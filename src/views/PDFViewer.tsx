import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import PDFPage from '../components/pdf-page';
import SignatureOverlay, { PDFCoordinates } from '../components/signature-overlay';

// Use local worker file for Electron compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.mjs';

interface PDFViewerProps {
  file: string;
  onSignaturePositionSelect: (position: PDFCoordinates) => void;
  onStateChange?: (state: PDFViewerState) => void;
}

export interface PDFViewerState {
  currentPage: number;
  totalPages: number;
  scale: number;
  loading: boolean;
  error: string | null;
}

export interface PDFViewerHandle {
  previousPage: () => void;
  nextPage: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
}

const PDFViewer = forwardRef<PDFViewerHandle, PDFViewerProps>(({
  file,
  onSignaturePositionSelect,
  onStateChange
}, ref) => {
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [pageObj, setPageObj] = useState<pdfjsLib.PDFPageProxy | null>(null);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  const [selectedPosition, setSelectedPosition] = useState<PDFCoordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        currentPage,
        totalPages,
        scale,
        loading,
        error
      });
    }
  }, [currentPage, totalPages, scale, loading, error, onStateChange]);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        // Read file as buffer through IPC
        const fileBuffer = await window.electronAPI.readFileAsBuffer(file);

        // Load PDF from buffer
        const loadingTask = pdfjsLib.getDocument({
          data: fileBuffer
        });
        const pdf = await loadingTask.promise;

        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(`Failed to load PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    if (file) {
      loadPDF();
    }

    return () => {
      if (pdfDocument) {
        pdfDocument.destroy();
      }
    };
  }, [file]);

  useEffect(() => {
    const loadPage = async () => {
      if (!pdfDocument) return;

      try {
        const page = await pdfDocument.getPage(currentPage);
        setPageObj(page);

        // Get the base viewport at scale 1 to get true PDF dimensions
        const baseViewport = page.getViewport({ scale: 1 });
        setPageDimensions({
          width: baseViewport.width,
          height: baseViewport.height
        });
      } catch (err) {
        console.error('Error loading page:', err);
        setError(`Failed to load page: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    loadPage();
  }, [pdfDocument, currentPage]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setScale(Math.min(scale + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale(Math.max(scale - 0.25, 0.5));
  };

  const handleZoomReset = () => {
    setScale(1.0);
  };

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    previousPage: handlePreviousPage,
    nextPage: handleNextPage,
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    zoomReset: handleZoomReset
  }), [currentPage, totalPages, scale]);

  const handleSignatureSelect = (position: PDFCoordinates) => {
    setSelectedPosition(position);
    onSignaturePositionSelect(position);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading PDF</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto bg-gray-100 dark:bg-neutral-800 p-8"
    >
      <div className="flex justify-center">
        <div className="relative bg-white shadow-2xl">
          {pageObj && (
            <>
              <PDFPage
                page={pageObj}
                scale={scale}
              />
              <SignatureOverlay
                pageNumber={currentPage - 1}
                pageWidth={pageDimensions.width}
                pageHeight={pageDimensions.height}
                scale={scale}
                onSignaturePositionSelect={handleSignatureSelect}
                existingSignature={selectedPosition}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
});

PDFViewer.displayName = 'PDFViewer';

export default PDFViewer;