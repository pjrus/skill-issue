
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useUser, useAuth as useFirebaseAuthService } from '@/firebase';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, isLoading: isUserLoading } = useUser();
  const auth = useFirebaseAuthService();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Login Successful",
        description: "Welcome!",
      });
      // The useUser hook will handle redirection.
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmailLogin = async () => {
    setIsProcessing(true);
    try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
            title: "Login Successful",
            description: "Welcome back!",
        });
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: error.message || "Please check your credentials and try again.",
        });
    } finally {
        setIsProcessing(false);
    }
  }

  const handleEmailSignUp = async () => {
    setIsProcessing(true);
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
            title: "Account Created",
            description: "Welcome to SkillSwap!",
        });
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: error.message || "An unexpected error occurred.",
        });
    } finally {
        setIsProcessing(false);
    }
  }


  if (isUserLoading || user) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
  }

  return (
    <div className="relative flex h-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
            <div className="flex flex-col space-y-2 text-center">
                <Icons.logo className="mx-auto h-8 w-8 text-primary"/>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Welcome to SkillSwap
                </h1>
                <p className="text-sm text-muted-foreground">
                    Sign in or create an account to get started
                </p>
            </div>

            <Tabs defaultValue="sign-in" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sign-in">Sign In</TabsTrigger>
                    <TabsTrigger value="create-account">Create Account</TabsTrigger>
                </TabsList>
                <TabsContent value="sign-in">
                    <Card>
                        <CardHeader>
                            <CardDescription>
                                Enter your email and password to access your account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email-signin">Email</Label>
                                <Input id="email-signin" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password-signin">Password</Label>
                                <Input id="password-signin" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
                            </div>
                            <Button onClick={handleEmailLogin} disabled={isProcessing} className="w-full">
                                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign In
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="create-account">
                    <Card>
                        <CardHeader>
                             <CardDescription>
                                Enter an email and password to create your account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email-signup">Email</Label>
                                <Input id="email-signup" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password-signup">Password</Label>
                                <Input id="password-signup" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
                            </div>
                            <Button onClick={handleEmailSignUp} disabled={isProcessing} className="w-full">
                                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Account
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
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

            <Button variant="outline" onClick={handleGoogleLogin} disabled={isProcessing}>
                {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 64.5C308 106.9 280.7 96 248 96c-88.8 0-160.1 72.1-160.1 160.1s71.3 160.1 160.1 160.1c94.9 0 134.6-64.2 140.8-98.6H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
                )}
                Sign in with Google
            </Button>
             <p className="px-8 text-center text-sm text-muted-foreground">
                By clicking continue, you agree to our{" "}
                <Button variant="link" className="underline underline-offset-4 hover:text-primary p-0 h-auto" disabled>
                    Terms of Service
                </Button>{" "}
                and{" "}
                <Button variant="link" className="underline underline-offset-4 hover:text-primary p-0 h-auto" disabled>
                    Privacy Policy
                </Button>
                .
            </p>
        </div>
    </div>
  );
}
