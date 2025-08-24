
'use client';

import { Pill, Clock, Trash2, MoreVertical, ShieldAlert, Pencil, CalendarDays, Utensils } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Medication } from '@/lib/types';
import { differenceInDays, formatDistanceToNowStrict, parse, format, isAfter } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

interface MedicationCardProps {
  medication: Medication;
  onDelete?: (id: string) => void;
  onFamilyAlert?: (medication: Medication) => void;
  onEdit?: (id: string) => void;
  specificTime?: string;
  hideTime?: boolean;
  status?: 'Upcoming' | 'Ongoing' | 'Missed';
}

export function MedicationCard({ medication, onDelete, onFamilyAlert, specificTime, onEdit, hideTime = false, status }: MedicationCardProps) {

  const formatTime = (time24h: string) => {
    try {
      return format(parse(time24h, 'HH:mm', new Date()), 'h:mm a');
    } catch {
      return time24h; // Fallback to original if parsing fails
    }
  }
  
  const isOngoing = () => {
    if (!specificTime) return false;
    const now = new Date();
    const scheduleTime = parse(specificTime, 'HH:mm', now);
    return isAfter(now, scheduleTime);
  };
  
  const getStatus = () => {
      if (status) return status;
      return isOngoing() ? "Ongoing" : "Upcoming";
  }
  
  const getStatusColor = () => {
      const currentStatus = getStatus();
      if(currentStatus === 'Missed') return 'destructive';
      if(currentStatus === 'Ongoing') return 'secondary';
      return 'default';
  }

  const displayTimes = specificTime ? [specificTime] : medication.times;
  const formattedTimes = displayTimes.map(formatTime).join(', ');


  const getDayInfo = () => {
    try {
        const startDate = new Date(medication.start_date);
        const endDate = new Date(medication.end_date);
        const today = new Date();
        
        if (today < startDate) {
            const daysUntilStart = formatDistanceToNowStrict(startDate, { unit: 'day', roundingMethod: 'ceil'});
            return `Starts in ${daysUntilStart}`;
        }
        
        const totalDays = differenceInDays(endDate, startDate) + 1;
        const runningDay = differenceInDays(today, startDate) + 1;

        if (runningDay > totalDays) return `Finished`;

        return `Day ${runningDay} of ${totalDays}`;
    } catch(e) {
        return 'Invalid date';
    }
  };

  const getFoodInfo = () => {
    switch (medication.food_relation) {
        case 'before':
            return `${medication.food_time_minutes || ''} min before food`;
        case 'after':
            return `${medication.food_time_minutes || ''} min after food`;
        case 'with':
            return 'With food';
        default:
            return 'No specific food relation';
    }
  };


  return (
    <Card className="w-full overflow-hidden transition-all hover:shadow-md border">
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
           <div className="flex items-center gap-2">
            <Badge variant={getStatusColor()}>{getStatus()}</Badge>
            {(onDelete || onFamilyAlert || onEdit) && (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                   <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(medication.id)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                )}
                {onFamilyAlert && (
                  <DropdownMenuItem onClick={() => onFamilyAlert(medication)}>
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      Alert Family
                  </DropdownMenuItem>
                )}
                {(onDelete && (onFamilyAlert || onEdit)) && <DropdownMenuSeparator />}
                {onDelete && (
                    <DropdownMenuItem onClick={() => onDelete(medication.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            )}
           </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-4 text-sm text-muted-foreground">
          {!hideTime && (
             <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{formattedTimes}</span>
             </div>
          )}
           <div className="flex items-center gap-2">
            <Utensils className="h-4 w-4 shrink-0" />
            <span>{getFoodInfo()}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>{getDayInfo()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
