import { useState, useEffect, useCallback } from 'react';

export interface EidCardData {
  cardNumber?: string;
  chipNumber?: string;
  validityBeginDate?: string;
  validityEndDate?: string;
  issuingMunicipality?: string;
  nationalNumber?: string;
  surname?: string;
  firstnames?: string;
  firstLetterOfThirdGivenName?: string;
  nationality?: string;
  locationOfBirth?: string;
  dateOfBirth?: string;
  gender?: string;
  nobility?: string;
  documentType?: string;
  specialStatus?: string;
  duplicata?: string;
  specialOrganization?: string;
  memberOfFamily?: string;
  dateAndCountryOfProtection?: string;
  workPermitMention?: string;
  employerVat1?: string;
  employerVat2?: string;
  regionalFileNumber?: string;
  brexitMention1?: string;
  brexitMention2?: string;
  addressStreetAndNumber?: string;
  addressZip?: string;
  addressMunicipality?: string;
}

export interface UseEidReturn {
  isInitialized: boolean;
  isConnected: boolean;
  hasCard: boolean;
  cardData: EidCardData | null;
  photo: string | null;
  error: string | null;
  isLoading: boolean;
  refreshCard: () => Promise<void>;
  initialize: () => Promise<void>;
  cleanup: () => Promise<void>;
}

export function useEid(): UseEidReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasCard, setHasCard] = useState(false);
  const [cardData, setCardData] = useState<EidCardData | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const initialize = useCallback(async () => {
    if (isInitialized) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await window.electronAPI.eidInitialize();
      if (result.success) {
        setIsInitialized(true);
        setIsConnected(result.connected || false);
      } else {
        setError(result.error || 'Failed to initialize eID module');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  const checkStatus = useCallback(async () => {
    if (!isInitialized) {
      // Try to initialize if not already done
      try {
        const result = await window.electronAPI.eidInitialize();
        if (result.success) {
          setIsInitialized(true);
          setIsConnected(result.connected || false);
        }
      } catch (err) {
        console.error('Error initializing eID:', err);
      }
      return;
    }

    try {
      const statusResult = await window.electronAPI.eidGetStatus();
      const newIsConnected = statusResult.connected || false;
      const newHasCard = statusResult.hasCard || false;

      // Update connection status if changed
      if (newIsConnected !== isConnected) {
        setIsConnected(newIsConnected);
        
        // If reader was disconnected, clear card data
        if (!newIsConnected) {
          setHasCard(false);
          setCardData(null);
          setPhoto(null);
        }
      }

      // If card status changed, update data
      if (newIsConnected && newHasCard !== hasCard) {
        setHasCard(newHasCard);
        
        if (newHasCard) {
          // Card was inserted, load data
          setIsLoading(true);
          setError(null);
          
          try {
            // Get card data
            const dataResult = await window.electronAPI.eidGetCardData();
            if (dataResult.success && dataResult.data) {
              setCardData(dataResult.data);
            }

            // Get photo
            const photoResult = await window.electronAPI.eidGetPhoto();
            if (photoResult.success && photoResult.photo) {
              setPhoto(photoResult.photo);
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to read card');
          } finally {
            setIsLoading(false);
          }
        } else {
          // Card was removed, clear data
          setCardData(null);
          setPhoto(null);
        }
      }
    } catch (err) {
      console.error('Error checking status:', err);
    }
  }, [isInitialized, isConnected, hasCard]);

  const refreshCard = useCallback(async () => {
    if (!isInitialized) {
      await initialize();
      return;
    }

    // Force a full refresh
    setIsLoading(true);
    setError(null);

    try {
      const statusResult = await window.electronAPI.eidGetStatus();
      setIsConnected(statusResult.connected || false);
      setHasCard(statusResult.hasCard || false);

      if (statusResult.hasCard) {
        // Get card data
        const dataResult = await window.electronAPI.eidGetCardData();
        if (dataResult.success && dataResult.data) {
          setCardData(dataResult.data);
        }

        // Get photo
        const photoResult = await window.electronAPI.eidGetPhoto();
        if (photoResult.success && photoResult.photo) {
          setPhoto(photoResult.photo);
        }
      } else {
        setCardData(null);
        setPhoto(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read card');
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, initialize]);

  const cleanup = useCallback(async () => {
    try {
      await window.electronAPI.eidCleanup();
      setIsInitialized(false);
      setIsConnected(false);
      setHasCard(false);
      setCardData(null);
      setPhoto(null);
    } catch (err) {
      console.error('Failed to cleanup eID module:', err);
    }
  }, []);

  // Auto-initialize on mount
  useEffect(() => {
    initialize();

    return () => {
      cleanup();
    };
  }, []);

  // Poll for connection and card status changes
  useEffect(() => {
    // Start checking immediately, even before initialization
    checkStatus();
    
    const interval = setInterval(() => {
      checkStatus();
    }, 2000); // Check status every 2 seconds

    return () => clearInterval(interval);
  }, [checkStatus]);

  return {
    isInitialized,
    isConnected,
    hasCard,
    cardData,
    photo,
    error,
    isLoading,
    refreshCard,
    initialize,
    cleanup
  };
}