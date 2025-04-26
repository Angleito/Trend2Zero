'use client';

import { useEffect, useState, ReactNode } from 'react';

// This component prevents hydration errors by only rendering children on the client
// Use this to wrap components that use browser-specific APIs
export default function ClientOnly({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return <>{children}</>;
}
