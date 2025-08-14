interface ElectronAPI {
  openFile: () => Promise<string | null>;
  saveFile: (defaultPath: string) => Promise<string | null>;
  readFileAsBuffer: (filePath: string) => Promise<Uint8Array>;
  calculateFileHash: (filePath: string) => Promise<string>;
  saveSignedPDF: (tempPath: string, defaultName: string) => Promise<string | null>;
  signPDF: (data: {
    pdfPath: string;
    fileHash: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }) => Promise<{ 
    success: boolean; 
    message?: string;
    outputPath?: string;
    error?: string;
    traceback?: string;
  }>;
  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
  
  // Belgian eID methods
  eidInitialize: () => Promise<{
    success: boolean;
    connected?: boolean;
    error?: string;
  }>;
  eidGetStatus: () => Promise<{
    connected: boolean;
    hasCard: boolean;
  }>;
  eidGetCardData: () => Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }>;
  eidGetPhoto: () => Promise<{
    success: boolean;
    photo?: string;
    error?: string;
  }>;
  eidCleanup: () => Promise<{
    success: boolean;
    error?: string;
  }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};