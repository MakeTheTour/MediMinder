
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

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
              </Label>
              <Switch id="stripe-enabled" defaultChecked />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="stripe-test-mode" className="flex flex-col space-y-1">
                <span>Test Mode</span>
              </Label>
              <Switch id="stripe-test-mode" defaultChecked />
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
              </Label>
              <Switch id="payoneer-enabled" defaultChecked/>
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="payoneer-test-mode" className="flex flex-col space-y-1">
                <span>Test Mode</span>
              </Label>
              <Switch id="payoneer-test-mode" />
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
        
        <Card>
          <CardHeader>
            <CardTitle>PayPal</CardTitle>
            <CardDescription>Manage PayPal integration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="paypal-enabled" className="flex flex-col space-y-1">
                <span>Enable PayPal</span>
              </Label>
              <Switch id="paypal-enabled" defaultChecked />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="paypal-sandbox" className="flex flex-col space-y-1">
                <span>Sandbox Mode</span>
              </Label>
              <Switch id="paypal-sandbox" defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paypal-client-id">Client ID</Label>
              <Input id="paypal-client-id" placeholder="Your PayPal Client ID" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paypal-client-secret">Client Secret</Label>
              <Input id="paypal-client-secret" type="password" placeholder="Your PayPal Client Secret" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SSLCommerz</CardTitle>
            <CardDescription>Manage SSLCommerz integration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="ssl-enabled">Enable SSLCommerz</Label>
              <Switch id="ssl-enabled" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="ssl-sandbox">Sandbox Mode</Label>
              <Switch id="ssl-sandbox" defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ssl-store-id">Store ID</Label>
              <Input id="ssl-store-id" placeholder="Your Store ID" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ssl-store-password">Store Password</Label>
              <Input id="ssl-store-password" type="password" placeholder="Your Store Password" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>bKash</CardTitle>
            <CardDescription>Manage bKash integration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="bkash-enabled">Enable bKash</Label>
              <Switch id="bkash-enabled" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="bkash-sandbox">Sandbox Mode</Label>
              <Switch id="bkash-sandbox" defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bkash-app-key">App Key</Label>
              <Input id="bkash-app-key" placeholder="Your bKash App Key" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bkash-app-secret">App Secret</Label>
              <Input id="bkash-app-secret" type="password" placeholder="Your bKash App Secret" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="bkash-username">Username</Label>
              <Input id="bkash-username" placeholder="Your bKash Username" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="bkash-password">Password</Label>
              <Input id="bkash-password" type="password" placeholder="Your bKash Password" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nagad</CardTitle>
            <CardDescription>Manage Nagad integration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="nagad-enabled">Enable Nagad</Label>
              <Switch id="nagad-enabled" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="nagad-sandbox">Sandbox Mode (UAT)</Label>
              <Switch id="nagad-sandbox" defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nagad-merchant-id">Merchant ID</Label>
              <Input id="nagad-merchant-id" placeholder="Your Nagad Merchant ID" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nagad-private-key">Merchant Private Key</Label>
              <Textarea id="nagad-private-key" placeholder="Paste your private key here" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="nagad-public-key">PG Public Key</Label>
              <Textarea id="nagad-public-key" placeholder="Paste the payment gateway's public key here" />
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
