
import { AddParentForm } from '@/components/add-parent-form';

export default function AddParentPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Add Parent</h1>
        <p className="text-muted-foreground">Search for a parent by their email to send an invitation.</p>
      </header>
      <AddParentForm />
    </div>
  );
}
