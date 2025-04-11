import React from 'react';
import { useUser } from '@clerk/nextjs';
import { Input } from '@repo/design/components/ui/input';
import { Label } from '@repo/design/components/ui/label';
import { Button } from '@repo/design/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/design/components/ui/avatar';

export function ProfileTab() {
  const { user } = useUser();
  
  const handleSaveProfile = () => {
    // Would implement profile saving logic here
  };

  // Get user initials for avatar fallback
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : user?.emailAddresses?.[0]?.emailAddress?.charAt(0).toUpperCase() || "?";

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-1">profile</h3>
        <p className="text-sm text-muted-foreground">
          manage your account information and settings
        </p>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {/* Avatar Section */}
        <div className="flex items-center gap-4 pb-4 border-b border-border/10">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.imageUrl} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user?.fullName}</p>
            <p className="text-sm text-muted-foreground">{user?.emailAddresses?.[0]?.emailAddress}</p>
            <div className="mt-2">
              <Button variant="outline" size="sm">change avatar</Button>
            </div>
          </div>
        </div>

        {/* User Information */}
        <div className="space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">first name</Label>
              <Input id="firstName" defaultValue={user?.firstName || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">last name</Label>
              <Input id="lastName" defaultValue={user?.lastName || ''} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">email address</Label>
            <Input id="email" type="email" defaultValue={user?.emailAddresses?.[0]?.emailAddress || ''} disabled />
            <p className="text-xs text-muted-foreground mt-1">
              email changes are managed through your account provider
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">username</Label>
            <Input id="username" defaultValue={user?.username || ''} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">bio</Label>
            <textarea
              id="bio"
              className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="tell us about yourself"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 mt-auto">
          <Button onClick={handleSaveProfile}>
            save changes
          </Button>
        </div>
      </div>
    </div>
  );
} 