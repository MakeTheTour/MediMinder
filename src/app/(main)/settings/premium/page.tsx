
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Star, Users, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { sendPremiumConfirmationEmail } from "@/ai/flows/send-premium-confirmation-email";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

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

const StripeIcon = () => (
    <svg className="mr-2 h-5 w-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path d="M33,13.2a5.4,5.4,0,0,0-5.4,5.4V29.4a5.4,5.4,0,0,0,5.4,5.4h5.4V29.4a5.4,5.4,0,0,0-5.4-5.4H27.6V18.6a5.4,5.4,0,0,1,5.4-5.4h5.4V7.8H33A5.4,5.4,0,0,0,27.6,13.2Z" fill="#635bff"></path>
        <path d="M20.4,18.6a5.4,5.4,0,0,0-5.4,5.4V34.8a5.4,5.4,0,0,0,5.4,5.4H33V34.8a5.4,5.4,0,0,0-5.4-5.4H20.4V24a5.4,5.4,0,0,1,5.4-5.4H33V13.2H20.4A5.4,5.4,0,0,0,15,18.6Z" fill="#635bff"></path>
    </svg>
);

const PayoneerIcon = () => (
    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path fill="#FF4800" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
        <path fill="#FFFFFF" d="M11 11h2v6h-2zm0 8h2v2h-2z"/>
    </svg>
);

const PayPalIcon = () => (
    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path fill="#003087" d="M20.3,5.1c-0.4-1.8-2-3.1-3.9-3.1H7.4c-1.9,0-3.5,1.4-3.9,3.2C3.4,5.8,3.3,6.5,3.3,7.2c0,1.3,0.3,2.6,1,3.7 c0.7,1.1,1.7,1.9,2.8,2.4l-0.1,0.6c-0.1,0.5,0.3,1,0.8,1h1.8c0.4,0,0.7-0.3,0.8-0.7l0.3-1.8c0,0,0.2-1,0.3-1.3 c0.1-0.3,0.4-0.6,0.8-0.6h2.8c1.9,0,3.5-1.2,3.9-2.9c0.3-1.2,0-2.4-0.8-3.3C21.9,6.9,21.2,5.9,20.3,5.1z M16.7,9.6 c-0.3,1.3-1.5,2.2-2.9,2.2H11c-0.4,0-0.7,0.3-0.8,0.7L10,13.9c0,0,0,0,0,0c-0.1,0.6-0.7,1.1-1.3,1.1H7.4c-0.4,0-0.8-0.4-0.6-0.8 l0.3-1.7c0.2-1,0.5-2,0.9-2.9C8.3,9.2,8.7,8.8,9.1,8.5c0.4-0.3,0.9-0.5,1.4-0.6h3.4c1.4,0,2.6,0.8,2.9,2.1C16.8,9.3,16.8,9.4,16.7,9.6z"></path>
        <path fill="#009cde" d="M6.3,13.7c0.7,1.1,1.7,1.9,2.8,2.4l-0.4,2.4c-0.1,0.4,0.3,0.8,0.7,0.8h1.8c0.4,0,0.7-0.3,0.8-0.7l0.4-2.4 c0,0,0,0,0,0c1.1-0.2,2.1-0.7,2.8-1.5c-0.4,1.7-2,3-3.9,3H7.4c-1.9,0-3.5-1.4-3.9-3.2C3.4,13,3.3,12.3,3.3,11.5 c0-0.6,0.1-1.2,0.2-1.8c-0.1,0.4-0.1,0.8-0.1,1.2C3.4,12.2,3.8,13.1,4.4,13.7C5,14,5.6,14.1,6.3,13.7z"></path>
    </svg>
);


export default function PremiumPage() {
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleUpgrade = async (method: 'Stripe' | 'Payoneer' | 'PayPal') => {
    if (isGuest || !user) {
      router.push('/login');
      return;
    }

    setIsUpgrading(true);
    setPaymentMethod(method);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user in firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { isPremium: true, premiumCycle: billingCycle }, { merge: true });

      // Send confirmation email
      await sendPremiumConfirmationEmail({
          name: user.displayName || 'Valued User',
          email: user.email || '',
      })

      toast({
        title: "Upgrade Successful!",
        description: `Welcome to MediMinder Premium. Your payment via ${method} was successful.`,
      });

      router.push('/settings/premium/success');

    } catch (error) {
      console.error("Upgrade failed:", error);
      toast({
        variant: 'destructive',
        title: "Upgrade Failed",
        description: `We couldn't process your ${method} payment. Please try again.`,
      });
    } finally {
      setIsUpgrading(false);
      setPaymentMethod(null);
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
          <div className="flex items-center justify-center space-x-2 pt-4">
            <Label htmlFor="billing-cycle">Monthly</Label>
            <Switch
                id="billing-cycle"
                checked={billingCycle === 'yearly'}
                onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            />
            <Label htmlFor="billing-cycle">Yearly</Label>
            <Badge variant="secondary">Save 17%</Badge>
          </div>
          <CardDescription className="pt-2">
            {billingCycle === 'monthly' ? '$9.99 / month' : '$99.99 / year'}
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
        <CardFooter className="flex-col gap-4">
            <Button className="w-full" size="lg" onClick={() => handleUpgrade('Stripe')} disabled={isUpgrading}>
                 {isUpgrading && paymentMethod === 'Stripe' ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing with Stripe...
                    </>
                 ) : (
                    <>
                        <StripeIcon/>
                        Pay with Stripe
                    </>
                 )}
            </Button>
            <Button className="w-full" size="lg" onClick={() => handleUpgrade('PayPal')} disabled={isUpgrading}>
                 {isUpgrading && paymentMethod === 'PayPal' ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing with PayPal...
                    </>
                 ) : (
                    <>
                        <PayPalIcon/>
                        Pay with PayPal
                    </>
                 )}
            </Button>
             <Button className="w-full" size="lg" variant="secondary" onClick={() => handleUpgrade('Payoneer')} disabled={isUpgrading}>
                 {isUpgrading && paymentMethod === 'Payoneer' ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing with Payoneer...
                    </>
                 ) : (
                    <>
                        <PayoneerIcon/>
                        Pay with Payoneer
                    </>
                 )}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
