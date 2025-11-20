import Link from 'next/link';
import { Twitter, Github, Linkedin, Facebook } from 'lucide-react';
import { Logo } from '@/components/icons';
import { Button } from '../ui/button';

export function Footer() {
  const socialLinks = [
    { name: 'X', icon: Twitter, href: 'https://x.com/algorythmai' },
    { name: 'Facebook', icon: Facebook, href: 'https://www.facebook.com/profile.php?id=61583282171653&name=xhp_nt__fb__action__open_user' },
  ];

  const legalLinks = [
    { name: 'Terms & Conditions', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
  ];

  return (
    <footer className="border-t border-border/40 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Logo className="h-8 w-8" />
              <span className="font-bold text-xl font-headline bg-clip-text text-transparent bg-gradient-to-r from-accent via-blue-500 to-primary">
                Algorythm AI
              </span>
            </Link>
            <p className="text-muted-foreground text-sm text-center md:text-left">
              Building the future of decentralized applications with artificial intelligence.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center text-center">
             <h3 className="font-semibold mb-4">Support</h3>
             <a href="mailto:support@algorythmai.xyz" className="text-sm text-muted-foreground hover:text-foreground">
                support@algorythmai.xyz
             </a>
          </div>

          <div className="flex flex-col items-center md:items-end">
            <h3 className="font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <Button asChild key={social.name} variant="ghost" size="icon">
                  <a
                    href={social.href}
                    aria-label={social.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border/40 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p className="text-center md:text-left mb-4 md:mb-0">
            © {new Date().getFullYear()} Algorythm AI. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <Button asChild variant="link" className="text-muted-foreground">
                <Link href="/docs">Docs</Link>
            </Button>
            {legalLinks.map((link) => (
              <Button asChild key={link.name} variant="link" className="text-muted-foreground">
                <Link href={link.href}>{link.name}</Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
