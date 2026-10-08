/**
 * Map team names to their cropped logos and official team brand colors
 */
export const TEAM_LOGOS: Record<string, { logo: string; color: string; slogan?: string }> = {
  // 7PD VPL Season 2 (Men's Volleyball)
  'Smashers': {
    logo: '/tournaments/7pd-vpl/smashers_logo.jpg',
    color: '#DC2626',
    slogan: 'Smash Limits',
  },
  'Spikers': {
    logo: '/tournaments/7pd-vpl/spikers_logo.jpg',
    color: '#2563EB',
    slogan: 'Spike to Win',
  },
  'Servers': {
    logo: '/tournaments/7pd-vpl/servers_logo.jpg',
    color: '#059669',
    slogan: 'Serve with Pride',
  },
  'Netbreakers': {
    logo: '/tournaments/7pd-vpl/netbreakers_logo.jpg',
    color: '#7C3AED',
    slogan: 'Break Barriers',
  },
  'Gamechangers': {
    logo: '/tournaments/7pd-vpl/gamechangers_logo.jpg',
    color: '#EA580C',
    slogan: 'Change the Game',
  },
  'Blockbusters': {
    logo: '/tournaments/7pd-vpl/blockbusters_logo.jpg',
    color: '#0284C7',
    slogan: 'Defend to Dominate',
  },

  // WVPL 2026 (Women's Volleyball Premier League)
  'Legends': {
    logo: '/tournaments/wvpl/legends.jpg',
    color: '#831843',
  },
  'Strikers': {
    logo: '/tournaments/wvpl/strikers.jpg',
    color: '#0284C7',
  },
  'Blazers': {
    logo: '/tournaments/wvpl/blazers.jpg',
    color: '#EA580C',
  },
  'Aces': {
    logo: '/tournaments/wvpl/aces.jpg',
    color: '#0D9488',
  },
};

export const DYNAMIC_TEAM_LOGOS: Record<string, string> = {};

export function registerTeamLogo(teamName: string, logoUrl: string) {
  if (teamName && logoUrl) {
    DYNAMIC_TEAM_LOGOS[teamName.trim().toLowerCase()] = logoUrl;
  }
}

export function getTeamLogo(teamName?: string): string | null {
  if (!teamName) return null;
  const trimmed = teamName.trim().toLowerCase();
  if (DYNAMIC_TEAM_LOGOS[trimmed]) {
    return DYNAMIC_TEAM_LOGOS[trimmed];
  }
  const dynMatch = Object.keys(DYNAMIC_TEAM_LOGOS).find(
    name => trimmed === name || trimmed.includes(name) || name.includes(trimmed)
  );
  if (dynMatch) {
    return DYNAMIC_TEAM_LOGOS[dynMatch];
  }

  const match = Object.keys(TEAM_LOGOS).find(
    name => name.toLowerCase() === trimmed || trimmed.includes(name.toLowerCase())
  );
  return match ? TEAM_LOGOS[match].logo : null;
}

export function getTeamColor(teamName?: string, defaultColor = '#3B82F6'): string {
  if (!teamName) return defaultColor;
  const match = Object.keys(TEAM_LOGOS).find(
    name => name.toLowerCase() === teamName.trim().toLowerCase() || teamName.toLowerCase().includes(name.toLowerCase())
  );
  return match ? TEAM_LOGOS[match].color : defaultColor;
}
