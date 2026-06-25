import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function StatCard({ label, value, tone }: { label: string; value: string; tone?: 'danger' | 'success' }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={tone === 'danger' ? 'text-2xl font-bold text-destructive' : tone === 'success' ? 'text-2xl font-bold text-primary' : 'text-2xl font-bold'}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
