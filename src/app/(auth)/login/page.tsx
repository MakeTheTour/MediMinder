
'use client';

import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, UserCredential, getAdditionalUserInfo, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.83 0-5.22-1.9-6.08-4.44H2.31v2.84C4.13 20.98 7.76 23 12 23z" />
        <path fill="#FBBC05" d="M5.92 14.58c-.21-.66-.33-1.34-.33-2.04s.12-1.38.33-2.04V7.67H2.31c-.66 1.32-.98 2.79-.98 4.34s.32 3.02.98 4.34l3.61-2.77z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.76 1 4.13 3.02 2.31 5.83l3.61 2.84c.86-2.54 3.25-4.29 6.08-4.29z" />
    </svg>
);

const FacebookIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        <path fill="#1877F2" d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-1.5c-1.1 0-1.5.7-1.5 1.5V12h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z" />
    </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const handleUserInFirestore = async (user: User) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // User is new, create a new document
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        createdAt: new Date().toISOString(),
      });
    }
  }


  const handleSocialSignIn = async (provider: GoogleAuthProvider | FacebookAuthProvider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      await handleUserInFirestore(result.user);
      router.push('/');
    } catch (error: any) {
        let errorMessage = error.message;
        if (error.code === 'auth/account-exists-with-different-credential') {
            errorMessage = 'An account already exists with the same email address but different sign-in credentials. Please sign in using the original method.';
        }
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: errorMessage,
      });
    }
  };

  const handleGoogleSignIn = () => {
    const provider = new GoogleAuthProvider();
    handleSocialSignIn(provider);
  };

  const handleFacebookSignIn = () => {
    const provider = new FacebookAuthProvider();
    handleSocialSignIn(provider);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to MediMinder</CardTitle>
          <CardDescription>Sign in to manage your health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={handleGoogleSignIn} className="w-full" variant="outline">
                <GoogleIcon />
                Sign in with Google
            </Button>
            <Button onClick={handleFacebookSignIn} className="w-full" variant="outline">
                <FacebookIcon />
                Sign in with Facebook
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
