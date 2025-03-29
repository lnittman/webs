'use client';

import { useEffect, useState } from 'react';
import type { ThemeProviderProps } from 'next-themes';
import { ThemeProvider as NextThemeProvider } from 'next-themes';

export const ThemeProvider = ({
  children,
  ...properties
}: ThemeProviderProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    
    // Check if the device is mobile using userAgent or width
    const checkMobile = () => {
      if (typeof window === 'undefined') return false;
      
      return window.innerWidth <= 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    
    setIsMobile(checkMobile());
    
    // Handle resize events
    const handleResize = () => {
      setIsMobile(checkMobile());
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // If not mounted yet (during SSR), use a default
  if (!isMounted) {
    return (
      <NextThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
        forcedTheme="dark" // Force dark theme during SSR
        {...properties}
      >
        {children}
      </NextThemeProvider>
    );
  }

  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme={isMobile ? "system" : "dark"}
      enableSystem={isMobile}
      disableTransitionOnChange
      {...properties}
    >
      {children}
    </NextThemeProvider>
  );
}
