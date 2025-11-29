'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Github, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  UserCredential,
  signInWithCustomToken,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { initiateEmailSignUp } from '@/firebase';
import { ethers } from 'ethers';
import { SiweMessage } from 'siwe';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

interface SignupFormProps {
    onLoginClick?: () => void;
}

// Function to create a user document in Firestore
const createUserDocument = async (userCred: UserCredential) => {
    const firestore = getFirestore();
    const user = userCred.user;
    const userRef = doc(firestore, 'users', user.uid);
    
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return; // User document already exists
    }

    const userData = {
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        credits: 8, // Assign 8 free credits on creation
        freeAudits: 0,
        isAdmin: false,
    };

    // Use setDoc with merge: true to create or update without overwriting
    await setDoc(userRef, userData, { merge: true });
};

export function SignupForm({ onLoginClick }: SignupFormProps) {
  const { toast } = useToast();
  const auth = getAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    initiateEmailSignUp(auth, values.email, values.password);
    toast({ title: 'Creating Account...', description: 'Please wait.' });
  }

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      await createUserDocument(userCredential);
      toast({ title: 'Success', description: 'Signed up with Google.' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleGithubSignIn = async () => {
    const provider = new GithubAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      await createUserDocument(userCredential);
      toast({ title: 'Success', description: 'Signed up with GitHub.' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleWeb3SignIn = async () => {
    if (typeof window.ethereum === 'undefined') {
        toast({ title: 'MetaMask not found', description: 'Please install MetaMask to use this feature.', variant: 'destructive'});
        return;
    }

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const { chainId } = await provider.getNetwork();

        // 1. Get nonce from our API
        const nonceRes = await fetch('/api/siwe?action=nonce', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address }),
        });
        if (!nonceRes.ok) throw new Error('Failed to get nonce.');
        const { nonce } = await nonceRes.json();

        // 2. Create SIWE message
        const message = new SiweMessage({
            domain: window.location.host,
            address,
            statement: `Sign in to Algorythm AI`,
            uri: window.location.origin,
            version: '1',
            chainId: Number(chainId),
            nonce,
        });

        // 3. Sign message
        const signature = await signer.signMessage(message.prepareMessage());

        // 4. Verify signature and get custom token from our API
        const verifyRes = await fetch('/api/siwe?action=verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, signature }),
        });
        if (!verifyRes.ok) throw new Error('Failed to verify signature.');
        const { token } = await verifyRes.json();
        
        // 5. Sign in with custom token
        await signInWithCustomToken(auth, token);

        toast({ title: 'Wallet Sign-Up Successful!', description: 'You are now logged in.'});

    } catch (error: any) {
        console.error("Web3 sign-in error:", error);
        toast({ title: 'Web3 Sign-In Failed', description: error.message, variant: 'destructive'});
    }
  }

  const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 36.131 44 30.655 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );

  return (
    <Card className="w-full max-w-sm border-none shadow-none">
       {!onLoginClick && (
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
                <CardDescription>
                Join now to start building with AI.
                </CardDescription>
            </CardHeader>
       )}
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
            <Button variant="outline" onClick={handleWeb3SignIn}>
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
            </Button>
            <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={handleGoogleSignIn}>
                    <GoogleIcon />
                    Google
                </Button>
                <Button variant="outline" onClick={handleGithubSignIn}>
                    <Github className="mr-2 h-4 w-4" />
                    Github
                </Button>
            </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              Create Account
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="text-center text-sm">
        Already have an account?&nbsp;
        <Link href={onLoginClick ? '#' : "/login"} onClick={onLoginClick} className="underline">
          Log in
        </Link>
      </CardFooter>
    </Card>
  );
}
