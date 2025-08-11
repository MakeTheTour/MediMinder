
'use client';

import { Pill, Clock, Trash2, MoreVertical, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Medication } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Button } from './ui/button';

interface MedicationCardProps {
  medication: Medication;
  onDelete?: (id: string) => void;
  onFamilyAlert?: (medication: Medication) => void;
  specificTime?: string;
}

export function MedicationCard({ medication, onDelete, onFamilyAlert, specificTime }: MedicationCardProps) {
  const displayTimes = specificTime ? [specificTime] : medication.times;

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
          {(onDelete || onFamilyAlert) && (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                   <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onFamilyAlert && (
                  <DropdownMenuItem onClick={() => onFamilyAlert(medication)}>
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      Alert Family
                  </DropdownMenuItem>
                )}
                {onDelete && onFamilyAlert && <DropdownMenuSeparator />}
                {onDelete && (
                    <DropdownMenuItem onClick={() => onDelete(medication.id)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                )}
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
