
'use client';

import { Pill, Clock, Trash2, MoreVertical, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Medication, FamilyMember } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateFamilyAlert } from '@/ai/flows/family-alert-flow';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MedicationCardProps {
  medication: Medication;
  onDelete?: (id: string) => void;
  specificTime?: string;
}

export function MedicationCard({ medication, onDelete, specificTime }: MedicationCardProps) {
  const displayTimes = specificTime ? [specificTime] : medication.times;
  const { user, isGuest } = useAuth();
  const { toast } = useToast();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  useEffect(() => {
    if (!user || isGuest) return;
    const unsub = onSnapshot(collection(db, 'users', user.uid, 'familyMembers'), (snapshot) => {
        setFamilyMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FamilyMember)));
    });
    return () => unsub();
  }, [user, isGuest]);


  const handleFamilyAlert = async () => {
    if (isGuest || !user) {
        toast({ title: 'Sign In Required', description: 'Please sign in to alert family members.', variant: 'destructive'});
        return;
    }
    const acceptedFamilyMember = familyMembers.find(m => m.status === 'accepted');
    if (!acceptedFamilyMember) {
        toast({ title: 'No Linked Family Member', description: 'Please add and link a family member in the Family tab first.', variant: 'destructive'});
        return;
    }
    
    try {
        toast({ title: 'Sending Alert...', description: `Notifying ${acceptedFamilyMember.name}.` });
        const result = await generateFamilyAlert({
            patientName: user.displayName || 'A family member',
            medicationName: medication.name,
            familyName: acceptedFamilyMember.name,
        });
        // Here you would typically send the alert via SMS/email
        console.log("Family Alert Message:", result.alertMessage);
        toast({ title: 'Alert Sent!', description: `${acceptedFamilyMember.name} has been notified.` });
    } catch (error) {
        toast({ title: 'Error', description: 'Could not send alert. Please try again.', variant: 'destructive'});
    }

  }

  return (
    <Card className="w-full overflow-hidden transition-all hover:shadow-md bg-muted/20 border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Pill className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">{medication.name}</h3>
              <p className="text-sm text-muted-foreground">{medication.intake_qty} {medication.dosage}</p>
            </div>
          </div>
          {onDelete && (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                   <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleFamilyAlert}>
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Alert Family
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(medication.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{displayTimes.join(', ')}</span>
        </div>
      </CardContent>
    </Card>
  );
}
