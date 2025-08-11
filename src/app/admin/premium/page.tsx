
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AdminPremiumPage() {
  const { toast } = useToast();

  const handleUpdate = () => {
    toast({
        title: "Settings Updated",
        description: "Premium plan details have been saved."
    })
  }

  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Premium Plan Management</h1>
        <p className="text-muted-foreground">Update pricing and features for the premium subscription.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Premium Plan Settings</CardTitle>
          <CardDescription>
            Changes here will affect the premium plan offerings in the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="premium-price">Monthly Price (USD)</Label>
            <Input id="premium-price" type="number" placeholder="e.g., 9.99" defaultValue="9.99" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="premium-features">Features (comma-separated)</Label>
            <Input id="premium-features" placeholder="e.g., Feature 1, Feature 2" defaultValue="Family Member Alerts,Advanced Adherence Reports,Priority Support"/>
          </div>
          <Button onClick={handleUpdate}>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
