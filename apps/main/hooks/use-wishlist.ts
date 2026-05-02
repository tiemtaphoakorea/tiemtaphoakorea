"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "k_smart_wishlist";

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  slug?: string;
}

function loadFromStorage(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WishlistItem[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: WishlistItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    setItems(loadFromStorage());
  }, []);

  const isInWishlist = useCallback((id: string) => items.some((item) => item.id === id), [items]);

  const addItem = useCallback((item: WishlistItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      const next = [...prev, item];
      saveToStorage(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveToStorage(next);
      return next;
    });
  }, []);

  const toggleItem = useCallback(
    (item: WishlistItem) => {
      if (isInWishlist(item.id)) {
        removeItem(item.id);
      } else {
        addItem(item);
      }
    },
    [isInWishlist, addItem, removeItem],
  );

  const clearWishlist = useCallback(() => {
    setItems([]);
    saveToStorage([]);
  }, []);

  return { items, isInWishlist, addItem, removeItem, toggleItem, clearWishlist };
}
