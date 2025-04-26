'use client';

import React, { useState, useEffect } from 'react';

// This component serves as a client-side providers wrapper to handle hydration issues
// It ensures client components only render after hydration is complete

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Only show the UI after first client-side render
  useEffect(() => {
    // Ensure this runs only in the browser
    if (typeof window !== 'undefined') {
      setMounted(true);
    }
  }, []);

  // Render children only if mounted on the client
  if (!mounted) {
    // Return null instead of a placeholder to avoid hydration issues
    return null;
  }

  return <>{children}</>;
}
