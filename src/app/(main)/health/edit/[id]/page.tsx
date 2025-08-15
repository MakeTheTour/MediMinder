
import { EditHealthMetricForm } from '@/components/edit-health-metric-form';

export default function EditHealthMetricPage({ params }: { params: { id: string }}) {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Edit Health Metrics</h1>
        <p className="text-muted-foreground">Update your recorded health data.</p>
      </header>
      <EditHealthMetricForm healthMetricId={params.id} />
    </div>
  );
}
