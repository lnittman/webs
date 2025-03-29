import { SignIn as ClerkSignIn } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';

export const SignIn = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-6">
        <div className="text-5xl mb-4">🕸️</div>
        <h1 className="text-3xl font-bold lowercase text-foreground">sign in to webs</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          access your content, search history, and personalized web experience
        </p>
      </div>
      
      <ClerkSignIn
        routing="hash"
        appearance={{
          baseTheme: isDark ? dark : undefined,
          variables: {
            colorBackground: isDark ? 'var(--background)' : '#ffffff',
            colorInputBackground: isDark ? 'var(--card)' : '#ffffff',
            colorText: isDark ? 'var(--foreground)' : '#020817',
            colorInputText: isDark ? 'var(--foreground)' : '#020817',
            colorPrimary: '#0ea5e9',
            colorTextSecondary: isDark ? 'var(--muted-foreground)' : '#64748b',
            colorTextOnPrimaryBackground: '#ffffff',
            colorDanger: '#ef4444',
            borderRadius: 'var(--radius)'
          },
          elements: {
            rootBox: 'w-full',
            card: 'w-full shadow-none',
            header: 'hidden',
            formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90 lowercase font-normal w-full',
            formButtonReset: 'text-muted-foreground hover:text-foreground lowercase',
            footerActionText: 'lowercase text-muted-foreground',
            footerActionLink: 'lowercase text-primary hover:text-primary/90',
            socialButtonsBlockButton: 'lowercase w-full',
            socialButtonsIconButton: 'lowercase w-full', 
            socialButtonsProviderIcon: 'w-5 h-5',
            dividerText: 'lowercase text-xs text-muted-foreground',
            formFieldLabel: 'lowercase text-sm font-normal text-foreground',
            formFieldInput: 'bg-background border border-input px-3 py-2 text-sm ring-offset-background w-full',
            identityPreviewText: 'lowercase',
            identityPreviewEditButton: 'lowercase',
            alert: 'lowercase text-sm',
            alertText: 'lowercase',
            formFieldAction: 'lowercase',
            formFieldSuccessText: 'lowercase',
            otpCodeFieldInput: 'lowercase',
            avatarImageActionsUpload: 'lowercase',
            userButtonPopoverCard: 'lowercase',
            userButtonPopoverActionButton: 'lowercase',
            socialButtonsProviderIcon__google: 'w-5 h-5',
            socialButtonsProviderIcon__github: 'w-5 h-5',
            socialButtonsProviderIcon__apple: 'w-5 h-5',
            main: 'w-full',
            form: 'w-full',
            socialButtons: 'w-full mx-auto grid gap-2',
            alternativeMethods: 'w-full',
            phoneInputBox: 'w-full',
            formField: 'w-full',
            footer: 'mx-auto text-center'
          }
        }}
      />
    </div>
  );
};
