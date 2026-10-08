// ============================================================
// MatchPoint — Mock Data Store (Demo Mode)
// ============================================================

import {
  User,
  Tournament,
  TournamentEvent,
  Registration,
  Match,
  MatchSet,
  DashboardStats,
  MatchStatus,
  Team,
  MasterEvent,
  TournamentMedia,
  MatchComment,
} from '@/types';

// ---- Event Master Table (Global Master Events Templates) ----
export const mockMasterEvents: MasterEvent[] = [
  { id: 'ms_open', name: "Men's Singles", event_type: 'singles', category: 'open', gender: 'Male', min_age: 0, max_age: 100, sports: ['badminton', 'table_tennis', 'squash', 'tennis'] },
  { id: 'ws_open', name: "Women's Singles", event_type: 'singles', category: 'open', gender: 'Female', min_age: 0, max_age: 100, sports: ['badminton', 'table_tennis', 'squash', 'tennis'] },
  { id: 'md_open', name: "Men's Doubles", event_type: 'doubles', category: 'open', gender: 'Male', min_age: 0, max_age: 100, sports: ['badminton', 'table_tennis', 'squash', 'tennis'] },
  { id: 'wd_open', name: "Women's Doubles", event_type: 'doubles', category: 'open', gender: 'Female', min_age: 0, max_age: 100, sports: ['badminton', 'table_tennis', 'squash', 'tennis'] },
  { id: 'xd_open', name: "Mixed Doubles", event_type: 'doubles', category: 'open', gender: 'Mixed', min_age: 0, max_age: 100, sports: ['badminton', 'table_tennis', 'squash', 'tennis'] },
  { id: 'bs_u9', name: "Under 9 Boys", event_type: 'singles', category: 'junior', gender: 'Boys', min_age: 0, max_age: 9, sports: ['badminton', 'table_tennis', 'squash', 'tennis'] },
  { id: 'gs_u9', name: "Under 9 Girls", event_type: 'singles', category: 'junior', gender: 'Girls', min_age: 0, max_age: 9, sports: ['badminton', 'table_tennis', 'squash', 'tennis'] },
  { id: 'bs_u11', name: "Under 11 Boys", event_type: 'singles', category: 'junior', gender: 'Boys', min_age: 0, max_age: 11, sports: ['badminton', 'table_tennis', 'squash', 'tennis'] },
  { id: 'gs_u11', name: "Under 11 Girls", event_type: 'singles', category: 'junior', gender: 'Girls', min_age: 0, max_age: 11, sports: ['badminton', 'table_tennis', 'squash', 'tennis'] },
  { id: 'bs_u19', name: "Boys Singles Under-19", event_type: 'singles', category: 'junior', gender: 'Boys', min_age: 0, max_age: 19, sports: ['badminton', 'table_tennis', 'squash', 'tennis'] },
  { id: 'gs_u19', name: "Girls Singles Under-19", event_type: 'singles', category: 'junior', gender: 'Girls', min_age: 0, max_age: 19, sports: ['badminton', 'table_tennis', 'squash', 'tennis'] },
  { id: 'mens_team', name: "Mens Team", event_type: 'team', category: 'open', gender: 'Male', min_age: 0, max_age: 100, sports: ['volleyball', 'cricket', 'badminton'] },
  { id: 'womens_team', name: "Womens Team", event_type: 'team', category: 'open', gender: 'Female', min_age: 0, max_age: 100, sports: ['volleyball', 'cricket', 'badminton'] },
  { id: 'team_open', name: "Franchise Team Championship", event_type: 'team', category: 'open', gender: 'Open', min_age: 0, max_age: 100, sports: ['badminton', 'volleyball', 'cricket', 'table_tennis'] },
  { id: 'vb_men_open', name: "Men's Open Volleyball", event_type: 'team', category: 'open', gender: 'Male', min_age: 0, max_age: 100, sports: ['volleyball'] },
  { id: 'vb_women_open', name: "Women's Open Volleyball", event_type: 'team', category: 'open', gender: 'Female', min_age: 0, max_age: 100, sports: ['volleyball'] },
  { id: 'vb_mixed_open', name: "Mixed Open Volleyball", event_type: 'team', category: 'open', gender: 'Mixed', min_age: 0, max_age: 100, sports: ['volleyball'] },
  { id: 'vb_u19_boys', name: "Under-19 Boys Volleyball", event_type: 'team', category: 'junior', gender: 'Boys', min_age: 0, max_age: 19, sports: ['volleyball'] },
  { id: 'vb_u19_girls', name: "Under-19 Girls Volleyball", event_type: 'team', category: 'junior', gender: 'Girls', min_age: 0, max_age: 19, sports: ['volleyball'] },
  { id: 'vb_corp_open', name: "Corporate Volleyball Cup", event_type: 'team', category: 'open', gender: 'Open', min_age: 0, max_age: 100, sports: ['volleyball'] },
];

// ---- Users ----

