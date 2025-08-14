const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (defaultPath) => ipcRenderer.invoke('dialog:saveFile', defaultPath),
  
  // File operations
  readFileAsBuffer: (filePath) => ipcRenderer.invoke('file:readAsBuffer', filePath),
  calculateFileHash: (filePath) => ipcRenderer.invoke('file:calculateHash', filePath),
  saveSignedPDF: (tempPath, defaultName) => ipcRenderer.invoke('file:saveSignedPDF', tempPath, defaultName),
  
  // For Python signing process
  signPDF: (data) => ipcRenderer.invoke('sign:pdf', data),
  
  // Belgian eID operations
  eidInitialize: () => ipcRenderer.invoke('eid:initialize'),
  eidGetStatus: () => ipcRenderer.invoke('eid:getStatus'),
  eidGetCardData: () => ipcRenderer.invoke('eid:getCardData'),
  eidGetPhoto: () => ipcRenderer.invoke('eid:getPhoto'),
  eidCleanup: () => ipcRenderer.invoke('eid:cleanup'),
  
  // Event listeners
  on: (channel, callback) => {
    const validChannels = ['signing-progress', 'signing-complete', 'signing-error'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});