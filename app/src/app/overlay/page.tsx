import React, { Suspense } from 'react';
import OverlayClient from './OverlayClient';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading overlay...</div>}>
      <OverlayClient />
    </Suspense>
  );
}
