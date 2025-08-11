
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";


export default function AdminAdsPage() {
  return (
    <div className="container mx-auto p-4">
      <header className="mb-6 flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">Custom Ads</h1>
            <p className="text-muted-foreground">Manage promotional content within the app.</p>
        </div>
        <Button>
            <Plus className="mr-2 h-4 w-4" /> Create New Ad
        </Button>
      </header>

      <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle>New Ad Campaign</CardTitle>
                <CardDescription>Fill out the details for your new ad.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="ad-title">Ad Title</Label>
                    <Input id="ad-title" placeholder="e.g., Summer Health Sale"/>
                </div>
                 <div>
                    <Label htmlFor="ad-content">Ad Content</Label>
                    <Input id="ad-content" placeholder="e.g., Get 20% off all vitamins!"/>
                </div>
                 <div>
                    <Label htmlFor="ad-image">Image URL</Label>
                    <Input id="ad-image" placeholder="https://example.com/ad-image.png"/>
                </div>
                <Button>Save Campaign</Button>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Campaigns</CardTitle>
            <CardDescription>
              A list of current ad campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              No active ad campaigns.
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
