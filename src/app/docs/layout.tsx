import React from 'react';
import Link from 'next/link';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <nav className="w-64 flex-shrink-0 border-r border-border bg-card p-4">
        <h2 className="text-lg font-semibold mb-4 text-card-foreground">Navigation</h2>
        <ul className="space-y-2">
          <li><Link href="/docs/ai-powered-builder-selection" className="text-muted-foreground hover:text-foreground">AI-Powered Builder Selection</Link></li>
          <li><Link href="/docs/authentication" className="text-muted-foreground hover:text-foreground">Authentication</Link></li>
          <li><Link href="/docs/credit-system" className="text-muted-foreground hover:text-foreground">Credit System</Link></li>
          <li><Link href="/docs/dapp-builder" className="text-muted-foreground hover:text-foreground">dApp Builder</Link></li>
          <li><Link href="/docs/nft-builder" className="text-muted-foreground hover:text-foreground">NFT Builder</Link></li>
          <li><Link href="/docs/cryptocurrency-builder" className="text-muted-foreground hover:text-foreground">Cryptocurrency Builder</Link></li>
        </ul>
      </nav>
      <main className="flex-grow p-8 prose prose-invert">{children}</main>
    </div>
  );
}
