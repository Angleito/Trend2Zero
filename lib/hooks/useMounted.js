'use client';
import { useState, useEffect } from 'react';
export function useMounted(options) {
    const [mounted, setMounted] = useState(() => {
        // Server-side initial state can be configured
        return options?.serverInitialState ?? false;
    });
    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
        }, options?.delayMs ?? 0);
        return () => clearTimeout(timer);
    }, [options?.delayMs]);
    return mounted;
}
