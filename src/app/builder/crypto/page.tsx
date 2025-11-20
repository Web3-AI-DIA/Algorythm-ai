'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generateCryptocurrencyPlan, generateCryptocurrencyDesign, GenerateCryptocurrencyDesignOutput } from '@/ai/flows/ai-cryptocurrency-design';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Bot, ListChecks, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { LoginForm } from '@/components/auth/login-form';
import { SignupForm } from '@/components/auth/signup-form';


const formSchema = z.object({
  description: z.string().min(20, 'Please provide a more detailed description of your cryptocurrency.'),
});

type AuthModal = 'login' | 'signup' | null;
type Step = 'initial' | 'plan' | 'generating' | 'result';

const checklistItems = [
    { id: 'review_code', label: 'Thoroughly review generated smart contract for security vulnerabilities.' },
    { id: 'choose_blockchain', label: 'Select the target blockchain (e.g., Ethereum, Solana, Polygon).' },
    { id: 'setup_wallet', label: 'Set up a secure wallet with sufficient funds for deployment fees.' },
    { id: 'deploy_testnet', label: 'Deploy the contract to a Testnet and verify functionality.' },
    { id: 'audit_contract', label: 'Consider a professional third-party audit for the smart contract.' },
    { id: 'plan_liquidity', label: 'Plan for initial liquidity providing on a decentralized exchange.' },
    { id: 'deploy_mainnet', label: 'Deploy the contract to the Mainnet. (Est. Cost: 1 credit per blockchain + gas fees)' },
];

