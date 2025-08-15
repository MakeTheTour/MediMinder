
import { AdminProfileForm } from '@/components/admin-profile-form';

export default function AdminProfilePage() {
  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Admin Profile</h1>
        <p className="text-muted-foreground">Manage your administrator account details.</p>
      </header>
      <AdminProfileForm />
    </div>
  );
}
