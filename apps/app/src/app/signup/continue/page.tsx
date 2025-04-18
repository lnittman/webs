"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContinuePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Comprehensive logging
    console.log('[ContinuePage] Component mounted');
    console.log('[ContinuePage] URL:', window.location.href);
    console.log('[ContinuePage] Search params:', window.location.search);
    console.log('[ContinuePage] Hash:', window.location.hash);
    
    // First attempt - try to redirect the user with client-side router
    console.log('[ContinuePage] Redirecting via Next.js router');
    router.push('/');
    
    // Backup approach - use direct location change with a slight delay
    const timeoutA = setTimeout(() => {
      console.log('[ContinuePage] Router fallback: using window.location.replace');
      window.location.replace('/');
    }, 200);
    
    // Final fallback - force a hard refresh to home
    const timeoutB = setTimeout(() => {
      console.log('[ContinuePage] Final fallback: using window.location.href');
      window.location.href = '/';
    }, 500);
    
    // Handle Clerk sign-up completion
    const handleSignUpSuccess = () => {
      console.log('[ContinuePage] Sign-up successful event detected');
      clearTimeout(timeoutA);
      clearTimeout(timeoutB);
      window.location.href = '/';
    };
    
    // Listen for sign-up completion
    document.addEventListener('clerk:signup:successful', handleSignUpSuccess);
    
    return () => {
      clearTimeout(timeoutA);
      clearTimeout(timeoutB);
      document.removeEventListener('clerk:signup:successful', handleSignUpSuccess);
    };
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Finalizing your sign-up</h1>
        <p className="mb-4">Redirecting you to the home page...</p>
        <div className="flex justify-center space-x-1">
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-75"></div>
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-150"></div>
        </div>
      </div>
    </div>
  );
} 