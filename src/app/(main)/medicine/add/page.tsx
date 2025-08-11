import { AddMedicationForm } from '@/components/add-medication-form';

export default function AddMedicationPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Add New Medication</h1>
        <p className="text-muted-foreground">Fill in the details to set up a new reminder.</p>
      </header>
      <AddMedicationForm />
    </div>
  );
}
