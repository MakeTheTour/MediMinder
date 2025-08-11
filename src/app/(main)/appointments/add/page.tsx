import { AddAppointmentForm } from '@/components/add-appointment-form';

export default function AddAppointmentPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Add New Appointment</h1>
        <p className="text-muted-foreground">Keep track of your doctor visits.</p>
      </header>
      <AddAppointmentForm />
    </div>
  );
}
