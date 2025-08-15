
'use client';

import { Stethoscope, Clock, MapPin, Trash2, MoreVertical, FileText, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Appointment } from '@/lib/types';
import { format, parse } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from './ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"


interface AppointmentCardProps {
  appointment: Appointment;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function AppointmentCard({ appointment, onDelete, onEdit }: AppointmentCardProps) {
  
  const formatTime = (time24h: string) => {
    try {
      return format(parse(time24h, 'HH:mm', new Date()), 'h:mm a');
    } catch {
      return time24h; // Fallback to original if parsing fails
    }
  }

  return (
     <Collapsible asChild>
        <Card className="w-full overflow-hidden transition-all hover:shadow-md bg-muted/20 border">
            <div className="flex items-start justify-between p-4">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
                    <Stethoscope className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                    <h3 className="font-bold text-lg text-foreground">Dr. {appointment.doctorName}</h3>
                    <p className="text-sm text-muted-foreground">{appointment.specialty}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-1">
                     {appointment.notes && (
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4 mr-1"/>
                                Notes
                            </Button>
                        </CollapsibleTrigger>
                     )}
                    {(onDelete || onEdit) && (
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">More options</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(appointment.id)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <DropdownMenuItem onClick={() => onDelete(appointment.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                 </div>
            </div>
            <CardContent className="px-4 pb-4 pt-0">
                 <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{format(new Date(`${appointment.date}T00:00:00`), 'EEE, dd/MM/yy')} at {formatTime(appointment.time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{appointment.location}</span>
                    </div>
                </div>
                 <CollapsibleContent className="mt-4">
                    <div className="p-3 rounded-md bg-background border">
                        <h4 className="font-semibold mb-2 text-foreground">Visit Notes</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{appointment.notes}</p>
                    </div>
                </CollapsibleContent>
            </CardContent>
        </Card>
     </Collapsible>
  );
}
