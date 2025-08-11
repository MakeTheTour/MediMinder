'use client';

import { Stethoscope, Clock, MapPin, Trash2, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Appointment } from '@/lib/types';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from './ui/button';


interface AppointmentCardProps {
  appointment: Appointment;
  onDelete?: (id: string) => void;
}

export function AppointmentCard({ appointment, onDelete }: AppointmentCardProps) {
  return (
    <Card className="w-full overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
              <Stethoscope className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">Dr. {appointment.doctorName}</h3>
              <p className="text-sm text-muted-foreground">{appointment.specialty}</p>
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
                <DropdownMenuItem onClick={() => onDelete(appointment.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{format(new Date(appointment.date), 'EEE, MMM d')} at {appointment.time}</span>
            </div>
            <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{appointment.location}</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
