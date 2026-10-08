'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TournamentPublicView from './TournamentPublicView';

function TournamentPageContent() {
  const searchParams = useSearchParams();
  const slug = searchParams?.get('slug') || '';
  
  if (!slug) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        No tournament specified.
      </div>
    );
  }

  return <TournamentPublicView slug={slug} />;
}

export default function TournamentPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading tournament...</div>}>
      <TournamentPageContent />
    </Suspense>
  );
}
