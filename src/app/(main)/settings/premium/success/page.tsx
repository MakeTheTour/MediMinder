
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function PremiumSuccessPage() {
  return (
    <div className="container mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle className="h-10 w-10" />
          </div>
          <CardTitle className="text-3xl">Upgrade Successful!</CardTitle>
          <CardDescription>
            You are now a MediMinder Premium member. Thank you for your support!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You can now access all premium features, including family member alerts and advanced reports.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link href="/home">Go to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
