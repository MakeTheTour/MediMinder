
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, BrainCircuit, Facebook, Mail } from 'lucide-react';

const GoogleIcon = () => (
    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.83 0-5.22-1.9-6.08-4.44H2.31v2.84C4.13 20.98 7.76 23 12 23z" />
        <path fill="#FBBC05" d="M5.92 14.58c-.21-.66-.33-1.34-.33-2.04s.12-1.38.33-2.04V7.67H2.31c-.66 1.32-.98 2.79-.98 4.34s.32 3.02.98 4.34l3.61-2.77z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.76 1 4.13 3.02 2.31 5.83l3.61 2.84c.86-2.54 3.25-4.29 6.08-4.29z" />
    </svg>
);

export default function AdminSettingsPage() {
  const { toast } = useToast();

  const handleSaveChanges = () => {
    toast({
      title: "Settings Saved",
      description: "API and integration settings have been updated.",
    });
  };

  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">API Settings</h1>
        <p className="text-muted-foreground">Manage third-party integrations and API keys.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BrainCircuit /> AI Provider</CardTitle>
            <CardDescription>Manage Gemini API Key.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gemini-key">Gemini API Key</Label>
              <Input id="gemini-key" type="password" placeholder="Enter your Gemini API key" />
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><KeyRound/> Social Logins</CardTitle>
                <CardDescription>Manage Google and Facebook login credentials.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2"><GoogleIcon/> Google</h3>
                    <div className="space-y-2">
                        <Label htmlFor="google-client-id">Client ID</Label>
                        <Input id="google-client-id" placeholder="Your Google Client ID"/>
                    </div>
                    <div className="space-y-2 mt-2">
                        <Label htmlFor="google-client-secret">Client Secret</Label>
                        <Input id="google-client-secret" type="password" placeholder="Your Google Client Secret"/>
                    </div>
                </div>
                 <div className="border-t pt-6">
                    <h3 className="font-semibold mb-2 flex items-center gap-2"><Facebook className="h-5 w-5 text-blue-600"/> Facebook</h3>
                    <div className="space-y-2">
                        <Label htmlFor="facebook-app-id">App ID</Label>
                        <Input id="facebook-app-id" placeholder="Your Facebook App ID"/>
                    </div>
                    <div className="space-y-2 mt-2">
                        <Label htmlFor="facebook-app-secret">App Secret</Label>
                        <Input id="facebook-app-secret" type="password" placeholder="Your Facebook App Secret"/>
                    </div>
                </div>
            </CardContent>
        </Card>

      </div>
        <div className="mt-8">
            <Button onClick={handleSaveChanges}>Save All Settings</Button>
        </div>
    </div>
  );
}
