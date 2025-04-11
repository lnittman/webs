import '@repo/design/styles/globals.css';
import { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { ThemeProvider } from '@repo/design/providers/theme';
import { TooltipProvider } from '@repo/design/components/ui/tooltip';

import { LayoutWrapper } from '@/components/layout/LayoutWrapper';
import { SidebarProvider } from '@/components/layout/sidebar/SidebarProvider';

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
      <body className="min-h-screen bg-background" suppressHydrationWarning>
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
          redirectUrl="/"
        >
          <ThemeProvider>
            <TooltipProvider>
              <SidebarProvider>
                <LayoutWrapper>{children}</LayoutWrapper>
              </SidebarProvider>
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
