
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import Link from 'next/link';

type PricingCardProps = {
  title: string;
  price: string;
  pricePeriod?: string;
  description: string;
  features: string[];
  buttonText: string;
  buyButtonId?: string;
  publishableKey?: string;
  isFeatured?: boolean;
  nowPaymentsLink?: string;
  className?: string;
};

export function PricingCard({
  title,
  price,
  pricePeriod,
  description,
  features,
  buttonText,
  buyButtonId,
  publishableKey,
  isFeatured = false,
  nowPaymentsLink,
  className,
}: PricingCardProps) {
  const { user } = useUser();

  const renderButton = () => {
    if (title === 'Free') {
        if (user) {
            return <Button className="w-full" disabled>Your Current Plan</Button>;
        }
        return (
            <Button asChild className="w-full" variant={isFeatured ? 'default' : 'default'}>
                <Link href="/signup">{buttonText}</Link>
            </Button>
        );
    }
    
    // Fallback for buttons without Stripe config
    return (
        <Button asChild className={cn('w-full', isFeatured && 'bg-accent hover:bg-accent/90 text-accent-foreground')} variant={isFeatured ? 'default' : 'outline'}>
          <Link href={nowPaymentsLink || '/pricing'}>{buttonText}</Link>
        </Button>
    )
  }

  return (
    <Card
      className={cn(
        'flex w-full flex-col',
        isFeatured ? 'border-primary ring-2 ring-primary shadow-lg' : 'border-border/60',
        className
      )}
    >
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-center">{title}</CardTitle>
        <div className="flex items-baseline justify-center gap-x-2">
            <span className="text-5xl font-bold tracking-tight">{price}</span>
            {pricePeriod && <span className="text-sm font-semibold leading-6 tracking-wide text-muted-foreground">{pricePeriod}</span>}
        </div>
        <CardDescription className="pt-2 text-center">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ul role="list" className="space-y-3 text-sm leading-6 px-4">
          {features.map((feature) => (
            <li key={feature}>
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex-col items-stretch space-y-2">
        {renderButton()}
        {nowPaymentsLink && (
            <Button asChild className="w-full" variant="secondary">
                <Link href={nowPaymentsLink} target="_blank" rel="noopener noreferrer">
                    Pay with Crypto (NOWPayments)
                </Link>
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
