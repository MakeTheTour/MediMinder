
'use client';

import { Pill, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Medication } from '@/lib/types';
import { format, parse } from 'date-fns';
import { MedicationCard } from './medication-card';

interface GroupedMedicationCardProps {
  time: string;
  medications: Medication[];
}

export function GroupedMedicationCard({ time, medications }: GroupedMedicationCardProps) {
  
  const formatTime = (time24h: string) => {
    try {
      return format(parse(time24h, 'HH:mm', new Date()), 'h:mm a');
    } catch {
      return time24h; // Fallback to original if parsing fails
    }
  }

  return (
    <Card className="w-full overflow-hidden border">
        <CardHeader className="p-4 pb-0">
            <div className="flex items-center gap-2 text-foreground font-semibold">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-lg">{formatTime(time)}</span>
            </div>
        </CardHeader>
      <CardContent className="p-4 space-y-3">
        {medications.map(med => (
            <MedicationCard key={med.id} medication={med} hideTime={true} />
        ))}
      </CardContent>
    </Card>
  );
}

    
