
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
    buttonText: 'Subscribe Now',
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
    buttonText: 'Subscribe Now',
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
    buttonText: 'Subscribe Now',
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
    buttonText: 'Subscribe',
    buyButtonId: 'buy_btn_1SEeKU0fXapiKkQR7MY5DF48',
    publishableKey: publishableKey,
    nowPaymentsLink: 'https://nowpayments.io/payment/?iid=4446014558',
  },
];

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-16 sm:py-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl font-headline">
          Find the Right Plan for You
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Choose a credit package that fits your needs. All new users receive free credits to start building.
        </p>
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
  );
}
