
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PricingCard } from '@/components/pricing-card';
import { ArrowRight, Code, Cpu, Layers } from 'lucide-react';

const freePlan = {
    title: 'New User',
    price: 'Free',
    description: 'Get started and try the platform, on us.',
    features: ['✓ 5 Free Credits', '✓ 5 Free Smart Contract Audits', '✓ Access to all builders'],
    buttonText: 'Sign Up to Claim',
    credits: 0,
    priceId: ''
  };

const creditPacks = [
  {
    title: 'Starter Pack',
    price: '$25',
    pricePeriod: '/ month',
    description: 'Perfect for a few small projects.',
    features: ['✓ 40 Credits', '✓ Monthly subscription', '✓ Standard Support'],
    credits: 40,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PACK_PRICE_ID,
    nowPaymentsLink: process.env.NEXT_PUBLIC_NOWPAYMENTS_STARTER_PACK_LINK,
  },
  {
    title: 'Pro Pack',
    price: '$50',
    pricePeriod: '/ month',
    description: 'Ideal for serious hobbyists and frequent users.',
    features: ['✓ 100 Credits', '✓ Monthly subscription', '✓ Priority Support'],
    credits: 100,
    isFeatured: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PACK_PRICE_ID,
    nowPaymentsLink: process.env.NEXT_PUBLIC_NOWPAYMENTS_PRO_PACK_LINK,
  },
  {
    title: 'Scale Pack',
    price: '$100',
    pricePeriod: '/ month',
    description: 'For professionals and teams building at scale.',
    features: ["✓ 250 credits", '✓ Monthly subscription', '✓ Priority Support'],
    credits: 250,
    priceId: process.env.NEXT_PUBLIC_STRIPE_SCALE_PACK_PRICE_ID,
    nowPaymentsLink: process.env.NEXT_PUBLIC_NOWPAYMENTS_SCALE_PACK_LINK,
  },
    {
    title: 'Enterprise',
    price: '$350',
    pricePeriod: '/ month',
    description: 'For power users and enterprise teams.',
    features: ["✓ Unlimited Credits", "✓ Dedicated Support", "✓ Custom Integrations"],
    credits: -1, // Using -1 to represent unlimited
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PACK_PRICE_ID,
    nowPaymentsLink: process.env.NEXT_PUBLIC_NOWPAYMENTS_ENTERPRISE_PACK_LINK,
  },
];


export default function Home() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero');

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative w-full pt-24 md:pt-32 lg:pt-40 pb-12 md:pb-24 lg:pb-32 overflow-hidden">
        {heroImage && (
          <div className="absolute inset-0 z-0">
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              data-ai-hint={heroImage.imageHint}
              fill
              className="object-cover opacity-10"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
          </div>
        )}
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col justify-center space-y-8 text-center items-center">
            <div className="space-y-4 max-w-4xl">
               <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl font-headline bg-clip-text text-transparent bg-gradient-to-br from-neon-green via-electric-blue to-neon-yellow">
                 Conversational Creation for the Decentralized Future
               </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground text-lg md:text-xl">
                How are you trying to enhance Web3?
              </p>
            </div>
             <div className="flex flex-col sm:flex-row w-full max-w-md items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mx-auto">
              <Button asChild size="lg" className="w-full sm:w-auto bg-neon-green text-black hover:bg-neon-green/90">
                <Link href="/builder/dapp">dApp</Link>
              </Button>
               <Button asChild size="lg" className="w-full sm:w-auto bg-electric-blue text-primary-foreground hover:bg-electric-blue/90">
                  <Link href="/builder/nft">NFT</Link>
                </Button>
                 <Button asChild size="lg" className="w-full sm:w-auto bg-neon-yellow text-black hover:bg-neon-yellow/90">
                  <Link href="/builder/crypto">Crypto</Link>
                </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                  <div className="flex flex-col items-center space-y-3">
                      <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                          <Cpu className="h-8 w-8 text-electric-blue"/>
                      </div>
                      <h3 className="text-xl font-bold font-headline">AI-Powered Builders</h3>
                      <p className="text-muted-foreground">From dApps to NFT collections, describe your project in plain English and let our AI agents do the heavy lifting.</p>
                  </div>
                   <div className="flex flex-col items-center space-y-3">
                      <div className="p-3 rounded-full bg-accent/10 border border-accent/20">
                          <Code className="h-8 w-8 text-neon-green"/>
                      </div>
                      <h3 className="text-xl font-bold font-headline">Production-Ready Code</h3>
                      <p className="text-muted-foreground">Receive well-structured, secure, and maintainable code in modern frameworks like React and Solidity.</p>
                  </div>
                   <div className="flex flex-col items-center space-y-3">
                      <div className="p-3 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                          <Layers className="h-8 w-8 text-neon-yellow"/>
                      </div>
                      <h3 className="text-xl font-bold font-headline">Guided Deployment</h3>
                      <p className="text-muted-foreground">Each builder provides a step-by-step checklist to guide you from generation to mainnet launch.</p>
                  </div>
              </div>
          </div>
      </section>
      
      <section id="pricing" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
           <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline bg-clip-text text-transparent bg-gradient-to-r from-neon-green to-electric-blue">Flexible Credit Packs</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Purchase credits as you go. No subscriptions, no recurring fees. All new users receive free credits to start building.
              </p>
            </div>
          </div>
          <div className="mt-16 mx-auto grid max-w-md grid-cols-1 gap-8 lg:max-w-5xl lg:grid-cols-4">
             <PricingCard {...freePlan} />
            {creditPacks.map((plan) => (
              <PricingCard key={plan.title} {...plan} />
            ))}
          </div>
           <div className="mt-16 text-center text-sm text-muted-foreground">
            <p>Payments are securely processed by Stripe and NOWPayments.</p>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline bg-clip-text text-transparent bg-gradient-to-r from-neon-green to-electric-blue">
              Ready to Start Building?
            </h2>
            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Sign up today and receive free credits to start your journey into decentralized development.
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm space-x-4">
            <Button asChild size="lg" className="bg-neon-yellow text-black hover:bg-neon-yellow/90">
              <Link href="/signup">Sign Up Now</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/docs">Read the Docs</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
