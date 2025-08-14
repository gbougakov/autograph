import React, { useState, useRef, useCallback, useEffect } from 'react';

export interface PDFCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  pageWidth: number;
  pageHeight: number;
}

interface SignatureOverlayProps {
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  scale: number;
  onSignaturePositionSelect: (position: PDFCoordinates) => void;
  existingSignature?: PDFCoordinates | null;
}

const SignatureOverlay: React.FC<SignatureOverlayProps> = ({
  pageNumber,
  pageWidth,
  pageHeight,
  scale,
  onSignaturePositionSelect,
  existingSignature
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragEnd, setDragEnd] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<PDFCoordinates | null>(existingSignature || null);

  const screenToPDFCoordinates = useCallback((screenX: number, screenY: number) => {
    // The canvas is displayed at (pageWidth * scale) x (pageHeight * scale) pixels
    // But rendered at double resolution for retina
    // screenX and screenY are in displayed pixels
    
    // Convert screen pixels to PDF points
    const pdfX = screenX / scale;
    // For Y: screen has origin at top, PDF has origin at bottom
    // Screen bottom = pageHeight * scale pixels
    // So PDF Y = pageHeight - (screenY / scale)
    const pdfY = pageHeight - (screenY / scale);
    return { x: pdfX, y: pdfY };
  }, [scale, pageHeight]);

  const pdfToScreenCoordinates = useCallback((pdfX: number, pdfY: number) => {
    // Convert PDF points to displayed screen pixels
    const screenX = pdfX * scale;
    // Convert from PDF coordinates (Y=0 at bottom) to screen (Y=0 at top)
    const screenY = (pageHeight - pdfY) * scale;
    return { x: screenX, y: screenY };
  }, [scale, pageHeight]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDragStart({ x, y });
    setDragEnd({ x, y });
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDragEnd({ x, y });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    const minX = Math.min(dragStart.x, dragEnd.x);
    const minY = Math.min(dragStart.y, dragEnd.y);
    const width = Math.abs(dragEnd.x - dragStart.x);
    const height = Math.abs(dragEnd.y - dragStart.y);

    if (width < 20 || height < 10) {
      return;
    }

    // Convert screen rectangle corners to PDF coordinates
    // In screen: top-left is (minX, minY), bottom-right is (minX+width, minY+height)
    const topLeftPDF = screenToPDFCoordinates(minX, minY);
    const bottomRightPDF = screenToPDFCoordinates(minX + width, minY + height);

    // In PDF coordinates:
    // - Origin is at bottom-left of page
    // - Rectangle is defined by bottom-left corner (x,y) and size (width, height)
    // Since we drew from top-left to bottom-right in screen coords,
    // the PDF rectangle's bottom-left is (left x, bottom y)
    const pdfCoords: PDFCoordinates = {
      x: Math.min(topLeftPDF.x, bottomRightPDF.x),  // Left edge
      y: Math.min(topLeftPDF.y, bottomRightPDF.y),  // Bottom edge (smaller Y in PDF coords)
      width: Math.abs(bottomRightPDF.x - topLeftPDF.x),
      height: Math.abs(topLeftPDF.y - bottomRightPDF.y),
      page: pageNumber,
      pageWidth: pageWidth,
      pageHeight: pageHeight
    };

    setCurrentRect(pdfCoords);
    onSignaturePositionSelect(pdfCoords);
  }, [isDragging, dragStart, dragEnd, screenToPDFCoordinates, pageNumber, pageWidth, pageHeight, onSignaturePositionSelect]);

  useEffect(() => {
    if (existingSignature && existingSignature.page === pageNumber) {
      setCurrentRect(existingSignature);
    } else if (existingSignature?.page !== pageNumber) {
      setCurrentRect(null);
    }
  }, [existingSignature, pageNumber]);

  const renderRectangle = () => {
    if (isDragging) {
      const minX = Math.min(dragStart.x, dragEnd.x);
      const minY = Math.min(dragStart.y, dragEnd.y);
      const width = Math.abs(dragEnd.x - dragStart.x);
      const height = Math.abs(dragEnd.y - dragStart.y);

      return (
        <div
          className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-30 pointer-events-none"
          style={{
            left: `${minX}px`,
            top: `${minY}px`,
            width: `${width}px`,
            height: `${height}px`
          }}
        >
          <div className="text-xs text-blue-600 p-1 bg-white bg-opacity-90">
            {Math.round(width / scale)}x{Math.round(height / scale)} pts
          </div>
        </div>
      );
    }

    if (currentRect && currentRect.page === pageNumber) {
      // currentRect stores PDF coordinates where (x,y) is the bottom-left corner
      // We need to convert to screen coordinates where we draw from top-left
      // Top-left in PDF coords is (x, y + height)
      const topLeftScreen = pdfToScreenCoordinates(currentRect.x, currentRect.y + currentRect.height);
      
      return (
        <div
          className="absolute border-2 border-green-500 bg-green-100 bg-opacity-30 pointer-events-none"
          style={{
            left: `${topLeftScreen.x}px`,
            top: `${topLeftScreen.y}px`,
            width: `${currentRect.width * scale}px`,
            height: `${currentRect.height * scale}px`
          }}
        >
          <div className="text-xs text-green-700 p-1 bg-white bg-opacity-90">
            Signature Area
            <br />
            {Math.round(currentRect.width)}x{Math.round(currentRect.height)} pts
            <br />
            Position: ({Math.round(currentRect.x)}, {Math.round(currentRect.y)})
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 cursor-crosshair"
      style={{ zIndex: 10 }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {renderRectangle()}
    </div>
  );
};

export default SignatureOverlay;