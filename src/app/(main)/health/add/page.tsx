
import { AddHealthMetricForm } from '@/components/add-health-metric-form';

export default function AddHealthMetricPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Log Health Metrics</h1>
        <p className="text-muted-foreground">Keep a record of your important health data.</p>
      </header>
      <AddHealthMetricForm />
    </div>
  );
}
