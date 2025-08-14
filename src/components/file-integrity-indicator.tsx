import React from 'react';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface FileIntegrityIndicatorProps {
  isVerified: boolean;
  fileHash: string | null;
}

const FileIntegrityIndicator: React.FC<FileIntegrityIndicatorProps> = ({ isVerified, fileHash }) => {
  if (!fileHash) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <Shield className="h-4 w-4" />
        <span className="text-sm">No file loaded</span>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <ShieldCheck className="h-4 w-4" />
        <span className="text-sm">File verified</span>
        <span className="text-xs text-gray-500" title={fileHash}>
          ({fileHash.substring(0, 8)}...)
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-red-600 animate-pulse">
      <ShieldAlert className="h-4 w-4" />
      <span className="text-sm font-medium">File modified!</span>
    </div>
  );
};

export default FileIntegrityIndicator;