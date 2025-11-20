
'use client';

import React, { useState, useEffect } from 'react';
import { generateDAppPlan, generateDApp, GenerateDAppOutput } from '@/ai/flows/ai-driven-dapp-generation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Sparkles, Clipboard, Check, FileCode, Eye, ListChecks, Github, FileText, Bot, Rocket, CreditCard } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { LoginForm } from '@/components/auth/login-form';
import { SignupForm } from '@/components/auth/signup-form';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import Script from 'next/script';

type Step = 'initial' | 'plan' | 'generating' | 'result';
type AuthModal = 'login' | 'signup' | null;

const deploymentChecklist = [
    { id: '1', label: 'Review and finalize smart contract code' },
    { id: '2', label: 'Set up development environment (Truffle/Hardhat)' },
    { id: '3', label: 'Compile smart contracts' },
    { id: '4', label: 'Deploy to a test network (e.g., Ropsten, Rinkeby)' },
    { id: '5', 'label': 'Integrate front-end with deployed contract' },
    { id: '6', 'label': 'Deploy front-end (e.g., Vercel, Firebase Hosting)' },
    { id: '7', label: 'Deploy smart contract to mainnet (Est. Cost: 1 credit per blockchain + gas fees)' },
];

function LivePreview({ code }: { code: string }) {
  const [Component, setComponent] = useState<React.FC | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if scripts are loaded
    if ((window as any).Babel && (window as any).ethers) {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (isReady && code) {
      try {
        const fullCode = `
          const { useState, useEffect, useCallback } = React;
          const { ethers } = window.ethers;
          
          function App() {
            ${code.replace(/export default function Component\(\)/, '')}
            return Component();
          }
          
          return React.createElement(App);
        `;
        const transformedCode = (window as any).Babel.transform(fullCode, { presets: ['react'] }).code;
        const DynamicComponent = new Function('React', 'ethers', transformedCode);
        
        setComponent(() => DynamicComponent(React, (window as any).ethers));
        setError(null);
      } catch (e: any) {
        console.error("Error rendering live preview:", e);
        setError("Failed to render preview. The generated code might have an error.");
        setComponent(null);
      }
    }
  }, [code, isReady]);

  if (error) {
    return <div className="text-destructive-foreground p-4 bg-destructive rounded-md">{error}</div>;
  }
  
  if (!isReady || !Component) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
        Loading Preview...
      </div>
    );
  }

  return (
     <div className="w-full h-full p-4 bg-white rounded-md text-black">
        <React.Suspense fallback={<div>Loading Preview...</div>}>
            {Component}
        </React.Suspense>
    </div>
  )
}

