
import { AddParentForm } from '@/components/add-parent-form';

export default function AddParentPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Add Parent</h1>
        <p className="text-muted-foreground">Send an invitation to a parent by entering their email address and your relationship to them.</p>
      </header>
      <AddParentForm />
    </div>
  );
}
