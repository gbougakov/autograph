# Autograph - Belgian eID PDF Signing App

## Project Overview
Electron desktop application that enables users to digitally sign PDF documents using their Belgian electronic identity card (eID) on macOS. The app provides a simple, focused workflow for placing legally-binding digital signatures on PDFs using the Belgian government's eID infrastructure.

### Key Features
- Native macOS application built with Electron
- Direct integration with Belgian eID cards via system middleware
- Visual PDF preview and signature placement
- Legally compliant digital signatures using pyHanko
- Minimal, focused UI with no unnecessary features
- Custom React components with Tailwind CSS styling
- Works fully offline and never sends any data anywhere

## Architecture

```
autograph/
├── main.js              # Electron main process
├── preload.js           # IPC bridge
├── forge.config.js      # Electron Forge config
├── package.json
├── src/
│   ├── index.html
│   ├── app.tsx          # Main React app
│   ├── components/      # Reusable components
│   │   ├── ui/ # Shadcn components
│   │   ├── Modal.tsx
│   │   └── Toolbar.tsx
│   ├── views/
│   │   ├── PDFViewer.tsx
│   │   └── Settings.tsx
│   └── styles/
│       └── globals.css  # Tailwind setup
└── python/
    ├── signer.py        # pyHanko wrapper
    ├── requirements.txt
    └── build.sh         # Nuitka build script
```

## Core Workflow

### User Journey
1. **Open PDF**: User selects a PDF file through file dialog or drag-and-drop
2. **Navigate**: User scrolls through PDF pages to find signature location
3. **Place Signature**: User clicks on the desired position on the page
4. **Sign Document**: App prompts for eID PIN and signs the document
5. **Save Result**: Signed PDF is automatically saved with "_signed" suffix

### Technical Flow
1. Electron renderer loads PDF using pdfjs-dist
2. User interaction captured via React event handlers
3. Signature coordinates calculated relative to PDF page dimensions
4. IPC message sent to main process with signing parameters
5. Main process spawns Nuitka-compiled Python binary
6. Python process interacts with Belgian eID via pyHanko
7. Signed PDF returned to Electron for display/save

## Technology Stack

### Frontend Technologies
- **React**: Component-based UI framework for building the interface
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **pdfjs-dist**: Mozilla's PDF.js library for rendering and displaying PDFs in the browser

### Desktop Framework
- **Electron**: Cross-platform desktop app framework using web technologies
- **Electron Forge**: Build toolchain for packaging and distributing Electron apps
- **IPC (Inter-Process Communication)**: For secure communication between renderer and main process

### Backend & Signing
- **Python 3.9+**: Runtime for PDF signing operations
- **pyHanko**: Python library for PDF signing with support for Belgian eID
- **Nuitka**: Python compiler to create native macOS binaries (Apache 2.0 license)

### Belgian eID Integration
- Requires Belgian eID middleware to be installed separately
- Uses PKCS#11 interface for smart card communication
- Supports both authentication and signature certificates

## Component Library

### Design Principles
- Minimal initial styling (will be customized later)
- Consistent usage throughout the application
- Props-based customization for variants
- Tailwind utility classes for styling

### Core Components
- **`<Button />`**: Primary interactive element
  - Props: `variant="primary|secondary|ghost"`, `icon`, `onClick`, `disabled`
  - Used for all actions (open file, sign, cancel, etc.)
  
- **`<Modal />`**: Overlay dialog for user interactions
  - Props: `isOpen`, `onClose`, `title`, `children`
  - Used for PIN entry, error messages, confirmations
  
- **`<Toolbar />`**: Top navigation bar
  - Contains file operations and view controls
  - Fixed position with consistent height
  
- **`<PDFPage />`**: Individual PDF page renderer
  - Wraps pdfjs-dist canvas rendering
  - Handles zoom and scroll events
  
- **`<SignatureOverlay />`**: Transparent layer for signature placement
  - Captures click coordinates
  - Shows signature preview box

## Development Steps
1. ✅ Set up Electron + React + Tailwind skeleton
2. ✅ Create base component library with minimal styling
3. ✅ Implement PDF viewer with page navigation
4. ✅ Add signature placement UI (drag-to-draw rectangle)
5. Create Python signer script with pyHanko
6. Build Python binary with Nuitka
7. Wire up IPC between Electron and Python
8. Test with Belgian eID
9. Package and code sign the complete app

## Implementation Status

### Completed Features

#### PDF Viewer (pdfjs-dist)
- Full PDF rendering with pdfjs-dist library
- Multi-page navigation with previous/next buttons
- Zoom controls (in/out/reset) with 50%-300% range
- Loading states and error handling
- Clean, centered layout with shadow effects

