
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
import { Pill, BellRing, Hourglass } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { format, parse } from 'date-fns';

interface MedicationReminderDialogProps {
  isOpen: boolean;
  medication: Medication;
  time: string;
  onTake: () => void;
  onSkip: () => void;
  onStockOut: () => void;
  onSnooze: () => void;
}

export function MedicationReminderDialog({
  isOpen,
  medication,
  time,
  onTake,
  onSkip,
  onStockOut,
  onSnooze,
}: MedicationReminderDialogProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Play a sound when the dialog opens
      audioRef.current = new Audio('/notification.mp3'); // Assuming you have a sound file in /public
      audioRef.current.loop = true;
      audioRef.current.play().catch(e => console.error("Failed to play notification sound:", e));
    } else if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
    }
    
    // Cleanup on component unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isOpen]);
  
  const handleAction = (action: () => void) => {
    if (audioRef.current) {
        audioRef.current.pause();
    }
    action();
  }

  const formatTime = (time24h: string) => {
    try {
      return format(parse(time24h, 'HH:mm', new Date()), 'h:mm a');
    } catch {
      return time24h; // Fallback to original if parsing fails
    }
  }

  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleAction(onSkip)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BellRing className="h-10 w-10 animate-pulse" />
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
                <p className="text-sm">Scheduled for {formatTime(time)}</p>
             </div>
        </div>
        <AlertDialogFooter className="grid grid-cols-2 gap-4">
          <Button variant="outline" onClick={() => handleAction(onSnooze)}>
            <Hourglass className="mr-2 h-4 w-4" />
            Snooze
          </Button>
          <Button onClick={() => handleAction(onTake)}>Complete</Button>
        </AlertDialogFooter>
         <Button variant="ghost" className="w-full" onClick={() => handleAction(onSkip)}>
            Skip Dose
        </Button>
         <Button variant="destructive" className="w-full" onClick={() => handleAction(onStockOut)}>
            Out of Stock
        </Button>
      </AlertDialogContent>
    </AlertDialog>
  );
}
