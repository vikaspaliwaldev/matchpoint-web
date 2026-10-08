import React, { Suspense } from 'react';
import WatchMatchClient from './WatchMatchClient';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading watch player...</div>}>
      <WatchMatchClient />
    </Suspense>
  );
}
