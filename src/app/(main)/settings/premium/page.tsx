
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Star, Users, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendPremiumConfirmationEmail } from "@/ai/flows/send-premium-confirmation-email";

const premiumFeatures = [
  {
    icon: Users,
    title: "Family Member Alerts",
    description: "Automatically notify a family member if you miss a critical medication dose."
  },
  {
    icon: CheckCircle2,
    title: "Advanced Adherence Reports",
    description: "Get deeper insights into your medication schedule and habits."
  },
  {
    icon: Star,
    title: "Priority Support",
    description: "Receive faster assistance from our dedicated support team."
  }
];

export default function PremiumPage() {
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    if (isGuest || !user) {
      router.push('/login');
      return;
    }

    setIsUpgrading(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user in firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { isPremium: true }, { merge: true });

      // Send confirmation email
      await sendPremiumConfirmationEmail({
          name: user.displayName || 'Valued User',
          email: user.email || '',
      })

      toast({
        title: "Upgrade Successful!",
        description: "Welcome to MediMinder Premium.",
      });

      router.push('/settings/premium/success');

    } catch (error) {
      console.error("Upgrade failed:", error);
      toast({
        variant: 'destructive',
        title: "Upgrade Failed",
        description: "We couldn't process your upgrade. Please try again.",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">MediMinder Premium</h1>
        <p className="text-muted-foreground">Upgrade for advanced features and peace of mind.</p>
      </header>
      <Card className="bg-gradient-to-br from-primary/10 to-transparent">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Star className="h-8 w-8" />
            </div>
          <CardTitle className="text-3xl">Unlock Premium</CardTitle>
          <CardDescription>
            Supercharge your health management with powerful new tools for you and your loved ones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {premiumFeatures.map(feature => (
                <div key={feature.title} className="flex items-start gap-4">
                    <feature.icon className="h-8 w-8 text-primary mt-1" />
                    <div>
                        <h3 className="font-semibold">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                </div>
            ))}
        </CardContent>
        <CardFooter>
            <Button className="w-full" size="lg" onClick={handleUpgrade} disabled={isUpgrading}>
                 {isUpgrading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Upgrading...
                    </>
                 ) : 'Upgrade to Premium'}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
