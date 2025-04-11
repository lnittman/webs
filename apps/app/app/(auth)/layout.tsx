import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider 
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: 'var(--primary)',
          colorText: '#ffffff',
          colorTextSecondary: '#ffffff',
          colorBackground: 'var(--background)',
          colorInputBackground: 'var(--card)',
          colorInputText: '#ffffff',
          colorTextOnPrimaryBackground: '#000000',
        },
        elements: {
          formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
          rootBox: 'w-full mx-auto',
          card: 'bg-card hover:bg-card/80 border-border',
          socialButtonsIconButton: 'bg-muted hover:bg-muted/80',
          dividerRow: 'text-white',
          dividerText: 'text-white',
          formFieldInput: 'bg-card border-border',
          footerActionLink: 'text-primary hover:text-primary/80',
          identityPreview: 'bg-card',
          formFieldLabel: 'text-white',
          formButtonReset: 'text-white hover:text-white/80',
          navbar: 'hidden',
          socialButtonsBlockButton: 'text-white',
          formFieldLabelRow: 'text-white',
          headerTitle: 'text-white',
          headerSubtitle: 'text-white',
          profileSectionTitle: 'text-white',
          otpCodeFieldInput: 'text-white'
        }
      }}
      afterSignInUrl="/"
      afterSignUpUrl="/"
      signInUrl="/signin"
      signUpUrl="/signup"
      signInFallbackRedirectUrl="/"
    >
      <div className="flex min-h-screen flex-col items-center justify-center">
        {children}
      </div>
    </ClerkProvider>
  );
} 