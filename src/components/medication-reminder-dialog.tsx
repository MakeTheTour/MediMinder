
'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Medication } from '@/lib/types';
import { Pill, BellRing } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MedicationReminderDialogProps {
  isOpen: boolean;
  medication: Medication;
  time: string;
  onTake: () => void;
  onSkip: () => void;
  onStockOut: () => void;
}

export function MedicationReminderDialog({
  isOpen,
  medication,
  time,
  onTake,
  onSkip,
  onStockOut,
}: MedicationReminderDialogProps) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    let sound: HTMLAudioElement | null = null;
    if (isOpen) {
      // Play a sound when the dialog opens
      sound = new Audio('/notification.mp3'); // Assuming you have a sound file in /public
      sound.play().catch(e => console.error("Failed to play notification sound:", e));
      setAudio(sound);
    }
    
    // Cleanup on component unmount or when dialog closes
    return () => {
      if (sound) {
        sound.pause();
        sound.currentTime = 0;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onSkip()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BellRing className="h-10 w-10" />
          </div>
          <AlertDialogTitle className="text-center text-2xl">
            Time for your medication!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-lg">
            It's time to take your dose of{' '}
            <span className="font-bold text-primary">{medication.name}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4 flex justify-center items-center gap-4 p-4 rounded-lg bg-muted/50">
             <Pill className="h-6 w-6 text-muted-foreground" />
             <div>
                <p className="font-semibold">{medication.intake_qty} {medication.dosage}</p>
                <p className="text-sm">Scheduled for {time}</p>
             </div>
        </div>
        <AlertDialogFooter className="grid grid-cols-2 gap-4">
          <Button variant="outline" onClick={onSkip}>Mute</Button>
          <Button onClick={onTake}>Complete</Button>
        </AlertDialogFooter>
         <Button variant="destructive" className="w-full" onClick={onStockOut}>
            Out of Stock
        </Button>
      </AlertDialogContent>
    </AlertDialog>
  );
}
