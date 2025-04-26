'use client';

import { useState, useEffect, ReactNode } from 'react';

// A more robust client wrapper that prevents hydration mismatches
// This wraps client-side components to ensure they only render on the client
// avoiding common React hydration errors in Next.js

export default function ClientWrapper({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial client render, return a placeholder
  // This avoids hydration mismatches between server and client
  if (!mounted) {
    return <div className="client-only-placeholder" aria-hidden="true" />;
  }

  return <>{children}</>;
}
