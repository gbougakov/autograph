import React, { useState, useEffect, useRef } from 'react';
import Toolbar from './components/toolbar';
import PDFViewer, { PDFViewerHandle, PDFViewerState } from './views/PDFViewer';
import SettingsModal from './components/settings-modal';
import { Button } from '@/components/ui/button';
import { PDFCoordinates } from './components/signature-overlay';
import { ThemeProvider } from "@/components/theme-provider"
import { useEid } from './hooks/useEid';

function App() {
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<PDFCoordinates | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [isFileVerified, setIsFileVerified] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [pdfState, setPdfState] = useState<PDFViewerState>({
    currentPage: 1,
    totalPages: 0,
    scale: 1.0,
    loading: false,
    error: null
  });
  const eid = useEid();

  useEffect(() => {
    console.log(eid);
  }, [eid]);
  
  const pdfViewerRef = useRef<PDFViewerHandle>(null);

  const handleOpenFile = async () => {
    const filePath = await window.electronAPI.openFile();
    if (filePath) {
      setPdfFile(filePath);
      setSignaturePosition(null);
      
      // Calculate initial file hash
      try {
        const hash = await window.electronAPI.calculateFileHash(filePath);
        setFileHash(hash);
        setIsFileVerified(true);
      } catch (error) {
        console.error('Error calculating file hash:', error);
      }
    }
  };

  // Periodically verify file integrity
  useEffect(() => {
    if (!pdfFile || !fileHash) return;

    const verifyInterval = setInterval(async () => {
      try {
        const currentHash = await window.electronAPI.calculateFileHash(pdfFile);
        setIsFileVerified(currentHash === fileHash);
      } catch (error) {
        console.error('Error verifying file:', error);
        setIsFileVerified(false);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(verifyInterval);
  }, [pdfFile, fileHash]);

  const handleSign = async () => {
    if (!pdfFile || !signaturePosition) {
      alert('Please open a PDF and select a signature position');
      return;
    }

    // Verify file integrity before signing
    if (!isFileVerified) {
      alert('File has been modified since it was opened. Please reload the file.');
      return;
    }

    try {
      // Final verification before signing
      const currentHash = await window.electronAPI.calculateFileHash(pdfFile);
      if (currentHash !== fileHash) {
        alert('File has been modified. Signing aborted for security.');
        setIsFileVerified(false);
        return;
      }

      const result = await window.electronAPI.signPDF({
        pdfPath: pdfFile,
        fileHash: fileHash,
        page: signaturePosition.page,
        x: signaturePosition.x,
        y: signaturePosition.y,
        width: signaturePosition.width,
        height: signaturePosition.height
      });

      if (result.success && result.outputPath) {
        // Prompt user to save the signed PDF
        const originalName = pdfFile.split('/').pop()?.replace('.pdf', '') || 'document';
        const savedPath = await window.electronAPI.saveSignedPDF(
          result.outputPath,
          `${originalName}_signed.pdf`
        );
        
        if (savedPath) {
          alert(`PDF signed and saved successfully!`);
        } else {
          alert('PDF signed but save was cancelled. The signed file is in a temporary location.');
        }
      } else {
        throw new Error(result.error || 'Signing failed');
      }
    } catch (error) {
      alert(`Error signing PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="flex flex-col h-screen">
        <Toolbar
          onOpenFile={handleOpenFile}
          onSign={handleSign}
          canSign={!!pdfFile && !!signaturePosition && isFileVerified}
          isFileVerified={isFileVerified}
          fileHash={fileHash}
          hasPDF={!!pdfFile}
          currentPage={pdfState.currentPage}
          totalPages={pdfState.totalPages}
          scale={pdfState.scale}
          onPreviousPage={() => pdfViewerRef.current?.previousPage()}
          onNextPage={() => pdfViewerRef.current?.nextPage()}
          onZoomIn={() => pdfViewerRef.current?.zoomIn()}
          onZoomOut={() => pdfViewerRef.current?.zoomOut()}
          onZoomReset={() => pdfViewerRef.current?.zoomReset()}
          onOpenSettings={() => setShowSettings(true)}
          eid={eid}
        />

        <div className="flex-1 overflow-auto">
          {pdfFile ? (
            <PDFViewer
              ref={pdfViewerRef}
              file={pdfFile}
              onSignaturePositionSelect={setSignaturePosition}
              onStateChange={setPdfState}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 mb-4">No PDF loaded</p>
                <Button
                  variant="default"
                  onClick={handleOpenFile}
                >
                  Open PDF
                </Button>
              </div>
            </div>
          )}
        </div>

        <SettingsModal 
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;