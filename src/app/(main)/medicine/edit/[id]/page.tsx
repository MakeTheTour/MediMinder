
'use client';
import { EditMedicationForm } from '@/components/edit-medication-form';

export default function EditMedicationPage({ params }: { params: { id: string }}) {
  const { id } = params;
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Edit Medication</h1>
        <p className="text-muted-foreground">Update the details for your reminder.</p>
      </header>
      <EditMedicationForm medicationId={id} />
    </div>
  );
}
