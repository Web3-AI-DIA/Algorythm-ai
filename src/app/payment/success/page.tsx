import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  return (
    <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center text-center">
      <CheckCircle className="h-16 w-16 text-green-500" />
      <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl font-headline">
        Payment Successful!
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Thank you for your purchase. Your credits have been added to your account.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/builder/dapp">Start Building</Link>
        </Button>
      </div>
    </div>
  );
}

    