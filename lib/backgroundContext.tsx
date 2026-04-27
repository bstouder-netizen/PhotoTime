import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@background_uri';

type BackgroundContextType = {
  backgroundUri: string | null;
  setBackgroundUri: (uri: string | null) => Promise<void>;
};

const BackgroundContext = createContext<BackgroundContextType>({
  backgroundUri: null,
  setBackgroundUri: async () => {},
});

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [backgroundUri, setBackground] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val) setBackground(val);
    });
  }, []);

  const setBackgroundUri = async (uri: string | null) => {
    setBackground(uri);
    if (uri) {
      await AsyncStorage.setItem(STORAGE_KEY, uri);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <BackgroundContext.Provider value={{ backgroundUri, setBackgroundUri }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export const useBackground = () => useContext(BackgroundContext);
