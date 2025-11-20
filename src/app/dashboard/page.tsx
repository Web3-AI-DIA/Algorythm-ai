'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Files, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const projectsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/projects`), orderBy('lastModifiedDate', 'desc'));
  }, [user, firestore]);

  const { data: projects, isLoading: areProjectsLoading } = useCollection(projectsQuery);

  const renderProjectCard = (project: any) => (
    <Card key={project.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span className="truncate">{project.name}</span>
          <Badge variant="outline">{project.type}</Badge>
        </CardTitle>
        <CardDescription>
          Last modified: {formatDistanceToNow(new Date(project.lastModifiedDate), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="secondary" className="w-full">
          <Link href={`/dashboard/${project.id}`}>
            View Project
          </Link>
        </Button>
      </CardContent>
    </Card>
  );

  const renderEmptyState = () => (
    <div className="text-center py-20">
      <Files className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">No Projects Yet</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        It looks like you haven't created any projects. Get started by using one of our AI builders.
      </p>
      <div className="mt-6 flex justify-center gap-4">
        <Button asChild>
          <Link href="/builder/dapp">
            <PlusCircle className="mr-2 h-4 w-4" />
            New dApp
          </Link>
        </Button>
        <Button asChild>
          <Link href="/builder/nft">
            <PlusCircle className="mr-2 h-4 w-4" />
            New NFT Collection
          </Link>
        </Button>
         <Button asChild>
          <Link href="/builder/crypto">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Cryptocurrency
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline">
            Welcome to Your Dashboard
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
            View, manage, and continue working on all your AI-generated projects.
        </p>
      </div>


      {isUserLoading || areProjectsLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !user ? (
        <div className="text-center py-20">
            <h3 className="mt-4 text-lg font-semibold">Please Log In</h3>
            <p className="mt-2 text-sm text-muted-foreground">
                You need to be logged in to view your projects.
            </p>
            <Button asChild className="mt-6">
                <Link href="/login">Log In</Link>
            </Button>
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(renderProjectCard)}
        </div>
      ) : (
        renderEmptyState()
      )}
    </div>
  );
}