function ChecklistDialog() {
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    const handleCheckChange = (id: string) => {
        setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <ListChecks className="mr-2 h-4 w-4"/>
                    Deployment Checklist
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Deployment Checklist</DialogTitle>
                    <DialogDescription>
                        A step-by-step guide to help you launch your dApp.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                    {deploymentChecklist.map(item => (
                        <div key={item.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`dapp-${item.id}`}
                                checked={checkedItems[item.id] || false}
                                onCheckedChange={() => handleCheckChange(item.id)}
                            />
                            <label
                                htmlFor={`dapp-${item.id}`}
                                className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${checkedItems[item.id] ? 'line-through text-muted-foreground' : ''}`}
                            >
                                {item.label}
                            </label>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}

const planCreditCost = 3;
const generationCreditCost = 1;

export default function DappBuilderPage() {
  const [prompt, setPrompt] = useState('');
  const [step, setStep] = useState<Step>('initial');
  const [plan, setPlan] = useState('');
  const [result, setResult] = useState<GenerateDAppOutput | null>(null);
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const [authModal, setAuthModal] = useState<AuthModal>(null);

  const userDocRef = useMemoFirebase(() => (user && firestore ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userData } = useDoc(userDocRef);

  const handleCopy = () => {
    if (result?.dAppCode) {
        navigator.clipboard.writeText(result.dAppCode);
        setHasCopied(true);
        toast({ title: 'Code copied to clipboard!' });
        setTimeout(() => setHasCopied(false), 2000);
    }
  };

  const handleGeneratePlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim() || step !== 'initial') return;

    if (!user || !userData || !userDocRef) {
        toast({ title: "Please Log In", description: "You need to be logged in to generate a plan.", variant: "destructive" });
        setAuthModal('login');
        return;
    }

    if (userData.credits < planCreditCost) {
      toast({
        title: 'Insufficient Credits',
        description: `You need ${planCreditCost} credits to generate a plan, but you only have ${userData.credits}.`,
        variant: 'destructive',
      });
      return;
    }

    setStep('plan');
    setResult(null);

    try {
      await updateDoc(userDocRef, { credits: userData.credits - planCreditCost });
      const generatedPlan = await generateDAppPlan({ prompt });
      setPlan(generatedPlan);
      toast({ title: 'Plan Generated!', description: `${planCreditCost} credits have been deducted.` });
    } catch (error) {
      console.error(error);
      await updateDoc(userDocRef, { credits: userData.credits });
      toast({
        title: 'Error Generating Plan',
        description: 'There was an error communicating with the AI. Please try again. Your credits have not been deducted.',
        variant: 'destructive',
      });
      setStep('initial');
    }
  };
  
  const saveProject = async (dAppResult: GenerateDAppOutput) => {
    if (!user || !firestore) return;

    try {
      const projectData = {
        name: prompt.substring(0, 30), // Use the beginning of the prompt as a name
        type: 'dApp',
        creationDate: new Date().toISOString(),
        lastModifiedDate: new Date().toISOString(),
        code: dAppResult.dAppCode,
        userId: user.uid,
      };

      const projectsCol = collection(firestore, `users/${user.uid}/projects`);
      addDocumentNonBlocking(projectsCol, projectData);
      
      toast({
          title: 'dApp Saved!',
          description: 'Your new dApp has been saved to your projects.',
      })

    } catch (error) {
        console.error("Error saving project:", error);
        toast({
            title: 'Save Failed',
            description: 'Could not save your project to the database.',
            variant: 'destructive',
        });
    }
  }

  const handleApprovePlan = async () => {
    if (!user || !userData || !userDocRef) {
        toast({ title: "Please Log In", description: "You need to be logged in to generate a dApp.", variant: "destructive" });
        setAuthModal('login');
        return;
    }

    if (userData.credits < generationCreditCost) {
      toast({
        title: 'Insufficient Credits',
        description: `You need ${generationCreditCost} credit to generate the dApp, but you only have ${userData.credits}.`,
        variant: 'destructive',
      });
      return;
    }

    setStep('generating');
    try {
      await updateDoc(userDocRef, { credits: userData.credits - generationCreditCost });
      const genResult = await generateDApp({ prompt, plan });
      setResult(genResult);
      setStep('result');
      await saveProject(genResult);
      toast({ title: 'dApp Generated!', description: `${generationCreditCost} credit has been deducted.` });
    } catch (error) {
      console.error(error);
      await updateDoc(userDocRef, { credits: userData.credits });
      toast({
        title: 'Error Generating dApp',
        description: 'There was a problem communicating with the AI. Please check your connection and try again. Your credits were not deducted.',
        variant: 'destructive',
      });
      setStep('plan');
    }
  };

  const handlePlaceholderClick = () => {
    toast({ title: 'Coming Soon!', description: 'This feature is under development.' });
  };
  
  const handleEdit = () => {
      setStep('initial');
      setPlan('');
      setResult(null);
  }

  const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 36.131 44 30.655 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
  
  const isLoading = step === 'plan' && !plan || step === 'generating';

  return (
    <>
     <Dialog open={!!authModal} onOpenChange={(open) => !open && setAuthModal(null)}>
        <DialogContent className="sm:max-w-[425px]">
            {authModal === 'login' && (
                <>
                    <DialogHeader>
                        <DialogTitle>Log In</DialogTitle>
                        <DialogDescription>Access your saved projects and full features.</DialogDescription>
                    </DialogHeader>
                    <LoginForm onSignupClick={() => setAuthModal('signup')} />
                </>
            )}
            {authModal === 'signup' && (
                <>
                    <DialogHeader>
                        <DialogTitle>Create Account</DialogTitle>
                        <DialogDescription>Save your work and unlock all features by creating an account.</DialogDescription>
                    </DialogHeader>
                    <SignupForm onLoginClick={() => setAuthModal('login')} />
                </>
            )}
        </DialogContent>
      </Dialog>
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div className='flex flex-col'>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline">
              AI-Driven dApp Builder
            </h1>
            <p className="text-lg text-muted-foreground mt-2 max-w-3xl">
              Describe the decentralized application you want to build. The more detail you provide about its functionality, the better the result. The AI will generate a complete, functional React component with wallet connection logic using ethers.js.
            </p>
          </div>
          <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePlaceholderClick} title="Integrate Google Cloud / Firebase (Coming Soon)"><GoogleIcon /></Button>
              <Button variant="outline" size="icon" onClick={handlePlaceholderClick} title="Sync with GitHub (Coming Soon)"><Github className="h-5 w-5"/></Button>
              <Button variant="outline" size="icon" onClick={handlePlaceholderClick} title="Deploy (Coming Soon)"><Rocket className="h-5 w-5"/></Button>
              <ChecklistDialog />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[70vh]">
          {/* Left Column: Chat & Checklist */}
          <div className="flex flex-col gap-8">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className='flex items-center gap-2'>
                    <Bot className="text-primary" />
                    dApp Generator
                  </div>
                  {user && userData && (
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      <span>{userData.credits} Credits</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                      {step === 'initial' && <div className="text-muted-foreground">Describe your dApp to get started. The AI will generate a plan for your approval.</div>}
                      {step === 'plan' && !plan && (
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">A</div>
                            <div className="rounded-lg p-3 bg-secondary flex items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
                          </div>
                      )}
                      {step === 'plan' && plan && (
                          <Card>
                              <CardHeader>
                                  <CardTitle className="flex items-center gap-2"><FileText /> AI Generated Plan</CardTitle>
                                  <CardDescription>Review the plan below. You can approve it to generate the dApp, or go back to edit your description.</CardDescription>
                              </CardHeader>
                              <CardContent>
                                  <p className="p-4 bg-secondary rounded-md whitespace-pre-wrap">{plan}</p>
                              </CardContent>
                          </Card>
                      )}
                      {step === 'result' && result?.description && (
                          <div className="rounded-lg p-3 bg-secondary">{result.description}</div>
                      )}
                    {(step === 'generating') && (
                      <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">A</div>
                          <div className="rounded-lg p-3 bg-secondary flex items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                {step === 'initial' && (
                  <form onSubmit={handleGeneratePlan} className="flex flex-col gap-4 border-t pt-4">
                    <Textarea
                      placeholder="Describe the dApp you want to build..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={2}
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <div className="space-y-2 rounded-lg border bg-secondary/50 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CreditCard />
                          <span>Cost</span>
                        </div>
                        <span className="font-semibold text-foreground">{planCreditCost} Credits</span>
                      </div>
                       <p className="text-xs text-muted-foreground">To generate a high-level plan for your dApp.</p>
                    </div>
                    <Button type="submit" size="lg" disabled={!prompt.trim() || isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                      Generate Plan
                    </Button>
                  </form>
                )}
                {step === 'plan' && plan && (
                  <CardFooter className="flex-col sm:flex-row justify-end gap-2 border-t pt-4">
                      <div className="w-full sm:w-auto space-y-2 rounded-lg border bg-secondary/50 p-4 mb-4 sm:mb-0 sm:mr-auto">
                          <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                  <CreditCard />
                                  <span>Cost</span>
                              </div>
                              <span className="font-semibold text-foreground">{generationCreditCost} Credit</span>
                          </div>
                          <p className="text-xs text-muted-foreground">To approve the plan and generate the dApp.</p>
                      </div>
                      <Button variant="outline" onClick={handleEdit} disabled={isLoading}>Edit</Button>
                      <Button onClick={handleApprovePlan} disabled={isLoading}>
                          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                          Approve & Generate
                      </Button>
                  </CardFooter>
                )}
                {step === 'result' && (
                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button variant="outline" onClick={handleEdit}>Start Over</Button>
                    </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Preview, Code */}
          <Card className="flex flex-col">
              <Tabs defaultValue="preview" className="h-full flex flex-col">
                <TabsList className="m-4">
                  <TabsTrigger value="preview"><Eye className="mr-2 h-4 w-4"/>Live Preview</TabsTrigger>
                  <TabsTrigger value="code"><FileCode className="mr-2 h-4 w-4"/>Code</TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview" className="flex-1 flex items-center justify-center text-muted-foreground p-4 bg-secondary/20 m-4 mt-0 rounded-lg">
                  {step === 'generating' ? <Loader2 className="h-8 w-8 animate-spin"/> : result?.livePreview ? <LivePreview code={result.livePreview} /> : 'Live preview will appear here...'}
                </TabsContent>

                <TabsContent value="code" className="flex-1 relative overflow-hidden">
                  {result?.dAppCode && (
                    <Button onClick={handleCopy} size="icon" variant="ghost" className="absolute top-2 right-2 z-10 h-8 w-8">
                      {hasCopied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                    </Button>
                  )}
                  <ScrollArea className="h-full">
                    <pre className="p-4 text-sm"><code className="font-code">{result?.dAppCode || 'Generated code will appear here...'}</code></pre>
                  </ScrollArea>
                </TabsContent>

              </Tabs>
          </Card>
        </div>
      </div>
      <Script src="https://unpkg.com/@babel/standalone/babel.min.js" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/ethers@6/dist/ethers.umd.min.js" strategy="afterInteractive" />
    </>
  );
}
