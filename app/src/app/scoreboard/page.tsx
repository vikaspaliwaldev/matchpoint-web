import React, { Suspense } from 'react';
import ScoreboardClient from './ScoreboardClient';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ background: '#020617', color: '#64748B', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Stadium Scoreboard...</div>}>
      <ScoreboardClient />
    </Suspense>
  );
}
