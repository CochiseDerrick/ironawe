
"use client";

import { useState, useEffect, useCallback, createContext, ReactNode, useContext } from 'react';
import type { Product } from '@/lib/database';

export interface CartItem extends Product {
  quantity: number;
}

export interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
    shippingTotal: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

const CART_KEY = 'ironawe-cart';

const readCartFromStorage = (): CartItem[] => {
    if (typeof window === 'undefined') {
        return [];
    }
    try {
        const storedCart = localStorage.getItem(CART_KEY);
        return storedCart ? JSON.parse(storedCart) : [];
    } catch (error) {
        console.error("Could not read cart from local storage", error);
        return [];
    }
}

const writeCartToStorage = (cartItems: CartItem[]) => {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    } catch (error) {
        console.error("Could not save cart to local storage", error);
    }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setCartItems(readCartFromStorage());
  }, []);

  useEffect(() => {
    writeCartToStorage(cartItems);
  }, [cartItems]);

  const addToCart = useCallback((product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCartItems(prevItems => {
        if (quantity <= 0) {
            return prevItems.filter(item => item.id !== productId);
        }
        return prevItems.map(item =>
            item.id === productId ? { ...item, quantity } : item
        );
    });
  }, []);
  
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);
  
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const cartTotal = cartItems.reduce((acc, item) => acc + (item.discountPrice || item.price) * item.quantity, 0);

  const shippingTotal = cartItems.reduce((acc, item) => acc + (item.shippingCost || 0) * item.quantity, 0);
  
  const value: CartContextType = { cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal, shippingTotal };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
};
