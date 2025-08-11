import { ProfileForm } from '@/components/profile-form';

export default function ProfilePage() {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information.</p>
      </header>
      <ProfileForm />
    </div>
  );
}
