import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

interface PDFPageProps {
  page: pdfjsLib.PDFPageProxy;
  scale: number;
  onPageRendered?: (dimensions: { width: number; height: number }) => void;
}

const PDFPage: React.FC<PDFPageProps> = ({ page, scale, onPageRendered }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const renderPage = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const viewport = page.getViewport({ scale: scale * 2 });
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const pageDimensions = {
        width: viewport.width,
        height: viewport.height
      };
      setDimensions(pageDimensions);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
      if (onPageRendered) {
        // Pass the actual page dimensions, not the retina-scaled ones
        onPageRendered({
          width: viewport.width / 2,
          height: viewport.height / 2
        });
      }
    };

    renderPage();
  }, [page, scale, onPageRendered]);

  return (
    <canvas
      ref={canvasRef}
      className="shadow-lg"
      style={{ width: dimensions.width / 2, height: dimensions.height / 2 }}
    />
  );
};

export default PDFPage;