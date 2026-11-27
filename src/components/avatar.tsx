import { UserRound } from 'lucide-react';

export function Avatar() {
  return (
    <span
      aria-hidden="true"
      className="bg-muted text-primary ring-border flex size-12 shrink-0 items-center justify-center rounded-full ring-1"
    >
      <UserRound size={24} strokeWidth={1.6} />
    </span>
  );
}
