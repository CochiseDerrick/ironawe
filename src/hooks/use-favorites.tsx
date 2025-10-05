
"use client";

import { useState, useEffect, useCallback, createContext, ReactNode, useContext } from 'react';

export interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  favoritesCount: number;
}

export const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

const FAVORITES_KEY = 'ironawe-favorites';

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITES_KEY);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error("Could not read favorites from local storage", error);
    }
  }, []);

  const toggleFavorite = useCallback((productId: string) => {
    setFavorites(prevFavorites => {
      const isFavorite = prevFavorites.includes(productId);
      const newFavorites = isFavorite
        ? prevFavorites.filter(id => id !== productId)
        : [...prevFavorites, productId];
      
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      } catch (error) {
        console.error("Could not save favorites to local storage", error);
      }
      
      return newFavorites;
    });
  }, []);

  const isFavorite = (productId: string) => favorites.includes(productId);

  const favoritesCount = favorites.length;

  const value: FavoritesContextType = { favorites, toggleFavorite, isFavorite, favoritesCount };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