#### Signature Placement
- **Drag-to-draw rectangle**: Users can click and drag to create a signature rectangle
- **PDF coordinate system**: All positions stored in PDF points (1/72 inch) with origin at bottom-left
- **Visual feedback**: Live preview while dragging, shows dimensions in points
- **Persistent selection**: Selected signature area remains visible across page changes
- **Coordinate display**: Shows exact position and size in the UI

#### File Integrity System
- **SHA-256 hashing**: Files are hashed when first loaded
- **Continuous verification**: Hash checked every 5 seconds while file is open
- **Pre-signing verification**: Final check before signing to prevent TOCTOU attacks
- **Visual indicators**: 
  - Green shield with checkmark when file is verified
  - Red pulsing alert when file has been modified
  - Hash prefix displayed for verification
- **Security**: Prevents signing if file has been tampered with

#### Coordinate Transformation
```typescript
// Screen to PDF conversion (implemented in SignatureOverlay.tsx)
const screenToPDFCoordinates = (screenX, screenY) => {
  const pdfX = screenX / scale;
  const pdfY = (pageHeight - screenY / scale);  // Flip Y axis
  return { x: pdfX, y: pdfY };
};

// PDF to Screen conversion
const pdfToScreenCoordinates = (pdfX, pdfY) => {
  const screenX = pdfX * scale;
  const screenY = (pageHeight - pdfY) * scale;  // Flip Y axis
  return { x: screenX, y: screenY };
};
```

### Components Created

1. **PDFPage.tsx**: Canvas-based PDF page renderer using pdfjs-dist
2. **SignatureOverlay.tsx**: Transparent overlay for drag-to-draw signature placement
3. **FileIntegrityIndicator.tsx**: Visual component showing file verification status
4. **PDFViewer.tsx**: Main viewer with navigation, zoom, and signature placement

### IPC Communication

#### New IPC Handlers
- `file:calculateHash`: Calculates SHA-256 hash of PDF file
- `sign:pdf`: Placeholder for Python signer integration (ready for implementation)

#### Signature Data Structure
```typescript
interface PDFCoordinates {
  page: number;        // 0-indexed page number
  x: number;          // PDF x coordinate (points from left)
  y: number;          // PDF y coordinate (points from bottom)
  width: number;      // Width in PDF points
  height: number;     // Height in PDF points
  pageWidth: number;  // Total page width for reference
  pageHeight: number; // Total page height for reference
}
```

