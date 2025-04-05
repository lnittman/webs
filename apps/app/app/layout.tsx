import type { Metadata } from 'next';
import { TooltipProvider } from '@repo/design/components/ui/tooltip';
import { ThemeProvider } from '@repo/design/providers/theme';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

import '@repo/design/styles/globals.css';
import { Header, CommandMenu, MobileSheet } from '@/components/layout';

export const metadata: Metadata = {
  title: 'webs - internet reader module',
  description: 'fetch, index, and search web content with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background">
        <ClerkProvider 
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: 'var(--primary)',
              colorText: 'var(--foreground)',
              colorBackground: 'var(--background)',
              colorInputBackground: 'var(--card)',
              colorInputText: 'var(--foreground)'
            },
            elements: {
              formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
              card: 'bg-background border-border'
            }
          }}
          afterSignInUrl="/"
          afterSignUpUrl="/"
          signInUrl="/signin"
          signUpUrl="/signup"
          redirectUrl="/"
        >
          <ThemeProvider>
            <TooltipProvider>
              <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                {/* Portal components rendered at the root layout level for proper stacking context */}
                {/* These components use Jotai atoms from settingsStore for state management */}
                <MobileSheet />
                <CommandMenu />
              </div>
            </TooltipProvider>
          </ThemeProvider>
        </ClerkProvider>
        
        {/* Enhanced redirect handler with more comprehensive redirects */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Global event listener for Clerk sign-up success
            document.addEventListener('clerk:signup:successful', function(event) {
              console.log("[Global] Sign-up successful, redirecting to home");
              window.location.href = "/";
            });

            // Global event listener for Clerk verification completion
            document.addEventListener('clerk:verification:complete', function(event) {
              console.log("[Global] Verification complete, redirecting to home");
              window.location.href = "/";
            });

            // Detect any continue path and forcibly redirect to home
            if (window.location.pathname.includes('/continue')) {
              console.log("[Global] Detected continue path, redirecting to home");
              window.location.href = "/";
            }
          `
        }} />
      </body>
    </html>
  );
}
