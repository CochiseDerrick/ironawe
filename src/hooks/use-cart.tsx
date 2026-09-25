
"use client";

import { useState, useEffect, useCallback, createContext, ReactNode, useContext } from 'react';
import { getProductsByIds, type Product } from '@/lib/database';

export interface CartItem extends Product {
  quantity: number;
}

export type AddToCartResult = 'added' | 'increased' | 'max_reached' | 'out_of_stock';

export interface StockIssue {
  productId: string;
  name: string;
  requested: number;
  available: number;
}

export interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: Product) => AddToCartResult;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    refreshStock: () => Promise<StockIssue[]>;
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

  // Adds a product to the cart, but never lets the quantity for that item exceed the stock
  // level known at the time (product.stock). This is a first line of defense based on
  // whatever stock value the UI last saw - it's not a substitute for the live re-validation
  // in refreshStock() or the authoritative server-side check in the createOrder action.
  const addToCart = useCallback((product: Product): AddToCartResult => {
    if (product.stock <= 0) {
      return 'out_of_stock';
    }

    let result: AddToCartResult = 'added';

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          result = 'max_reached';
          return prevItems;
        }
        result = 'increased';
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, stock: product.stock }
            : item
        );
      }

      return [...prevItems, { ...product, quantity: 1 }];
    });

    return result;
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCartItems(prevItems => {
        const item = prevItems.find(i => i.id === productId);
        if (!item) return prevItems;

        // Always allow decreasing (down to removal, even if the item is currently sold out).
        // Only cap increases at the last-known stock level - and if that cap is below the
        // current quantity, treat it as a no-op rather than forcing a reduction, since a
        // reduction from a "+" click would be surprising. (The UI should disable "+" once
        // quantity reaches stock, this is just a safety net.)
        const isIncrease = quantity > item.quantity;
        const nextQuantity = isIncrease
            ? Math.min(quantity, Math.max(item.stock, item.quantity))
            : quantity;

        if (nextQuantity <= 0) {
            return prevItems.filter(i => i.id !== productId);
        }

        return prevItems.map(i => (i.id === productId ? { ...i, quantity: nextQuantity } : i));
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Re-fetches current stock for every item in the cart directly from the database, updates
  // each cart item's `stock` field to that live value, and returns any items whose requested
  // quantity now exceeds what's actually available (including items that are now sold out or
  // no longer exist, i.e. available = 0). Call this on the cart and checkout pages so stale
  // localStorage cart state can't silently let someone "buy" something that sold out.
  const refreshStock = useCallback(async (): Promise<StockIssue[]> => {
    if (cartItems.length === 0) return [];

    try {
      const liveProducts = await getProductsByIds(cartItems.map(item => item.id));
      const liveStockById = new Map(liveProducts.map(product => [product.id, product.stock]));
      const issues: StockIssue[] = [];

      setCartItems(prevItems =>
        prevItems.map(item => {
          const liveStock = liveStockById.has(item.id) ? liveStockById.get(item.id)! : 0;
          if (item.quantity > liveStock) {
            issues.push({
              productId: item.id,
              name: item.name,
              requested: item.quantity,
              available: liveStock,
            });
          }
          return { ...item, stock: liveStock };
        })
      );

      return issues;
    } catch (error) {
      console.error('Failed to refresh stock levels for cart items', error);
      return [];
    }
  }, [cartItems]);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const cartTotal = cartItems.reduce((acc, item) => acc + (item.discountPrice || item.price) * item.quantity, 0);

  const shippingTotal = cartItems.reduce((acc, item) => acc + (item.shippingCost || 0) * item.quantity, 0);

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshStock,
    cartCount,
    cartTotal,
    shippingTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
};
