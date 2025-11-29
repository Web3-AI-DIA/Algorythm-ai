'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Rocket } from 'lucide-react';
import { ethers } from 'ethers';

interface DeployDialogProps {
  contractCode: string;
  abi: string;
  bytecode: string;
}

export function DeployDialog({ contractCode, abi, bytecode }: DeployDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const { toast } = useToast();

  const handleDeploy = async () => {
    if (!(window as any).ethereum) {
      toast({
        title: 'MetaMask not found',
        description: 'Please install MetaMask to deploy your contract.',
        variant: 'destructive',
      });
      return;
    }

    setIsDeploying(true);

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const factory = new ethers.ContractFactory(JSON.parse(abi), bytecode, signer);
      const contract = await factory.deploy();

      await contract.waitForDeployment();

      toast({
        title: 'Deployment Successful!',
        description: `Contract deployed to address: ${await contract.getAddress()}`,
      });
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: 'Deployment Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Rocket className="mr-2 h-4 w-4" /> Deploy
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deploy Your Smart Contract</DialogTitle>
          <DialogDescription>
            Select a network and provide your private key to deploy your contract.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <p className="text-sm text-muted-foreground">
                You will be prompted to connect your wallet and confirm the deployment transaction.
            </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeploy} disabled={isDeploying}>
            {isDeploying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Deploy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
