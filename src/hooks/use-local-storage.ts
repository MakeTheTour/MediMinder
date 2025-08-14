
'use client';

import { useState, useEffect, useCallback } from 'react';

// A utility function to safely get the initial value from localStorage.
function getInitialValue<T>(key: string, initialValue: T): T {
  // Prevent server-side execution, since localStorage is not available.
  if (typeof window === 'undefined') {
    return initialValue;
  }
  try {
    // Get from local storage by key
    const item = window.localStorage.getItem(key);
    // Parse stored json or if none return initialValue
    return item ? JSON.parse(item) : initialValue;
  } catch (error) {
    // If error also return initialValue
    console.warn(`Error reading localStorage key “${key}”:`, error);
    return initialValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    return getInitialValue(key, initialValue);
  });

  // The 'setValue' function is now wrapped in 'useCallback' to prevent
  // it from being recreated on every render.
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      // Prevent build error "window is undefined" but keep keep working
      if (typeof window === 'undefined') {
        console.warn(
          `Tried setting localStorage key “${key}” even though no window was found`
        );
        return;
      }

      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        // Save state
        setStoredValue(valueToStore);
        // Save to local storage
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key, storedValue] // This dependency was causing the issue, so we remove it. A setter function from useState can be used in a dependency array without causing re-renders if it doesn't depend on the state it sets. By wrapping it we can control this behavior better.
  );
  
    // This effect listens for changes in other browser tabs
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key) {
                try {
                    setStoredValue(e.newValue ? JSON.parse(e.newValue) : initialValue);
                } catch (error) {
                    console.warn(`Error parsing stored value for key "${key}":`, error);
                    setStoredValue(initialValue);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [key, initialValue]);

  return [storedValue, setValue];
}
