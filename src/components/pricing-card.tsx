'use client';

import React, { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Loader2, Zap } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type PricingCardProps = {
  title: string;
  price: string;
  pricePeriod?: string;
  description: string;
  features: string[];
  buttonText?: string;
  priceId?: string;
  isFeatured?: boolean;
  className?: string;
  credits: number;
  nowPaymentsLink?: string;
};

export function PricingCard({
  title,
  price,
  pricePeriod,
  description,
  features,
  buttonText = 'Purchase with Card',
  priceId,
  isFeatured = false,
  className,
  credits,
  nowPaymentsLink,
}: PricingCardProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    if (!user) {
      toast({
        title: 'Please Log In',
        description: 'You must be logged in to purchase credits.',
        variant: 'destructive',
      });
      return;
    }
    if (!priceId) {
      toast({
        title: 'Not available',
        description: 'This pack is not available for purchase.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe.js has not loaded yet.');
      }
      
      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        successUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
        clientReferenceId: user.uid,
        customerEmail: user.email || undefined,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast({
        title: 'Purchase Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderButton = () => {
    if (title === 'New User') {
        return (
            <Button asChild className="w-full" variant="outline">
                <Link href="/signup">{buttonText}</Link>
            </Button>
        );
    }
    
    return (
      <div className="w-full space-y-2">
        <Button onClick={handlePurchase} disabled={isLoading} className={cn('w-full', isFeatured && 'bg-neon-yellow hover:bg-neon-yellow/90 text-black')}>
            {isLoading ? <Loader2 className="animate-spin" /> : buttonText}
        </Button>
        {nowPaymentsLink && (
           <Button asChild className="w-full" variant="secondary">
                <Link href={nowPaymentsLink} target="_blank" rel="noopener noreferrer">
                    <Zap className="mr-2 h-4 w-4" />
                    Pay with Crypto
                </Link>
            </Button>
        )}
      </div>
    )
  }

  return (
    <Card
      className={cn(
        'flex w-full flex-col bg-card/50 backdrop-blur-sm',
        isFeatured ? 'border-neon-yellow ring-2 ring-neon-yellow shadow-lg shadow-neon-yellow/10' : 'border-border/60',
        className
      )}
    >
      <CardHeader>
        <CardTitle className={cn("text-2xl font-headline text-center", isFeatured && "text-neon-yellow")}>{title}</CardTitle>
        <div className="flex items-baseline justify-center gap-x-2">
            <span className="text-5xl font-bold tracking-tight">{price}</span>
            {pricePeriod && <span className="text-sm font-semibold leading-6 tracking-wide text-muted-foreground">{pricePeriod}</span>}
        </div>
        <CardDescription className="pt-2 text-center h-10">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ul role="list" className="space-y-3 text-sm leading-6">
          {features.map((feature) => (
            <li key={feature} className="flex gap-x-3">
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex-col items-stretch space-y-2">
        {renderButton()}
      </CardFooter>
    </Card>
  );
}
