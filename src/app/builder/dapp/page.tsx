'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { generateDAppPlan, generateDApp, GenerateDAppOutput } from '@/ai/flows/ai-driven-dapp-generation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Sparkles, Clipboard, Check, FileCode, Eye, ListChecks, Bot, CreditCard } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, increment } from 'firebase/firestore';
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

  useEffect(() => {
    if (!code) return;
    
    // Ensure Babel and ethers are available on the window object
    if (typeof (window as any).Babel === 'undefined' || typeof (window as any).ethers === 'undefined') {
      console.error("Babel or ethers.js not loaded");
      setError("Preview environment is not ready. Please refresh.");
      return;
    }

    try {
      // The AI generates a component named 'Component'. We need to extract its body.
      const componentBodyMatch = code.match(/function Component\(\)\s*\{([\s\S]*)\}/);
      if (!componentBodyMatch) {
        throw new Error("Could not find a valid React component structure in the generated code.");
      }
      
      const componentBody = componentBodyMatch[1];
      
      // We dynamically create a new function that includes React hooks and ethers.js from the window scope.
      const fullCode = `
        const { useState, useEffect, useCallback } = React;
        const { ethers } = window.ethers;
        
        // This is the body of the generated component
        ${componentBody}
      `;
      
      // Transform JSX to JS using Babel
      const transformedCode = (window as any).Babel.transform(fullCode, { presets: ['react'] }).code;
      
      // Create a new function that returns the component's output
      const DynamicComponent = new Function('React', 'ethers', transformedCode);

      // Set the component to be rendered
      setComponent(() => DynamicComponent(React, (window as any).ethers));
      setError(null);
    } catch (e: any) {
      console.error("Error rendering live preview:", e);
      setError(`Failed to render preview. The generated code might have an error: ${e.message}`);
      setComponent(null);
    }
  }, [code]);

  if (error) {
    return <div className="text-destructive-foreground p-4 bg-destructive rounded-md">{error}</div>;
  }
  
  if (!Component) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
        Rendering Preview...
      </div>
    );
  }

  return (
     <div className="w-full h-full p-4 bg-white rounded-md text-black">
        <Suspense fallback={<div>Loading Preview...</div>}>
            {Component}
        </Suspense>
    </div>
  )
}

function LivePreviewWrapper({ code }: { code: string }) {
    const [isClient, setIsClient] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setIsClient(true);
        // Check if scripts are loaded
        if ((window as any).Babel && (window as any).ethers) {
            setIsReady(true);
        }
    }, []);

    if (!isClient || !isReady) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                Loading Preview Environment...
            </div>
        );
    }

    return <LivePreview code={code} />;
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
      await updateDoc(userDocRef, { credits: increment(-planCreditCost) });
      const generatedPlan = await generateDAppPlan({ prompt });
      setPlan(generatedPlan);
      toast({ title: 'Plan Generated!', description: `${planCreditCost} credits have been deducted.` });
    } catch (error) {
      console.error(error);
      await updateDoc(userDocRef, { credits: increment(planCreditCost) });
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
      await updateDoc(userDocRef, { credits: increment(-generationCreditCost) });
      const genResult = await generateDApp({ prompt, plan });
      setResult(genResult);
      setStep('result');
      await saveProject(genResult);
      toast({ title: 'dApp Generated!', description: `${generationCreditCost} credit has been deducted.` });
    } catch (error) {
      console.error(error);
      await updateDoc(userDocRef, { credits: increment(generationCreditCost) });
      toast({
        title: 'Error Generating dApp',
        description: 'There was a problem communicating with the AI. Please check your connection and try again. Your credits were not deducted.',
        variant: 'destructive',
      });
      setStep('plan');
    }
  };
  
  const handleEdit = () => {
      setStep('initial');
      setPlan('');
      setResult(null);
  }
  
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
                                  <CardTitle className="flex items-center gap-2">AI Generated Plan</CardTitle>
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
                  {step === 'generating' ? <Loader2 className="h-8 w-8 animate-spin"/> : result?.livePreview ? <LivePreviewWrapper code={result.livePreview} /> : 'Live preview will appear here...'}
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
