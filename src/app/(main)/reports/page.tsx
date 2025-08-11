'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const data = [
  { date: "Mon", taken: 4, missed: 1 },
  { date: "Tue", taken: 5, missed: 0 },
  { date: "Wed", taken: 5, missed: 0 },
  { date: "Thu", taken: 3, missed: 2 },
  { date: "Fri", taken: 5, missed: 0 },
  { date: "Sat", taken: 4, missed: 1 },
  { date: "Sun", taken: 5, missed: 0 },
];

export default function ReportsPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Your medication adherence at a glance.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Adherence</CardTitle>
          <CardDescription>Doses taken vs. missed this week.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`}/>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                }}
              />
              <Bar dataKey="taken" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="missed" fill="hsl(var(--destructive) / 0.5)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
