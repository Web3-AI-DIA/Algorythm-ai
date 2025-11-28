
'use client';

import Link from 'next/link';
import {
  Menu,
  Rocket,
  Palette,
  Bitcoin,
  Settings,
  Mail,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  CreditCard,
  HelpCircle,
  FileSearch,
  Shield,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/icons';
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { HelpAssistant } from '@/components/auth/help-assistant';
import { Skeleton } from '../ui/skeleton';
import { useRouter } from 'next/navigation';
import { HamburgerIcon } from '../icons/hamburger-icon';

const builderLinks = [
  {
    href: '/builder/dapp',
    label: 'dApp Builder',
    icon: <Rocket className="h-4 w-4 mr-2" />,
  },
  {
    href: '/builder/nft',
    label: 'NFT Builder',
    icon: <Palette className="h-4 w-4 mr-2" />,
  },
  {
    href: '/builder/crypto',
    label: 'Crypto Builder',
    icon: <Bitcoin className="h-4 w-4 mr-2" />,
  },
  {
    href: '/builder/testing',
    label: 'Contract Testing',
    icon: <FileSearch className="h-4 w-4 mr-2" />,
  },
];

const mobileNavLinks = [
  { href: '/pricing', label: 'Pricing', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/contact', label: 'Contact', icon: Mail },
];

export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => (user && firestore ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/');
    }
  };

  const UserMenu = () => (
    <div className="flex items-center gap-4">
       {isUserDataLoading ? <Skeleton className="h-5 w-20" /> : userData && (
        <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span>{userData.credits} Credits</span>
        </div>
       )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
              <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.displayName || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {userData?.isAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/admin">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Admin</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/pricing">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing & Credits</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const AuthButtons = () => (
    <div className="flex items-center gap-2">
      <Button variant="ghost" asChild>
        <Link href="/login">Log In</Link>
      </Button>
      <Button asChild>
        <Link href="/signup">Sign Up</Link>
      </Button>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center gap-2 mr-6">
            <Logo className="h-6 w-6" />
            <span className="font-bold font-headline text-lg bg-clip-text text-transparent bg-gradient-to-r from-neon-green via-electric-blue to-neon-yellow">
              Algorythm AI
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  Builders <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {builderLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href}>
                      {link.icon}
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" asChild>
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/docs">Docs</Link>
            </Button>
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="hidden md:flex">
            {isUserLoading ? <Skeleton className="h-8 w-24" /> : user ? (
              <UserMenu />
            ) : (
              <AuthButtons />
            )}
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <HamburgerIcon className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>
                  <Link href="/" className="flex items-center gap-2">
                    <Logo className="h-6 w-6 text-primary" />
                    <span className="font-bold font-headline text-lg">
                      Algorythm AI
                    </span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-4 mt-8">
                {builderLinks.map((link) => (
                  <Button variant="ghost" asChild key={link.href} className="justify-start">
                    <Link href={link.href}>
                      {link.icon}
                      {link.label}
                    </Link>
                  </Button>
                ))}
                <Button variant="ghost" asChild className="justify-start">
                  <Link href="/docs">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Docs
                  </Link>
                </Button>
                <DropdownMenuSeparator />
                {mobileNavLinks.map((link) => (
                  <Button variant="ghost" asChild key={link.href} className="justify-start">
                    <Link href={link.href}>
                      <link.icon className="h-4 w-4 mr-2" />
                      {link.label}
                    </Link>
                  </Button>
                ))}
                <Dialog>
                   <DialogTrigger asChild>
                    <Button variant="ghost" className="justify-start">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Help
                    </Button>
                   </DialogTrigger>
                   <HelpAssistant />
                </Dialog>

              </div>
              <div className="mt-8">
                {isUserLoading ? <Skeleton className="h-10 w-full" /> : user ? (
                   <DropdownMenu>
                    <DropdownMenuTrigger className="w-full">
                      <Button variant="outline" className="w-full">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                          <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        My Account
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Button asChild className="w-full"><Link href="/login">Log In</Link></Button>
                    <Button asChild variant="secondary" className="w-full"><Link href="/signup">Sign Up</Link></Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
