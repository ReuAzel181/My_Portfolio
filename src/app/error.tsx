'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-4xl font-bold mb-4">Something went wrong!</h1>
      <p className="mb-8">Please try again later or contact support if the problem persists.</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
      >
        Try again
      </button>
    </div>
  );
} 