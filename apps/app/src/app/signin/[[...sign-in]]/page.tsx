"use client";

import React, { useState, useEffect } from "react";
import * as Clerk from '@clerk/elements/common';
import * as SignIn from '@clerk/elements/sign-in';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from "@clerk/nextjs";

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url') || '/';
  const { isSignedIn, isLoaded } = useAuth();
  
  // Handle redirection after successful sign-in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      try {
        console.log("Redirecting to:", redirectUrl);
        window.location.href = redirectUrl;
      } catch (err) {
        console.error("Error during redirection:", err);
        // Fallback to home page
        window.location.href = '/';
      }
    }
  }, [isLoaded, isSignedIn, redirectUrl]);
  
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm">
      <div className="w-full p-6">
        <SignIn.Root 
          routing="path"
          path="/signin"
        >
          <SignIn.Step name="start" className="w-full">
            <div className="text-center mb-10">
              <div className="text-4xl font-bold mb-2 text-foreground">🕸️ webs</div>
            </div>
            
            <div className="grid grid-cols-1 gap-3 w-full mb-6">
              <Clerk.Connection 
                name="apple" 
                className="flex items-center justify-center gap-2 w-full p-3 bg-card hover:bg-card/80 rounded-md text-sm font-medium transition-colors text-foreground"
              >
                <Clerk.Icon className="h-5 w-5" />
                sign in with Apple
              </Clerk.Connection>
              
              <Clerk.Connection 
                name="google" 
                className="flex items-center justify-center gap-2 w-full p-3 bg-card hover:bg-card/80 rounded-md text-sm font-medium transition-colors text-foreground"
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
                <span className="bg-background px-4 text-foreground/70">or</span>
              </div>
            </div>
            
            <div className="mb-5">
              <Clerk.Field name="identifier" className="mb-5">
                <Clerk.Label className="block text-sm font-medium mb-2 text-foreground">email</Clerk.Label>
                <Clerk.Input 
                  className="w-full p-3 bg-card border-border border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground" 
                />
                <Clerk.FieldError className="text-destructive text-xs mt-2" />
              </Clerk.Field>
              
              <SignIn.Strategy name="password">
                <Clerk.Field name="password" className="mb-5">
                  <Clerk.Label className="block text-sm font-medium mb-2 text-foreground">password</Clerk.Label>
                  <div className="relative">
                    <Clerk.Input 
                      type={showPassword ? "text" : "password"}
                      className="w-full p-3 bg-card border-border border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring pr-10 text-foreground" 
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/70 hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeSlash className="h-5 w-5" weight="duotone" /> : <Eye className="h-5 w-5" weight="duotone" />}
                    </button>
                  </div>
                  <Clerk.FieldError className="text-destructive text-xs mt-2" />
                </Clerk.Field>
              </SignIn.Strategy>
            </div>
            
            <SignIn.Action 
              submit
              className="w-full p-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors"
            >
              sign in
            </SignIn.Action>
            
            <div className="text-center mt-6 text-sm text-foreground/70">
              don't have an account?{' '}
              <a href="/signup" className="text-primary hover:text-primary/80 hover:underline">
                sign up
              </a>
            </div>
          </SignIn.Step>
          
          <SignIn.Step name="verifications">
            <SignIn.Strategy name="email_code">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Check your email</h2>
              <p className="mb-6 text-foreground/70">
                We sent a code to <SignIn.SafeIdentifier />
              </p>
              
              <Clerk.Field name="code" className="mb-5">
                <Clerk.Label className="block text-sm font-medium mb-2 text-foreground">verification code</Clerk.Label>
                <Clerk.Input 
                  className="w-full p-3 bg-card border-border border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground" 
                />
                <Clerk.FieldError className="text-destructive text-xs mt-2" />
              </Clerk.Field>
              
              <SignIn.Action 
                submit
                className="w-full p-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors mb-3"
              >
                verify
              </SignIn.Action>
              
              <SignIn.Action 
                navigate="previous"
                className="w-full p-3 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md text-sm font-medium transition-colors"
              >
                back
              </SignIn.Action>
            </SignIn.Strategy>
          </SignIn.Step>
        </SignIn.Root>
      </div>
    </div>
  );
} 