
import { AddFamilyMemberForm } from '@/components/add-family-member-form';

export default function AddFamilyMemberPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Add Family Member</h1>
        <p className="text-muted-foreground">Add a new person to your family circle.</p>
      </header>
      <AddFamilyMemberForm />
    </div>
  );
}
