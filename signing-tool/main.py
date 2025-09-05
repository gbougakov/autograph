#!/usr/bin/env python3
"""
Autograph PDF Signer
Signs PDF documents using Belgian eID card
"""

import sys
import json
import hashlib
import traceback
import uuid
from pathlib import Path

from pyhanko.sign.fields import SigFieldSpec
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from pkcs11 import Session
from pyhanko.sign import pkcs11 as sign_pkcs11
from pyhanko.sign import signers, fields
from pyhanko import stamp
from pyhanko.pdf_utils import text, layout
from pyhanko.pdf_utils.font import opentype


# Belgian eID library path for macOS
BEID_LIB_PATH = "/Library/Belgium Identity Card/Pkcs11/beid-pkcs11.bundle/Contents/MacOS/libbeidpkcs11.dylib"


def open_beid_session(lib_location: str, slot_no=None) -> Session:
    """Open a PKCS#11 session with the Belgian eID card."""
    return sign_pkcs11.open_pkcs11_session(
        lib_location, slot_no=slot_no, token_label="BELPIC"
    )


class BEIDSigner(sign_pkcs11.PKCS11Signer):
    """Belgian eID card signer."""
    
    def __init__(
        self,
        pkcs11_session: Session,
        use_auth_cert: bool = False,
        bulk_fetch: bool = False,
        embed_roots=True,
    ):
        super().__init__(
            pkcs11_session=pkcs11_session,
            cert_label="Authentication" if use_auth_cert else "Signature",
            other_certs_to_pull=("Root", "CA"),
            bulk_fetch=bulk_fetch,
            embed_roots=embed_roots,
        )


def sign_pdf(input_data: dict) -> dict:
    """
    Sign a PDF file with Belgian eID.
    
    Args:
        input_data: Dictionary containing:
            - pdf_path: Path to input PDF
            - output_path: Path for signed PDF
            - file_hash: Expected SHA-256 hash of input file
            - page: Page number (0-indexed)
            - x, y, width, height: Signature box coordinates in PDF points
            - visible: Whether signature should be visible
            - reason: Reason for signing (optional)
            - location: Location of signing (optional)
    
    Returns:
        Dictionary with success status and message/error
    """
    try:
        # Read file once into memory to prevent TOCTOU attacks
        pdf_path = input_data["pdf_path"]
        expected_hash = input_data.get("file_hash")
        
        # Read the entire PDF into memory
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()
        
        # Verify file integrity if hash provided
        if expected_hash:
            actual_hash = hashlib.sha256(pdf_bytes).hexdigest()
            if actual_hash != expected_hash:
                return {
                    "success": False,
                    "error": "File integrity check failed. File may have been modified."
                }
        
        # Extract signature parameters
        output_path = input_data["output_path"]
        page = input_data.get("page", 0)
        x = input_data.get("x", 200)
        y = input_data.get("y", 600)
        width = input_data.get("width", 200)
        height = input_data.get("height", 60)
        visible = input_data.get("visible", True)
        reason = input_data.get("reason", "Document approval")
        location = input_data.get("location", "Belgium")
        
        # Use the in-memory PDF bytes for signing (no second file read!)
        import io
        pdf_buffer = io.BytesIO(pdf_bytes)
        w = IncrementalPdfFileWriter(pdf_buffer)
        
        # Generate unique field name for multiple signature support
        field_name = f"Signature_{uuid.uuid4().hex[:8]}"
        
        # Add signature field if visible
        if visible:
            sig_field_spec = SigFieldSpec(
                field_name,
                box=(x, y, x + width, y + height),
                on_page=page
            )
            fields.append_signature_field(w, sig_field_spec=sig_field_spec)
        else:
            # For invisible signatures, we still need a field
            fields.append_signature_field(w, sig_field_spec=SigFieldSpec(field_name))
        
        # Open session with Belgian eID
        session = open_beid_session(BEID_LIB_PATH)
        signer = BEIDSigner(session)
        
        # Configure signature metadata
        meta = signers.PdfSignatureMetadata(
            field_name=field_name,
            reason=reason,
            location=location
        )
        
        # Configure signature appearance
        if visible:
            # Get the directory where the script is located
            script_dir = Path(__file__).parent
            font_path = script_dir / "JetBrainsMono-Regular.ttf"
            
            if font_path.exists():
                font_factory = opentype.GlyphAccumulatorFactory(str(font_path))
            else:
                font_factory = None
            
            stamp_style = stamp.TextStampStyle(
                stamp_text="Digitally signed by\n%(signer)s\n%(ts)s",
                text_box_style=text.TextBoxStyle(
                    font=font_factory,
                    font_size=10,
                    leading=12,
                ),
                inner_content_layout=layout.SimpleBoxLayoutRule(
                    x_align=layout.AxisAlignment.ALIGN_MIN,
                    y_align=layout.AxisAlignment.ALIGN_MIN,
                ),
                border_width=1,
            )
        else:
            stamp_style = None
        
        # Create PDF signer
        pdf_signer = signers.PdfSigner(
            meta,
            signer=signer,
            stamp_style=stamp_style
        )
        
        # Sign the PDF
        with open(output_path, "wb") as outf:
            pdf_signer.sign_pdf(w, output=outf)
        
        return {
            "success": True,
            "message": "PDF signed successfully",
            "output_path": output_path
        }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }


def main():
    """Main entry point for CLI usage."""
    try:
        # Read JSON input from stdin
        input_json = sys.stdin.read()
        input_data = json.loads(input_json)
        
        # Sign the PDF
        result = sign_pdf(input_data)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except json.JSONDecodeError as e:
        error_result = {
            "success": False,
            "error": f"Invalid JSON input: {str(e)}"
        }
        print(json.dumps(error_result))
        sys.exit(1)
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == "__main__":
    main()