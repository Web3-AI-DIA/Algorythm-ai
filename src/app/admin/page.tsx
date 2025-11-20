
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, collectionGroup, query, doc, updateDoc, increment } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, FileCode, Shield, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

function AddCreditsDialog({ userId, currentCredits }: { userId: string, currentCredits: number }) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleAddCredits = async () => {
        if (amount <= 0) {
            toast({
                title: 'Invalid Amount',
                description: 'Please enter a positive number of credits to add.',
                variant: 'destructive',
            });
            return;
        }

        setIsUpdating(true);
        const userDocRef = doc(firestore, 'users', userId);
        try {
            await updateDoc(userDocRef, {
                credits: increment(amount)
            });
            toast({
                title: 'Credits Added!',
                description: `${amount} credits have been successfully added to user ${userId}.`,
            });
            setOpen(false);
            setAmount(0);
        } catch (error) {
            console.error('Failed to add credits:', error);
            toast({
                title: 'Error',
                description: 'Could not update user credits. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Credits
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Credits</DialogTitle>
                    <DialogDescription>
                        Add credits to this user's account. The current balance is {currentCredits}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="credits-amount" className="text-right">
                            Amount
                        </Label>
                        <Input
                            id="credits-amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
                            className="col-span-3"
                            placeholder="e.g., 100"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleAddCredits} disabled={isUpdating}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm & Add Credits
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userDocRef = useMemoFirebase(() => (user && firestore ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
    const { data: currentUserData, isLoading: isUserDataLoading } = useDoc(userDocRef);

    useEffect(() => {
        if (isUserLoading || isUserDataLoading) return; // Wait for user data to load

        if (!user) {
            router.push('/login'); // Not logged in
        } else if (currentUserData && !currentUserData.isAdmin) {
            router.push('/dashboard'); // Not an admin
        }
    }, [user, currentUserData, isUserLoading, isUserDataLoading, router]);

    // Render loading state or nothing while checking
    if (isUserLoading || isUserDataLoading || !currentUserData || !currentUserData.isAdmin) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-electric-blue" />
            </div>
        );
    }

    return <>{children}</>;
}


export default function AdminPage() {
    const firestore = useFirestore();

    const usersQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'users')) : null), [firestore]);
    const { data: users, isLoading: areUsersLoading } = useCollection(usersQuery);

    const projectsQuery = useMemoFirebase(() => (firestore ? query(collectionGroup(firestore, 'projects')) : null), [firestore]);
    const { data: projects, isLoading: areProjectsLoading } = useCollection(projectsQuery);

    const totalUsers = users?.length || 0;
    const totalProjects = projects?.length || 0;
    const totalFreeAudits = users?.reduce((sum, user) => sum + (user.freeAudits || 0), 0) || 0;
    
    return (
        <AdminGuard>
            <div className="container mx-auto p-4 md:p-8">
                <div className="flex items-center gap-4 mb-8">
                    <Shield className="h-10 w-10 text-electric-blue" />
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline">
                        Admin Dashboard
                    </h1>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{areUsersLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalUsers}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                            <FileCode className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{areProjectsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalProjects}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Free Audits</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{areUsersLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalFreeAudits}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Users Table */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Users</CardTitle>
                        <CardDescription>This table provides a list of all registered users on the platform, including their administrative roles.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Display Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Credits</TableHead>
                                    <TableHead>Free Audits</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {areUsersLoading ? (
                                    <TableRow><TableCell colSpan={6} className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                                ) : (
                                    users?.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell>{user.displayName || 'N/A'}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.credits}</TableCell>
                                            <TableCell>{user.freeAudits}</TableCell>
                                            <TableCell>
                                                {user.isAdmin ? <Badge>Admin</Badge> : <Badge variant="outline">User</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <AddCreditsDialog userId={user.id} currentCredits={user.credits} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Projects Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Projects</CardTitle>
                        <CardDescription>This table shows a comprehensive list of all projects created by users across the platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Project Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Owner (User ID)</TableHead>
                                    <TableHead>Created At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {areProjectsLoading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                                ) : (
                                    projects?.map(project => (
                                        <TableRow key={project.id}>
                                            <TableCell>{project.name}</TableCell>
                                            <TableCell><Badge variant="secondary">{project.type}</Badge></TableCell>
                                            <TableCell className="font-mono text-xs">{project.userId}</TableCell>
                                            <TableCell>{format(new Date(project.creationDate), 'PPpp')}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminGuard>
    );
}

    
