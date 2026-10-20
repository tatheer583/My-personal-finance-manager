import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui/Card';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg py-10">
      <Card>
        <EmptyState
          icon={<Compass className="size-5" />}
          title="Page not found"
          description="The page you were looking for does not exist or has moved."
          action={
            <Link
              to="/"
              className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
            >
              Back to dashboard
            </Link>
          }
        />
      </Card>
    </div>
  );
}
