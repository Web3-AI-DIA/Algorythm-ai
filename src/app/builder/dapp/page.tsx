'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { conversationalDAppBuilder } from '@/ai/flows/conversational-dapp-builder';
import { DAppPlan, DAppCode } from '@/ai/flows/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Sparkles, Clipboard, Check, FileCode, Eye, ListChecks, Bot, CreditCard, Github } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Editor from '@monaco-editor/react';
import { Switch } from '@/components/ui/switch';
import { ChatInterface } from '@/components/builder/chat-interface';

type Step = 'initial' | 'conversation' | 'generating' | 'result';
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
  const [iframeContent, setIframeContent] = useState('');

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch('/preview-template.html');
        const template = await response.text();
        const content = template.replace('// COMPONENT_CODE', code);
        setIframeContent(`data:text/html;charset=utf-8,${encodeURIComponent(content)}`);
      } catch (error) {
        console.error('Error fetching preview template:', error);
      }
    };

    if (code) {
      fetchTemplate();
    }
  }, [code]);

  return (
    <iframe
      src={iframeContent}
      title="dApp Preview"
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-same-origin"
    />
  );
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

export default function DappBuilderPage() {
  const [prompt, setPrompt] = useState('');
  const [step, setStep] = useState<Step>('initial');
  const [plan, setPlan] = useState<DAppPlan | null>(null);
  const [dAppCode, setDAppCode] = useState<DAppCode | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const [authModal, setAuthModal] = useState<AuthModal>(null);

  const userDocRef = useMemoFirebase(() => (user && firestore ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userData } = useDoc(userDocRef);

  const handleSendMessage = async (message: string) => {
    const newMessages = [...messages, { role: 'user' as const, content: message }];
    setMessages(newMessages);
    setStep('conversation');

    if (!user || !userData || !userDocRef) {
      setMessages((prev) => [...prev, { role: 'model' as const, content: 'Please log in to continue.' }]);
      setAuthModal('login');
      return;
    }

    const creditCost = newMessages.length === 1 ? 3 : 1;
    if (userData.credits < creditCost) {
      setMessages((prev) => [...prev, { role: 'model' as const, content: `You need ${creditCost} credits to send this message, but you only have ${userData.credits}.` }]);
      return;
    }

    try {
      await updateDoc(userDocRef, { credits: increment(-creditCost) });
      const response = await conversationalDAppBuilder({ messages: newMessages });

      if ('plan' in response) {
        setPlan(response);
        setMessages((prev) => [...prev, { role: 'model' as const, content: response.plan }]);
      } else {
        setDAppCode(response);
        setMessages((prev) => [...prev, { role: 'model' as const, content: response.description }]);
        setStep('result');
      }
    } catch (error) {
      console.error(error);
      await updateDoc(userDocRef, { credits: increment(creditCost) });
      setMessages((prev) => [...prev, { role: 'model' as const, content: 'Sorry, I had trouble processing your request. Please try again.' }]);
    }
  };

  const handleCopy = () => {
    if (dAppCode?.dAppCode) {
      navigator.clipboard.writeText(dAppCode.dAppCode);
      setHasCopied(true);
      toast({ title: 'Code copied to clipboard!' });
      setTimeout(() => setHasCopied(false), 2000);
    }
  };
  
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

        <div className="flex flex-col h-[80vh]">
          {/* Top Section: Chat Interface */}
          <div className="flex-1 flex flex-col gap-8">
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
                <ChatInterface
                  messages={messages.map(m => ({ sender: m.role === 'user' ? 'user' : 'ai', text: m.content }))}
                  onSendMessage={handleSendMessage}
                  isLoading={step === 'conversation' && messages[messages.length - 1]?.role === 'user'}
                />
              </CardContent>
            </Card>
          </div>

          {/* Bottom Section: Preview, Code */}
          <div className="flex-1 flex flex-col mt-8">
            <Card className="flex-1 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={viewMode === 'preview'}
                      onCheckedChange={(checked) => setViewMode(checked ? 'preview' : 'code')}
                      id="view-mode-switch"
                    />
                    <Label htmlFor="view-mode-switch">{viewMode === 'preview' ? 'Live Preview' : 'Code Editor'}</Label>
                  </div>
                  {dAppCode?.dAppCode && (
                    <Button onClick={handleCopy} size="icon" variant="ghost" className="h-8 w-8">
                      {hasCopied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                    </Button>
                  )}
                </div>

                {viewMode === 'preview' ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground p-4 bg-secondary/20 m-4 mt-0 rounded-lg">
                    {step === 'generating' ? <Loader2 className="h-8 w-8 animate-spin"/> : dAppCode?.livePreview ? <LivePreview code={dAppCode.livePreview} /> : 'Live preview will appear here...'}
                  </div>
                ) : (
                  <div className="flex-1 relative overflow-hidden">
                    <Editor
                      height="100%"
                      language="javascript"
                      theme="vs-dark"
                      value={dAppCode?.dAppCode || '// Generated code will appear here...'}
                      options={{
                        readOnly: false,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                      }}
                    />
                  </div>
                )}
            </Card>
          </div>
        </div>
      </div>
      <Script src="https://unpkg.com/@babel/standalone/babel.min.js" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/ethers@6/dist/ethers.umd.min.js" strategy="afterInteractive" />
    </>
  );
}