function ChecklistDialog() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const handleCheckChange = (id: string) => {
      setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
      <Dialog>
          <DialogTrigger asChild>
              <Button variant="outline">
                  <ListChecks className="mr-2 h-4 w-4" />
                  Deployment Checklist
              </Button>
          </DialogTrigger>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Deployment Checklist</DialogTitle>
                  <DialogDescription>
                      A step-by-step guide to help you launch your cryptocurrency.
                  </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4">
                  {checklistItems.map(item => (
                      <div key={item.id} className="flex items-center space-x-2">
                          <Checkbox
                              id={`crypto-${item.id}`}
                              checked={checkedItems[item.id] || false}
                              onCheckedChange={() => handleCheckChange(item.id)}
                          />
                          <label
                              htmlFor={`crypto-${item.id}`}
                              className={`text-sm leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${checkedItems[item.id] ? 'line-through text-muted-foreground' : ''}`}
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

export default function CryptoBuilderPage() {
  const [step, setStep] = useState<Step>('initial');
  const [plan, setPlan] = useState('');
  const [authModal, setAuthModal] = useState<AuthModal>(null);

  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => (user && firestore ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userData } = useDoc(userDocRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
    },
  });
  
  const saveProject = async (cryptoResult: GenerateCryptocurrencyDesignOutput) => {
    if (!user || !firestore) return;

    try {
      const projectData = {
        name: form.getValues('description').substring(0, 30),
        type: 'Cryptocurrency',
        creationDate: new Date().toISOString(),
        lastModifiedDate: new Date().toISOString(),
        code: cryptoResult.smartContractCode,
        userId: user.uid,
      };

      const projectsCol = collection(firestore, `users/${user.uid}/projects`);
      addDocumentNonBlocking(projectsCol, projectData);
      
      toast({
          title: 'Cryptocurrency Saved!',
          description: 'Your new crypto design has been saved to your projects.',
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

  async function onGeneratePlan(values: z.infer<typeof formSchema>) {
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
    try {
      await updateDoc(userDocRef, { credits: userData.credits - planCreditCost });
      const generatedPlan = await generateCryptocurrencyPlan(values.description);
      setPlan(generatedPlan);
      toast({ title: 'Plan Generated!', description: `${planCreditCost} credits have been deducted.` });
    } catch (error) {
      console.error(error);
      // Re-add credits if plan generation fails
      await updateDoc(userDocRef, { credits: userData.credits });
      toast({
        title: 'Error',
        description: 'Failed to generate a plan. Please try again. Your credits have not been deducted.',
        variant: 'destructive',
      });
      setStep('initial');
    }
  }
  
  async function onApprovePlan() {
    if (!user || !userData || !userDocRef) {
        toast({ title: "Please Log In", description: "You need to be logged in to generate a design.", variant: "destructive" });
        setAuthModal('login');
        return;
    }

    if (userData.credits < generationCreditCost) {
      toast({
        title: 'Insufficient Credits',
        description: `You need ${generationCreditCost} credit to generate the design, but you only have ${userData.credits}.`,
        variant: 'destructive',
      });
      return;
    }

    setStep('generating');
    try {
      await updateDoc(userDocRef, { credits: userData.credits - generationCreditCost });
      const values = form.getValues();
      const result = await generateCryptocurrencyDesign({ description: values.description, plan });
      setStep('result');
      await saveProject(result);
      toast({ title: 'Design Generated!', description: `${generationCreditCost} credit has been deducted.` });
    } catch (error) {
       console.error(error);
       // Re-add credits if generation fails
       await updateDoc(userDocRef, { credits: userData.credits });
      toast({
        title: 'Error Generating Design',
        description: 'There was a problem communicating with the AI. Please try again. Your credits have not been deducted.',
        variant: 'destructive',
      });
      setStep('plan');
    }
  }
  
  const handleEdit = () => {
    setStep('initial');
    setPlan('');
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
            AI Cryptocurrency Builder
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
            Design your own cryptocurrency from scratch. Describe your vision, and the AI will generate a comprehensive plan including tokenomics, a secure Solidity smart contract, and a full deployment strategy.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <ChecklistDialog />
        </div>
      </div>

      <div className="max-w-xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="text-primary" />
                  Your Vision
                </div>
                {user && userData && (
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span>{userData.credits} Credits</span>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Describe its purpose, target audience, and desired features. The more detail, the better!
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 'initial' && (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onGeneratePlan)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cryptocurrency Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., A decentralized meme coin for a community of artists, with a deflationary mechanism and rewards for holders."
                              rows={8}
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2 rounded-lg border bg-secondary/50 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CreditCard />
                          <span>Cost</span>
                        </div>
                        <span className="font-semibold text-foreground">{planCreditCost} Credits</span>
                      </div>
                      <p className="text-xs text-muted-foreground">To generate a high-level plan for your cryptocurrency.</p>
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Generate Plan
                    </Button>
                  </form>
                </Form>
              )}
               {(step === 'plan' || step === 'generating' || step === 'result') && (
                 <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">Your Description</h3>
                      <p className="p-4 bg-secondary rounded-md text-sm text-secondary-foreground">{form.getValues('description')}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Bot /> AI Generated Plan
                      </h3>
                      {isLoading && !plan ? (
                        <div className="p-4 bg-secondary rounded-md flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      ) : (
                         <p className="p-4 bg-secondary rounded-md whitespace-pre-wrap">{plan}</p>
                      )}
                    </div>
                    {step === 'result' && (
                       <Card className="bg-green-950/50 border-green-500/50">
                        <CardHeader>
                          <CardTitle className="text-green-400">Generation Complete!</CardTitle>
                          <CardDescription className="text-green-400/80">
                            Your cryptocurrency design has been generated and saved to your projects. 
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    )}
                 </div>
               )}
            </CardContent>
             {(step === 'plan' && plan) && (
              <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 border-t pt-4">
                  <div className="w-full space-y-2 rounded-lg border bg-secondary/50 p-4 mb-4 sm:mb-0 sm:mr-auto">
                      <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                              <CreditCard />
                              <span>Cost</span>
                          </div>
                          <span className="font-semibold text-foreground">{generationCreditCost} Credit</span>
                      </div>
                      <p className="text-xs text-muted-foreground">To approve the plan and generate the full design.</p>
                  </div>
                  <Button variant="outline" onClick={handleEdit} disabled={isLoading}>Edit</Button>
                  <Button onClick={onApprovePlan} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Approve & Generate
                  </Button>
              </CardFooter>
            )}
             {step === 'result' && (
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="outline" onClick={handleEdit}>Start Over</Button>
                </CardFooter>
             )}
          </Card>
        </div>
    </div>
    </>
  );
}
