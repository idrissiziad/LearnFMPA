'use client';

import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';

export default function LazyAnalytics() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onIdle = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 200));
    onIdle(() => {
      setShouldLoad(true);
    });
  }, []);

  if (!shouldLoad) return null;
  return <Analytics />;
}