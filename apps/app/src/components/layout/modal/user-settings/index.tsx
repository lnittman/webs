import React, { useState, useEffect, useRef } from 'react';
import { X, User, Sun, Sliders, Database, CreditCard } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@repo/design/components/ui/button';
import { cn } from '@/src/lib/utils';
import { useAtom } from 'jotai';
import { settingsModalOpenAtom } from '@/src/store/settingsStore';

// Import tab content components
import { ProfileTab } from './components/ProfileTab';
import { AppearanceTab } from './components/AppearanceTab';
import { CustomizeTab } from './components/CustomizeTab';
import { DataTab } from './components/DataTab';
import { BillingTab } from './components/BillingTab';

type Tab = {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
};

interface SettingsModalProps {
  isMobile?: boolean;
}

export function SettingsModal({ isMobile = false }: SettingsModalProps) {
  const [open, setOpen] = useAtom(settingsModalOpenAtom);
  const [activeTab, setActiveTab] = useState<string>('profile');
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  // Handle backdrop click
  const handleClose = () => {
    setOpen(false);
  };

  // Define tabs with their content components
  const tabs: Tab[] = [
    {
      id: 'profile',
      label: 'profile',
      icon: <User weight="duotone" className="h-4 w-4" />,
      component: <ProfileTab />,
    },
    {
      id: 'appearance',
      label: 'appearance',
      icon: <Sun weight="duotone" className="h-4 w-4" />,
      component: <AppearanceTab />,
    },
    {
      id: 'customize',
      label: 'customize',
      icon: <Sliders weight="duotone" className="h-4 w-4" />,
      component: <CustomizeTab />,
    },
    {
      id: 'data',
      label: 'data',
      icon: <Database weight="duotone" className="h-4 w-4" />,
      component: <DataTab />,
    },
    {
      id: 'billing',
      label: 'billing',
      icon: <CreditCard weight="duotone" className="h-4 w-4" />,
      component: <BillingTab />,
    },
  ];

  // Find the current active tab
  const activeTabData = tabs.find(tab => tab.id === activeTab) || tabs[0];

  // For mobile, just render the content directly as the header is handled by SettingsOverlay
  if (isMobile) {
    return (
      <AnimatePresence>
        {open && (
          <motion.div 
            className="px-2 text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Mobile tabs navigation */}
            <div className="flex border-b border-border/20 mb-4 overflow-x-auto pb-1 hide-scrollbar">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                    activeTab === tab.id 
                      ? "border-b-2 border-primary text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="w-4 h-4">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content with fade animation */}
            <div className="py-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTabData.component}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Desktop modal
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop with blur */}
          <motion.div 
            className="fixed inset-0 bg-background/60 backdrop-blur-md" 
            onClick={handleClose}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          
          {/* Modal dialog */}
          <motion.div 
            className="fixed left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 transform px-4"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div 
              ref={modalRef}
              className="rounded-lg bg-background shadow-lg overflow-hidden border border-border/50 flex flex-col mx-auto"
              style={{ maxWidth: '950px', height: '650px' }}
            >
              {/* Header with close button */}
              <div className="flex items-center justify-between border-b p-3 relative">
                <h3 className="text-foreground text-sm font-normal">settings</h3>
                <button 
                  onClick={handleClose}
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent/50 transition-colors"
                >
                  <X weight="duotone" className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              
              {/* Content area with fixed height */}
              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar navigation */}
                <div className="w-48 border-r border-border/20 py-2 overflow-y-auto">
                  <ul className="space-y-1 px-2">
                    {tabs.map(tab => (
                      <li key={tab.id}>
                        <button
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            activeTab === tab.id 
                              ? "bg-accent/70 text-foreground" 
                              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                          )}
                        >
                          {tab.icon}
                          <span>{tab.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tab content with fade animation - fixed height container */}
                <div className="flex-1 overflow-y-auto p-4 relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      {activeTabData.component}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
