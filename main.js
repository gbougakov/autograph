const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');
const os = require('os');
const { Module, ObjectClass, Data } = require('graphene-pk11');

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hidden',
    vibrancy: 'sidebar',
    visualEffectState: 'active',
    trafficLightPosition: { x: 16, y: 16 }
  });

  // In development, load from Vite dev server
  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Belgian eID module management
let eidModule = null;
let eidSession = null;

// Initialize eID module
ipcMain.handle('eid:initialize', async () => {
  try {
    if (eidModule) {
      return { success: true, connected: true };
    }

    const libPath = '/Library/Belgium Identity Card/Pkcs11/beid-pkcs11.bundle/Contents/MacOS/libbeidpkcs11.dylib';
    
    // Check if library exists
    if (!fs.existsSync(libPath)) {
      return { 
        success: false, 
        error: 'Belgian eID middleware not installed. Please install from https://eid.belgium.be',
        connected: false
      };
    }

    eidModule = Module.load(libPath, 'BEID');
    eidModule.initialize();
    
    // Check if card reader is connected
    const slots = eidModule.getSlots(0);
    const connected = slots.length > 0;
    
    return { success: true, connected };
  } catch (error) {
    console.error('Error initializing eID module:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to initialize eID module',
      connected: false
    };
  }
});

// Get eID status
ipcMain.handle('eid:getStatus', async () => {
  try {
    if (!eidModule) {
      return { connected: false, hasCard: false };
    }

    const slots = eidModule.getSlots(true);
    const hasCard = slots.length > 0;
    
    return { connected: true, hasCard };
  } catch (error) {
    console.error('Error getting eID status:', error);
    return { connected: false, hasCard: false };
  }
});

// Get card data
ipcMain.handle('eid:getCardData', async () => {
  try {
    if (!eidModule) {
      return { success: false, error: 'eID module not initialized' };
    }

    const slots = eidModule.getSlots(true);
    if (slots.length === 0) {
      return { success: false, error: 'No card inserted' };
    }

    // Open session with first available slot
    if (eidSession) {
      try {
        eidSession.close();
      } catch (e) {
        // Ignore close errors
      }
    }
    
    eidSession = slots.items(0).open();
    
    // Get all data objects from the card
    const objects = eidSession.find({ class: ObjectClass.DATA });
    
    const cardData = {};
    const labelMapping = {
      'card_number': 'cardNumber',
      'chip_number': 'chipNumber',
      'validity_begin_date': 'validityBeginDate',
      'validity_end_date': 'validityEndDate',
      'issuing_municipality': 'issuingMunicipality',
      'national_number': 'nationalNumber',
      'surname': 'surname',
      'firstnames': 'firstnames',
      'first_letter_of_third_given_name': 'firstLetterOfThirdGivenName',
      'nationality': 'nationality',
      'location_of_birth': 'locationOfBirth',
      'date_of_birth': 'dateOfBirth',
      'gender': 'gender',
      'nobility': 'nobility',
      'document_type': 'documentType',
      'special_status': 'specialStatus',
      'duplicata': 'duplicata',
      'special_organization': 'specialOrganization',
      'member_of_family': 'memberOfFamily',
      'date_and_country_of_protection': 'dateAndCountryOfProtection',
      'work_permit_mention': 'workPermitMention',
      'employer_vat_1': 'employerVat1',
      'employer_vat_2': 'employerVat2',
      'regional_file_number': 'regionalFileNumber',
      'brexit_mention_1': 'brexitMention1',
      'brexit_mention_2': 'brexitMention2',
      'address_street_and_number': 'addressStreetAndNumber',
      'address_zip': 'addressZip',
      'address_municipality': 'addressMunicipality'
    };
    
    for (const object of objects) {
      const store = new Data(object);
      const label = store.label;
      
      // Special handling for ADDRESS_FILE
      if (label === 'ADDRESS_FILE') {
        // Parse the ADDRESS_FILE binary format
        const addressData = store.value;
        let offset = 0;
        
        // Read street and number
        if (addressData[offset] === 0x01) {
          offset++;
          const streetLength = addressData[offset];
          offset++;
          cardData.addressStreetAndNumber = addressData.slice(offset, offset + streetLength).toString('utf-8').trim();
          offset += streetLength;
        }
        
        // Read zip code
        if (addressData[offset] === 0x02) {
          offset++;
          const zipLength = addressData[offset];
          offset++;
          cardData.addressZip = addressData.slice(offset, offset + zipLength).toString('utf-8').trim();
          offset += zipLength;
        }
        
        // Read municipality
        if (addressData[offset] === 0x03) {
          offset++;
          const municipalityLength = addressData[offset];
          offset++;
          cardData.addressMunicipality = addressData.slice(offset, offset + municipalityLength).toString('utf-8').trim();
        }
      } else {
        // Try to process as UTF-8 text data for other fields
        const mappedKey = labelMapping[label];
        
        if (mappedKey) {
          try {
            // Attempt to convert to string - will work for valid UTF-8
            const stringValue = store.value.toString('utf-8');
            // Check if the conversion resulted in valid text (no replacement characters)
            if (!stringValue.includes('\ufffd') && stringValue.trim().length > 0) {
              cardData[mappedKey] = stringValue.trim();
            }
          } catch (e) {
            // Not valid UTF-8, skip this field
          }
        }
      }
    }
    
    return { success: true, data: cardData };
  } catch (error) {
    console.error('Error reading card data:', error);
    return { success: false, error: error.message || 'Failed to read card data' };
  }
});

