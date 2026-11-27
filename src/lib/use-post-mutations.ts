'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function usePostMutations(
  page: number,
  itemCount: number,
  onSuccess: (message: string) => void
) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function run(method: 'POST' | 'PATCH' | 'DELETE', id?: string, content?: string) {
    setError('');
    startTransition(async () => {
      try {
        const response = await fetch(id ? `/api/posts/${id}` : '/api/posts', {
          method,
          headers: { 'content-type': 'application/json' },
          body: method === 'DELETE' ? undefined : JSON.stringify({ content }),
        });
        if (!response.ok) {
          const result = await response.json();
          setError(
            typeof result.error === 'string'
              ? result.error
              : 'Could not save your changes. Try again.'
          );
          return;
        }
        const targetPage =
          method === 'POST'
            ? 1
            : method === 'DELETE' && itemCount === 1
              ? Math.max(1, page - 1)
              : page;
        if (targetPage !== page)
          router.replace(targetPage === 1 ? '/' : `/?page=${targetPage}`, { scroll: false });
        else router.refresh();
        onSuccess(
          method === 'DELETE'
            ? 'Post deleted.'
            : method === 'POST'
              ? 'Your post is live.'
              : 'Changes saved.'
        );
      } catch (error) {
        console.error('Could not reach the post service:', error);
        setError('Could not reach the server. Check your connection and try again.');
      }
    });
  }

  return {
    pending,
    error,
    clearError: () => setError(''),
    save: (content: string, id?: string) => run(id ? 'PATCH' : 'POST', id, content),
    remove: (id: string) => run('DELETE', id),
  };
}
