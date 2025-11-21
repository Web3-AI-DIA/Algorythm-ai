
import { PricingCard } from '@/components/pricing-card';

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
    description: 'Perfect for a few small projects.',
    features: ['✓ 40 Credits', '✓ One-time purchase', '✓ Standard Support'],
    credits: 40,
    priceId: process.env.STRIPE_STARTER_PACK_PRICE_ID,
    nowPaymentsLink: process.env.NOWPAYMENTS_STARTER_PACK_LINK,
  },
  {
    title: 'Pro Pack',
    price: '$50',
    description: 'Ideal for serious hobbyists and frequent users.',
    features: ['✓ 100 Credits', '✓ One-time purchase', '✓ Priority Support'],
    credits: 100,
    isFeatured: true,
    priceId: process.env.STRIPE_PRO_PACK_PRICE_ID,
    nowPaymentsLink: process.env.NOWPAYMENTS_PRO_PACK_LINK,
  },
  {
    title: 'Scale Pack',
    price: '$100',
    description: 'For professionals and teams building at scale.',
    features: ["✓ 250 credits", '✓ One-time purchase', '✓ Priority Support'],
    credits: 250,
    priceId: process.env.STRIPE_SCALE_PACK_PRICE_ID,
    nowPaymentsLink: process.env.NOWPAYMENTS_SCALE_PACK_LINK,
  },
  {
    title: 'Unlimited',
    price: '$500',
    description: 'For power users and enterprise teams.',
    features: ["✓ Unlimited Credits", "✓ Dedicated Support", "✓ Custom Integrations"],
    credits: -1, // Using -1 to represent unlimited
    priceId: process.env.STRIPE_UNLIMITED_PACK_PRICE_ID,
    nowPaymentsLink: process.env.NOWPAYMENTS_UNLIMITED_PACK_LINK,
  },
];


export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-16 sm:py-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl font-headline bg-clip-text text-transparent bg-gradient-to-br from-neon-yellow via-neon-green to-electric-blue">
          Find the Right Plan for You
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Choose a credit package that fits your needs. No subscriptions, no recurring fees. All new users receive free credits to start building.
        </p>
      </div>
       <div className="mt-20 mx-auto grid max-w-md grid-cols-1 gap-8 lg:max-w-5xl lg:grid-cols-4">
         <PricingCard {...freePlan} />
        {creditPacks.map((plan) => (
           <PricingCard key={plan.title} {...plan} />
        ))}
      </div>
       <div className="mt-16 text-center text-sm text-muted-foreground">
        <p>Payments are securely processed by Stripe and NOWPayments.</p>
      </div>
    </div>
  );
}