export const mockUsers: User[] = [
  {
    id: 'sys1',
    email: 'sysadmin@matchpoint.io',
    name: 'Siddharth Sen',
    role: 'system_admin',
    roles: ['system_admin'],
    phone: '+91 98765 00001',
    age: 35,
    gender: 'Male',
    date_of_birth: '1991-03-15',
    created_at: '2026-06-21T10:00:00Z',
  },
  {
    id: 'sys2',
    email: 'sysadmin2@matchpoint.io',
    name: 'Preeti Nair',
    role: 'system_admin',
    roles: ['system_admin'],
    phone: '+91 98765 00002',
    age: 32,
    gender: 'Female',
    date_of_birth: '1994-07-22',
    created_at: '2026-06-21T10:00:00Z',
  },
  {
    id: 'u1',
    email: 'admin@matchpoint.io',
    name: 'Rajesh Kumar',
    role: 'admin',
    roles: ['admin', 'player'],
    phone: '+91 98765 43210',
    age: 32,
    gender: 'Male',
    created_at: '2025-01-15T10:00:00Z',
  },
  {
    id: 'u2',
    email: 'priya@matchpoint.io',
    name: 'Priya Sharma',
    role: 'player',
    roles: ['player'],
    phone: '+91 91234 56789',
    age: 24,
    gender: 'Female',
    created_at: '2025-02-01T10:00:00Z',
  },
  {
    id: 'u3',
    email: 'vikas@matchpoint.io',
    name: 'Vikas Patel',
    role: 'player',
    roles: ['player'],
    age: 28,
    gender: 'Male',
    created_at: '2025-02-05T10:00:00Z',
  },
  {
    id: 'u4',
    email: 'anita@matchpoint.io',
    name: 'Anita Desai',
    role: 'player',
    roles: ['player'],
    age: 21,
    gender: 'Female',
    created_at: '2025-02-10T10:00:00Z',
  },
  {
    id: 'u5',
    email: 'umpire@matchpoint.io',
    name: 'Suresh Nair',
    role: 'umpire',
    roles: ['umpire', 'player'],
    age: 40,
    gender: 'Male',
    created_at: '2025-01-20T10:00:00Z',
  },
  {
    id: 'u6',
    email: 'rahul@matchpoint.io',
    name: 'Rahul Singh',
    role: 'player',
    roles: ['player'],
    age: 25,
    gender: 'Male',
    created_at: '2025-03-01T10:00:00Z',
  },
  {
    id: 'u7',
    email: 'neha@matchpoint.io',
    name: 'Neha Gupta',
    role: 'player',
    roles: ['player'],
    age: 23,
    gender: 'Female',
    created_at: '2025-03-05T10:00:00Z',
  },
  {
    id: 'u8',
    email: 'amit@matchpoint.io',
    name: 'Amit Verma',
    role: 'player',
    roles: ['player'],
    age: 27,
    gender: 'Male',
    created_at: '2025-03-10T10:00:00Z',
  },
  {
    id: 'u9',
    email: 'deepa@matchpoint.io',
    name: 'Deepa Menon',
    role: 'player',
    roles: ['player'],
    age: 29,
    gender: 'Female',
    created_at: '2025-03-12T10:00:00Z',
  },
  {
    id: 'u10',
    email: 'karthik@matchpoint.io',
    name: 'Karthik Rajan',
    role: 'player',
    roles: ['player'],
    age: 26,
    gender: 'Male',
    created_at: '2025-03-15T10:00:00Z',
  },
  {
    id: 'u11',
    email: 'allroles@matchpoint.io',
    name: 'Arjun Mehta',
    role: 'admin',
    roles: ['admin', 'player', 'umpire'],
    created_at: '2025-01-10T10:00:00Z',
  },
  {
    id: 'u12',
    email: 'umpire2@matchpoint.io',
    name: 'Kavita Rao',
    role: 'umpire',
    roles: ['umpire'],
    created_at: '2025-02-20T10:00:00Z',
  },

  // 7PD VPL Season 2 - Smashers Players
  { id: 'vb_p_tj', email: 'tarun.jha@vpl.io', name: 'Tarun Jha', role: 'player', roles: ['player'], gender: 'Male', age: 28, date_of_birth: '1998-05-12', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_pj', email: 'pradyumna.j@vpl.io', name: 'Pradyumna Juikar', role: 'player', roles: ['player'], gender: 'Male', age: 29, date_of_birth: '1997-08-15', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_sm', email: 'sushant.mane@vpl.io', name: 'Sushant Mane', role: 'player', roles: ['player'], gender: 'Male', age: 27, date_of_birth: '1999-03-20', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_ak', email: 'anand.k@vpl.io', name: 'Anand Kulkarni', role: 'player', roles: ['player'], gender: 'Male', age: 31, date_of_birth: '1995-11-04', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_ym', email: 'yogesh.m@vpl.io', name: 'Yogesh M', role: 'player', roles: ['player'], gender: 'Male', age: 26, date_of_birth: '2000-02-18', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_rs', email: 'ranjit.s@vpl.io', name: 'Ranjit Savant', role: 'player', roles: ['player'], gender: 'Male', age: 30, date_of_birth: '1996-09-25', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_vp', email: 'vikas.p@vpl.io', name: 'Vikas Paliwal', role: 'player', roles: ['player'], gender: 'Male', age: 32, date_of_birth: '1994-06-14', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_ac', email: 'anup.c@vpl.io', name: 'Anup Chudiwal', role: 'player', roles: ['player'], gender: 'Male', age: 33, date_of_birth: '1993-12-08', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_sh', email: 'shivraj.h@vpl.io', name: 'Shivraj Harale', role: 'player', roles: ['player'], gender: 'Male', age: 27, date_of_birth: '1999-07-21', created_at: '2026-10-05T12:00:00Z' },

  // 7PD VPL Season 2 - Spikers Players
  { id: 'vb_p_po', email: 'prashant.o@vpl.io', name: 'Prashant Omble', role: 'player', roles: ['player'], gender: 'Male', age: 29, date_of_birth: '1997-04-10', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_sv', email: 'sagar.v@vpl.io', name: 'Sagar Vekanjkar', role: 'player', roles: ['player'], gender: 'Male', age: 28, date_of_birth: '1998-10-14', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_ng', email: 'nilesh.g@vpl.io', name: 'Nilesh Gaikwad', role: 'player', roles: ['player'], gender: 'Male', age: 30, date_of_birth: '1996-02-28', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_ss', email: 'shivraj.s@vpl.io', name: 'Shivraj Salve', role: 'player', roles: ['player'], gender: 'Male', age: 26, date_of_birth: '2000-05-19', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_hm', email: 'harsh.m@vpl.io', name: 'Harsh Munot', role: 'player', roles: ['player'], gender: 'Male', age: 25, date_of_birth: '2001-08-30', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_sbs', email: 'sibendra.s@vpl.io', name: 'Sibendra Singh', role: 'player', roles: ['player'], gender: 'Male', age: 31, date_of_birth: '1995-01-11', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_vm', email: 'vinay.m@vpl.io', name: 'Vinay Mahadik', role: 'player', roles: ['player'], gender: 'Male', age: 29, date_of_birth: '1997-09-09', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_hr', email: 'himanshu.r@vpl.io', name: 'Himanshu Rajpali', role: 'player', roles: ['player'], gender: 'Male', age: 27, date_of_birth: '1999-11-23', created_at: '2026-10-05T12:00:00Z' },

  // 7PD VPL Season 2 - Servers Players
  { id: 'vb_p_rk', email: 'rohit.k@vpl.io', name: 'Rohit Kashyap', role: 'player', roles: ['player'], gender: 'Male', age: 30, date_of_birth: '1996-06-15', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_rp', email: 'rudra.p@vpl.io', name: 'Rudra Pathak', role: 'player', roles: ['player'], gender: 'Male', age: 24, date_of_birth: '2002-04-18', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_ab', email: 'abie@vpl.io', name: 'Abie', role: 'player', roles: ['player'], gender: 'Male', age: 27, date_of_birth: '1999-08-20', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_nj', email: 'neeraj@vpl.io', name: 'Neeraj', role: 'player', roles: ['player'], gender: 'Male', age: 26, date_of_birth: '2000-01-10', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_tl', email: 'tushar.l@vpl.io', name: 'Tushar Lokhande', role: 'player', roles: ['player'], gender: 'Male', age: 28, date_of_birth: '1998-03-05', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_nn', email: 'niranjan.n@vpl.io', name: 'Niranjan Nande', role: 'player', roles: ['player'], gender: 'Male', age: 29, date_of_birth: '1997-12-12', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_smh', email: 'suyash.h@vpl.io', name: 'Suyash M Harkare', role: 'player', roles: ['player'], gender: 'Male', age: 25, date_of_birth: '2001-09-17', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_ckl', email: 'kishor.l@vpl.io', name: 'C.kishor Ladekar', role: 'player', roles: ['player'], gender: 'Male', age: 34, date_of_birth: '1992-07-29', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_oj', email: 'onkar.j@vpl.io', name: 'Onkar Jagtap', role: 'player', roles: ['player'], gender: 'Male', age: 26, date_of_birth: '2000-11-03', created_at: '2026-10-05T12:00:00Z' },

  // 7PD VPL Season 2 - Netbreakers Players
  { id: 'vb_p_at', email: 'asif.t@vpl.io', name: 'Asif Tamboli', role: 'player', roles: ['player'], gender: 'Male', age: 31, date_of_birth: '1995-02-14', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_acg', email: 'amit.c@vpl.io', name: 'Amit Chougule', role: 'player', roles: ['player'], gender: 'Male', age: 28, date_of_birth: '1998-07-07', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_vmk', email: 'vinod.m@vpl.io', name: 'Vinod Mulik', role: 'player', roles: ['player'], gender: 'Male', age: 33, date_of_birth: '1993-04-16', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_vd', email: 'vinod.d@vpl.io', name: 'Vinod Digole', role: 'player', roles: ['player'], gender: 'Male', age: 30, date_of_birth: '1996-05-22', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_rr', email: 'rakesh.r@vpl.io', name: 'Rakesh Rane', role: 'player', roles: ['player'], gender: 'Male', age: 32, date_of_birth: '1994-10-18', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_smo', email: 'shreyas.m@vpl.io', name: 'Shreyas Mohite', role: 'player', roles: ['player'], gender: 'Male', age: 25, date_of_birth: '2001-03-31', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_yj', email: 'yogesh.j@vpl.io', name: 'Yogesh Jadhav', role: 'player', roles: ['player'], gender: 'Male', age: 27, date_of_birth: '1999-06-25', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_kg', email: 'kavish.g@vpl.io', name: 'Kavish Gianani', role: 'player', roles: ['player'], gender: 'Male', age: 26, date_of_birth: '2000-08-14', created_at: '2026-10-05T12:00:00Z' },

  // 7PD VPL Season 2 - Gamechangers Players
  { id: 'vb_p_vpwr', email: 'vaijnath.p@vpl.io', name: 'Vaijnath Pawar', role: 'player', roles: ['player'], gender: 'Male', age: 31, date_of_birth: '1995-09-05', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_atm', email: 'akshay.t@vpl.io', name: 'Akshay Tamane', role: 'player', roles: ['player'], gender: 'Male', age: 28, date_of_birth: '1998-12-19', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_pb', email: 'pandurang.b@vpl.io', name: 'Pandurang Biradar', role: 'player', roles: ['player'], gender: 'Male', age: 30, date_of_birth: '1996-03-11', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_yb', email: 'yash.b@vpl.io', name: 'Yash Bhame', role: 'player', roles: ['player'], gender: 'Male', age: 23, date_of_birth: '2003-01-27', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_bp', email: 'bharat.p@vpl.io', name: 'Bharat Patil', role: 'player', roles: ['player'], gender: 'Male', age: 32, date_of_birth: '1994-04-09', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_vg', email: 'vaibhav.g@vpl.io', name: 'Vaibhav Gunjal', role: 'player', roles: ['player'], gender: 'Male', age: 29, date_of_birth: '1997-10-30', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_rpw', email: 'rahul.p@vpl.io', name: 'Rahul Pawar', role: 'player', roles: ['player'], gender: 'Male', age: 27, date_of_birth: '1999-05-16', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_arm', email: 'amit.rm@vpl.io', name: 'Dr Amit R M', role: 'player', roles: ['player'], gender: 'Male', age: 36, date_of_birth: '1990-08-22', created_at: '2026-10-05T12:00:00Z' },

  // 7PD VPL Season 2 - Blockbusters Players
  { id: 'vb_p_sk', email: 'sachin.k@vpl.io', name: 'Sachin Kable', role: 'player', roles: ['player'], gender: 'Male', age: 32, date_of_birth: '1994-07-03', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_ps', email: 'pankaj.s@vpl.io', name: 'Pankaj Sehra', role: 'player', roles: ['player'], gender: 'Male', age: 30, date_of_birth: '1996-11-15', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_ssap', email: 'shailesh.s@vpl.io', name: 'Shailesh Sapate', role: 'player', roles: ['player'], gender: 'Male', age: 31, date_of_birth: '1995-04-24', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_hu', email: 'harshit.u@vpl.io', name: 'Harshit Upadhyay', role: 'player', roles: ['player'], gender: 'Male', age: 26, date_of_birth: '2000-02-12', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_as', email: 'ajit.s@vpl.io', name: 'Ajit Sarwale', role: 'player', roles: ['player'], gender: 'Male', age: 29, date_of_birth: '1997-06-20', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_md', email: 'mahesh.d@vpl.io', name: 'Mahesh Dhole', role: 'player', roles: ['player'], gender: 'Male', age: 34, date_of_birth: '1992-09-08', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_asu', email: 'ashwin.s@vpl.io', name: 'Ashwin Sutar', role: 'player', roles: ['player'], gender: 'Male', age: 28, date_of_birth: '1998-01-19', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_mm', email: 'manish.m@vpl.io', name: 'Manish Mishra', role: 'player', roles: ['player'], gender: 'Male', age: 33, date_of_birth: '1993-03-27', created_at: '2026-10-05T12:00:00Z' },
  { id: 'vb_p_jd', email: 'jayesh.d@vpl.io', name: 'Jayesh Deore', role: 'player', roles: ['player'], gender: 'Male', age: 27, date_of_birth: '1999-10-10', created_at: '2026-10-05T12:00:00Z' },

  // WVPL 2026 - Blazers Players
  { id: 'wv_p_ns', email: 'neha.s@wvpl.io', name: 'Neha S (C)', role: 'player', roles: ['player'], gender: 'Female', age: 27, date_of_birth: '1999-04-12', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_pk', email: 'pooja.kable@wvpl.io', name: 'Pooja Kable', role: 'player', roles: ['player'], gender: 'Female', age: 26, date_of_birth: '2000-09-18', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_ud', email: 'urmila.d@wvpl.io', name: 'Urmila D', role: 'player', roles: ['player'], gender: 'Female', age: 29, date_of_birth: '1997-02-15', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_sb', email: 'swati.b@wvpl.io', name: 'Swati Bhange', role: 'player', roles: ['player'], gender: 'Female', age: 28, date_of_birth: '1998-06-22', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_da', email: 'dr.archana@wvpl.io', name: 'Dr. Archana', role: 'player', roles: ['player'], gender: 'Female', age: 34, date_of_birth: '1992-11-05', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_pp', email: 'pratima.p@wvpl.io', name: 'Pratima Patil', role: 'player', roles: ['player'], gender: 'Female', age: 25, date_of_birth: '2001-08-14', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_sk', email: 'shivani.k@wvpl.io', name: 'Shivani Kohli', role: 'player', roles: ['player'], gender: 'Female', age: 24, date_of_birth: '2002-01-30', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_sn', email: 'snehali@wvpl.io', name: 'Snehali', role: 'player', roles: ['player'], gender: 'Female', age: 26, date_of_birth: '2000-07-09', created_at: '2026-10-05T12:00:00Z' },

  // WVPL 2026 - Strikers Players
  { id: 'wv_p_np', email: 'nishita.p@wvpl.io', name: 'Nishita P (C)', role: 'player', roles: ['player'], gender: 'Female', age: 28, date_of_birth: '1998-03-24', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_sp', email: 'snehal.p@wvpl.io', name: 'Snehal Patil', role: 'player', roles: ['player'], gender: 'Female', age: 25, date_of_birth: '2001-12-01', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_as', email: 'aarti.s@wvpl.io', name: 'Aarti Sehera', role: 'player', roles: ['player'], gender: 'Female', age: 27, date_of_birth: '1999-05-18', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_ap', email: 'aakansha.p@wvpl.io', name: 'Aakansha P', role: 'player', roles: ['player'], gender: 'Female', age: 23, date_of_birth: '2003-08-11', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_psh', email: 'priyanka.s@wvpl.io', name: 'Priyanka Shinde', role: 'player', roles: ['player'], gender: 'Female', age: 29, date_of_birth: '1997-10-04', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_pw', email: 'priya.w@wvpl.io', name: 'Priya W', role: 'player', roles: ['player'], gender: 'Female', age: 26, date_of_birth: '2000-04-27', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_ht', email: 'heena.t@wvpl.io', name: 'Heena T', role: 'player', roles: ['player'], gender: 'Female', age: 30, date_of_birth: '1996-01-16', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_rj', email: 'rohini.j@wvpl.io', name: 'Rohini J', role: 'player', roles: ['player'], gender: 'Female', age: 31, date_of_birth: '1995-07-23', created_at: '2026-10-05T12:00:00Z' },

  // WVPL 2026 - Aces Players
  { id: 'wv_p_prp', email: 'purva.p@wvpl.io', name: 'Purva P (C)', role: 'player', roles: ['player'], gender: 'Female', age: 27, date_of_birth: '1999-06-19', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_sd', email: 'sneha.d@wvpl.io', name: 'Sneha Desai', role: 'player', roles: ['player'], gender: 'Female', age: 28, date_of_birth: '1998-02-14', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_pjs', email: 'pooja.s@wvpl.io', name: 'Pooja S', role: 'player', roles: ['player'], gender: 'Female', age: 25, date_of_birth: '2001-11-29', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_snb', email: 'sonal.b@wvpl.io', name: 'Sonal Bhoyar', role: 'player', roles: ['player'], gender: 'Female', age: 29, date_of_birth: '1997-03-08', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_ds', email: 'deepa.s@wvpl.io', name: 'Deepa Shetty', role: 'player', roles: ['player'], gender: 'Female', age: 30, date_of_birth: '1996-09-12', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_std', email: 'sheetal.d@wvpl.io', name: 'Sheetal Dhole', role: 'player', roles: ['player'], gender: 'Female', age: 32, date_of_birth: '1994-12-25', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_so', email: 'shardha.o@wvpl.io', name: 'Shardha Omble', role: 'player', roles: ['player'], gender: 'Female', age: 26, date_of_birth: '2000-08-03', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_rm', email: 'ritu.m@wvpl.io', name: 'Ritu M', role: 'player', roles: ['player'], gender: 'Female', age: 24, date_of_birth: '2002-05-17', created_at: '2026-10-05T12:00:00Z' },

  // WVPL 2026 - Legends Players
  { id: 'wv_p_mp', email: 'mansa.p@wvpl.io', name: 'Mansa Patil (C)', role: 'player', roles: ['player'], gender: 'Female', age: 28, date_of_birth: '1998-01-26', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_jl', email: 'jayalaxmi@wvpl.io', name: 'Jayalaxmi', role: 'player', roles: ['player'], gender: 'Female', age: 29, date_of_birth: '1997-08-31', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_vp', email: 'vrushali.p@wvpl.io', name: 'Vrushali P', role: 'player', roles: ['player'], gender: 'Female', age: 26, date_of_birth: '2000-10-15', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_pbo', email: 'purva.b@wvpl.io', name: 'Purva Bonde', role: 'player', roles: ['player'], gender: 'Female', age: 27, date_of_birth: '1999-07-02', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_pt', email: 'priyanka.t@wvpl.io', name: 'Priyanka T', role: 'player', roles: ['player'], gender: 'Female', age: 31, date_of_birth: '1995-12-14', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_nds', email: 'nidhi.s@wvpl.io', name: 'Nidhi S', role: 'player', roles: ['player'], gender: 'Female', age: 24, date_of_birth: '2002-09-20', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_dn', email: 'deepika.n@wvpl.io', name: 'Deepika N', role: 'player', roles: ['player'], gender: 'Female', age: 28, date_of_birth: '1998-04-06', created_at: '2026-10-05T12:00:00Z' },
  { id: 'wv_p_pkp', email: 'pankti.p@wvpl.io', name: 'Pankti P', role: 'player', roles: ['player'], gender: 'Female', age: 25, date_of_birth: '2001-02-11', created_at: '2026-10-05T12:00:00Z' },
];

// ---- Categories ----
export let mockCategories = [
  { value: 'MS', label: "Men's Singles" },
  { value: 'WS', label: "Women's Singles" },
  { value: 'MD', label: "Men's Doubles" },
  { value: 'WD', label: "Women's Doubles" },
  { value: 'XD', label: "Mixed Doubles" },
  { value: 'TEAM', label: "Team" },
];

// ---- Tournaments ----

export const mockTournaments: Tournament[] = [
  {
    id: 't1',
    name: 'Mumbai Badminton Open 2025',
    slug: 'mumbai-open-2025',
    description: 'The premier badminton tournament in Mumbai. Open to all skill levels. Prizes worth ₹5,00,000!',
    location: 'Shree Shiv Chhatrapati Sports Complex, Mumbai',
    start_date: '2025-06-15',
    end_date: '2025-06-22',
    withdraw_date: '2025-06-10',
    type: 'individual',
    status: 'live',
    created_by: 'u1',
    created_at: '2025-01-20T10:00:00Z',
  },
  {
    id: 't2',
    name: 'Delhi Shuttle Championship',
    slug: 'delhi-shuttle-championship',
    description: 'Annual championship featuring top players from across North India.',
    location: 'Siri Fort Sports Complex, New Delhi',
    start_date: '2026-10-10',
    end_date: '2026-10-14',
    withdraw_date: '2026-10-05',
    type: 'individual',
    status: 'open',
    created_by: 'u1',
    created_at: '2025-02-10T10:00:00Z',
  },
  {
    id: 't3',
    name: 'Bangalore Corporate League',
    slug: 'bangalore-corporate-league',
    description: 'Team-based corporate badminton league. Companies compete head-to-head!',
    location: 'Koramangala Indoor Stadium, Bangalore',
    start_date: '2026-11-01',
    end_date: '2026-11-15',
    withdraw_date: '2026-10-25',
    type: 'team',
    status: 'draft',
    created_by: 'u1',
    created_at: '2025-03-01T10:00:00Z',
  },
  {
    id: 't_7pd_vpl_s2',
    name: '7PD VPL Season 2',
    slug: '7pd-vpl-season-2',
    description: "7PD VPL Season 2 - Men's Volleyball Tournament. More Than a Game: Unite, Play, Thrive.",
    location: '7PD Sports Arena, Pune',
    banner: '/tournaments/7pd-vpl/poster.jpg',
    start_date: '2026-10-10',
    end_date: '2026-10-18',
    withdraw_date: '2026-10-09',
    type: 'team',
    status: 'live',
    sport: 'volleyball',
    created_by: 'usr_admin_7',
    created_at: '2026-10-05T12:00:00Z',
  },
  {
    id: 't_wvpl_2026',
    name: 'WVPL 2026',
    slug: 'wvpl-2026',
    description: "WVPL 2026 - Women's Volleyball Premier League. Play, Compete, Support, Empower.",
    location: '7PD Sports Complex, Pune',
    banner: '/tournaments/wvpl/poster.jpg',
    start_date: '2026-10-10',
    end_date: '2026-10-18',
    withdraw_date: '2026-10-09',
    type: 'team',
    status: 'live',
    sport: 'volleyball',
    created_by: 'usr_admin_7',
    created_at: '2026-10-05T12:00:00Z',
  },
  {
    id: 't4',
    name: 'Pune Masters Invitational',
    slug: 'pune-masters-2025',
    description: 'Invitational tournament for ranked players. Seeded draw with knockout format.',
    location: 'Balewadi Stadium, Pune',
    start_date: '2025-05-01',
    end_date: '2025-05-05',
    withdraw_date: '2025-04-25',
    type: 'individual',
    status: 'completed',
    created_by: 'u1',
    created_at: '2025-01-05T10:00:00Z',
  },
];

// ---- Events ----

export const mockEvents: TournamentEvent[] = [
  { id: 'e1', tournament_id: 't1', master_event_id: 'ms_open', event_name: "Men's Singles", category: 'MS', entry_limit: 32, format: 'knockout', registrations_count: 24, scoring_format: '21-point', gender_restriction: 'men', age_limit: 0, age_restriction_type: 'max' },
  { id: 'e2', tournament_id: 't1', master_event_id: 'ws_open', event_name: "Women's Singles", category: 'WS', entry_limit: 16, format: 'knockout', registrations_count: 12, scoring_format: '21-point', gender_restriction: 'women', age_limit: 0, age_restriction_type: 'max' },
  { id: 'e3', tournament_id: 't1', master_event_id: 'md_open', event_name: "Men's Doubles", category: 'MD', entry_limit: 16, format: 'knockout', registrations_count: 14, scoring_format: '21-point', gender_restriction: 'men', age_limit: 0, age_restriction_type: 'max' },
  { id: 'e4', tournament_id: 't1', master_event_id: 'xd_open', event_name: "Mixed Doubles", category: 'XD', entry_limit: 16, format: 'knockout', registrations_count: 10, scoring_format: '21-point', gender_restriction: 'mixed', age_limit: 0, age_restriction_type: 'max' },
  { id: 'e5', tournament_id: 't2', master_event_id: 'ms_open', event_name: "Men's Singles", category: 'MS', entry_limit: 64, format: 'knockout', registrations_count: 38, scoring_format: '21-point', gender_restriction: 'men', age_limit: 0, age_restriction_type: 'max' },
  { id: 'e6', tournament_id: 't2', master_event_id: 'ws_open', event_name: "Women's Singles", category: 'WS', entry_limit: 32, format: 'knockout', registrations_count: 20, scoring_format: '21-point', gender_restriction: 'women', age_limit: 0, age_restriction_type: 'max' },
  { id: 'e7', tournament_id: 't4', master_event_id: 'ms_open', event_name: "Men's Singles", category: 'MS', entry_limit: 16, format: 'knockout', registrations_count: 16, scoring_format: '21-point', gender_restriction: 'men', age_limit: 0, age_restriction_type: 'max' },
  { id: 'e8', tournament_id: 't3', master_event_id: 'team_open', event_name: "Team Event", category: 'TEAM', entry_limit: 8, format: 'league', registrations_count: 6, scoring_format: '21-point', gender_restriction: 'open', age_limit: 0, age_restriction_type: 'max' },
];

// ---- Registrations ----

export const mockRegistrations: Registration[] = [
  // T1 - Event e1 (Men's Singles)
  { id: 'r1', tournament_id: 't1', event_id: 'e1', player_id: 'u2', player_name: 'Priya Sharma', player_email: 'priya@matchpoint.io', status: 'approved', registered_at: '2025-04-01T10:00:00Z', seed: 1 },
  { id: 'r2', tournament_id: 't1', event_id: 'e1', player_id: 'u3', player_name: 'Vikas Patel', player_email: 'vikas@matchpoint.io', status: 'approved', registered_at: '2025-04-02T10:00:00Z', seed: 2 },
  { id: 'r3', tournament_id: 't1', event_id: 'e1', player_id: 'u4', player_name: 'Anita Desai', player_email: 'anita@matchpoint.io', status: 'approved', registered_at: '2025-04-03T10:00:00Z', seed: 3 },
  { id: 'r4', tournament_id: 't1', event_id: 'e1', player_id: 'u6', player_name: 'Rahul Singh', player_email: 'rahul@matchpoint.io', status: 'approved', registered_at: '2025-04-04T10:00:00Z', seed: 4 },
  { id: 'r5', tournament_id: 't1', event_id: 'e1', player_id: 'u7', player_name: 'Neha Gupta', player_email: 'neha@matchpoint.io', status: 'pending', registered_at: '2025-04-05T10:00:00Z' },
  { id: 'r6', tournament_id: 't1', event_id: 'e1', player_id: 'u8', player_name: 'Amit Verma', player_email: 'amit@matchpoint.io', status: 'approved', registered_at: '2025-04-06T10:00:00Z', seed: 5 },
  { id: 'r7', tournament_id: 't1', event_id: 'e1', player_id: 'u9', player_name: 'Deepa Menon', player_email: 'deepa@matchpoint.io', status: 'rejected', registered_at: '2025-04-07T10:00:00Z' },
  { id: 'r8', tournament_id: 't1', event_id: 'e1', player_id: 'u10', player_name: 'Karthik Rajan', player_email: 'karthik@matchpoint.io', status: 'approved', registered_at: '2025-04-08T10:00:00Z', seed: 6 },

  // T1 - Event e2 (Women's Singles) — NEW: registrations for fixture generation
  { id: 'r11', tournament_id: 't1', event_id: 'e2', player_id: 'u2', player_name: 'Priya Sharma', player_email: 'priya@matchpoint.io', status: 'approved', registered_at: '2025-04-01T10:00:00Z', seed: 1 },
  { id: 'r12', tournament_id: 't1', event_id: 'e2', player_id: 'u4', player_name: 'Anita Desai', player_email: 'anita@matchpoint.io', status: 'approved', registered_at: '2025-04-02T10:00:00Z', seed: 2 },
  { id: 'r13', tournament_id: 't1', event_id: 'e2', player_id: 'u7', player_name: 'Neha Gupta', player_email: 'neha@matchpoint.io', status: 'approved', registered_at: '2025-04-03T10:00:00Z', seed: 3 },
  { id: 'r14', tournament_id: 't1', event_id: 'e2', player_id: 'u9', player_name: 'Deepa Menon', player_email: 'deepa@matchpoint.io', status: 'approved', registered_at: '2025-04-04T10:00:00Z', seed: 4 },

  // T2 - Event e5 (Men's Singles)
  { id: 'r9', tournament_id: 't2', event_id: 'e5', player_id: 'u2', player_name: 'Priya Sharma', player_email: 'priya@matchpoint.io', status: 'approved', registered_at: '2025-05-01T10:00:00Z', seed: 1 },
  { id: 'r10', tournament_id: 't2', event_id: 'e5', player_id: 'u6', player_name: 'Rahul Singh', player_email: 'rahul@matchpoint.io', status: 'approved', registered_at: '2025-05-02T10:00:00Z', seed: 2 },
  { id: 'r15', tournament_id: 't2', event_id: 'e5', player_id: 'u3', player_name: 'Vikas Patel', player_email: 'vikas@matchpoint.io', status: 'approved', registered_at: '2025-05-03T10:00:00Z', seed: 3 },
  { id: 'r16', tournament_id: 't2', event_id: 'e5', player_id: 'u8', player_name: 'Amit Verma', player_email: 'amit@matchpoint.io', status: 'approved', registered_at: '2025-05-04T10:00:00Z', seed: 4 },

  // T2 - Event e6 (Women's Singles)
  { id: 'r17', tournament_id: 't2', event_id: 'e6', player_id: 'u4', player_name: 'Anita Desai', player_email: 'anita@matchpoint.io', status: 'approved', registered_at: '2025-05-01T10:00:00Z', seed: 1 },
  { id: 'r18', tournament_id: 't2', event_id: 'e6', player_id: 'u7', player_name: 'Neha Gupta', player_email: 'neha@matchpoint.io', status: 'approved', registered_at: '2025-05-02T10:00:00Z', seed: 2 },
  { id: 'r19', tournament_id: 't2', event_id: 'e6', player_id: 'u9', player_name: 'Deepa Menon', player_email: 'deepa@matchpoint.io', status: 'approved', registered_at: '2025-05-03T10:00:00Z', seed: 3 },
  { id: 'r20', tournament_id: 't2', event_id: 'e6', player_id: 'u2', player_name: 'Priya Sharma', player_email: 'priya@matchpoint.io', status: 'approved', registered_at: '2025-05-04T10:00:00Z', seed: 4 },
];

// ---- Teams ----

export const mockTeams: Team[] = [
  { id: 'team1', name: 'Infosys Smashers', tournament_id: 't3', logo_color: '#6366f1', captain_id: 'u3', players: ['u3', 'u6'] },
  { id: 'team2', name: 'TCS Titans', tournament_id: 't3', logo_color: '#ef4444', captain_id: 'u8', players: ['u8', 'u10'] },
  { id: 'team3', name: 'Wipro Warriors', tournament_id: 't3', logo_color: '#22c55e', players: [] },

  // 7PD VPL Season 2 (Men's Volleyball)
  {
    id: 'team_smashers',
    name: 'Smashers',
    tournament_id: 't_7pd_vpl_s2',
    logo_color: '#DC2626',
    logo_url: '/tournaments/7pd-vpl/smashers_logo.jpg',
    captain_id: 'vb_p_tj',
    players: ['vb_p_tj', 'vb_p_pj', 'vb_p_sm', 'vb_p_ak', 'vb_p_ym', 'vb_p_rs', 'vb_p_vp', 'vb_p_ac', 'vb_p_sh']
  },
  {
    id: 'team_spikers',
    name: 'Spikers',
    tournament_id: 't_7pd_vpl_s2',
    logo_color: '#2563EB',
    logo_url: '/tournaments/7pd-vpl/spikers_logo.jpg',
    captain_id: 'vb_p_po',
    players: ['vb_p_po', 'vb_p_sv', 'vb_p_ng', 'vb_p_ss', 'vb_p_hm', 'vb_p_sbs', 'vb_p_vm', 'vb_p_hr']
  },
  {
    id: 'team_servers',
    name: 'Servers',
    tournament_id: 't_7pd_vpl_s2',
    logo_color: '#059669',
    logo_url: '/tournaments/7pd-vpl/servers_logo.jpg',
    captain_id: 'vb_p_rk',
    players: ['vb_p_rk', 'vb_p_rp', 'vb_p_ab', 'vb_p_nj', 'vb_p_tl', 'vb_p_nn', 'vb_p_smh', 'vb_p_ckl', 'vb_p_oj']
  },
  {
    id: 'team_netbreakers',
    name: 'Netbreakers',
    tournament_id: 't_7pd_vpl_s2',
    logo_color: '#7C3AED',
    logo_url: '/tournaments/7pd-vpl/netbreakers_logo.jpg',
    captain_id: 'vb_p_at',
    players: ['vb_p_at', 'vb_p_acg', 'vb_p_vmk', 'vb_p_vd', 'vb_p_rr', 'vb_p_smo', 'vb_p_yj', 'vb_p_kg']
  },
  {
    id: 'team_gamechangers',
    name: 'Gamechangers',
    tournament_id: 't_7pd_vpl_s2',
    logo_color: '#EA580C',
    logo_url: '/tournaments/7pd-vpl/gamechangers_logo.jpg',
    captain_id: 'vb_p_vpwr',
    players: ['vb_p_vpwr', 'vb_p_atm', 'vb_p_pb', 'vb_p_yb', 'vb_p_bp', 'vb_p_vg', 'vb_p_rpw', 'vb_p_arm']
  },
  {
    id: 'team_blockbusters',
    name: 'Blockbusters',
    tournament_id: 't_7pd_vpl_s2',
    logo_color: '#0284C7',
    logo_url: '/tournaments/7pd-vpl/blockbusters_logo.jpg',
    captain_id: 'vb_p_sk',
    players: ['vb_p_sk', 'vb_p_ps', 'vb_p_ssap', 'vb_p_hu', 'vb_p_as', 'vb_p_md', 'vb_p_asu', 'vb_p_mm', 'vb_p_jd']
  },

  // WVPL 2026 (Women's Volleyball Premier League)
  {
    id: 'team_wvpl_blazers',
    name: 'Blazers',
    tournament_id: 't_wvpl_2026',
    logo_color: '#EA580C',
    logo_url: '/tournaments/wvpl/blazers.jpg',
    captain_id: 'wv_p_ns',
    players: ['wv_p_ns', 'wv_p_pk', 'wv_p_ud', 'wv_p_sb', 'wv_p_da', 'wv_p_pp', 'wv_p_sk', 'wv_p_sn']
  },
  {
    id: 'team_wvpl_strikers',
    name: 'Strikers',
    tournament_id: 't_wvpl_2026',
    logo_color: '#0284C7',
    logo_url: '/tournaments/wvpl/strikers.jpg',
    captain_id: 'wv_p_np',
    players: ['wv_p_np', 'wv_p_sp', 'wv_p_as', 'wv_p_ap', 'wv_p_psh', 'wv_p_pw', 'wv_p_ht', 'wv_p_rj']
  },
  {
    id: 'team_wvpl_aces',
    name: 'Aces',
    tournament_id: 't_wvpl_2026',
    logo_color: '#0D9488',
    logo_url: '/tournaments/wvpl/aces.jpg',
    captain_id: 'wv_p_prp',
    players: ['wv_p_prp', 'wv_p_sd', 'wv_p_pjs', 'wv_p_snb', 'wv_p_ds', 'wv_p_std', 'wv_p_so', 'wv_p_rm']
  },
  {
    id: 'team_wvpl_legends',
    name: 'Legends',
    tournament_id: 't_wvpl_2026',
    logo_color: '#831843',
    logo_url: '/tournaments/wvpl/legends.jpg',
    captain_id: 'wv_p_mp',
    players: ['wv_p_mp', 'wv_p_jl', 'wv_p_vp', 'wv_p_pbo', 'wv_p_pt', 'wv_p_nds', 'wv_p_dn', 'wv_p_pkp']
  },
];

// ---- Matches ----

function createSet(p1: number, p2: number, setNum: number, winnerId?: string): MatchSet {
  return {
    set_number: setNum,
    player1_score: p1,
    player2_score: p2,
    is_complete: !!(winnerId),
    winner_id: winnerId,
  };
}

export const mockMatches: Match[] = [
  {
    id: 'm_7pd_1',
    tournament_id: 't_7pd_vpl_s2',
    event_id: 'e_7pd_vpl_league',
    fixture_round: 1,
    fixture_position: 1,
    court: 'Center Court 1',
    player1_id: 'team_smashers',
    player1_name: 'Smashers',
    player2_id: 'team_spikers',
    player2_name: 'Spikers',
    scheduled_time: '2026-10-10T07:00:00Z',
    actual_start_time: '2026-10-10T07:05:00Z',
    status: 'completed' as MatchStatus,
    winner_id: 'team_smashers',
    sport: 'volleyball',
    round_name: 'Round 1 - League Stage',
    sets: [
      { set_number: 1, player1_score: 25, player2_score: 21, is_complete: true, winner_id: 'team_smashers' },
      { set_number: 2, player1_score: 25, player2_score: 18, is_complete: true, winner_id: 'team_smashers' },
    ],
    sport_metadata: {
      serving_team: 'player1',
      match_format: 'best_of_3',
      standard_set_points: 25,
      deciding_set_points: 15,
      stats_p1: { attacks: 24, blocks: 6, aces: 4, opponent_errors: 16 },
      stats_p2: { attacks: 19, blocks: 4, aces: 2, opponent_errors: 14 },
    },
  },
  {
    id: 'm_7pd_2',
    tournament_id: 't_7pd_vpl_s2',
    event_id: 'e_7pd_vpl_league',
    fixture_round: 1,
    fixture_position: 2,
    court: 'Center Court 1',
    player1_id: 'team_servers',
    player1_name: 'Servers',
    player2_id: 'team_netbreakers',
    player2_name: 'Netbreakers',
    scheduled_time: '2026-10-10T08:30:00Z',
    status: 'completed' as MatchStatus,
    winner_id: 'team_netbreakers',
    sport: 'volleyball',
    round_name: 'Round 1 - League Stage',
    sets: [
      { set_number: 1, player1_score: 23, player2_score: 25, is_complete: true, winner_id: 'team_netbreakers' },
      { set_number: 2, player1_score: 20, player2_score: 25, is_complete: true, winner_id: 'team_netbreakers' },
    ],
  },
  {
    id: 'm_7pd_3',
    tournament_id: 't_7pd_vpl_s2',
    event_id: 'e_7pd_vpl_league',
    fixture_round: 1,
    fixture_position: 3,
    court: 'Center Court 1',
    player1_id: 'team_gamechangers',
    player1_name: 'Gamechangers',
    player2_id: 'team_blockbusters',
    player2_name: 'Blockbusters',
    scheduled_time: '2026-10-10T10:00:00Z',
    status: 'completed' as MatchStatus,
    winner_id: 'team_gamechangers',
    sport: 'volleyball',
    round_name: 'Round 1 - League Stage',
    sets: [
      { set_number: 1, player1_score: 25, player2_score: 20, is_complete: true, winner_id: 'team_gamechangers' },
      { set_number: 2, player1_score: 21, player2_score: 25, is_complete: true, winner_id: 'team_blockbusters' },
      { set_number: 3, player1_score: 15, player2_score: 11, is_complete: true, winner_id: 'team_gamechangers' },
    ],
  },
  {
    id: 'm_7pd_s6_1',
    tournament_id: 't_7pd_vpl_s2',
    event_id: 'e_7pd_vpl_league',
    fixture_round: 2,
    fixture_position: 1,
    court: 'Center Court 1',
    player1_id: 'team_smashers',
    player1_name: 'Smashers',
    player2_id: 'team_gamechangers',
    player2_name: 'Gamechangers',
    scheduled_time: '2026-10-11T09:00:00Z',
    status: 'completed' as MatchStatus,
    winner_id: 'team_smashers',
    sport: 'volleyball',
    round_name: 'Round 2 - Super 6 Stage',
    sets: [
      { set_number: 1, player1_score: 25, player2_score: 22, is_complete: true, winner_id: 'team_smashers' },
      { set_number: 2, player1_score: 25, player2_score: 19, is_complete: true, winner_id: 'team_smashers' },
    ],
  },
  {
    id: 'm_7pd_s6_2',
    tournament_id: 't_7pd_vpl_s2',
    event_id: 'e_7pd_vpl_league',
    fixture_round: 2,
    fixture_position: 2,
    court: 'Center Court 1',
    player1_id: 'team_netbreakers',
    player1_name: 'Netbreakers',
    player2_id: 'team_spikers',
    player2_name: 'Spikers',
    scheduled_time: '2026-10-11T10:30:00Z',
    status: 'completed' as MatchStatus,
    winner_id: 'team_netbreakers',
    sport: 'volleyball',
    round_name: 'Round 2 - Super 6 Stage',
    sets: [
      { set_number: 1, player1_score: 25, player2_score: 17, is_complete: true, winner_id: 'team_netbreakers' },
      { set_number: 2, player1_score: 25, player2_score: 23, is_complete: true, winner_id: 'team_netbreakers' },
    ],
  },
  {
    id: 'm_7pd_sf_1',
    tournament_id: 't_7pd_vpl_s2',
    event_id: 'e_7pd_vpl_league',
    fixture_round: 3,
    fixture_position: 1,
    court: 'Center Court 1',
    player1_id: 'team_smashers',
    player1_name: 'Smashers',
    player2_id: 'team_spikers',
    player2_name: 'Spikers',
    scheduled_time: '2026-10-11T15:00:00Z',
    status: 'completed' as MatchStatus,
    winner_id: 'team_smashers',
    sport: 'volleyball',
    round_name: 'Round 3 - Semi Finals',
    sets: [
      { set_number: 1, player1_score: 25, player2_score: 23, is_complete: true, winner_id: 'team_smashers' },
      { set_number: 2, player1_score: 25, player2_score: 20, is_complete: true, winner_id: 'team_smashers' },
    ],
  },
  {
    id: 'm_7pd_sf_2',
    tournament_id: 't_7pd_vpl_s2',
    event_id: 'e_7pd_vpl_league',
    fixture_round: 3,
    fixture_position: 2,
    court: 'Center Court 1',
    player1_id: 'team_netbreakers',
    player1_name: 'Netbreakers',
    player2_id: 'team_gamechangers',
    player2_name: 'Gamechangers',
    scheduled_time: '2026-10-11T16:30:00Z',
    status: 'completed' as MatchStatus,
    winner_id: 'team_netbreakers',
    sport: 'volleyball',
    round_name: 'Round 3 - Semi Finals',
    sets: [
      { set_number: 1, player1_score: 25, player2_score: 21, is_complete: true, winner_id: 'team_netbreakers' },
      { set_number: 2, player1_score: 25, player2_score: 18, is_complete: true, winner_id: 'team_netbreakers' },
    ],
  },
  {
    id: 'm_7pd_final',
    tournament_id: 't_7pd_vpl_s2',
    event_id: 'e_7pd_vpl_league',
    fixture_round: 4,
    fixture_position: 1,
    court: 'Center Court 1',
    player1_id: 'team_smashers',
    player1_name: 'Smashers',
    player2_id: 'team_netbreakers',
    player2_name: 'Netbreakers',
    scheduled_time: '2026-10-11T18:30:00Z',
    status: 'running' as MatchStatus,
    sport: 'volleyball',
    round_name: 'Round 4 - Grand Finals',
    sets: [
      { set_number: 1, player1_score: 25, player2_score: 23, is_complete: true, winner_id: 'team_smashers' },
      { set_number: 2, player1_score: 21, player2_score: 25, is_complete: true, winner_id: 'team_netbreakers' },
      { set_number: 3, player1_score: 11, player2_score: 9, is_complete: false },
    ],
  },
  // WVPL 2026 (Women's Volleyball)
  {
    id: 'm_wvpl_1',
    tournament_id: 't_wvpl_2026',
    event_id: 'e_wvpl_league',
    fixture_round: 1,
    fixture_position: 1,
    court: 'Court 2 (Arena A)',
    player1_id: 'team_wvpl_legends',
    player1_name: 'Legends',
    player2_id: 'team_wvpl_strikers',
    player2_name: 'Strikers',
    scheduled_time: '2026-10-10T07:45:00Z',
    status: 'completed' as MatchStatus,
    winner_id: 'team_wvpl_legends',
    sport: 'volleyball',
    round_name: 'Round 1 - Group A',
    sets: [
      { set_number: 1, player1_score: 25, player2_score: 19, is_complete: true, winner_id: 'team_wvpl_legends' },
      { set_number: 2, player1_score: 25, player2_score: 21, is_complete: true, winner_id: 'team_wvpl_legends' },
    ],
  },
  {
    id: 'm_wvpl_2',
    tournament_id: 't_wvpl_2026',
    event_id: 'e_wvpl_league',
    fixture_round: 1,
    fixture_position: 2,
    court: 'Court 2 (Arena A)',
    player1_id: 'team_wvpl_blazers',
    player1_name: 'Blazers',
    player2_id: 'team_wvpl_aces',
    player2_name: 'Aces',
    scheduled_time: '2026-10-10T09:15:00Z',
    status: 'completed' as MatchStatus,
    winner_id: 'team_wvpl_blazers',
    sport: 'volleyball',
    round_name: 'Round 1 - Group B',
    sets: [
      { set_number: 1, player1_score: 25, player2_score: 16, is_complete: true, winner_id: 'team_wvpl_blazers' },
      { set_number: 2, player1_score: 25, player2_score: 20, is_complete: true, winner_id: 'team_wvpl_blazers' },
    ],
  },
  {
    id: 'm_wvpl_sf_1',
    tournament_id: 't_wvpl_2026',
    event_id: 'e_wvpl_league',
    fixture_round: 2,
    fixture_position: 1,
    court: 'Court 2 (Arena A)',
    player1_id: 'team_wvpl_legends',
    player1_name: 'Legends',
    player2_id: 'team_wvpl_aces',
    player2_name: 'Aces',
    scheduled_time: '2026-10-10T14:00:00Z',
    status: 'completed' as MatchStatus,
    winner_id: 'team_wvpl_legends',
    sport: 'volleyball',
    round_name: 'Round 2 - Semi Finals',
    sets: [
      { set_number: 1, player1_score: 25, player2_score: 22, is_complete: true, winner_id: 'team_wvpl_legends' },
      { set_number: 2, player1_score: 25, player2_score: 18, is_complete: true, winner_id: 'team_wvpl_legends' },
    ],
  },
  {
    id: 'm_wvpl_sf_2',
    tournament_id: 't_wvpl_2026',
    event_id: 'e_wvpl_league',
    fixture_round: 2,
    fixture_position: 2,
    court: 'Court 2 (Arena A)',
    player1_id: 'team_wvpl_blazers',
    player1_name: 'Blazers',
    player2_id: 'team_wvpl_strikers',
    player2_name: 'Strikers',
    scheduled_time: '2026-10-10T15:30:00Z',
    status: 'completed' as MatchStatus,
    winner_id: 'team_wvpl_blazers',
    sport: 'volleyball',
    round_name: 'Round 2 - Semi Finals',
    sets: [
      { set_number: 1, player1_score: 25, player2_score: 20, is_complete: true, winner_id: 'team_wvpl_blazers' },
      { set_number: 2, player1_score: 25, player2_score: 23, is_complete: true, winner_id: 'team_wvpl_blazers' },
    ],
  },
  {
    id: 'm_wvpl_final',
    tournament_id: 't_wvpl_2026',
    event_id: 'e_wvpl_league',
    fixture_round: 3,
    fixture_position: 1,
    court: 'Court 2 (Arena A)',
    player1_id: 'team_wvpl_legends',
    player1_name: 'Legends',
    player2_id: 'team_wvpl_blazers',
    player2_name: 'Blazers',
    scheduled_time: '2026-10-10T17:30:00Z',
    status: 'running' as MatchStatus,
    sport: 'volleyball',
    round_name: 'Round 3 - Grand Finals',
    sets: [
      { set_number: 1, player1_score: 25, player2_score: 22, is_complete: true, winner_id: 'team_wvpl_legends' },
      { set_number: 2, player1_score: 18, player2_score: 25, is_complete: true, winner_id: 'team_wvpl_blazers' },
      { set_number: 3, player1_score: 10, player2_score: 8, is_complete: false },
    ],
  },
  // T1 - Event e1 (MS) - Semi Finals
  {
    id: 'm1',
    tournament_id: 't1',
    event_id: 'e1',
    fixture_round: 2,
    fixture_position: 0,
    court: 'Court 1',
    player1_id: 'u2',
    player1_name: 'Priya Sharma',
    player2_id: 'u3',
    player2_name: 'Vikas Patel',
    umpire_id: 'u5',
    umpire_name: 'Suresh Nair',
    scheduled_time: '2025-06-20T10:00:00Z',
    status: 'running' as MatchStatus,
    sport: 'table_tennis',
    sets: [
      createSet(11, 8, 1, 'u2'),
      createSet(9, 11, 2, 'u3'),
    ],
  },
  {
    id: 'm2',
    tournament_id: 't1',
    event_id: 'e1',
    fixture_round: 2,
    fixture_position: 1,
    court: 'Court 2',
    player1_id: 'u4',
    player1_name: 'Anita Desai',
    player2_id: 'u6',
    player2_name: 'Rahul Singh',
    umpire_id: 'u5',
    umpire_name: 'Suresh Nair',
    scheduled_time: '2025-06-20T14:00:00Z',
    status: 'scheduled' as MatchStatus,
    sport: 'squash',
    sets: [],
  },
  // T1 - Event e1 (MS) - Quarter Finals (completed)
  {
    id: 'm3',
    tournament_id: 't1',
    event_id: 'e1',
    fixture_round: 1,
    fixture_position: 0,
    court: 'Court 1',
    player1_id: 'u2',
    player1_name: 'Priya Sharma',
    player2_id: 'u8',
    player2_name: 'Amit Verma',
    scheduled_time: '2025-06-18T10:00:00Z',
    status: 'completed' as MatchStatus,
    winner_id: 'u2',
    sets: [
      createSet(21, 15, 1, 'u2'),
      createSet(21, 12, 2, 'u2'),
    ],
  },
  {
    id: 'm4',
    tournament_id: 't1',
    event_id: 'e1',
    fixture_round: 1,
    fixture_position: 1,
    court: 'Court 2',
    player1_id: 'u3',
    player1_name: 'Vikas Patel',
    player2_id: 'u10',
    player2_name: 'Karthik Rajan',
    scheduled_time: '2025-06-18T14:00:00Z',
    status: 'completed' as MatchStatus,
    winner_id: 'u3',
    sets: [
      createSet(18, 21, 1, 'u10'),
      createSet(21, 16, 2, 'u3'),
      createSet(21, 19, 3, 'u3'),
    ],
  },
  {
    id: 'm5',
    tournament_id: 't1',
    event_id: 'e1',
    fixture_round: 1,
    fixture_position: 2,
    court: 'Court 1',
    player1_id: 'u4',
    player1_name: 'Anita Desai',
    player2_id: 'u7',
    player2_name: 'Neha Gupta',
    scheduled_time: '2025-06-19T10:00:00Z',
    status: 'completed' as MatchStatus,
    winner_id: 'u4',
    sets: [
      createSet(21, 11, 1, 'u4'),
      createSet(21, 17, 2, 'u4'),
    ],
  },
  {
    id: 'm6',
    tournament_id: 't1',
    event_id: 'e1',
    fixture_round: 1,
    fixture_position: 3,
    court: 'Court 2',
    player1_id: 'u6',
    player1_name: 'Rahul Singh',
    player2_id: 'u9',
    player2_name: 'Deepa Menon',
    scheduled_time: '2025-06-19T14:00:00Z',
    status: 'completed' as MatchStatus,
    winner_id: 'u6',
    sets: [
      createSet(21, 19, 1, 'u6'),
      createSet(19, 21, 2, 'u9'),
      createSet(21, 15, 3, 'u6'),
    ],
  },
  {
    id: 'adhoc-m-1',
    court: 'Court 3',
    player1_id: 'u2',
    player1_name: 'Priya Sharma',
    player2_id: 'u4',
    player2_name: 'Ananya Rao',
    scheduled_time: '2026-06-17T12:00:00Z',
    actual_start_time: '2026-06-17T12:05:00Z',
    actual_end_time: '2026-06-17T12:35:00Z',
    duration_seconds: 1800,
    status: 'completed' as MatchStatus,
    winner_id: 'u2',
    is_adhoc: true,
    adhoc_type: 'friendly',
    sets: [
      createSet(21, 15, 1, 'u2'),
      createSet(21, 18, 2, 'u2'),
    ],
  },
  {
    id: 'adhoc-m-2',
    court: 'Court 1',
    player1_id: 'u3',
    player1_name: 'Vikas Patel',
    player2_id: 'u6',
    player2_name: 'Rahul Singh',
    scheduled_time: '2026-06-18T10:00:00Z',
    status: 'scheduled' as MatchStatus,
    is_adhoc: true,
    adhoc_type: 'practice',
    sets: [],
  },
  {
    id: 'adhoc-m-3',
    court: 'Court 2',
    player1_id: 'u4',
    player1_name: 'Ananya Rao',
    player2_id: 'u3',
    player2_name: 'Vikas Patel',
    scheduled_time: '2026-06-18T15:30:00Z',
    status: 'running' as MatchStatus,
    is_adhoc: true,
    adhoc_type: 'practice',
    sets: [
      createSet(11, 15, 1),
    ],
  },
];

// ---- Dashboard Stats ----

export const mockDashboardStats: DashboardStats = {
  totalTournaments: 4,
  activeTournaments: 2,
  totalRegistrations: 60,
  totalMatches: 24,
  liveMatches: 1,
  completedMatches: 18,
};

// ---- Helper Functions ----

export function getTournamentById(id: string): Tournament | undefined {
  return mockTournaments.find(t => t.id === id);
}

export function getEventsByTournament(tournamentId: string): TournamentEvent[] {
  return mockEvents.filter(e => e.tournament_id === tournamentId);
}

export function getRegistrationsByEvent(eventId: string): Registration[] {
  return mockRegistrations.filter(r => r.event_id === eventId);
}

export function getMatchesByEvent(eventId: string): Match[] {
  return mockMatches.filter(m => m.event_id === eventId);
}

export function getMatchesByTournament(tournamentId: string): Match[] {
  return mockMatches.filter(m => m.tournament_id === tournamentId);
}

export function getLiveMatches(): Match[] {
  return mockMatches.filter(m => m.status === 'running');
}

export function getUpcomingMatches(playerId: string): Match[] {
  return mockMatches.filter(m =>
    (m.player1_id === playerId || m.player2_id === playerId) &&
    (m.status === 'scheduled' || m.status === 'running')
  );
}

export function getPlayerRegistrations(playerId: string): Registration[] {
  return mockRegistrations.filter(r => r.player_id === playerId);
}

export function getUmpireMatches(umpireId: string): Match[] {
  return mockMatches.filter(m => m.umpire_id === umpireId);
}

export function getTournamentBySlug(slug: string): Tournament | undefined {
  return mockTournaments.find(t => t.slug === slug);
}

export function getTeamsByTournament(tournamentId: string): Team[] {
  return mockTeams.filter(t => t.tournament_id === tournamentId);
}

export function getUmpireUsers(): User[] {
  return mockUsers.filter(u => u.roles.includes('umpire'));
}

export const mockAuditLogs: any[] = [
  { id: 'log-1', action: 'Tournament "Mumbai Badminton Open 2025" created', category: 'tournament', user_name: 'Rajesh Kumar', details: 'Status set to draft', created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString() },
  { id: 'log-2', action: 'Event "Men\'s Singles" added', category: 'event', user_name: 'Rajesh Kumar', details: 'Tournament ID: t1, Entry limit: 32', created_at: new Date(Date.now() - 3600000 * 24 * 9).toISOString() },
  { id: 'log-3', action: 'Player Priya Sharma registered', category: 'registration', user_name: 'Priya Sharma', details: 'Registered for Mumbai Badminton Open 2025 (e1)', created_at: new Date(Date.now() - 3600000 * 24 * 8).toISOString() },
  { id: 'log-4', action: 'Player Priya Sharma approved', category: 'registration', user_name: 'Rajesh Kumar', details: 'Approved for Mumbai Badminton Open 2025', created_at: new Date(Date.now() - 3600000 * 5).toISOString() }
];

// ---- Tournament Media ----
export const mockTournamentMedia: TournamentMedia[] = [
  {
    id: 'media-1',
    tournament_id: 't1',
    uploaded_by: 'u1',
    file_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&q=80',
    caption: 'Mumbai Open 2025 opening ceremony and main court preparation.',
    media_type: 'image',
    created_at: '2025-06-14T10:00:00Z',
  },
  {
    id: 'media-2',
    tournament_id: 't1',
    uploaded_by: 'u1',
    file_url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&q=80',
    caption: 'High-intensity rally during the Men\'s Singles practice sessions.',
    media_type: 'image',
    created_at: '2025-06-14T14:30:00Z',
  },
  {
    id: 'media-3',
    tournament_id: 't1',
    uploaded_by: 'u1',
    file_url: 'https://images.unsplash.com/photo-1613918431208-6752fe4ef70d?w=1200&q=80',
    caption: 'Action shot of a decisive smash from the mixed doubles qualifiers.',
    media_type: 'image',
    created_at: '2025-06-15T09:15:00Z',
  },
  {
    id: 'media-4',
    tournament_id: 't1',
    uploaded_by: 'u1',
    file_url: 'https://images.unsplash.com/photo-1521537634199-673a1e022146?w=1200&q=80',
    caption: 'Match gear setup on standard BWF-approved synthetic court.',
    media_type: 'image',
    created_at: '2025-06-15T16:00:00Z',
  }
];

export function getTournamentMedia(tournamentId: string): TournamentMedia[] {
  return mockTournamentMedia.filter(m => m.tournament_id === tournamentId)
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
}

export function uploadTournamentMedia(tournamentId: string, media: Omit<TournamentMedia, 'id' | 'created_at'>): TournamentMedia {
  const newMedia: TournamentMedia = {
    ...media,
    id: `media-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    tournament_id: tournamentId,
    created_at: new Date().toISOString()
  };
  mockTournamentMedia.unshift(newMedia);
  return newMedia;
}

export function deleteTournamentMedia(tournamentId: string, mediaId: string): boolean {
  const index = mockTournamentMedia.findIndex(m => m.id === mediaId && m.tournament_id === tournamentId);
  if (index !== -1) {
    mockTournamentMedia.splice(index, 1);
    return true;
  }
  return false;
}

export function getMatchMedia(matchId: string): TournamentMedia[] {
  return mockTournamentMedia.filter(m => m.match_id === matchId)
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
}

export function uploadMatchMedia(matchId: string, media: Omit<TournamentMedia, 'id' | 'created_at'>): TournamentMedia {
  const newMedia: TournamentMedia = {
    ...media,
    id: `media-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    match_id: matchId,
    created_at: new Date().toISOString()
  };
  mockTournamentMedia.unshift(newMedia);
  return newMedia;
}

export function deleteMatchMedia(matchId: string, mediaId: string): boolean {
  const index = mockTournamentMedia.findIndex(m => m.id === mediaId && m.match_id === matchId);
  if (index !== -1) {
    mockTournamentMedia.splice(index, 1);
    return true;
  }
  return false;
}

// ---- Match Comments ----
export const mockMatchComments: MatchComment[] = [
  {
    id: 'comm-1',
    match_id: 'm1',
    user_name: 'Rahul Kumar',
    message: 'What a beautiful serve by Priya! Vikas looks completely off-balance.',
    created_at: new Date(Date.now() - 600000).toISOString()
  },
  {
    id: 'comm-2',
    match_id: 'm1',
    user_name: 'Deepa Menon',
    message: 'Awesome recovery by Vikas! That net chord play was unbelievable.',
    created_at: new Date(Date.now() - 400000).toISOString()
  },
  {
    id: 'comm-3',
    match_id: 'm1',
    user_name: 'Rajesh Kumar',
    message: 'Great rally, Priya leads 14-17 in set 2. This could go to a third set decider!',
    created_at: new Date(Date.now() - 200000).toISOString()
  }
];

export function getMatchComments(matchId: string): MatchComment[] {
  return mockMatchComments.filter(c => c.match_id === matchId)
    .sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
}

export function postMatchComment(matchId: string, comment: Omit<MatchComment, 'id' | 'created_at'>): MatchComment {
  const newComment: MatchComment = {
    ...comment,
    id: `comm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    match_id: matchId,
    created_at: new Date().toISOString()
  };
  mockMatchComments.push(newComment);
  return newComment;
}

export function deleteMatchComment(matchId: string, commentId: string): boolean {
  const index = mockMatchComments.findIndex(c => c.id === commentId && c.match_id === matchId);
  if (index !== -1) {
    mockMatchComments.splice(index, 1);
    return true;
  }
  return false;
}

// ---- Spectator Polls Mock Store ----
export interface MockMatchPoll {
  id: string;
  match_id: string;
  question: string;
  options: string[];
  votes: number[];
  created_at?: string;
}

export const mockPolls: MockMatchPoll[] = [];

export function getMatchPolls(matchId: string): MockMatchPoll[] {
  const polls = mockPolls.filter(p => p.match_id === matchId);
  if (polls.length === 0) {
    const match = mockMatches.find(m => m.id === matchId);
    const p1 = match ? match.player1_name : 'Player 1';
    const p2 = match ? match.player2_name : 'Player 2';
    
    const defaultPoll: MockMatchPoll = {
      id: `poll-default-${matchId}`,
      match_id: matchId,
      question: 'Who will win the match?',
      options: [p1, p2],
      votes: [0, 0],
      created_at: new Date().toISOString()
    };
    mockPolls.push(defaultPoll);
    return [defaultPoll];
  }
  return [...polls].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
}

export function createMatchPoll(matchId: string, question: string, options: string[]): MockMatchPoll {
  const newPoll: MockMatchPoll = {
    id: `poll-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    match_id: matchId,
    question: question,
    options: options,
    votes: options.map(() => 0),
    created_at: new Date().toISOString()
  };
  mockPolls.push(newPoll);
  return newPoll;
}

export function voteInMatchPoll(pollId: string, optionIndex: number): MockMatchPoll {
  let poll = mockPolls.find(p => p.id === pollId);
  if (!poll) {
    poll = {
      id: pollId,
      match_id: '',
      question: 'Who will win the match?',
      options: ['Player 1', 'Player 2'],
      votes: [0, 0],
      created_at: new Date().toISOString()
    };
    mockPolls.push(poll);
  }
  
  if (optionIndex >= 0 && optionIndex < poll.options.length) {
    const nextVotes = [...poll.votes];
    nextVotes[optionIndex] += 1;
    poll.votes = nextVotes;
  }
  return poll;
}

export function updateMockMatchesViewers(count: number): boolean {
  let updated = false;
  mockMatches.forEach(m => {
    if (m.status === 'running') {
      if (!m.max_viewers || count > m.max_viewers) {
        m.max_viewers = count;
        updated = true;
      }
    }
  });
  return updated;
}

export const mockLoginLogs = [
  {
    id: 'll-1',
    userId: 'sys1',
    email: 'sysadmin@matchpoint.io',
    userName: 'Siddharth Sen',
    loginTime: new Date(Date.now() - 600000).toISOString(),
    ipAddress: '192.168.1.12',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    status: 'success'
  },
  {
    id: 'll-2',
    userId: 'u1',
    email: 'admin@matchpoint.io',
    userName: 'Rajesh Kumar',
    loginTime: new Date(Date.now() - 1800000).toISOString(),
    ipAddress: '192.168.1.45',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    status: 'success'
  },
  {
    id: 'll-3',
    userId: 'sys2',
    email: 'sysadmin2@matchpoint.io',
    userName: 'Preeti Nair',
    loginTime: new Date(Date.now() - 3600000).toISOString(),
    ipAddress: '192.168.1.99',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    status: 'success'
  },
  {
    id: 'll-4',
    userId: 'u2',
    email: 'priya@matchpoint.io',
    userName: 'Priya Sharma',
    loginTime: new Date(Date.now() - 7200000).toISOString(),
    ipAddress: '10.0.0.8',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    status: 'success'
  },
  {
    id: 'll-5',
    userId: 'sys1',
    email: 'sysadmin@matchpoint.io',
    userName: 'Siddharth Sen',
    loginTime: new Date(Date.now() - 86400000).toISOString(),
    ipAddress: '192.168.1.12',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    status: 'success'
  },
  {
    id: 'll-6',
    userId: 'sys1',
    email: 'sysadmin@matchpoint.io',
    userName: 'Siddharth Sen',
    loginTime: new Date(Date.now() - 90000000).toISOString(),
    ipAddress: '192.168.1.12',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    status: 'failed_credentials'
  },
  {
    id: 'll-7',
    userId: 'unknown',
    email: 'intruder@badactor.net',
    userName: 'Unknown User',
    loginTime: new Date(Date.now() - 95000000).toISOString(),
    ipAddress: '185.220.101.5',
    userAgent: 'curl/7.79.1',
    status: 'failed_credentials'
  }
];


