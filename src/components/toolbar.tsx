import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Signature, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Settings } from 'lucide-react';
import FileIntegrityIndicator from './file-integrity-indicator';

import ConnectionStatusIndicator from './connection-status-indicator';
import { AnimatePresence, motion } from 'motion/react';
import { useEid, UseEidReturn } from '@/hooks/useEid';

interface ToolbarProps {
  onOpenFile: () => void;
  onSign: () => void;
  canSign: boolean;
  isFileVerified?: boolean;
  fileHash?: string | null;
  // PDF controls
  currentPage?: number;
  totalPages?: number;
  scale?: number;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  hasPDF?: boolean;
  // Settings
  onOpenSettings?: () => void;
  eid: UseEidReturn;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onOpenFile,
  onSign,
  canSign,
  isFileVerified = true,
  fileHash = null,
  currentPage = 1,
  totalPages = 0,
  scale = 1.0,
  onPreviousPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  hasPDF = false,
  onOpenSettings,
  eid
}) => {

  const noDragStyle = { WebkitAppRegion: 'no-drag' } as React.CSSProperties;
  const dragStyle = { WebkitAppRegion: 'drag' } as React.CSSProperties;

  const showSignButton = hasPDF && eid.isConnected && eid.hasCard && eid.cardData?.documentType !== null;

  return (
    <div
      className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-950 px-2 py-2 pl-20"
      style={dragStyle}
    >
      <div className="flex items-center justify-between h-8">
        {/* Left Section: File Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFile}
            style={noDragStyle}
          >
            <FileText className="h-4 w-4" />
            <span className="ml-1">Open PDF</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSettings}
            style={noDragStyle}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Center Section: PDF Controls */}
        <AnimatePresence>
          {hasPDF && (
            <motion.div
              className="flex items-center gap-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              {/* Page Navigation */}
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPreviousPage}
                  disabled={currentPage <= 1}
                  style={noDragStyle}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm mx-2 min-w-[80px] text-center select-none">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNextPage}
                  disabled={currentPage >= totalPages}
                  style={noDragStyle}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onZoomOut}
                  disabled={scale <= 0.5}
                  style={noDragStyle}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm mx-2 min-w-[50px] text-center select-none">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onZoomIn}
                  disabled={scale >= 3.0}
                  style={noDragStyle}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onZoomReset}
                  style={noDragStyle}
                  title="Reset Zoom"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Section: Status and Sign */}
        <div className={`flex items-center gap-3`}>
          <div className={!showSignButton ? 'mr-2' : ''}>
            <ConnectionStatusIndicator eid={eid} />
          </div>


          <AnimatePresence>
            {showSignButton && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                className="origin-right"
              >
                <Button
                  variant={canSign ? "default" : "secondary"}
                  size="sm"
                  onClick={onSign}
                  disabled={!canSign}
                  style={noDragStyle}
                >
                  {canSign ? (
                    <>
                      <img
                        src={eid.photo}
                        alt="eID"
                        className="w-5 h-5 object-contain object-top bg-white rounded-full border border-gray-300 mr-0.5"
                      />
                      <span>Sign with eID</span>
                    </>
                  ) : (
                    <span>Draw a signature</span>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;