export interface MasterEvent {
  category: string; // 'Junior', 'Senior', 'Veteran', 'Corporate', 'School', 'College', 'Team', 'Skill-Based', 'Parent-Child', 'Family', 'Fun'
  displayName: string;
  eventType: 'SINGLES' | 'DOUBLES' | 'MIXED_DOUBLES' | 'TEAM';
  gender: 'BOYS' | 'GIRLS' | 'MALE' | 'FEMALE' | 'MIXED' | 'OPEN';
  ageCategory: string;
  minAge?: number;
  maxAge?: number;
}

export const masterEvents: MasterEvent[] = [
  // ============================================================
  // 1) Junior Age Categories
  // ============================================================
  // Under 7
  { category: 'Junior', displayName: 'BS U7', eventType: 'SINGLES', gender: 'BOYS', ageCategory: 'U7', minAge: 0, maxAge: 7 },
  { category: 'Junior', displayName: 'GS U7', eventType: 'SINGLES', gender: 'GIRLS', ageCategory: 'U7', minAge: 0, maxAge: 7 },
  { category: 'Junior', displayName: 'BD U7', eventType: 'DOUBLES', gender: 'BOYS', ageCategory: 'U7', minAge: 0, maxAge: 7 },
  { category: 'Junior', displayName: 'GD U7', eventType: 'DOUBLES', gender: 'GIRLS', ageCategory: 'U7', minAge: 0, maxAge: 7 },
  { category: 'Junior', displayName: 'XD U7', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: 'U7', minAge: 0, maxAge: 7 },

  // Under 9
  { category: 'Junior', displayName: 'BS U9', eventType: 'SINGLES', gender: 'BOYS', ageCategory: 'U9', minAge: 0, maxAge: 9 },
  { category: 'Junior', displayName: 'GS U9', eventType: 'SINGLES', gender: 'GIRLS', ageCategory: 'U9', minAge: 0, maxAge: 9 },
  { category: 'Junior', displayName: 'BD U9', eventType: 'DOUBLES', gender: 'BOYS', ageCategory: 'U9', minAge: 0, maxAge: 9 },
  { category: 'Junior', displayName: 'GD U9', eventType: 'DOUBLES', gender: 'GIRLS', ageCategory: 'U9', minAge: 0, maxAge: 9 },
  { category: 'Junior', displayName: 'XD U9', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: 'U9', minAge: 0, maxAge: 9 },

  // Under 11
  { category: 'Junior', displayName: 'BS U11', eventType: 'SINGLES', gender: 'BOYS', ageCategory: 'U11', minAge: 0, maxAge: 11 },
  { category: 'Junior', displayName: 'GS U11', eventType: 'SINGLES', gender: 'GIRLS', ageCategory: 'U11', minAge: 0, maxAge: 11 },
  { category: 'Junior', displayName: 'BD U11', eventType: 'DOUBLES', gender: 'BOYS', ageCategory: 'U11', minAge: 0, maxAge: 11 },
  { category: 'Junior', displayName: 'GD U11', eventType: 'DOUBLES', gender: 'GIRLS', ageCategory: 'U11', minAge: 0, maxAge: 11 },
  { category: 'Junior', displayName: 'XD U11', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: 'U11', minAge: 0, maxAge: 11 },

  // Under 13
  { category: 'Junior', displayName: 'BS U13', eventType: 'SINGLES', gender: 'BOYS', ageCategory: 'U13', minAge: 0, maxAge: 13 },
  { category: 'Junior', displayName: 'GS U13', eventType: 'SINGLES', gender: 'GIRLS', ageCategory: 'U13', minAge: 0, maxAge: 13 },
  { category: 'Junior', displayName: 'BD U13', eventType: 'DOUBLES', gender: 'BOYS', ageCategory: 'U13', minAge: 0, maxAge: 13 },
  { category: 'Junior', displayName: 'GD U13', eventType: 'DOUBLES', gender: 'GIRLS', ageCategory: 'U13', minAge: 0, maxAge: 13 },
  { category: 'Junior', displayName: 'XD U13', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: 'U13', minAge: 0, maxAge: 13 },

  // Under 15
  { category: 'Junior', displayName: 'BS U15', eventType: 'SINGLES', gender: 'BOYS', ageCategory: 'U15', minAge: 0, maxAge: 15 },
  { category: 'Junior', displayName: 'GS U15', eventType: 'SINGLES', gender: 'GIRLS', ageCategory: 'U15', minAge: 0, maxAge: 15 },
  { category: 'Junior', displayName: 'BD U15', eventType: 'DOUBLES', gender: 'BOYS', ageCategory: 'U15', minAge: 0, maxAge: 15 },
  { category: 'Junior', displayName: 'GD U15', eventType: 'DOUBLES', gender: 'GIRLS', ageCategory: 'U15', minAge: 0, maxAge: 15 },
  { category: 'Junior', displayName: 'XD U15', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: 'U15', minAge: 0, maxAge: 15 },

  // Under 17
  { category: 'Junior', displayName: 'BS U17', eventType: 'SINGLES', gender: 'BOYS', ageCategory: 'U17', minAge: 0, maxAge: 17 },
  { category: 'Junior', displayName: 'GS U17', eventType: 'SINGLES', gender: 'GIRLS', ageCategory: 'U17', minAge: 0, maxAge: 17 },
  { category: 'Junior', displayName: 'BD U17', eventType: 'DOUBLES', gender: 'BOYS', ageCategory: 'U17', minAge: 0, maxAge: 17 },
  { category: 'Junior', displayName: 'GD U17', eventType: 'DOUBLES', gender: 'GIRLS', ageCategory: 'U17', minAge: 0, maxAge: 17 },
  { category: 'Junior', displayName: 'XD U17', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: 'U17', minAge: 0, maxAge: 17 },

  // Under 19
  { category: 'Junior', displayName: 'BS U19', eventType: 'SINGLES', gender: 'BOYS', ageCategory: 'U19', minAge: 0, maxAge: 19 },
  { category: 'Junior', displayName: 'GS U19', eventType: 'SINGLES', gender: 'GIRLS', ageCategory: 'U19', minAge: 0, maxAge: 19 },
  { category: 'Junior', displayName: 'BD U19', eventType: 'DOUBLES', gender: 'BOYS', ageCategory: 'U19', minAge: 0, maxAge: 19 },
  { category: 'Junior', displayName: 'GD U19', eventType: 'DOUBLES', gender: 'GIRLS', ageCategory: 'U19', minAge: 0, maxAge: 19 },
  { category: 'Junior', displayName: 'XD U19', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: 'U19', minAge: 0, maxAge: 19 },

  // ============================================================
  // 2) Senior Categories
  // ============================================================
  { category: 'Senior', displayName: 'MS Open', eventType: 'SINGLES', gender: 'MALE', ageCategory: 'OPEN' },
  { category: 'Senior', displayName: 'WS Open', eventType: 'SINGLES', gender: 'FEMALE', ageCategory: 'OPEN' },
  { category: 'Senior', displayName: 'MD Open', eventType: 'DOUBLES', gender: 'MALE', ageCategory: 'OPEN' },
  { category: 'Senior', displayName: 'WD Open', eventType: 'DOUBLES', gender: 'FEMALE', ageCategory: 'OPEN' },
  { category: 'Senior', displayName: 'MXD Open', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: 'OPEN' },

  // ============================================================
  // 3) Veteran / Masters Categories
  // ============================================================
  // 35+
  { category: 'Veteran', displayName: 'MS 35+', eventType: 'SINGLES', gender: 'MALE', ageCategory: '35+', minAge: 35 },
  { category: 'Veteran', displayName: 'WS 35+', eventType: 'SINGLES', gender: 'FEMALE', ageCategory: '35+', minAge: 35 },
  { category: 'Veteran', displayName: 'MD 35+', eventType: 'DOUBLES', gender: 'MALE', ageCategory: '35+', minAge: 35 },
  { category: 'Veteran', displayName: 'WD 35+', eventType: 'DOUBLES', gender: 'FEMALE', ageCategory: '35+', minAge: 35 },
  { category: 'Veteran', displayName: 'MXD 35+', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: '35+', minAge: 35 },

  // 40+
  { category: 'Veteran', displayName: 'MS 40+', eventType: 'SINGLES', gender: 'MALE', ageCategory: '40+', minAge: 40 },
  { category: 'Veteran', displayName: 'WS 40+', eventType: 'SINGLES', gender: 'FEMALE', ageCategory: '40+', minAge: 40 },
  { category: 'Veteran', displayName: 'MD 40+', eventType: 'DOUBLES', gender: 'MALE', ageCategory: '40+', minAge: 40 },
  { category: 'Veteran', displayName: 'WD 40+', eventType: 'DOUBLES', gender: 'FEMALE', ageCategory: '40+', minAge: 40 },
  { category: 'Veteran', displayName: 'MXD 40+', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: '40+', minAge: 40 },

  // 45+
  { category: 'Veteran', displayName: 'MS 45+', eventType: 'SINGLES', gender: 'MALE', ageCategory: '45+', minAge: 45 },
  { category: 'Veteran', displayName: 'WS 45+', eventType: 'SINGLES', gender: 'FEMALE', ageCategory: '45+', minAge: 45 },
  { category: 'Veteran', displayName: 'MD 45+', eventType: 'DOUBLES', gender: 'MALE', ageCategory: '45+', minAge: 45 },
  { category: 'Veteran', displayName: 'WD 45+', eventType: 'DOUBLES', gender: 'FEMALE', ageCategory: '45+', minAge: 45 },
  { category: 'Veteran', displayName: 'MXD 45+', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: '45+', minAge: 45 },

  // 50+
  { category: 'Veteran', displayName: 'MS 50+', eventType: 'SINGLES', gender: 'MALE', ageCategory: '50+', minAge: 50 },
  { category: 'Veteran', displayName: 'WS 50+', eventType: 'SINGLES', gender: 'FEMALE', ageCategory: '50+', minAge: 50 },
  { category: 'Veteran', displayName: 'MD 50+', eventType: 'DOUBLES', gender: 'MALE', ageCategory: '50+', minAge: 50 },
  { category: 'Veteran', displayName: 'WD 50+', eventType: 'DOUBLES', gender: 'FEMALE', ageCategory: '50+', minAge: 50 },
  { category: 'Veteran', displayName: 'MXD 50+', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: '50+', minAge: 50 },

  // 55+
  { category: 'Veteran', displayName: 'MS 55+', eventType: 'SINGLES', gender: 'MALE', ageCategory: '55+', minAge: 55 },
  { category: 'Veteran', displayName: 'WS 55+', eventType: 'SINGLES', gender: 'FEMALE', ageCategory: '55+', minAge: 55 },
  { category: 'Veteran', displayName: 'MD 55+', eventType: 'DOUBLES', gender: 'MALE', ageCategory: '55+', minAge: 55 },
  { category: 'Veteran', displayName: 'WD 55+', eventType: 'DOUBLES', gender: 'FEMALE', ageCategory: '55+', minAge: 55 },
  { category: 'Veteran', displayName: 'MXD 55+', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: '55+', minAge: 55 },

  // 60+
  { category: 'Veteran', displayName: 'MS 60+', eventType: 'SINGLES', gender: 'MALE', ageCategory: '60+', minAge: 60 },
  { category: 'Veteran', displayName: 'WS 60+', eventType: 'SINGLES', gender: 'FEMALE', ageCategory: '60+', minAge: 60 },
  { category: 'Veteran', displayName: 'MD 60+', eventType: 'DOUBLES', gender: 'MALE', ageCategory: '60+', minAge: 60 },
  { category: 'Veteran', displayName: 'WD 60+', eventType: 'DOUBLES', gender: 'FEMALE', ageCategory: '60+', minAge: 60 },
  { category: 'Veteran', displayName: 'MXD 60+', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: '60+', minAge: 60 },

  // 65+
  { category: 'Veteran', displayName: 'MS 65+', eventType: 'SINGLES', gender: 'MALE', ageCategory: '65+', minAge: 65 },
  { category: 'Veteran', displayName: 'WS 65+', eventType: 'SINGLES', gender: 'FEMALE', ageCategory: '65+', minAge: 65 },
  { category: 'Veteran', displayName: 'MD 65+', eventType: 'DOUBLES', gender: 'MALE', ageCategory: '65+', minAge: 65 },
  { category: 'Veteran', displayName: 'WD 65+', eventType: 'DOUBLES', gender: 'FEMALE', ageCategory: '65+', minAge: 65 },
  { category: 'Veteran', displayName: 'MXD 65+', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: '65+', minAge: 65 },

  // 70+
  { category: 'Veteran', displayName: 'MS 70+', eventType: 'SINGLES', gender: 'MALE', ageCategory: '70+', minAge: 70 },
  { category: 'Veteran', displayName: 'WS 70+', eventType: 'SINGLES', gender: 'FEMALE', ageCategory: '70+', minAge: 70 },
  { category: 'Veteran', displayName: 'MD 70+', eventType: 'DOUBLES', gender: 'MALE', ageCategory: '70+', minAge: 70 },
  { category: 'Veteran', displayName: 'WD 70+', eventType: 'DOUBLES', gender: 'FEMALE', ageCategory: '70+', minAge: 70 },
  { category: 'Veteran', displayName: 'MXD 70+', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: '70+', minAge: 70 },

  // 75+
  { category: 'Veteran', displayName: 'MS 75+', eventType: 'SINGLES', gender: 'MALE', ageCategory: '75+', minAge: 75 },
  { category: 'Veteran', displayName: 'WS 75+', eventType: 'SINGLES', gender: 'FEMALE', ageCategory: '75+', minAge: 75 },
  { category: 'Veteran', displayName: 'MD 75+', eventType: 'DOUBLES', gender: 'MALE', ageCategory: '75+', minAge: 75 },
  { category: 'Veteran', displayName: 'WD 75+', eventType: 'DOUBLES', gender: 'FEMALE', ageCategory: '75+', minAge: 75 },
  { category: 'Veteran', displayName: 'MXD 75+', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: '75+', minAge: 75 },

  // ============================================================
  // 4) Corporate Categories
  // ============================================================
  { category: 'Corporate', displayName: 'MS Corporate', eventType: 'SINGLES', gender: 'MALE', ageCategory: 'OPEN' },
  { category: 'Corporate', displayName: 'WS Corporate', eventType: 'SINGLES', gender: 'FEMALE', ageCategory: 'OPEN' },
  { category: 'Corporate', displayName: 'MD Corporate', eventType: 'DOUBLES', gender: 'MALE', ageCategory: 'OPEN' },
  { category: 'Corporate', displayName: 'WD Corporate', eventType: 'DOUBLES', gender: 'FEMALE', ageCategory: 'OPEN' },
  { category: 'Corporate', displayName: 'MXD Corporate', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: 'OPEN' },

  // ============================================================
  // 5) School Categories
  // ============================================================
  { category: 'School', displayName: 'BS Primary', eventType: 'SINGLES', gender: 'BOYS', ageCategory: 'PRIMARY', maxAge: 11 },
  { category: 'School', displayName: 'GS Primary', eventType: 'SINGLES', gender: 'GIRLS', ageCategory: 'PRIMARY', maxAge: 11 },
  { category: 'School', displayName: 'BS Middle School', eventType: 'SINGLES', gender: 'BOYS', ageCategory: 'MIDDLE', maxAge: 14 },
  { category: 'School', displayName: 'GS Middle School', eventType: 'SINGLES', gender: 'GIRLS', ageCategory: 'MIDDLE', maxAge: 14 },
  { category: 'School', displayName: 'BS High School', eventType: 'SINGLES', gender: 'BOYS', ageCategory: 'HIGH', maxAge: 18 },
  { category: 'School', displayName: 'GS High School', eventType: 'SINGLES', gender: 'GIRLS', ageCategory: 'HIGH', maxAge: 18 },

  // ============================================================
  // 6) College Categories
  // ============================================================
  { category: 'College', displayName: 'Men\'s Singles College', eventType: 'SINGLES', gender: 'MALE', ageCategory: 'COLLEGE' },
  { category: 'College', displayName: 'Women\'s Singles College', eventType: 'SINGLES', gender: 'FEMALE', ageCategory: 'COLLEGE' },
  { category: 'College', displayName: 'Men\'s Doubles College', eventType: 'DOUBLES', gender: 'MALE', ageCategory: 'COLLEGE' },
  { category: 'College', displayName: 'Women\'s Doubles College', eventType: 'DOUBLES', gender: 'FEMALE', ageCategory: 'COLLEGE' },
  { category: 'College', displayName: 'Mixed Doubles College', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: 'COLLEGE' },

  // ============================================================
  // 7) Team Events
  // ============================================================
  { category: 'Team', displayName: 'Men\'s Team', eventType: 'TEAM', gender: 'MALE', ageCategory: 'OPEN' },
  { category: 'Team', displayName: 'Women\'s Team', eventType: 'TEAM', gender: 'FEMALE', ageCategory: 'OPEN' },
  { category: 'Team', displayName: 'Mixed Team', eventType: 'TEAM', gender: 'MIXED', ageCategory: 'OPEN' },
  { category: 'Team', displayName: 'Inter School Team', eventType: 'TEAM', gender: 'OPEN', ageCategory: 'OPEN' },
  { category: 'Team', displayName: 'Inter College Team', eventType: 'TEAM', gender: 'OPEN', ageCategory: 'OPEN' },
  { category: 'Team', displayName: 'Corporate Team', eventType: 'TEAM', gender: 'OPEN', ageCategory: 'OPEN' },
  { category: 'Team', displayName: 'Club Team', eventType: 'TEAM', gender: 'OPEN', ageCategory: 'OPEN' },

  // ============================================================
  // 8) Skill-Based Categories
  // ============================================================
  // Beginner
  { category: 'Skill-Based', displayName: 'MS Beginner', eventType: 'SINGLES', gender: 'MALE', ageCategory: 'OPEN' },
  { category: 'Skill-Based', displayName: 'WS Beginner', eventType: 'SINGLES', gender: 'FEMALE', ageCategory: 'OPEN' },
  { category: 'Skill-Based', displayName: 'MD Beginner', eventType: 'DOUBLES', gender: 'MALE', ageCategory: 'OPEN' },
  { category: 'Skill-Based', displayName: 'WD Beginner', eventType: 'DOUBLES', gender: 'FEMALE', ageCategory: 'OPEN' },
  { category: 'Skill-Based', displayName: 'MXD Beginner', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: 'OPEN' },

  // Intermediate
  { category: 'Skill-Based', displayName: 'MS Intermediate', eventType: 'SINGLES', gender: 'MALE', ageCategory: 'OPEN' },
  { category: 'Skill-Based', displayName: 'WS Intermediate', eventType: 'SINGLES', gender: 'FEMALE', ageCategory: 'OPEN' },
  { category: 'Skill-Based', displayName: 'MD Intermediate', eventType: 'DOUBLES', gender: 'MALE', ageCategory: 'OPEN' },
  { category: 'Skill-Based', displayName: 'WD Intermediate', eventType: 'DOUBLES', gender: 'FEMALE', ageCategory: 'OPEN' },
  { category: 'Skill-Based', displayName: 'MXD Intermediate', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: 'OPEN' },

  // Advanced
  { category: 'Skill-Based', displayName: 'MS Advanced', eventType: 'SINGLES', gender: 'MALE', ageCategory: 'OPEN' },
  { category: 'Skill-Based', displayName: 'WS Advanced', eventType: 'SINGLES', gender: 'FEMALE', ageCategory: 'OPEN' },
  { category: 'Skill-Based', displayName: 'MD Advanced', eventType: 'DOUBLES', gender: 'MALE', ageCategory: 'OPEN' },
  { category: 'Skill-Based', displayName: 'WD Advanced', eventType: 'DOUBLES', gender: 'FEMALE', ageCategory: 'OPEN' },
  { category: 'Skill-Based', displayName: 'MXD Advanced', eventType: 'MIXED_DOUBLES', gender: 'MIXED', ageCategory: 'OPEN' },

  // ============================================================
  // 9) Parent-Child
  // ============================================================
  { category: 'Parent-Child', displayName: 'Father-Son Doubles', eventType: 'DOUBLES', gender: 'MALE', ageCategory: 'OPEN' },
  { category: 'Parent-Child', displayName: 'Father-Daughter Doubles', eventType: 'DOUBLES', gender: 'MIXED', ageCategory: 'OPEN' },
  { category: 'Parent-Child', displayName: 'Mother-Son Doubles', eventType: 'DOUBLES', gender: 'MIXED', ageCategory: 'OPEN' },
  { category: 'Parent-Child', displayName: 'Mother-Daughter Doubles', eventType: 'DOUBLES', gender: 'FEMALE', ageCategory: 'OPEN' },

  // ============================================================
  // 10) Family
  // ============================================================
  { category: 'Family', displayName: 'Husband-Wife Doubles', eventType: 'DOUBLES', gender: 'MIXED', ageCategory: 'OPEN' },
  { category: 'Family', displayName: 'Sibling Doubles', eventType: 'DOUBLES', gender: 'OPEN', ageCategory: 'OPEN' },
  { category: 'Family', displayName: 'Family Doubles', eventType: 'DOUBLES', gender: 'OPEN', ageCategory: 'OPEN' },

  // ============================================================
  // 11) Fun Events
  // ============================================================
  { category: 'Fun', displayName: 'Lucky Draw Doubles', eventType: 'DOUBLES', gender: 'OPEN', ageCategory: 'OPEN' },
  { category: 'Fun', displayName: 'Corporate Fun Doubles', eventType: 'DOUBLES', gender: 'OPEN', ageCategory: 'OPEN' },
  { category: 'Fun', displayName: 'Pro-Am Doubles', eventType: 'DOUBLES', gender: 'OPEN', ageCategory: 'OPEN' },
];
