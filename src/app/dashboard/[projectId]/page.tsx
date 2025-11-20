'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function ProjectViewPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const params = useParams();
  const projectId = params.projectId as string;
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);

  const projectDocRef = useMemoFirebase(
    () => (user && firestore && projectId ? doc(firestore, `users/${user.uid}/projects`, projectId) : null),
    [user, firestore, projectId]
  );

  const { data: project, isLoading } = useDoc(projectDocRef);

  const handleCopy = () => {
    if (project?.code) {
      navigator.clipboard.writeText(project.code);
      setHasCopied(true);
      toast({ title: 'Code copied to clipboard!' });
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center text-center">
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl font-headline">
          Project Not Found
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          We couldn't find the project you're looking for or you don't have permission to view it.
        </p>
        <Button asChild className="mt-10">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="mb-1 text-3xl font-headline">{project.name}</CardTitle>
              <CardDescription>
                Project Type: <Badge variant="secondary">{project.type}</Badge>
              </CardDescription>
            </div>
             <Button onClick={handleCopy} size="sm">
              {hasCopied ? 'Copied!' : 'Copy Code'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mt-4 rounded-md bg-secondary text-secondary-foreground">
             <pre className="p-4 text-sm font-code whitespace-pre-wrap overflow-x-auto">
                <code>{project.code}</code>
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
