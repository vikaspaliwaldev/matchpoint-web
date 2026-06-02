import React from 'react';
import { getTournamentBySlug } from '@/lib/supabase-service';
import { Metadata } from 'next';
import TournamentPublicView from './TournamentPublicView';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tournament = await getTournamentBySlug(slug);
  if (!tournament) {
    return { title: 'Tournament Not Found — MatchPoint' };
  }
  return {
    title: `${tournament.name} — MatchPoint`,
    description: tournament.description,
    openGraph: {
      title: tournament.name,
      description: tournament.description,
      type: 'website',
    },
  };
}

export default async function TournamentPage({ params }: Props) {
  const { slug } = await params;
  return <TournamentPublicView slug={slug} />;
}
