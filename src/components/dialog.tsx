'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { Button } from './button';

type DialogProps = {
  'aria-labelledby': string;
  title: string;
  children: ReactNode;
  pending: boolean;
  onDismiss: () => void;
};

export function Dialog({
  'aria-labelledby': titleId,
  title,
  children,
  pending,
  onDismiss,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
      else document.getElementById('create-post')?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onDismiss();
      }}
      className={clsx(
        'fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto',
        'rounded-container border-border bg-card text-foreground border p-0 shadow-xl',
        'backdrop:bg-foreground/40 backdrop:backdrop-blur-sm'
      )}
    >
      <header className="border-border flex items-center justify-between gap-4 border-b px-6 py-4">
        <h2 id={titleId} className="font-heading text-xl font-semibold tracking-tight">
          {title}
        </h2>
        <Button
          variant="ghost"
          className="w-12 shrink-0 p-0"
          aria-label="Close dialog"
          disabled={pending}
          onClick={onDismiss}
        >
          <X size={20} aria-hidden="true" />
        </Button>
      </header>
      {children}
    </dialog>
  );
}
