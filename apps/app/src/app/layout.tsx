import { Metadata } from 'next';

import { DesignSystemProvider } from '@repo/design';

import { LayoutWrapper } from '@/src/components/layout/LayoutWrapper';
import { SidebarProvider } from '@/src/components/sidebar/SidebarProvider';
import '@/src/styles/globals.css';

export const metadata: Metadata = {
  title: 'arbor chat',
  description: 'LLM chat with memory and tools',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background" suppressHydrationWarning>
        <DesignSystemProvider>
          <SidebarProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </SidebarProvider>
        </DesignSystemProvider>
      </body>
    </html>
  );
}