// Get photo from card
ipcMain.handle('eid:getPhoto', async () => {
  try {
    if (!eidModule) {
      return { success: false, error: 'eID module not initialized' };
    }

    const slots = eidModule.getSlots(true);
    if (slots.length === 0) {
      return { success: false, error: 'No card inserted' };
    }

    // Open session if not already open
    if (!eidSession) {
      eidSession = slots.items(0).open();
    }
    
    // Get all data objects from the card
    const objects = eidSession.find({ class: ObjectClass.DATA });
    
    for (const object of objects) {
      const store = new Data(object);
      
      if (store.label === 'PHOTO_FILE') {
        // Convert photo to base64
        const base64Photo = store.value.toString('base64');
        return { 
          success: true, 
          photo: `data:image/jpeg;base64,${base64Photo}`
        };
      }
    }
    
    return { success: false, error: 'Photo not found on card' };
  } catch (error) {
    console.error('Error reading photo from card:', error);
    return { success: false, error: error.message || 'Failed to read photo' };
  }
});

// Cleanup eID module
ipcMain.handle('eid:cleanup', async () => {
  try {
    if (eidSession) {
      eidSession.close();
      eidSession = null;
    }
    
    if (eidModule) {
      eidModule.finalize();
      eidModule = null;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error cleaning up eID module:', error);
    return { success: false, error: error.message };
  }
});

// Cleanup on app quit
app.on('before-quit', () => {
  if (eidSession) {
    try {
      eidSession.close();
    } catch (e) {
      // Ignore errors
    }
  }
  
  if (eidModule) {
    try {
      eidModule.finalize();
    } catch (e) {
      // Ignore errors
    }
  }
});

// IPC handlers
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] }
    ]
  });
  
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('dialog:saveFile', async (event, defaultPath) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultPath,
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] }
    ]
  });
  
  if (!result.canceled) {
    return result.filePath;
  }
  return null;
});

// Save signed PDF from temp location to user-selected location
ipcMain.handle('file:saveSignedPDF', async (event, tempPath, defaultName) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] }
      ]
    });
    
    if (!result.canceled && result.filePath) {
      // Copy file from temp to user-selected location
      await fs.promises.copyFile(tempPath, result.filePath);
      
      // Clean up temp file
      try {
        await fs.promises.unlink(tempPath);
      } catch (err) {
        console.warn('Could not delete temp file:', err);
      }
      
      return result.filePath;
    }
    
    return null;
  } catch (error) {
    console.error('Error saving signed PDF:', error);
    throw error;
  }
});

