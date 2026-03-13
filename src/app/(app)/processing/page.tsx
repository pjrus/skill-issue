"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProcessingPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/matches');
    }, 3000); // Simulate processing time

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
        <h2 className="text-xl font-semibold mt-4 text-center">Finding the best learning partners for you...</h2>
        <p className="text-muted-foreground mt-2">Please wait a moment.</p>
    </div>
  );
}