## Key Technical Decisions
- **PDF rendering**: pdfjs-dist (Mozilla's library, most reliable)
- **State management**: React Context (simple enough for this scope)
- **IPC**: Electron IPC for Python process communication
- **Belgian eID**: Handled transparently by pyHanko through system middleware

## Python Integration

### Nuitka Compilation
```bash
# Build command for macOS
python -m nuitka --standalone --macos-create-app-bundle \
  --enable-plugin=numpy \
  --include-package=pyhanko \
  --output-dir=build \
  signer.py
```

### Python Script Interface
The `signer.py` script accepts JSON input via stdin:
```json
{
  "pdf_path": "/path/to/input.pdf",
  "output_path": "/path/to/output_signed.pdf",
  "page": 0,
  "x": 100,
  "y": 200,
  "width": 200,
  "height": 50,
  "visible": true,
  "reason": "Document approval",
  "location": "Brussels, Belgium"
}
```

### IPC Communication
```javascript
// Main process spawns Python binary
const { spawn } = require('child_process');
const signer = spawn('./python/dist/signer', [], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Send signing request
signer.stdin.write(JSON.stringify(signingData));

// Handle response
signer.stdout.on('data', (data) => {
  const result = JSON.parse(data);
  if (result.success) {
    // Return signed PDF path to renderer
  }
});
```

### Belgian eID Requirements
- User must install Belgian eID middleware from: https://eid.belgium.be
- Card reader must be connected before signing
- PIN will be requested through system dialog
- Both citizen and foreigner eID cards supported

## macOS Specific Considerations

### Code Signing
- Entire app bundle must be signed with valid Developer ID certificate
- Nuitka-compiled Python binary signed as part of the bundle
- Entitlements needed for:
  - File system access (com.apple.security.files.user-selected.read-write)
  - Process spawning (com.apple.security.inherit)

### Notarization
- Required for distribution outside Mac App Store
- Submit to Apple for notarization after signing
- Staple notarization ticket to app bundle

### System Requirements
- macOS 10.15 (Catalina) or later
- Belgian eID middleware installed
- Compatible smart card reader
- Python dependencies compiled for arm64 (Apple Silicon) and x86_64 (Intel)

## Implementation Notes

### Scope Limitations
- **No file management**: No recent files, history, or file browser
- **Single document**: One PDF at a time, no tabs or multiple windows
- **Basic signing only**: No form filling, annotations, or other PDF modifications
- **No cloud integration**: Local files only, no sync or backup

### Future Enhancements (Post-MVP)
- Settings page for default signature appearance
- Multiple signature fields in one session
- Batch signing for multiple PDFs
- Timestamp server integration
- Custom signature appearance/logos
- Document validation and certificate verification

### Development Guidelines
- Keep components minimal and reusable
- Use consistent patterns throughout codebase
- Prioritize functionality over aesthetics initially
- Ensure all user-facing errors are clear and actionable
- Test with real Belgian eID cards before release

### Security Considerations
- Never store PIN codes or private keys
- Use secure IPC channels between processes
- Validate all PDF inputs before processing
- Clear sensitive data from memory after use
- Follow Belgian eID security guidelines

### Testing Strategy
- Unit tests for React components
- Integration tests for IPC communication
- Manual testing with Belgian eID test cards
- PDF compatibility testing with various formats
- Performance testing with large PDF files

## Critical Security Implementation

### TOCTOU (Time-of-Check-Time-of-Use) Protection

The application implements comprehensive TOCTOU protection to prevent file substitution attacks during the signing process:

#### Implementation Details

1. **Initial Hash Calculation** (App.tsx)
   - SHA-256 hash calculated when file is first opened
   - Hash stored in React state for comparison

2. **Continuous File Monitoring** (App.tsx)
   - File re-hashed every 5 seconds while open
   - Visual indicator (FileIntegrityIndicator component) shows verification status
   - Red pulsing alert if file has been modified

3. **Pre-Signing Verification** (App.tsx)
   - Final hash verification before initiating signing
   - Aborts if file has been modified since opening

4. **Hash Passing Through IPC** (App.tsx)
   - **CRITICAL**: Hash is passed from frontend to main process
   - Prevents TOCTOU window between frontend and backend verification

5. **Main Process** (main.js)
   - Receives hash from frontend (does NOT recalculate)
   - Validates hash exists before proceeding
   - Passes hash to Python signer

6. **Python Signer Protection** (signing-tool/main.py)
   - **CRITICAL**: Reads file ONCE into memory
   - Calculates hash from memory bytes (not file)
   - Verifies against expected hash
   - Signs using same memory bytes
   - Eliminates TOCTOU window between verification and signing

#### Security Guarantee
The exact file bytes that were verified in the UI are what gets signed - no possibility of file substitution at any point in the chain.

### Belgian eID Integration

#### useEid Hook (src/hooks/useEid.ts)
Custom React hook that manages Belgian eID card state and operations:

```typescript
interface EidState {
  initialized: boolean;
  connected: boolean;
  hasCard: boolean;
  cardData: CardData | null;
  photo: string | null;
  error: string | null;
}
```

**Key Features:**
- Automatic initialization on mount
- Status polling every 2 seconds
- Card data and photo caching
- Error handling and recovery
- Cleanup on unmount

**Usage:**
```typescript
const eid = useEid();
// Access: eid.connected, eid.hasCard, eid.cardData, etc.
```

#### eID Module Management (main.js)
- PKCS#11 interface via graphene-pk11
- Session management with proper cleanup
- Card data parsing including ADDRESS_FILE binary format
- Photo extraction and base64 encoding

#### Security Considerations
- PIN never stored or logged
- Sessions properly closed on errors
- Module finalized on app quit
- All operations use secure IPC channels

## Known Implementation Details

### Coordinate System
- PDF coordinates: Origin at bottom-left, measured in points (1/72 inch)
- Screen coordinates: Origin at top-left, measured in pixels
- Transformation handled in SignatureOverlay component

### File Paths
- All file paths must be absolute (not relative)
- Temp files created in system temp directory
- Signed files saved with "_signed" suffix

### Python Binary
- Development: Uses `uv run python main.py`
- Production: Uses Nuitka-compiled binary
- Binary location: `python-dist/autograph-signer/main.bin`

### IPC Channels
- `dialog:openFile` - File selection
- `file:calculateHash` - SHA-256 calculation
- `file:readAsBuffer` - PDF loading
- `sign:pdf` - Signing process
- `eid:*` - Belgian eID operations

### Error Handling
- All IPC handlers return success/error objects
- Frontend shows user-friendly error messages
- Python traceback included in debug logs

### Performance Optimizations
- PDF rendered at appropriate scale for display
- File integrity checked asynchronously
- eID status polled efficiently (2s intervals)
- Large PDFs handled with streaming