// File hash calculation for integrity checking
ipcMain.handle('file:calculateHash', async (event, filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => {
      hash.update(data);
    });
    
    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });
    
    stream.on('error', (error) => {
      reject(error);
    });
  });
});

// Read PDF file as buffer for pdfjs-dist
ipcMain.handle('file:readAsBuffer', async (event, filePath) => {
  try {
    const buffer = await fs.promises.readFile(filePath);
    return buffer;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
});

// PDF signing with Python integration
ipcMain.handle('sign:pdf', async (event, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Use the hash passed from the frontend (already verified there)
      // This ensures we're signing the exact same file the user verified
      const fileHash = data.fileHash;
      
      if (!fileHash) {
        reject(new Error('File hash is required for signing'));
        return;
      }
      
      // Generate output path in temp directory
      const tempDir = app.getPath('temp');
      const timestamp = Date.now();
      const outputPath = path.join(tempDir, `autograph_signed_${timestamp}.pdf`);
      
      // Prepare input for Python signer
      const signerInput = {
        pdf_path: data.pdfPath,
        output_path: outputPath,
        file_hash: fileHash,
        page: data.page || 0,
        x: data.x || 100,
        y: data.y || 100,
        width: data.width || 200,
        height: data.height || 60,
        visible: data.visible !== false,
        reason: data.reason || 'Document approval',
        location: data.location || 'Belgium'
      };
      
      // Determine Python signer path
      let signerPath;
      if (app.isPackaged) {
        // In production, use the bundled binary
        signerPath = path.join(process.resourcesPath, 'python-dist', 'autograph-signer', 'main.bin');
      } else {
        // In development, check if compiled binary exists
        const devBinaryPath = path.join(__dirname, '..', 'python-dist', 'autograph-signer', 'main.bin');

        console.log(devBinaryPath);
        
        if (fs.existsSync(devBinaryPath)) {
          // Compiled binary exists
          signerPath = devBinaryPath;
          console.log('Using compiled Python signer:', signerPath);
        } else {
          // Fallback to Python script for development
          signerPath = 'uv';
          console.log('Using Python script via uv');
        }
      }
      
      // Spawn Python signer process
      let signerProcess;
      if (signerPath === 'uv') {
        // Run via uv in development
        signerProcess = spawn('uv', ['run', 'python', 'main.py'], {
          cwd: path.join(__dirname, 'signing-tool')
        });
      } else {
        // Run compiled binary
        signerProcess = spawn(signerPath, []);
      }

      console.log(signerPath);
      
      let outputData = '';
      let errorData = '';
      
      // Send progress update
      mainWindow.webContents.send('signing-progress', { 
        stage: 'started', 
        message: 'Initializing signature process...' 
      });
      
      // Handle stdout
      signerProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });
      
      // Handle stderr
      signerProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });
      
      // Handle process exit
      signerProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Signer process exited with code ${code}: ${errorData}`));
          return;
        }
        
        try {
          const result = JSON.parse(outputData);
          
          if (result.success) {
            // Send completion update
            mainWindow.webContents.send('signing-complete', { 
              outputPath: result.output_path 
            });
            
            resolve({
              success: true,
              outputPath: result.output_path,
              message: result.message
            });
          } else {
            mainWindow.webContents.send('signing-error', { 
              error: result.error 
            });
            
            resolve({
              success: false,
              error: result.error,
              traceback: result.traceback
            });
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse signer output: ${outputData}`));
        }
      });
      
      // Handle process error
      signerProcess.on('error', (error) => {
        if (error.code === 'ENOENT') {
          reject(new Error('Python signer not found. Please build the Python signer first.'));
        } else {
          reject(error);
        }
      });
      
      // Send input to Python signer
      signerProcess.stdin.write(JSON.stringify(signerInput));
      signerProcess.stdin.end();
      
    } catch (error) {
      reject(error);
    }
  });
});