
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function AdminPaymentsPage() {
  const { toast } = useToast();

  const handleSaveChanges = () => {
    toast({
      title: "Settings Saved",
      description: "Payment gateway settings have been updated.",
    });
  };

  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Payment Gateways</h1>
        <p className="text-muted-foreground">Configure payment provider settings.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stripe</CardTitle>
            <CardDescription>Manage Stripe integration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="stripe-enabled" className="flex flex-col space-y-1">
                <span>Enable Stripe</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Allow users to pay with Stripe.
                </span>
              </Label>
              <Switch id="stripe-enabled" defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe-pk">Publishable Key</Label>
              <Input id="stripe-pk" placeholder="pk_test_..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe-sk">Secret Key</Label>
              <Input id="stripe-sk" type="password" placeholder="sk_test_..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payoneer</CardTitle>
            <CardDescription>Manage Payoneer integration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="payoneer-enabled" className="flex flex-col space-y-1">
                <span>Enable Payoneer</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Allow users to pay with Payoneer.
                </span>
              </Label>
              <Switch id="payoneer-enabled" defaultChecked/>
            </div>
             <div className="space-y-2">
              <Label htmlFor="payoneer-user">Payoneer Username</Label>
              <Input id="payoneer-user" placeholder="Your Payoneer Username" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payoneer-key">API Key</Label>
              <Input id="payoneer-key" type="password" placeholder="Your Payoneer API Key" />
            </div>
          </CardContent>
        </Card>
      </div>

       <div className="mt-8">
            <Button onClick={handleSaveChanges}>Save Changes</Button>
        </div>
    </div>
  );
}
