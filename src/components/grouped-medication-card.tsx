
'use client';

import { Pill, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Medication } from '@/lib/types';
import { format, parse } from 'date-fns';
import { MedicationCard } from './medication-card';
import { cn } from '@/lib/utils';

interface GroupedMedicationCardProps {
  time: string;
  medications: Medication[];
  highlight?: boolean;
}

export function GroupedMedicationCard({ time, medications, highlight = false }: GroupedMedicationCardProps) {
  
  const formatTime = (time24h: string) => {
    try {
      return format(parse(time24h, 'HH:mm', new Date()), 'h:mm a');
    } catch {
      return time24h; // Fallback to original if parsing fails
    }
  }

  return (
    <Card className="w-full overflow-hidden border bg-transparent shadow-none border-none">
        <CardHeader className="p-0 pb-2">
            <div className="flex items-center gap-2 text-foreground font-semibold">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-lg">{formatTime(time)}</span>
            </div>
        </CardHeader>
      <CardContent className="p-0 pt-2 space-y-3">
        {medications.map(med => (
            <MedicationCard key={med.id} medication={med} hideTime={true} />
        ))}
      </CardContent>
    </Card>
  );
}
