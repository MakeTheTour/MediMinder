
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function AdminEmailPage() {
  const { toast } = useToast();

  const handleSaveChanges = () => {
    toast({
      title: "Settings Saved",
      description: "Email settings have been updated.",
    });
  };

  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Email Configuration</h1>
        <p className="text-muted-foreground">Set up your email providers for sending application emails.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Email Settings</CardTitle>
          <CardDescription>
            Control which email service is used for different types of emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="firebase-email-enabled" className="flex flex-col space-y-1">
              <span>Firebase Auth Emails</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Use the default Firebase provider for password resets, email verification, etc.
              </span>
            </Label>
            <Switch
              id="firebase-email-enabled"
              defaultChecked
              aria-label="Toggle Firebase Auth emails"
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Custom SMTP Settings</CardTitle>
          <CardDescription>
            Configure a custom SMTP provider for sending non-auth emails like premium confirmations and notifications. This is disabled if Firebase Auth Emails are turned off.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp-from">From Email</Label>
              <Input id="smtp-from" placeholder="e.g., no-reply@mediminder.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input id="smtp-host" placeholder="e.g., smtp.mailgun.org" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Input id="smtp-port" type="number" placeholder="e.g., 587" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="smtp-user">SMTP Username</Label>
              <Input id="smtp-user" placeholder="Your SMTP username" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="smtp-pass">SMTP Password</Label>
              <Input id="smtp-pass" type="password" placeholder="Your SMTP password" />
            </div>
          </div>
          <Button onClick={handleSaveChanges}>Save SMTP Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
