
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
import { Pill, BellRing, PackageX, Check, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { format, parse } from 'date-fns';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { type ReminderSettings } from '@/app/(main)/settings/notifications/page';


interface MedicationReminderDialogProps {
  isOpen: boolean;
  medications: Medication[];
  time: string;
  onTake: () => void;
  onStockOut: () => void;
  onMiss: () => void;
  onClose: () => void;
}

export function MedicationReminderDialog({
  isOpen,
  medications,
  time,
  onTake,
  onStockOut,
  onMiss,
  onClose,
}: MedicationReminderDialogProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (!audioRef.current) {
        audioRef.current = new Audio('/notification.mp3');
      }
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    action();
  };

  const formatTime = (time24h: string) => {
    try {
      return format(parse(time24h, 'HH:mm', new Date()), 'h:mm a');
    } catch {
      return time24h;
    }
  }

  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            handleAction(onClose);
        }
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BellRing className="h-10 w-10 animate-pulse" />
          </div>
          <AlertDialogTitle className="text-center text-2xl">
            Time for your medication!
          </AlertDialogTitle>
           <AlertDialogDescription className="text-center text-lg">
            It's time for your <span className="font-bold text-primary">{formatTime(time)}</span> dose.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4 max-h-40 space-y-2 overflow-y-auto rounded-lg bg-muted/50 p-4">
            {medications.map(med => (
                <div key={med.id} className="flex items-center gap-4">
                    <Pill className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">{med.name}</p>
                        <p className="text-sm">{med.intake_qty} {med.dosage}</p>
                    </div>
                </div>
            ))}
        </div>
        <AlertDialogFooter className="grid grid-cols-2 gap-4">
          <Button variant="outline" onClick={() => handleAction(onStockOut)}>
            <PackageX className="mr-2 h-4 w-4" />
            Stock Out
          </Button>
          <Button onClick={() => handleAction(onTake)}>
            <Check className="mr-2 h-4 w-4" />
            Taken
          </Button>
           <Button variant="destructive" className="col-span-2" onClick={() => handleAction(onMiss)}>
            <X className="mr-2 h-4 w-4" />
            Missed
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
