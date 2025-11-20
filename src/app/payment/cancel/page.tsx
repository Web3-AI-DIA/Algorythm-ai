import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function PaymentCancelPage() {
  return (
    <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center text-center">
      <XCircle className="h-16 w-16 text-destructive" />
      <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl font-headline">
        Payment Canceled
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Your payment was not processed. You have not been charged.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/pricing">View Pricing</Link>
        </Button>
      </div>
    </div>
  );
}

    