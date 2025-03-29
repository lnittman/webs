"use client";

import React, { useState } from "react";
import * as Clerk from '@clerk/elements/common';
import * as SignUp from '@clerk/elements/sign-up';
import { useTheme } from 'next-themes';
import { Eye, EyeOff } from 'lucide-react';

export default function SignUpPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${isDark ? 'bg-[#171717]' : 'bg-[#f9f9f9]'} ${isDark ? 'text-white' : 'text-black'}`}>
      <div className="w-full max-w-sm mx-auto p-6">
        <SignUp.Root routing="hash">
          <SignUp.Step name="start" className="w-full">
            <div className="text-center mb-10">
              <div className="text-4xl font-bold mb-2">🕸️ webs</div>
            </div>
            
            <div className="grid grid-cols-1 gap-3 w-full mb-6">
              <Clerk.Connection 
                name="apple" 
                className={`flex items-center justify-center gap-2 w-full p-3 ${isDark ? 'bg-[#2b2b2b] hover:bg-[#3a3a3a]' : 'bg-[#f1f1f1] hover:bg-[#e5e5e5]'} rounded-md text-sm font-medium transition-colors`}
              >
                <Clerk.Icon className="h-5 w-5" />
                sign in with Apple
              </Clerk.Connection>
              
              <Clerk.Connection 
                name="google" 
                className={`flex items-center justify-center gap-2 w-full p-3 ${isDark ? 'bg-[#2b2b2b] hover:bg-[#3a3a3a]' : 'bg-[#f1f1f1] hover:bg-[#e5e5e5]'} rounded-md text-sm font-medium transition-colors`}
              >
                <Clerk.Icon className="h-5 w-5" />
                sign in with Google
              </Clerk.Connection>
            </div>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className={`w-full border-t ${isDark ? 'border-[#333]' : 'border-[#e0e0e0]'}`} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className={`${isDark ? 'bg-[#171717]' : 'bg-[#f9f9f9]'} px-4 ${isDark ? 'text-[#888]' : 'text-[#777]'}`}>or</span>
              </div>
            </div>
            
            <div className="mb-5">
              <Clerk.Field name="emailAddress" className="mb-5">
                <Clerk.Label className="block text-sm font-medium mb-2">email</Clerk.Label>
                <Clerk.Input 
                  className={`w-full p-3 ${isDark ? 'bg-[#2b2b2b] border-[#333]' : 'bg-white border-[#ddd]'} border rounded-md text-sm ${isDark ? 'text-white' : 'text-black'} focus:outline-none focus:ring-1 ${isDark ? 'focus:ring-[#666]' : 'focus:ring-[#999]'}`} 
                />
                <Clerk.FieldError className="text-red-400 text-xs mt-2" />
              </Clerk.Field>
              
              <Clerk.Field name="password" className="mb-5">
                <Clerk.Label className="block text-sm font-medium mb-2">password</Clerk.Label>
                <div className="relative">
                  <Clerk.Input 
                    type={showPassword ? "text" : "password"}
                    className={`w-full p-3 ${isDark ? 'bg-[#2b2b2b] border-[#333]' : 'bg-white border-[#ddd]'} border rounded-md text-sm ${isDark ? 'text-white' : 'text-black'} focus:outline-none focus:ring-1 ${isDark ? 'focus:ring-[#666]' : 'focus:ring-[#999]'} pr-10`} 
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <Clerk.FieldError className="text-red-400 text-xs mt-2" />
              </Clerk.Field>
              
              <Clerk.Field name="confirmPassword" className="mb-5">
                <Clerk.Label className="block text-sm font-medium mb-2">confirm password</Clerk.Label>
                <div className="relative">
                  <Clerk.Input 
                    type={showConfirmPassword ? "text" : "password"} 
                    className={`w-full p-3 ${isDark ? 'bg-[#2b2b2b] border-[#333]' : 'bg-white border-[#ddd]'} border rounded-md text-sm ${isDark ? 'text-white' : 'text-black'} focus:outline-none focus:ring-1 ${isDark ? 'focus:ring-[#666]' : 'focus:ring-[#999]'} pr-10`} 
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <Clerk.FieldError className="text-red-400 text-xs mt-2" />
              </Clerk.Field>
              
              <SignUp.Captcha className="mt-3" />
            </div>
            
            <SignUp.Action 
              submit
              className={`w-full p-3 ${isDark ? 'bg-[#2b2b2b] hover:bg-[#3a3a3a]' : 'bg-[#f1f1f1] hover:bg-[#e5e5e5]'} rounded-md text-sm font-medium transition-colors`}
            >
              sign up
            </SignUp.Action>
            
            <div className={`text-center mt-6 text-sm ${isDark ? 'text-[#888]' : 'text-[#777]'}`}>
              already have an account?{' '}
              <a href="/signin" className={`${isDark ? 'text-white' : 'text-black'} hover:underline`}>
                sign in
              </a>
            </div>
          </SignUp.Step>
          
          <SignUp.Step name="verifications">
            <SignUp.Strategy name="email_code">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold mb-2">🕸️</div>
                <h1 className="text-xl font-bold">check your email</h1>
                <p className={`${isDark ? 'text-[#888]' : 'text-[#777]'} text-sm mt-2`}>
                  we sent a verification code to your email
                </p>
              </div>
              
              <Clerk.Field name="code" className="mb-5">
                <Clerk.Label className="block text-sm font-medium mb-2">verification code</Clerk.Label>
                <Clerk.Input 
                  className={`w-full p-3 ${isDark ? 'bg-[#2b2b2b] border-[#333]' : 'bg-white border-[#ddd]'} border rounded-md text-sm ${isDark ? 'text-white' : 'text-black'} focus:outline-none focus:ring-1 ${isDark ? 'focus:ring-[#666]' : 'focus:ring-[#999]'}`} 
                />
                <Clerk.FieldError className="text-red-400 text-xs mt-2" />
              </Clerk.Field>
              
              <SignUp.Action 
                submit
                className={`w-full p-3 ${isDark ? 'bg-[#2b2b2b] hover:bg-[#3a3a3a]' : 'bg-[#f1f1f1] hover:bg-[#e5e5e5]'} rounded-md text-sm font-medium transition-colors mb-3`}
              >
                verify
              </SignUp.Action>
              
              <SignUp.Action
                navigate="start"
                className="text-center block w-full text-sm"
              >
                go back
              </SignUp.Action>
            </SignUp.Strategy>
            
            <SignUp.Strategy name="phone_code">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold mb-2">🕸️</div>
                <h1 className="text-xl font-bold">check your phone</h1>
                <p className={`${isDark ? 'text-[#888]' : 'text-[#777]'} text-sm mt-2`}>
                  we sent a verification code to your phone
                </p>
              </div>
              
              <Clerk.Field name="code" className="mb-5">
                <Clerk.Label className="block text-sm font-medium mb-2">verification code</Clerk.Label>
                <Clerk.Input 
                  className={`w-full p-3 ${isDark ? 'bg-[#2b2b2b] border-[#333]' : 'bg-white border-[#ddd]'} border rounded-md text-sm ${isDark ? 'text-white' : 'text-black'} focus:outline-none focus:ring-1 ${isDark ? 'focus:ring-[#666]' : 'focus:ring-[#999]'}`} 
                />
                <Clerk.FieldError className="text-red-400 text-xs mt-2" />
              </Clerk.Field>
              
              <SignUp.Action 
                submit
                className={`w-full p-3 ${isDark ? 'bg-[#2b2b2b] hover:bg-[#3a3a3a]' : 'bg-[#f1f1f1] hover:bg-[#e5e5e5]'} rounded-md text-sm font-medium transition-colors mb-3`}
              >
                verify
              </SignUp.Action>
              
              <SignUp.Action
                navigate="start"
                className="text-center block w-full text-sm"
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