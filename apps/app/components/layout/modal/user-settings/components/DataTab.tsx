import React, { useState } from 'react';
import { Button } from '@repo/design/components/ui/button';
import { Label } from '@repo/design/components/ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@repo/design/components/ui/table';
import { Switch } from '@repo/design/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@repo/design/components/ui/tabs';
import { Download, Link, Trash, Clock, Copy, Check } from '@phosphor-icons/react';

export function DataTab() {
  // Placeholder data - in a real app, these would come from an API
  const [sharedLinks, setSharedLinks] = useState([
    { id: '1', chatId: 'chat-123', chatTitle: 'AI Architecture Discussion', accessToken: 'share_abcde12345', createdAt: new Date('2023-10-15'), isActive: true },
    { id: '2', chatId: 'chat-456', chatTitle: 'Project Planning', accessToken: 'share_fghij67890', createdAt: new Date('2023-11-20'), isActive: true },
    { id: '3', chatId: 'chat-789', chatTitle: 'Code Review Session', accessToken: 'share_klmno12345', createdAt: new Date('2023-12-05'), isActive: false },
  ]);

  const [currentTab, setCurrentTab] = useState('shared-links');
  const [hideSharedWarning, setHideSharedWarning] = useState(false);
  const [linkCopied, setLinkCopied] = useState<string | null>(null);

  const handleDeactivateLink = (id: string) => {
    setSharedLinks(links => 
      links.map(link => 
        link.id === id ? { ...link, isActive: false } : link
      )
    );
  };

  const handleDeleteLink = (id: string) => {
    setSharedLinks(links => links.filter(link => link.id !== id));
  };

  const handleCopyLink = (accessToken: string) => {
    navigator.clipboard.writeText(`https://yourapp.com/shared/${accessToken}`);
    setLinkCopied(accessToken);
    setTimeout(() => setLinkCopied(null), 2000);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-1">data</h3>
        <p className="text-sm text-muted-foreground">
          manage your shared links and data controls
        </p>
      </div>

      <Tabs 
        defaultValue="shared-links" 
        value={currentTab} 
        onValueChange={setCurrentTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="shared-links">shared links</TabsTrigger>
          <TabsTrigger value="export">data export</TabsTrigger>
          <TabsTrigger value="privacy">privacy</TabsTrigger>
        </TabsList>

        {currentTab === 'shared-links' && (
          <div className="flex-1 flex flex-col">
            <div className="bg-primary/5 rounded-md p-4 mb-6 border border-primary/20">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-1">Shared Links</h4>
                  <p className="text-xs text-muted-foreground">
                    These links allow others to view specific chats without needing an account.
                    Active links can be accessed by anyone with the URL.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="hide-warning" 
                    checked={hideSharedWarning}
                    onCheckedChange={setHideSharedWarning}
                  />
                  <Label htmlFor="hide-warning" className="text-xs cursor-pointer">
                    Don't show again
                  </Label>
                </div>
              </div>
            </div>

            {sharedLinks.length > 0 ? (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1 border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Chat</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sharedLinks.map(link => (
                        <TableRow key={link.id}>
                          <TableCell className="font-medium">{link.chatTitle}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDate(link.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              link.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                              {link.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {link.isActive && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8" 
                                    onClick={() => handleCopyLink(link.accessToken)}
                                  >
                                    {linkCopied === link.accessToken ? (
                                      <Check className="h-4 w-4 text-green-500" weight="bold" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8" 
                                    onClick={() => handleDeactivateLink(link.id)}
                                  >
                                    <Link className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" 
                                onClick={() => handleDeleteLink(link.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center border border-dashed rounded-md p-6">
                <Link className="h-10 w-10 text-muted-foreground mb-2" weight="duotone" />
                <h4 className="text-sm font-medium mb-1">No shared links yet</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Create a shared link from any chat to give others access
                </p>
              </div>
            )}
          </div>
        )}

        {currentTab === 'export' && (
          <div className="flex-1 flex flex-col">
            <div className="space-y-6 flex-1">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Export Your Data</h4>
                <p className="text-sm text-muted-foreground">
                  Download all your data including chats, shared links, and preferences in a portable format.
                </p>
                
                <div className="bg-muted/30 rounded-md p-4 border border-border/40">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 h-12 w-12 rounded-md flex items-center justify-center text-primary">
                      <Download className="h-6 w-6" weight="duotone" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-medium mb-0.5">Complete data export</h5>
                      <p className="text-xs text-muted-foreground">
                        JSON format containing all your conversations and account data
                      </p>
                    </div>
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'privacy' && (
          <div className="flex-1 flex flex-col">
            <div className="space-y-6 flex-1">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Privacy Settings</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="analytics" className="text-sm font-medium">Usage analytics</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow anonymous usage data collection to improve our service
                      </p>
                    </div>
                    <Switch id="analytics" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="personalization" className="text-sm font-medium">Personalization</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow the app to personalize your experience based on your activity
                      </p>
                    </div>
                    <Switch id="personalization" defaultChecked />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 mt-8">
                <h4 className="text-sm font-medium text-red-500">Danger Zone</h4>
                
                <div className="bg-red-500/5 border border-red-200 dark:border-red-900/50 rounded-md p-4">
                  <h5 className="text-sm font-medium mb-1">Delete account data</h5>
                  <p className="text-xs text-muted-foreground mb-3">
                    This will permanently delete all your chats, shared links, and settings. This action cannot be undone.
                  </p>
                  <Button variant="destructive" size="sm">
                    Delete all data
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Tabs>
    </div>
  );
} 