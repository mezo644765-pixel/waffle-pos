import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useNetwork } from './NetworkContext';

export interface PriceConfig {
  waffleBasePrice: number;
  pancakePrice: number;
  version: number;
  updatedAt: string;
}

const DEFAULT_PRICES: PriceConfig = {
  waffleBasePrice: 60,
  pancakePrice: 10,
  version: 0,
  updatedAt: new Date().toISOString(),
};

interface PricesContextType {
  prices: PriceConfig;
  isLoading: boolean;
  refreshPrices: () => Promise<void>;
  updatePrices: (waffleBase: number, pancakePriceVal: number) => Promise<void>;
}

const PricesContext = createContext<PricesContextType | null>(null);

export function PricesProvider({ children }: { children: React.ReactNode }) {
  const { gasUrl } = useAuth();
  const { isOnline } = useNetwork();
  const [prices, setPrices] = useState<PriceConfig>(DEFAULT_PRICES);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('prices').then((stored) => {
      if (stored) setPrices(JSON.parse(stored));
    });
  }, []);

  const refreshPrices = useCallback(async () => {
    if (!gasUrl) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${gasUrl}?action=getSettings`);
      const data = await res.json();
      if (data.success) {
        const incoming: PriceConfig = data.settings;
        // Only update if version is newer
        setPrices((current) => {
          if (incoming.version > current.version) {
            AsyncStorage.setItem('prices', JSON.stringify(incoming));
            return incoming;
          }
          return current;
        });
      }
    } catch {
      // Silently use cached prices
    } finally {
      setIsLoading(false);
    }
  }, [gasUrl]);

  useEffect(() => {
    if (isOnline && gasUrl) refreshPrices();
  }, [isOnline, gasUrl, refreshPrices]);

  const updatePrices = useCallback(
    async (waffleBase: number, pancakePriceVal: number) => {
      if (!gasUrl) throw new Error('رابط النظام غير مُعيَّن');
      const newConfig: PriceConfig = {
        waffleBasePrice: waffleBase,
        pancakePrice: pancakePriceVal,
        version: prices.version + 1,
        updatedAt: new Date().toISOString(),
      };
      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateSettings', settings: newConfig }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'فشل تحديث الأسعار');
      setPrices(newConfig);
      await AsyncStorage.setItem('prices', JSON.stringify(newConfig));
    },
    [gasUrl, prices.version],
  );

  return (
    <PricesContext.Provider
      value={{ prices, isLoading, refreshPrices, updatePrices }}
    >
      {children}
    </PricesContext.Provider>
  );
}

export function usePrices() {
  const ctx = useContext(PricesContext);
  if (!ctx) throw new Error('usePrices must be within PricesProvider');
  return ctx;
}
