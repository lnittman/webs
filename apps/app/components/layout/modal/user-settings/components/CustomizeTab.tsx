import React from 'react';
import { useAtom } from 'jotai';
import { uiPreferencesAtom } from '@/lib/store/settingsStore';
import { Label } from '@repo/design/components/ui/label';
import { Switch } from '@repo/design/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@repo/design/components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger } from '@repo/design/components/ui/tabs';
import { Button } from '@repo/design/components/ui/button';
import { Check } from '@phosphor-icons/react';

export function CustomizeTab() {
  const [uiPreferences, setUiPreferences] = useAtom(uiPreferencesAtom);
  
  const updatePreference = (key: keyof typeof uiPreferences, value: any) => {
    setUiPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-1">customize</h3>
        <p className="text-sm text-muted-foreground">
          personalize your interface and experience
        </p>
      </div>

      <div className="flex flex-col gap-8 flex-1">
        {/* Layout Settings */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Command Bar Placement</h4>
            
            <RadioGroup 
              value={uiPreferences.commandBarPlacement}
              onValueChange={(value) => updatePreference('commandBarPlacement', value)}
              className="grid grid-cols-2 gap-2"
            >
              <Label 
                htmlFor="top-placement" 
                className="flex flex-col items-center gap-2 rounded-md border border-border/40 p-4 hover:bg-accent/50 cursor-pointer"
              >
                <RadioGroupItem value="top" id="top-placement" className="sr-only" />
                <div className="h-20 w-full border border-border/40 rounded-md flex flex-col">
                  <div className="h-6 bg-border/20 rounded-t-md"></div>
                  <div className="flex-1"></div>
                </div>
                <span className="text-sm flex items-center gap-1.5">
                  {uiPreferences.commandBarPlacement === 'top' && (
                    <Check className="h-3.5 w-3.5 text-primary" weight="bold" />
                  )}
                  Top placement
                </span>
              </Label>

              <Label 
                htmlFor="bottom-placement" 
                className="flex flex-col items-center gap-2 rounded-md border border-border/40 p-4 hover:bg-accent/50 cursor-pointer"
              >
                <RadioGroupItem value="bottom" id="bottom-placement" className="sr-only" />
                <div className="h-20 w-full border border-border/40 rounded-md flex flex-col">
                  <div className="flex-1"></div>
                  <div className="h-6 bg-border/20 rounded-b-md"></div>
                </div>
                <span className="text-sm flex items-center gap-1.5">
                  {uiPreferences.commandBarPlacement === 'bottom' && (
                    <Check className="h-3.5 w-3.5 text-primary" weight="bold" />
                  )}
                  Bottom placement
                </span>
              </Label>
            </RadioGroup>
          </div>
        </div>

        {/* Display Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Display Options</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-timestamps">Show timestamps</Label>
                <p className="text-xs text-muted-foreground">
                  Display time indicators in chat messages
                </p>
              </div>
              <Switch 
                id="show-timestamps" 
                checked={uiPreferences.showTimestamps}
                onCheckedChange={(checked) => updatePreference('showTimestamps', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="compact-mode">Compact mode</Label>
                <p className="text-xs text-muted-foreground">
                  Reduce spacing between elements for a denser interface
                </p>
              </div>
              <Switch 
                id="compact-mode" 
                checked={uiPreferences.compactMode}
                onCheckedChange={(checked) => updatePreference('compactMode', checked)}
              />
            </div>
          </div>
        </div>

        {/* Code Display */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Code Display</h4>
          
          <Tabs defaultValue="default" className="w-full">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">Syntax highlight theme</Label>
              <TabsList>
                <TabsTrigger value="default" className="text-xs px-2.5 py-1">Default</TabsTrigger>
                <TabsTrigger value="minimal" className="text-xs px-2.5 py-1">Minimal</TabsTrigger>
                <TabsTrigger value="vibrant" className="text-xs px-2.5 py-1">Vibrant</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="rounded-md border border-border/40 p-4 bg-muted/20">
              <pre className="text-xs text-muted-foreground overflow-x-auto">
                <code>{`function hello() {
  console.log("Hello world!");
  return 42;
}

// This is a sample code snippet
const result = hello();`}</code>
              </pre>
            </div>
          </Tabs>
        </div>

        {/* Reset Button */}
        <div className="flex justify-end mt-auto pt-4">
          <Button variant="outline" onClick={() => setUiPreferences({
            commandBarPlacement: 'top',
            showTimestamps: true,
            compactMode: false,
          })}>
            Reset to defaults
          </Button>
        </div>
      </div>
    </div>
  );
} 