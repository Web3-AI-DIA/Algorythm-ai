'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { updateProfile } from 'firebase/auth';

const profileFormSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters.').optional(),
});

function ProfileSettings() {
    const { user } = useUser();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            displayName: user?.displayName || '',
        },
    });

    async function onSubmit(values: z.infer<typeof profileFormSchema>) {
        if (!user) return;
        
        try {
            await updateProfile(user, { displayName: values.displayName });
            toast({
                title: 'Profile Updated',
                description: 'Your display name has been successfully updated.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update profile. Please try again.',
                variant: 'destructive',
            });
        }
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Manage your public profile information.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                         <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Display Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <Input value={user.email || 'No email associated'} disabled />
                        </FormItem>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function BillingSettings() {
    return (
         <Card>
            <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>Manage your subscription plan and view payment history. This feature is coming soon!</CardDescription>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground p-8">
                <p>Subscription management is under development.</p>
            </CardContent>
        </Card>
    )
}

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-16 sm:py-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline mb-12">
          Settings
        </h1>
        
        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="mt-6">
                <ProfileSettings />
            </TabsContent>
            <TabsContent value="billing" className="mt-6">
                <BillingSettings />
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
