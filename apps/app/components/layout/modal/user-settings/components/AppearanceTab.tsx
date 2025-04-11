import React from 'react';
import { Moon, Sun, Desktop } from '@phosphor-icons/react';
import { useAtom } from 'jotai';
import { themeAtom } from '@/lib/store/settingsStore';
import { useTheme } from 'next-themes';
import { Switch } from '@repo/design/components/ui/switch';
import { Label } from '@repo/design/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@repo/design/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function AppearanceTab() {
  const [theme, setTheme] = useAtom(themeAtom);
  const { resolvedTheme, setTheme: setNextTheme } = useTheme();
  const [reduceAnimations, setReduceAnimations] = React.useState(false);
  const [highContrastMode, setHighContrastMode] = React.useState(false);
  
  const handleThemeChange = (value: string) => {
    // Update both state stores
    setTheme(value as 'light' | 'dark' | 'system');
    setNextTheme(value);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-1">appearance</h3>
        <p className="text-sm text-muted-foreground">
          customize how the application looks and feels
        </p>
      </div>

      <div className="flex flex-col gap-8 flex-1">
        {/* Theme Selection */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">theme</h4>
          
          <div className="space-y-4">
            <Tabs 
              defaultValue={theme} 
              value={theme}
              onValueChange={handleThemeChange}
              className="w-full"
            >
              <TabsList className="bg-accent/30 w-full h-12 p-1 rounded-md grid grid-cols-3 gap-1 relative">
                {/* Active background indicator with animation */}
                <AnimatePresence initial={false}>
                  <motion.div 
                    key={theme}
                    className="absolute rounded-sm bg-background shadow-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      top: 4,
                      bottom: 4,
                      left: theme === 'light' ? 4 : (theme === 'dark' ? '33.33%' : '66.66%'),
                      width: 'calc(33.33% - 5.33px)',
                    }}
                  />
                </AnimatePresence>

                {/* Tab triggers with static icons */}
                <TabsTrigger 
                  value="light" 
                  className="h-full w-full rounded-sm transition-all duration-200 hover:bg-background/60 focus:outline-none flex items-center justify-center z-10"
                >
                  <div className="flex flex-col items-center gap-1">
                    <Sun 
                      weight="duotone" 
                      className={cn(
                        "h-4 w-4 transition-colors duration-300",
                        theme === 'light' ? "text-foreground" : "text-muted-foreground"
                      )} 
                    />
                    <span className="text-xs">Light</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="dark" 
                  className="h-full w-full rounded-sm transition-all duration-200 hover:bg-background/60 focus:outline-none flex items-center justify-center z-10"
                >
                  <div className="flex flex-col items-center gap-1">
                    <Moon 
                      weight="duotone" 
                      className={cn(
                        "h-4 w-4 transition-colors duration-300",
                        theme === 'dark' ? "text-foreground" : "text-muted-foreground"
                      )} 
                    />
                    <span className="text-xs">Dark</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="system" 
                  className="h-full w-full rounded-sm transition-all duration-200 hover:bg-background/60 focus:outline-none flex items-center justify-center z-10"
                >
                  <div className="flex flex-col items-center gap-1">
                    <Desktop 
                      weight="duotone" 
                      className={cn(
                        "h-4 w-4 transition-colors duration-300",
                        theme === 'system' ? "text-foreground" : "text-muted-foreground"
                      )} 
                    />
                    <span className="text-xs">System</span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <p className="text-sm text-muted-foreground">
              {theme === 'system' ? 'Using your system preference' : `Using ${theme} mode`}
              {theme === 'system' && ` (currently ${resolvedTheme})`}
            </p>
          </div>
        </div>

        {/* Font Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Font & Text</h4>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-1">
              <Label htmlFor="fontSize">Font Size</Label>
              <select 
                id="fontSize" 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="small">Small</option>
                <option value="medium" selected>Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </div>

        {/* Accessibility Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Accessibility</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reduce-animations">Reduce animations</Label>
                <p className="text-xs text-muted-foreground">
                  Minimize motion for users sensitive to movement
                </p>
              </div>
              <Switch 
                id="reduce-animations" 
                checked={reduceAnimations}
                onCheckedChange={setReduceAnimations}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="high-contrast">High contrast mode</Label>
                <p className="text-xs text-muted-foreground">
                  Increase contrast between elements
                </p>
              </div>
              <Switch 
                id="high-contrast" 
                checked={highContrastMode}
                onCheckedChange={setHighContrastMode}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 