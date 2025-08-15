
import { ChangePasswordForm } from '@/components/change-password-form';

export default function ChangePasswordPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Change Password</h1>
        <p className="text-muted-foreground">Update your password for better security.</p>
      </header>
      <ChangePasswordForm />
    </div>
  );
}
