import React, { Suspense } from 'react';
import CricketOverlayClient from './CricketOverlayClient';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 20, textAlign: 'center', color: '#fff', background: 'transparent' }}>Loading Cricket Overlay...</div>}>
      <CricketOverlayClient />
    </Suspense>
  );
}
