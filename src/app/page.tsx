
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PricingCard } from '@/components/pricing-card';

const freePlan = {
    title: 'Free',
    price: '$0',
    description: 'Perfect for getting started and trying out the platform.',
    features: ['✓ 5 Free Credits', '✓ 5 Free Smart Contract Audits', '✓ Standard Support'],
    buttonText: 'Start for Free',
  };

const publishableKey = "pk_live_51Rqu8B0fXapiKkQRecawly7P7AtORtYieMvi1u01XEvzoCc8vd176RWp7dwtR4DhkrNVCXQvbvHkkG5OLTDEqNJQ00zxK5Jd52";

const plans = [
  {
    title: 'Starter',
    price: '$25',
    pricePeriod: '/month',
    description: 'Perfect for trying out the platform and small projects.',
    features: ['✓ 40 Credits/Month', '✓ Standard Support', '✓ 3 Projects'],
    buttonText: 'Subscribe with Stripe',
    buyButtonId: 'buy_btn_1SS6480fXapiKkQRYAkt5it0',
    publishableKey: publishableKey,
    nowPaymentsLink: 'https://nowpayments.io/payment/?iid=4542924405',
  },
  {
    title: 'Pro',
    price: '$50',
    pricePeriod: '/month',
    description: 'Ideal for serious hobbyists and frequent users.',
    features: ['✓ 100 Credits/Month', '✓ Priority Support', '✓ 10 Projects', '✓ Github integration for version control'],
    buttonText: 'Subscribe with Stripe',
    buyButtonId: 'buy_btn_1SEe7t0fXapiKkQRNADmtpsW',
    publishableKey: publishableKey,
    nowPaymentsLink: 'https://nowpayments.io/payment/?iid=5899479934',
  },
  {
    title: 'Scale',
    price: '$100',
    pricePeriod: '/month',
    description: 'For professionals and teams building at scale.',
    features: ["✓ All of Pro's features", '✓ 250 credits/Month', '✓ Dedicated Support', '✓ Collaboration', '✓ 25 Projects'],
    buttonText: 'Subscribe with Stripe',
    buyButtonId: 'buy_btn_1SEeEs0fXapiKkQRgpqbFFQt',
    publishableKey: publishableKey,
    nowPaymentsLink: 'https://nowpayments.io/payment/?iid=6308736275',
  },
  {
    title: 'Enterprise',
    price: '$500',
    pricePeriod: '/month',
    description: 'Ultimate power for agencies and large-scale operations.',
    features: ["✓ All of Scale's features", "✓ Unlimited Access", "✓ Highest Priority Support"],
    buttonText: 'Subscribe with Stripe',
    buyButtonId: 'buy_btn_1SEeKU0fXapiKkQR7MY5DF48',
    publishableKey: publishableKey,
    nowPaymentsLink: 'https://nowpayments.io/payment/?iid=4446014558',
  },
];


export default function Home() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero');

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative w-full py-24 md:py-32 lg:py-40 xl:py-48 overflow-hidden">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            data-ai-hint={heroImage.imageHint}
            fill
            className="object-cover z-0 opacity-20 animate-bg-pan"
          />
        )}
        <div className="container px-4 md:px-6 relative z-10">
          <div className="grid gap-6 lg:grid-cols-1 lg:gap-x-12 xl:gap-x-16">
            <div className="flex flex-col justify-center space-y-6 text-center">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-headline bg-clip-text text-transparent bg-gradient-to-r from-accent via-blue-500 to-primary">
                  Conversational Creation for the Decentralized Future
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Choose your builder and describe what you want to create. Our AI will handle the rest.
                </p>
              </div>
               <div className="flex w-full max-w-sm items-center justify-center space-x-4 mx-auto">
                <Button asChild size="lg">
                  <Link href="/builder/dapp">dApp Builder</Link>
                </Button>
                <Button asChild size="lg">
                  <Link href="/builder/nft">NFT Builder</Link>
                </Button>
                <Button asChild size="lg">
                  <Link href="/builder/crypto">Crypto Builder</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
           <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline bg-clip-text text-transparent bg-gradient-to-r from-accent to-blue-500">Flexible Plans for Every Creator</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Choose a credit package that fits your needs. All new users receive free credits to start building.
              </p>
            </div>
          </div>
          <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-2 lg:flex lg:justify-center">
             <div className="lg:col-span-1 flex">
                <PricingCard {...freePlan} />
            </div>
            {plans.map((plan) => (
              <div key={plan.title} className="lg:col-span-1 flex">
                  <PricingCard {...plan} />
              </div>
            ))}
          </div>
           <div className="mt-16 text-center text-sm text-muted-foreground">
            <p>Payments are securely processed by Stripe and NOWPayments.</p>
            <p>You can use cryptocurrencies for your payments.</p>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline bg-clip-text text-transparent bg-gradient-to-r from-accent to-blue-500">
              Ready to Start Building?
            </h2>
            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Sign up today and receive free credits to start your journey into decentralized development.
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm space-x-4">
            <Button asChild size="lg">
              <Link href="/signup">Sign Up Now</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
