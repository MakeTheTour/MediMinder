
import { EditAppointmentForm } from '@/components/edit-appointment-form';

export default function EditAppointmentPage({ params }: { params: { id: string }}) {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Edit Appointment</h1>
        <p className="text-muted-foreground">Update the details for your doctor visit.</p>
      </header>
      <EditAppointmentForm appointmentId={params.id} />
    </div>
  );
}
