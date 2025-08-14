#!/usr/bin/env python3
"""
Test script for the PDF signer without Belgian eID
"""

import json
import subprocess
import sys
from pathlib import Path

def test_signer():
    """Test the signer with a mock input."""
    
    # Check if test PDF exists
    test_pdf = Path("document.pdf")
    if not test_pdf.exists():
        print("Error: document.pdf not found in signing-tool directory")
        print("Please create a test PDF file first")
        return False
    
    # Prepare test input
    test_input = {
        "pdf_path": str(test_pdf.absolute()),
        "output_path": "/tmp/test_signed.pdf",
        "page": 0,
        "x": 200,
        "y": 600,
        "width": 200,
        "height": 60,
        "visible": True,
        "reason": "Test signature",
        "location": "Test Location"
    }
    
    print("Testing signer with input:")
    print(json.dumps(test_input, indent=2))
    
    try:
        # Run the signer
        result = subprocess.run(
            #[sys.executable, "main.py"],
            ["./main.dist/main.bin"],
            input=json.dumps(test_input),
            capture_output=True,
            text=True
        )
        
        print("\nOutput:")
        print(result.stdout)
        
        if result.stderr:
            print("\nErrors:")
            print(result.stderr)
        
        # Parse result
        try:
            output = json.loads(result.stdout)
            if output.get("success"):
                print("\n✓ Test passed! Output at:", output.get("output_path"))
            else:
                print("\n✗ Test failed:", output.get("error"))
                if output.get("traceback"):
                    print("\nTraceback:")
                    print(output.get("traceback"))
        except json.JSONDecodeError:
            print("\n✗ Failed to parse output as JSON")
            
    except Exception as e:
        print(f"\n✗ Test failed with exception: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("PDF Signer Test Script")
    print("=" * 40)
    print("\nNote: This will fail if Belgian eID is not installed.")
    print("It's meant to test the script structure, not actual signing.\n")
    
    success = test_signer()
    sys.exit(0 if success else 1)