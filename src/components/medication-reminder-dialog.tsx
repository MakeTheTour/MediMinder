
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
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
}

export function MedicationReminderDialog({
  isOpen,
  medication,
  time,
  onTake,
  onSkip,
}: MedicationReminderDialogProps) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Play a sound when the dialog opens
      const sound = new Audio('/notification.mp3'); // Assuming you have a sound file in /public
      sound.play().catch(e => console.error("Failed to play notification sound:", e));
      setAudio(sound);
    } else {
      // Stop the sound if the dialog is closed
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
    
    // Cleanup on component unmount
    return () => {
      if (audio) {
        audio.pause();
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
          <Button variant="outline" onClick={onSkip}>Skip</Button>
          <Button onClick={onTake}>I've Taken It</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
