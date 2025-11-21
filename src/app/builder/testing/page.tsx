'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { testSmartContract, TestSmartContractOutput } from '@/ai/flows/smart-contract-testing';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Bot, CheckCircle, AlertTriangle, Lightbulb, CreditCard } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';


const formSchema = z.object({
  contractCode: z.string().min(50, 'Please provide the full smart contract code to be tested.'),
});

type Step = 'initial' | 'analyzing' | 'result';
const creditCost = 2; // Example cost for testing

export default function SmartContractTestingPage() {
  const [step, setStep] = useState<Step>('initial');
  const [analysisResult, setAnalysisResult] = useState<TestSmartContractOutput | null>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => (user && firestore ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userData } = useDoc(userDocRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contractCode: '',
    },
  });

  async function onAnalyzeContract(values: z.infer<typeof formSchema>) {
    if (!user || !userData || !userDocRef) {
      toast({
        title: 'Please Log In',
        description: 'You need to be logged in to analyze a contract.',
        variant: 'destructive',
      });
      return;
    }

    const hasFreeAudits = userData.freeAudits > 0;
    const hasEnoughCredits = userData.credits >= creditCost;

    if (!hasFreeAudits && !hasEnoughCredits) {
      toast({
        title: 'Insufficient Credits',
        description: `You need ${creditCost} credits for a contract analysis, but you only have ${userData.credits}.`,
        variant: 'destructive',
      });
      return;
    }

    setStep('analyzing');
    setAnalysisResult(null);

    try {
      if (hasFreeAudits) {
        await updateDoc(userDocRef, { freeAudits: increment(-1) });
        toast({ title: 'Free audit used!', description: `You have ${userData.freeAudits - 1} free audits remaining.`});
      } else {
        await updateDoc(userDocRef, { credits: increment(-creditCost) });
        toast({ title: 'Credits Deducted', description: `${creditCost} credits have been deducted from your account.`});
      }
      
      const result = await testSmartContract(values);
      setAnalysisResult(result);
      setStep('result');
      toast({
        title: 'Analysis Complete',
        description: 'Your smart contract has been tested and analyzed.',
      });

    } catch (error) {
      console.error(error);
      if (hasFreeAudits) {
        await updateDoc(userDocRef, { freeAudits: increment(1) });
      } else {
        await updateDoc(userDocRef, { credits: increment(creditCost) });
      }
      toast({
        title: 'Analysis Failed',
        description: 'There was an error analyzing your contract. Please try again. Your credits were not deducted.',
        variant: 'destructive',
      });
      setStep('initial');
    }
  }

  const handleStartOver = () => {
    setStep('initial');
    setAnalysisResult(null);
    form.reset();
  }

  const isLoading = step === 'analyzing';
  const analysisCostText = userData && userData.freeAudits > 0 ? '1 Free Audit' : `${creditCost} Credits`;

  return (
    <div className="container mx-auto p-4 md:p-8">
       <div className="flex flex-col items-center text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline">
            Smart Contract Testing Framework
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
            Paste your Solidity code below to receive a comprehensive AI-powered analysis. The tool simulates a full test suite, provides gas usage estimates for deployment and functions, and offers actionable security and optimization recommendations.
          </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Column */}
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="text-primary" />
                  Contract Input
                </div>
                {user && userData && (
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span>{userData.credits} Credits ({userData.freeAudits} Free Audits)</span>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Provide the full Solidity code for the smart contract you want to analyze.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onAnalyzeContract)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="contractCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Solidity Code</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="pragma solidity ^0.8.20; ..."
                              rows={15}
                              {...field}
                              disabled={isLoading}
                              className="font-code text-xs"
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
                          <span>Analysis Cost</span>
                        </div>
                        <span className="font-semibold text-foreground">{analysisCostText}</span>
                      </div>
                    </div>
                    {step === 'initial' && (
                        <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Analyze Contract
                        </Button>
                    )}
                    {step !== 'initial' && (
                        <Button onClick={handleStartOver} variant="outline" className="w-full">
                            Start New Analysis
                        </Button>
                    )}
                  </form>
                </Form>
            </CardContent>
        </Card>

        {/* Output Column */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Analysis Report</CardTitle>
            <CardDescription>
                {isLoading ? 'The AI is analyzing your contract...' : 'Review the analysis results below.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : !analysisResult ? (
                 <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                    <p>Your analysis report will appear here.</p>
                </div>
            ) : (
                <Tabs defaultValue="tests" className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="tests"><CheckCircle className="mr-2 h-4 w-4"/>Test Results</TabsTrigger>
                        <TabsTrigger value="gas"><AlertTriangle className="mr-2 h-4 w-4"/>Gas Report</TabsTrigger>
                        <TabsTrigger value="recommendations"><Lightbulb className="mr-2 h-4 w-4"/>Recommendations</TabsTrigger>
                    </TabsList>
                    <ScrollArea className="flex-1 mt-4">
                        <TabsContent value="tests">
                            <pre className="p-4 text-sm bg-secondary/50 rounded-md font-code whitespace-pre-wrap">{analysisResult.testResults}</pre>
                        </TabsContent>
                        <TabsContent value="gas">
                            <pre className="p-4 text-sm bg-secondary/50 rounded-md font-code whitespace-pre-wrap">{analysisResult.gasEstimate}</pre>
                        </TabsContent>
                        <TabsContent value="recommendations">
                             <pre className="p-4 text-sm bg-secondary/50 rounded-md font-code whitespace-pre-wrap">{analysisResult.recommendations}</pre>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
