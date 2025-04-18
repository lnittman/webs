"use client";

import React, { useEffect, useState } from "react";
import * as Clerk from '@clerk/elements/common';
import * as SignIn from '@clerk/elements/sign-in';
import { useTheme } from 'next-themes';
import { useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";

export default function SignInPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const clerk = useClerk();
  const [debugInfo, setDebugInfo] = useState('');
  const [error, setError] = useState('');
  
  // Effect for debugging
  useEffect(() => {
    if (isLoaded) {
      setDebugInfo(`Auth loaded: ${isLoaded}, Signed in: ${isSignedIn}, Time: ${new Date().toISOString()}`);
      console.log("Auth state:", { isLoaded, isSignedIn, time: new Date().toISOString() });
    }
  }, [isLoaded, isSignedIn]);
  
  // Effect to handle redirection after successful sign-in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      console.log("User is signed in, redirecting to home page");
      try {
        // Allow browser to finish any pending processes
        setTimeout(() => {
          router.push('/');
          console.log("Redirect initiated to /");
        }, 1500);
      } catch (err: any) {
        console.error("Error during redirection:", err);
        setError(`Redirect error: ${err?.message || 'Unknown error'}`);
      }
    }
  }, [isLoaded, isSignedIn, router]);

  // Handle manual navigation
  const goToHome = () => {
    try {
      console.log("Manual navigation to home page");
      window.location.href = '/';
    } catch (err: any) {
      console.error("Error during manual navigation:", err);
      setError(`Manual navigation error: ${err?.message || 'Unknown error'}`);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm">
      <div className="w-full p-6">
        <SignIn.Root
          routing="path"
          path="/signin"
        >
          <SignIn.Step name="start" className="w-full">
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
              <Clerk.Field name="identifier" className="mb-1">
                <Clerk.Label className="block text-sm font-medium mb-2">email</Clerk.Label>
                <Clerk.Input 
                  className="w-full p-3 bg-card border-border border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring" 
                />
                <Clerk.FieldError className="text-destructive text-xs mt-2" />
              </Clerk.Field>
              
              <Clerk.Field name="password" className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <Clerk.Label className="block text-sm font-medium">password</Clerk.Label>
                  <SignIn.Action 
                    navigate="forgot-password"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    forgot password?
                  </SignIn.Action>
                </div>
                <Clerk.Input 
                  type="password"
                  className="w-full p-3 bg-card border-border border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring" 
                />
                <Clerk.FieldError className="text-destructive text-xs mt-2" />
              </Clerk.Field>
            </div>
            
            <SignIn.Action 
              submit
              className="w-full p-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors"
            >
              submit
            </SignIn.Action>
            
            <div className="text-center mt-6 text-sm text-muted-foreground">
              don't have an account?{' '}
              <a href="/signup" className="text-primary hover:text-primary/80 hover:underline">
                sign up
              </a>
            </div>
          </SignIn.Step>
          
          <SignIn.Step name="sso-callback">
            <div className="text-center mb-10">
              <div className="text-4xl font-bold mb-2">🕸️ webs</div>
              <h2 className="text-xl font-medium">Completing sign-in...</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Please wait while we're completing your authentication
              </p>
              {debugInfo && (
                <div className="mt-4 p-2 text-xs bg-muted text-muted-foreground rounded font-mono overflow-x-auto max-w-full">
                  {debugInfo}
                </div>
              )}
              {error && (
                <div className="mt-2 p-2 text-xs bg-destructive/20 text-destructive rounded font-mono overflow-x-auto max-w-full">
                  {error}
                </div>
              )}
            </div>
            <SignIn.Captcha />
            <Clerk.GlobalError className="text-destructive text-sm mt-4 text-center" />
            <div className="mt-4 text-center">
              <button 
                onClick={goToHome}
                className="mt-4 p-2 bg-muted hover:bg-muted/80 rounded-md text-sm font-medium transition-colors"
              >
                Go to Home Page
              </button>
            </div>
          </SignIn.Step>
          
          <SignIn.Step name="verifications">
            <SignIn.Strategy name="password">
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold">enter your password</h1>
                <p className="text-sm mt-2 text-muted-foreground">
                  please enter your password to continue
                </p>
              </div>
              
              <Clerk.Field name="password" className="mb-5">
                <Clerk.Label className="block text-sm font-medium mb-2">password</Clerk.Label>
                <Clerk.Input 
                  className="w-full p-3 bg-card border-border border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring" 
                />
                <Clerk.FieldError className="text-destructive text-xs mt-2" />
              </Clerk.Field>
              
              <SignIn.Action 
                submit
                className="w-full p-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors"
              >
                sign in
              </SignIn.Action>
              
              <SignIn.Action 
                navigate="forgot-password"
                className="text-center block w-full mt-4 text-sm text-muted-foreground hover:text-foreground"
              >
                forgot password?
              </SignIn.Action>
            </SignIn.Strategy>
            
            <SignIn.Strategy name="email_code">
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold">check your email</h1>
                <p className="text-sm mt-2 text-muted-foreground">
                  we sent a verification code to <span className="text-foreground"><SignIn.SafeIdentifier /></span>
                </p>
              </div>
              
              <Clerk.Field name="code" className="mb-5">
                <Clerk.Label className="block text-sm font-medium mb-2">verification code</Clerk.Label>
                <Clerk.Input 
                  className="w-full p-3 bg-card border-border border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring" 
                />
                <Clerk.FieldError className="text-destructive text-xs mt-2" />
              </Clerk.Field>
              
              <SignIn.Action 
                submit
                className="w-full p-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors"
              >
                verify
              </SignIn.Action>
            </SignIn.Strategy>
            
            <SignIn.Strategy name="reset_password_email_code">
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold">check your email</h1>
                <p className="text-sm mt-2 text-muted-foreground">
                  we sent a password reset code to <span className="text-foreground"><SignIn.SafeIdentifier /></span>
                </p>
              </div>
              
              <Clerk.Field name="code" className="mb-5">
                <Clerk.Label className="block text-sm font-medium mb-2">reset code</Clerk.Label>
                <Clerk.Input 
                  className="w-full p-3 bg-card border-border border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring" 
                />
                <Clerk.FieldError className="text-destructive text-xs mt-2" />
              </Clerk.Field>
              
              <SignIn.Action 
                submit
                className="w-full p-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors"
              >
                continue
              </SignIn.Action>
            </SignIn.Strategy>
          </SignIn.Step>
          
          <SignIn.Step name="forgot-password">
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold">reset your password</h1>
              <p className="text-sm mt-2 text-muted-foreground">
                enter your email and we'll send you a reset link
              </p>
            </div>
            
            <Clerk.Field name="identifier" className="mb-5">
              <Clerk.Label className="block text-sm font-medium mb-2">email</Clerk.Label>
              <Clerk.Input 
                className="w-full p-3 bg-card border-border border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring" 
              />
              <Clerk.FieldError className="text-destructive text-xs mt-2" />
            </Clerk.Field>
            
            <div className="flex flex-col gap-3">
              <div className="w-full p-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium text-center transition-colors">
                <SignIn.SupportedStrategy name="reset_password_email_code">
                  reset password
                </SignIn.SupportedStrategy>
              </div>
              
              <SignIn.Action 
                navigate="previous"
                className="text-center block w-full text-sm text-muted-foreground hover:text-foreground"
              >
                back to sign in
              </SignIn.Action>
            </div>
          </SignIn.Step>
          
          <SignIn.Step name="reset-password">
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold">create new password</h1>
              <p className="text-sm mt-2 text-muted-foreground">
                please create a new password for your account
              </p>
            </div>
            
            <Clerk.Field name="password" className="mb-4">
              <Clerk.Label className="block text-sm font-medium mb-2">new password</Clerk.Label>
              <Clerk.Input 
                className="w-full p-3 bg-card border-border border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring" 
              />
              <Clerk.FieldError className="text-destructive text-xs mt-2" />
            </Clerk.Field>
            
            <Clerk.Field name="confirmPassword" className="mb-5">
              <Clerk.Label className="block text-sm font-medium mb-2">confirm password</Clerk.Label>
              <Clerk.Input 
                className="w-full p-3 bg-card border-border border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring" 
              />
              <Clerk.FieldError className="text-destructive text-xs mt-2" />
            </Clerk.Field>
            
            <SignIn.Action 
              submit
              className="w-full p-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors"
            >
              reset password
            </SignIn.Action>
          </SignIn.Step>
        </SignIn.Root>
      </div>
    </div>
  );
} 