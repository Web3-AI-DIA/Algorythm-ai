
'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generateNftPlan, createNftCollection, CreateNftCollectionOutput } from '@/ai/flows/ai-powered-nft-collection-creation';
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
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Palette, FileText, Bot, ListChecks, CreditCard, Files, PlusCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useUser, useFirestore, useStorage, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, updateDoc, query, where, increment } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { LoginForm } from '@/components/auth/login-form';
import { SignupForm } from '@/components/auth/signup-form';
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow } from 'date-fns';


const formSchema = z.object({
  collectionDescription: z.string().min(10, 'Please provide a more detailed description.'),
  numberOfNfts: z.number().min(1).max(10), // Limiting to 10 for performance
});

type Step = 'initial' | 'plan' | 'generating' | 'result';
type AuthModal = 'login' | 'signup' | null;

const checklistItems = [
    { id: 'choose_blockchain', label: 'Select the target blockchain (e.g., Ethereum, Solana, Polygon).' },
    { id: 'setup_wallet', label: 'Set up a secure wallet for deployment.' },
    { id: 'generate_art', label: 'Generate or prepare all NFT artwork and metadata.' },
    { id: 'upload_assets', label: 'Upload NFT assets and metadata to a decentralized storage (e.g., IPFS).' },
    { id: 'write_contract', label: 'Write or select a secure smart contract (e.g., ERC-721, ERC-1155).' },
    { id: 'deploy_testnet', label: 'Deploy the contract to a Testnet and verify functionality.' },
    { id: 'setup_minting', label: 'Set up a minting page or mechanism for users.' },
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
                    <DialogTitle>NFT Deployment Checklist</DialogTitle>
                    <DialogDescription>
                        A step-by-step guide to help you launch your NFT collection.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                    {checklistItems.map(item => (
                        <div key={item.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`nft-${item.id}`}
                                checked={checkedItems[item.id] || false}
                                onCheckedChange={() => handleCheckChange(item.id)}
                            />
                            <label
                                htmlFor={`nft-${item.id}`}
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

async function uploadImageAndGetURL(storage: any, userId: string, projectId: string, image: string, index: number): Promise<string> {
    const imageRef = ref(storage, `nft-images/${userId}/${projectId}/${index}.png`);
    const snapshot = await uploadString(imageRef, image, 'data_url');
    return getDownloadURL(snapshot.ref);
}

export default function NftBuilderPage() {
  const [step, setStep] = useState<Step>('initial');
  const [plan, setPlan] = useState('');
  const [result, setResult] = useState<CreateNftCollectionOutput | null>(null);
  const [authModal, setAuthModal] = useState<AuthModal>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();

  const userDocRef = useMemoFirebase(() => (user && firestore ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userData } = useDoc(userDocRef);

  const projectsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/projects`), where('type', '==', 'NFT'));
  }, [user, firestore]);

  const { data: nftCollections } = useCollection(projectsQuery);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      collectionDescription: '',
      numberOfNfts: 1,
    },
  });

  const numberOfNfts = form.watch('numberOfNfts');
  
  const planCreditCost = 3;
  const generationCreditCost = useMemo(() => {
      if (numberOfNfts <= 0) return 0;
      return 1 + (numberOfNfts - 1);
  }, [numberOfNfts]);


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
      await updateDoc(userDocRef, { credits: increment(-planCreditCost) });
      const generatedPlan = await generateNftPlan(values);
      setPlan(generatedPlan);
      toast({ title: 'Plan Generated!', description: `${planCreditCost} credits have been deducted.` });
    } catch (error) {
      console.error(error);
      await updateDoc(userDocRef, { credits: increment(planCreditCost) });
      toast({
        title: 'Error',
        description: 'Failed to generate a plan. Please try again. Your credits have not been deducted.',
        variant: 'destructive',
      });
      setStep('initial');
    }
  }

  const saveProject = async (nftsWithUrls: any[]) => {
    if (!user || !firestore) return;

    try {
      const projectData = {
        name: form.getValues('collectionDescription').substring(0, 30),
        type: 'NFT',
        creationDate: new Date().toISOString(),
        lastModifiedDate: new Date().toISOString(),
        code: JSON.stringify(nftsWithUrls, null, 2),
        userId: user.uid,
      };
      
      const projectsCol = collection(firestore, `users/${user.uid}/projects`);
      addDocumentNonBlocking(projectsCol, projectData);

      toast({
        title: 'NFT Collection Saved!',
        description: 'Your new collection has been saved to your projects.',
      });

    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: 'Save Failed',
        description: 'Could not save your project to the database.',
        variant: 'destructive',
      });
    }
  };

  async function onApprovePlan() {
     if (!user || !userData || !userDocRef) {
        toast({ title: "Please Log In", description: "You need to be logged in to generate a collection.", variant: "destructive" });
        setAuthModal('login');
        return;
    }

    if (userData.credits < generationCreditCost) {
      toast({
        title: 'Insufficient Credits',
        description: `You need ${generationCreditCost} credits for this collection, but you only have ${userData.credits}.`,
        variant: 'destructive',
      });
      return;
    }

    setStep('generating');
    setResult(null);
    try {
      await updateDoc(userDocRef, { credits: increment(-generationCreditCost) });

      const values = form.getValues();
      const response = await createNftCollection({...values, plan });
      setResult(response);
      setStep('result');
      
      toast({ title: 'Collection Generated!', description: `${generationCreditCost} credits were deducted. Uploading images...` });


      if (user && storage) {
        const projectId = uuidv4();
        toast({
            title: 'Uploading Images...',
            description: 'Your NFT images are being uploaded to secure storage.'
        });

        const nftsWithUrls = await Promise.all(
            response.nfts.map(async (nft, index) => {
                const downloadURL = await uploadImageAndGetURL(storage, user.uid, projectId, nft.image, index);
                return { ...nft, image: downloadURL };
            })
        );
        
        await saveProject(nftsWithUrls);
        setResult({ nfts: nftsWithUrls }); // Update the result state with final URLs

      } else {
        toast({
          title: 'Collection Generated! Sign up to save.',
          description: 'Sign up to save your project and store your images.',
          action: <Button onClick={() => setAuthModal('signup')}>Sign Up</Button>
        });
      }
    } catch (error) {
      console.error(error);
      // Refund credits on failure
      await updateDoc(userDocRef, { credits: increment(generationCreditCost) });
      toast({
        title: 'Error',
        description: 'Failed to generate NFT collection. Your credits were not deducted.',
        variant: 'destructive',
      });
      setStep('plan');
    }
  }

  const handleEdit = () => {
    setStep('initial');
    setResult(null);
  };
  
  const renderRightPanel = () => {
    switch(step) {
      case 'plan':
         return (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText /> AI Generated Plan</CardTitle>
                    <CardDescription>Review the plan for your NFT collection. Approve it to generate the NFTs, or go back to edit your description.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="p-4 bg-secondary rounded-md whitespace-pre-wrap">{plan}</p>
                </CardContent>
                <CardFooter className="flex-col sm:flex-row justify-end gap-2">
                    <div className="w-full sm:w-auto space-y-2 rounded-lg border bg-secondary/50 p-4 mb-4 sm:mb-0 sm:mr-auto">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CreditCard />
                          <span>Generation Cost</span>
                        </div>
                        <span className="font-semibold text-foreground">{generationCreditCost} Credits</span>
                      </div>
                      <p className="text-xs text-muted-foreground">To generate the full collection.</p>
                    </div>
                    <Button variant="outline" onClick={handleEdit}>Edit</Button>
                    <Button onClick={onApprovePlan}><Sparkles className="mr-2 h-4 w-4"/>Approve & Generate</Button>
                </CardFooter>
            </Card>
        );
      case 'generating':
        return (
             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: form.watch('numberOfNfts') }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <div className="aspect-square bg-secondary rounded-t-lg"></div>
                        <div className="p-4 space-y-2">
                            <div className="h-5 bg-secondary rounded w-3/4"></div>
                            <div className="h-4 bg-secondary rounded w-full"></div>
                            <div className="h-4 bg-secondary rounded w-1/2"></div>
                        </div>
                    </Card>
                ))}
             </div>
        );
      case 'result':
        return result && result.nfts.length > 0 && (
            <ScrollArea className="h-[70vh] pr-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {result.nfts.map((nft, index) => (
                    <Card key={index} className="overflow-hidden">
                        <div className="aspect-square relative">
                            <Image src={nft.image} alt={nft.name} fill objectFit="cover" />
                        </div>
                        <CardHeader>
                            <CardTitle>{nft.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">{nft.description}</p>
                            <Accordion type="single" collapsible>
                                <AccordionItem value="attributes">
                                    <AccordionTrigger>Attributes</AccordionTrigger>
                                    <AccordionContent>
                                        <ul className="space-y-1 text-xs">
                                            {nft.attributes.map(attr => (
                                                <li key={attr.trait_type} className="flex justify-between p-1 bg-secondary/50 rounded">
                                                    <span className="font-semibold text-muted-foreground">{attr.trait_type}:</span>
                                                    <span>{attr.value}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                ))}
                </div>
            </ScrollArea>
        );
      case 'initial':
      default:
        return (
            <div className="flex items-center justify-center h-full border-2 border-dashed border-border rounded-lg">
                <div className="text-center text-muted-foreground">
                    <Palette className="mx-auto h-12 w-12" />
                    <p className="mt-4">Your generated NFT collection will appear here.</p>
                </div>
            </div>
        );
    }
  }


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
        <div className="flex justify-between items-center mb-12">
          <div className="flex-1">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline">
              AI-Powered NFT Collection Builder
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
              Describe your vision, and our advanced AI model, "Nano Banana," will bring your NFT collection to life. It generates both the unique artwork for each NFT and its corresponding metadata. Generated images are automatically uploaded to secure storage.
              </p>
          </div>
          <div className="flex items-center gap-2">
              <Button asChild variant="outline"><Link href="/dashboard"><Files className="mr-2 h-4 w-4" /> View Collections</Link></Button>
              <ChecklistDialog />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="text-primary" />
                    Collection Details
                  </div>
                  {user && userData && (
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      <span>{userData.credits} Credits</span>
                    </div>
                  )}
                </CardTitle>
                <CardDescription>
                  Provide the theme and style for your collection. The AI will generate a plan for your approval.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onGeneratePlan)} className="space-y-8">
                    <FormField
                      control={form.control}
                      name="collectionDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Collection Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., A collection of cyberpunk cats with neon accessories, in a pixel art style."
                              rows={5}
                              {...field}
                              disabled={step !== 'initial'}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="numberOfNfts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of NFTs to Generate: {field.value}</FormLabel>
                          <FormControl>
                              <Slider
                                  min={1}
                                  max={10}
                                  step={1}
                                  value={[field.value]}
                                  onValueChange={(vals) => field.onChange(vals[0])}
                                  disabled={step !== 'initial'}
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
                                  <span>Plan Cost</span>
                              </div>
                              <span className="font-semibold text-foreground">{planCreditCost} Credits</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                              To generate the collection plan and attributes.
                          </p>
                      </div>
                    <Button type="submit" disabled={step !== 'initial'} className="w-full">
                      {step === 'plan' || step === 'generating' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Generate Plan
                    </Button>
                    {step === 'result' && <Button onClick={handleEdit} className="w-full" variant="outline">Start Over</Button>}
                  </form>
                </Form>
              </CardContent>
            </Card>

             {user && nftCollections && nftCollections.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Your NFT Collections</CardTitle>
                        <CardDescription>A list of your previously generated collections.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-48">
                            <div className="space-y-4">
                                {nftCollections.map(proj => (
                                    <Link key={proj.id} href={`/dashboard/${proj.id}`} className="block p-3 rounded-md hover:bg-secondary">
                                        <div className="font-semibold truncate">{proj.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            Modified {formatDistanceToNow(new Date(proj.lastModifiedDate), { addSuffix: true })}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
             )}

          </div>

          <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold font-headline mb-4">Generated NFTs</h2>
              <div className="h-[calc(80vh)]">
                {renderRightPanel()}
              </div>
          </div>
        </div>
      </div>
    </>
  );
}
