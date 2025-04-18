"use client";

import React, { useState, useEffect } from "react";
import * as Clerk from '@clerk/elements/common';
import * as SignUp from '@clerk/elements/sign-up';
import { useTheme } from 'next-themes';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  
  // Add enhanced logging and event listeners
  useEffect(() => {
    // Log initial mount
    console.log("[SignUp] Component mounted");
    
    const handleSignUpStart = () => {
      console.log("[SignUp] Sign-up process started");
    };
    
    const handleSignUpAttempt = () => {
      console.log("[SignUp] Sign-up attempt made");
    };
    
    const handleVerification = () => {
      console.log("[SignUp] Verification step reached");
    };
    
    const handleComplete = (event: Event) => {
      console.log("[SignUp] Sign-up COMPLETE event fired", event);
      
      // Force a direct navigation after sign-up is fully completed
      router.push('/');
      
      // Backup redirect using window.location
      setTimeout(() => {
        console.log("[SignUp] Forcing navigation to home page");
        window.location.href = "/";
      }, 500);
    };
    
    const handleVerificationComplete = (event: Event) => {
      console.log("[SignUp] Verification COMPLETE event fired", event);
      
      // Force a direct navigation after verification is completed
      router.push('/');
      
      // Backup redirect using window.location
      setTimeout(() => {
        console.log("[SignUp] Verification complete, forcing navigation to home page");
        window.location.href = "/";
      }, 500);
    };
    
    const handleError = (error: any) => {
      console.error("[SignUp] Error during sign-up:", error);
    };
    
    // Listen for all the relevant clerk events
    document.addEventListener('clerk:signup:started', handleSignUpStart);
    document.addEventListener('clerk:signup:attempted', handleSignUpAttempt);
    document.addEventListener('clerk:signup:verification', handleVerification);
    document.addEventListener('clerk:signup:successful', handleComplete);
    document.addEventListener('clerk:verification:complete', handleVerificationComplete);
    document.addEventListener('clerk:error', handleError);
    
    // Clean up event listeners
    return () => {
      console.log("[SignUp] Component unmounting, cleaning up listeners");
      document.removeEventListener('clerk:signup:started', handleSignUpStart);
      document.removeEventListener('clerk:signup:attempted', handleSignUpAttempt);
      document.removeEventListener('clerk:signup:verification', handleVerification);
      document.removeEventListener('clerk:signup:successful', handleComplete);
      document.removeEventListener('clerk:verification:complete', handleVerificationComplete);
      document.removeEventListener('clerk:error', handleError);
    };
  }, [router]);
  
  // Monitor route changes
  useEffect(() => {
    console.log("[SignUp] Current pathname:", window.location.pathname);
    
    // Forcibly redirect if on a continue page
    if (window.location.pathname.includes('/continue')) {
      console.log("[SignUp] Detected continue page, redirecting to home");
      router.push('/');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  }, [router]);
  
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm">
      <div className="w-full p-6">
        <SignUp.Root 
          routing="hash"
          path="/"
        >
          <SignUp.Step name="start" className="w-full">
            <div className="text-center mb-10">
              <div className="text-4xl font-bold mb-2">🕸️ webs</div>
            </div>
            
            <div className="grid grid-cols-1 gap-3 w-full mb-6">
              <Clerk.Connection 
                name="apple" 
                className="flex items-center justify-center gap-2 w-full p-3 bg-card hover:bg-card/80 rounded-md text-sm font-medium transition-colors"
              >
                <Clerk.Icon className="h-5 w-5" />
                sign in with Apple
              </Clerk.Connection>
              
              <Clerk.Connection 
                name="google" 
                className="flex items-center justify-center gap-2 w-full p-3 bg-card hover:bg-card/80 rounded-md text-sm font-medium transition-colors"
              >
                <Clerk.Icon className="h-5 w-5" />
                sign in with Google
              </Clerk.Connection>
            </div>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-4 text-muted-foreground">or</span>
              </div>
            </div>
            
            <div className="mb-5">
              <Clerk.Field name="emailAddress" className="mb-5">
                <Clerk.Label className="block text-sm font-medium mb-2">email</Clerk.Label>
                <Clerk.Input 
                  className="w-full p-3 bg-card border-border border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring" 
                />
                <Clerk.FieldError className="text-destructive text-xs mt-2" />
              </Clerk.Field>
              
              <Clerk.Field name="password" className="mb-5">
                <Clerk.Label className="block text-sm font-medium mb-2">password</Clerk.Label>
                <div className="relative">
                  <Clerk.Input 
                    type={showPassword ? "text" : "password"}
                    className="w-full p-3 bg-card border-border border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring pr-10" 
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeSlash className="h-5 w-5" weight="duotone" /> : <Eye className="h-5 w-5" weight="duotone" />}
                  </button>
                </div>
                <Clerk.FieldError className="text-destructive text-xs mt-2" />
              </Clerk.Field>
              
              <Clerk.Field name="confirmPassword" className="mb-5">
                <Clerk.Label className="block text-sm font-medium mb-2">confirm password</Clerk.Label>
                <div className="relative">
                  <Clerk.Input 
                    type={showConfirmPassword ? "text" : "password"} 
                    className="w-full p-3 bg-card border-border border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring pr-10" 
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeSlash className="h-5 w-5" weight="duotone" /> : <Eye className="h-5 w-5" weight="duotone" />}
                  </button>
                </div>
                <Clerk.FieldError className="text-destructive text-xs mt-2" />
              </Clerk.Field>
              
              <SignUp.Captcha className="mt-3" />
            </div>
            
            <SignUp.Action 
              submit
              className="w-full p-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors"
            >
              sign up
            </SignUp.Action>
            
            <div className="text-center mt-6 text-sm text-muted-foreground">
              already have an account?{' '}
              <a href="/signin" className="text-primary hover:text-primary/80 hover:underline">
                sign in
              </a>
            </div>
          </SignUp.Step>
          
          <SignUp.Step name="verifications">
            <SignUp.Strategy name="email_code">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold mb-2">🕸️</div>
                <h1 className="text-xl font-bold">check your email</h1>
                <p className="text-sm mt-2 text-muted-foreground">
                  we sent a verification code to your email
                </p>
              </div>
              
              <Clerk.Field name="code" className="mb-5">
                <Clerk.Label className="block text-sm font-medium mb-2">verification code</Clerk.Label>
                <Clerk.Input 
                  className="w-full p-3 bg-card border-border border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring" 
                />
                <Clerk.FieldError className="text-destructive text-xs mt-2" />
              </Clerk.Field>
              
              <SignUp.Action 
                submit
                className="w-full p-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors mb-3"
              >
                verify
              </SignUp.Action>
              
              <SignUp.Action
                navigate="start"
                className="text-center block w-full text-sm text-muted-foreground hover:text-foreground"
              >
                go back
              </SignUp.Action>
            </SignUp.Strategy>
            
            <SignUp.Strategy name="phone_code">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold mb-2">🕸️</div>
                <h1 className="text-xl font-bold">check your phone</h1>
                <p className="text-sm mt-2 text-muted-foreground">
                  we sent a verification code to your phone
                </p>
              </div>
              
              <Clerk.Field name="code" className="mb-5">
                <Clerk.Label className="block text-sm font-medium mb-2">verification code</Clerk.Label>
                <Clerk.Input 
                  className="w-full p-3 bg-card border-border border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring" 
                />
                <Clerk.FieldError className="text-destructive text-xs mt-2" />
              </Clerk.Field>
              
              <SignUp.Action 
                submit
                className="w-full p-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors mb-3"
              >
                verify
              </SignUp.Action>
              
              <SignUp.Action
                navigate="start"
                className="text-center block w-full text-sm text-muted-foreground hover:text-foreground"
              >
                go back
              </SignUp.Action>
            </SignUp.Strategy>
          </SignUp.Step>
        </SignUp.Root>
      </div>
    </div>
  );
}