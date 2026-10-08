--
-- PostgreSQL database dump
--


-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.user_logins DROP CONSTRAINT IF EXISTS user_logins_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tournaments DROP CONSTRAINT IF EXISTS tournaments_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.tournament_media DROP CONSTRAINT IF EXISTS tournament_media_uploaded_by_fkey;
ALTER TABLE IF EXISTS ONLY public.tournament_media DROP CONSTRAINT IF EXISTS tournament_media_tournament_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tournament_feedback DROP CONSTRAINT IF EXISTS tournament_feedback_tournament_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tournament_events DROP CONSTRAINT IF EXISTS tournament_events_tournament_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tournament_events DROP CONSTRAINT IF EXISTS tournament_events_master_event_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tournament_certificates DROP CONSTRAINT IF EXISTS tournament_certificates_tournament_id_fkey;
ALTER TABLE IF EXISTS ONLY public.teams DROP CONSTRAINT IF EXISTS teams_tournament_id_fkey;
ALTER TABLE IF EXISTS ONLY public.teams DROP CONSTRAINT IF EXISTS teams_captain_id_fkey;
ALTER TABLE IF EXISTS ONLY public.registrations DROP CONSTRAINT IF EXISTS registrations_tournament_id_fkey;
ALTER TABLE IF EXISTS ONLY public.registrations DROP CONSTRAINT IF EXISTS registrations_player_id_fkey;
ALTER TABLE IF EXISTS ONLY public.registrations DROP CONSTRAINT IF EXISTS registrations_event_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_orders DROP CONSTRAINT IF EXISTS payment_orders_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_orders DROP CONSTRAINT IF EXISTS payment_orders_registration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.matches DROP CONSTRAINT IF EXISTS matches_umpire_id_fkey;
ALTER TABLE IF EXISTS ONLY public.matches DROP CONSTRAINT IF EXISTS matches_tournament_id_fkey;
ALTER TABLE IF EXISTS ONLY public.matches DROP CONSTRAINT IF EXISTS matches_event_id_fkey;
ALTER TABLE IF EXISTS ONLY public.match_polls DROP CONSTRAINT IF EXISTS match_polls_match_id_fkey;
ALTER TABLE IF EXISTS ONLY public.match_history DROP CONSTRAINT IF EXISTS match_history_tournament_id_fkey;
ALTER TABLE IF EXISTS ONLY public.match_history DROP CONSTRAINT IF EXISTS match_history_match_id_fkey;
ALTER TABLE IF EXISTS ONLY public.match_history DROP CONSTRAINT IF EXISTS match_history_event_id_fkey;
ALTER TABLE IF EXISTS ONLY public.match_comments DROP CONSTRAINT IF EXISTS match_comments_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.match_comments DROP CONSTRAINT IF EXISTS match_comments_match_id_fkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
DROP INDEX IF EXISTS public.idx_user_logins_user_id;
DROP INDEX IF EXISTS public.idx_user_logins_time;
DROP INDEX IF EXISTS public.idx_transactions_session;
DROP INDEX IF EXISTS public.idx_tournaments_status;
DROP INDEX IF EXISTS public.idx_tournaments_sport;
DROP INDEX IF EXISTS public.idx_tournaments_created_by;
DROP INDEX IF EXISTS public.idx_tournament_media_uploaded_by;
DROP INDEX IF EXISTS public.idx_tournament_media_tour;
DROP INDEX IF EXISTS public.idx_tournament_feedback_tournament;
DROP INDEX IF EXISTS public.idx_tournament_events_tour_id;
DROP INDEX IF EXISTS public.idx_tournament_events_master_event;
DROP INDEX IF EXISTS public.idx_teams_tour_id;
DROP INDEX IF EXISTS public.idx_teams_captain_id;
DROP INDEX IF EXISTS public.idx_registrations_tournament_id;
DROP INDEX IF EXISTS public.idx_registrations_tour_id;
DROP INDEX IF EXISTS public.idx_registrations_player_id;
DROP INDEX IF EXISTS public.idx_registrations_event_id;
DROP INDEX IF EXISTS public.idx_profiles_email;
DROP INDEX IF EXISTS public.idx_payment_transactions_order_id;
DROP INDEX IF EXISTS public.idx_payment_orders_user_id;
DROP INDEX IF EXISTS public.idx_payment_orders_registration_id;
DROP INDEX IF EXISTS public.idx_payment_orders_razorpay_order_id;
DROP INDEX IF EXISTS public.idx_password_resets_email;
DROP INDEX IF EXISTS public.idx_matches_winner_id;
DROP INDEX IF EXISTS public.idx_matches_umpire_id;
DROP INDEX IF EXISTS public.idx_matches_tournament_id;
DROP INDEX IF EXISTS public.idx_matches_tour_id;
DROP INDEX IF EXISTS public.idx_matches_status;
DROP INDEX IF EXISTS public.idx_matches_sport;
DROP INDEX IF EXISTS public.idx_matches_player2_id;
DROP INDEX IF EXISTS public.idx_matches_player1_id;
DROP INDEX IF EXISTS public.idx_matches_p2_id;
DROP INDEX IF EXISTS public.idx_matches_p1_id;
DROP INDEX IF EXISTS public.idx_matches_event_id;
DROP INDEX IF EXISTS public.idx_match_history_tournament;
DROP INDEX IF EXISTS public.idx_match_history_match;
DROP INDEX IF EXISTS public.idx_match_history_event;
DROP INDEX IF EXISTS public.idx_match_comments_user_id;
DROP INDEX IF EXISTS public.idx_match_comments_match;
DROP INDEX IF EXISTS public.idx_audit_logs_user_id;
DROP INDEX IF EXISTS public.idx_audit_logs_created_at;
DROP INDEX IF EXISTS public.idx_activity_logs_created_at;
ALTER TABLE IF EXISTS ONLY public.user_logins DROP CONSTRAINT IF EXISTS user_logins_pkey;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_stripe_session_id_key;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.tournaments DROP CONSTRAINT IF EXISTS tournaments_slug_key;
ALTER TABLE IF EXISTS ONLY public.tournaments DROP CONSTRAINT IF EXISTS tournaments_pkey;
ALTER TABLE IF EXISTS ONLY public.tournament_media DROP CONSTRAINT IF EXISTS tournament_media_pkey;
ALTER TABLE IF EXISTS ONLY public.tournament_feedback DROP CONSTRAINT IF EXISTS tournament_feedback_pkey;
ALTER TABLE IF EXISTS ONLY public.tournament_events DROP CONSTRAINT IF EXISTS tournament_events_pkey;
ALTER TABLE IF EXISTS ONLY public.tournament_certificates DROP CONSTRAINT IF EXISTS tournament_certificates_tournament_id_key;
ALTER TABLE IF EXISTS ONLY public.tournament_certificates DROP CONSTRAINT IF EXISTS tournament_certificates_pkey;
ALTER TABLE IF EXISTS ONLY public.teams DROP CONSTRAINT IF EXISTS teams_pkey;
ALTER TABLE IF EXISTS ONLY public.support_requests DROP CONSTRAINT IF EXISTS support_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.registrations DROP CONSTRAINT IF EXISTS registrations_pkey;
ALTER TABLE IF EXISTS ONLY public.registrations DROP CONSTRAINT IF EXISTS registrations_event_id_player_id_key;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_email_key;
ALTER TABLE IF EXISTS ONLY public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_razorpay_payment_id_key;
ALTER TABLE IF EXISTS ONLY public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.payment_orders DROP CONSTRAINT IF EXISTS payment_orders_razorpay_order_id_key;
ALTER TABLE IF EXISTS ONLY public.payment_orders DROP CONSTRAINT IF EXISTS payment_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.password_resets DROP CONSTRAINT IF EXISTS password_resets_pkey;
ALTER TABLE IF EXISTS ONLY public.matches DROP CONSTRAINT IF EXISTS matches_pkey;
ALTER TABLE IF EXISTS ONLY public.match_polls DROP CONSTRAINT IF EXISTS match_polls_pkey;
ALTER TABLE IF EXISTS ONLY public.match_history DROP CONSTRAINT IF EXISTS match_history_pkey;
ALTER TABLE IF EXISTS ONLY public.match_comments DROP CONSTRAINT IF EXISTS match_comments_pkey;
ALTER TABLE IF EXISTS ONLY public.feature_flags DROP CONSTRAINT IF EXISTS feature_flags_pkey;
ALTER TABLE IF EXISTS ONLY public.feature_flags DROP CONSTRAINT IF EXISTS feature_flags_flag_key_key;
ALTER TABLE IF EXISTS ONLY public.events_master DROP CONSTRAINT IF EXISTS events_master_pkey;
ALTER TABLE IF EXISTS ONLY public.database_restore_requests DROP CONSTRAINT IF EXISTS database_restore_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_pkey;
DROP TABLE IF EXISTS public.user_logins;
DROP TABLE IF EXISTS public.transactions;
DROP TABLE IF EXISTS public.tournaments;
DROP TABLE IF EXISTS public.tournament_media;
DROP TABLE IF EXISTS public.tournament_feedback;
DROP TABLE IF EXISTS public.tournament_events;
DROP TABLE IF EXISTS public.tournament_certificates;
DROP TABLE IF EXISTS public.teams;
DROP TABLE IF EXISTS public.support_requests;
DROP TABLE IF EXISTS public.registrations;
DROP TABLE IF EXISTS public.profiles;
DROP TABLE IF EXISTS public.payment_transactions;
DROP TABLE IF EXISTS public.payment_orders;
DROP TABLE IF EXISTS public.password_resets;
DROP TABLE IF EXISTS public.matches;
DROP TABLE IF EXISTS public.match_polls;
DROP TABLE IF EXISTS public.match_history;
DROP TABLE IF EXISTS public.match_comments;
DROP TABLE IF EXISTS public.feature_flags;
DROP TABLE IF EXISTS public.events_master;
DROP TABLE IF EXISTS public.database_restore_requests;
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.activity_logs;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text,
    user_name text DEFAULT 'Anonymous'::text,
    activity_type character varying(50) NOT NULL,
    details text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    action text NOT NULL,
    category text NOT NULL,
    user_id text,
    user_name text NOT NULL,
    details text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: database_restore_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.database_restore_requests (
    id uuid NOT NULL,
    backup_data text NOT NULL,
    requested_by character varying(255) NOT NULL,
    approved_by character varying(255),
    status character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone NOT NULL
);


--
-- Name: events_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events_master (
    id text NOT NULL,
    name text NOT NULL,
    event_type character varying(20) NOT NULL,
    category character varying(20) NOT NULL,
    gender character varying(20) NOT NULL,
    min_age integer,
    max_age integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT events_master_category_check CHECK (((category)::text = ANY ((ARRAY['junior'::character varying, 'open'::character varying, 'veteran'::character varying])::text[]))),
    CONSTRAINT events_master_event_type_check CHECK (((event_type)::text = ANY ((ARRAY['singles'::character varying, 'doubles'::character varying, 'team'::character varying])::text[]))),
    CONSTRAINT events_master_gender_check CHECK (((gender)::text = ANY ((ARRAY['Male'::character varying, 'Female'::character varying, 'Mixed'::character varying, 'Open'::character varying])::text[])))
);


--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    flag_key character varying(100) NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    is_enabled boolean DEFAULT false NOT NULL,
    config jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: match_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_comments (
    id text NOT NULL,
    match_id text NOT NULL,
    user_id text,
    user_name text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: match_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_history (
    id text NOT NULL,
    match_id text NOT NULL,
    tournament_id text,
    event_id text,
    umpire_id text,
    umpire_name text,
    player1_name text,
    player2_name text,
    scoring_format text,
    best_of_games integer DEFAULT 3,
    court text,
    points_history jsonb DEFAULT '[]'::jsonb,
    sets_snapshot jsonb DEFAULT '[]'::jsonb,
    total_duration_seconds integer,
    play_time_seconds integer,
    paused_time_seconds integer,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    winner_id text,
    winner_name text,
    final_status text DEFAULT 'completed'::text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: match_polls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_polls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    match_id text NOT NULL,
    question text NOT NULL,
    options jsonb DEFAULT '[]'::jsonb NOT NULL,
    votes jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matches (
    id text NOT NULL,
    tournament_id text,
    event_id text,
    fixture_round integer DEFAULT 1,
    fixture_position integer DEFAULT 0,
    court text,
    player1_id text,
    player1_name text NOT NULL,
    player2_id text,
    player2_name text NOT NULL,
    umpire_id text,
    umpire_name text,
    scheduled_time timestamp with time zone,
    actual_start_time timestamp with time zone,
    actual_end_time timestamp with time zone,
    duration_seconds integer,
    status text NOT NULL,
    winner_id text,
    sets jsonb DEFAULT '[]'::jsonb NOT NULL,
    sub_matches jsonb DEFAULT '[]'::jsonb,
    is_adhoc boolean DEFAULT false,
    adhoc_type character varying(50),
    max_viewers integer DEFAULT 0,
    sport character varying(50) DEFAULT 'badminton'::character varying,
    sport_metadata jsonb DEFAULT '{}'::jsonb,
    round_name character varying(255),
    CONSTRAINT matches_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'running'::text, 'paused'::text, 'completed'::text])))
);


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_resets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    otp_hash character varying(64) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    attempts integer DEFAULT 0,
    is_verified boolean DEFAULT false,
    reset_token character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: payment_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text,
    registration_id text,
    amount numeric(10,2) NOT NULL,
    currency character varying(10) DEFAULT 'INR'::character varying NOT NULL,
    razorpay_order_id character varying(100) NOT NULL,
    status character varying(50) DEFAULT 'created'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    razorpay_payment_id character varying(100) NOT NULL,
    payment_method character varying(50),
    status character varying(50) NOT NULL,
    paid_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    phone text,
    roles text[] DEFAULT '{player}'::text[] NOT NULL,
    avatar text,
    password_hash character varying(255),
    age integer,
    gender character varying(10),
    date_of_birth date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registrations (
    id text NOT NULL,
    tournament_id text,
    event_id text,
    player_id text,
    player_name text NOT NULL,
    player_email text NOT NULL,
    status text NOT NULL,
    disqualification_reason text,
    registered_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    seed integer,
    partner_name character varying(100),
    partner_email character varying(100),
    partner_gender character varying(10),
    partner_age integer,
    payment_status character varying(20) DEFAULT 'unpaid'::character varying,
    payment_method character varying(20) DEFAULT 'stripe'::character varying,
    CONSTRAINT registrations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'waitlisted'::text, 'disqualified'::text])))
);


--
-- Name: support_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    organization text,
    message text NOT NULL,
    status text DEFAULT 'open'::text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id text NOT NULL,
    name text NOT NULL,
    tournament_id text,
    logo_color text NOT NULL,
    captain_id text,
    players text[] DEFAULT '{}'::text[] NOT NULL
);


--
-- Name: tournament_certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tournament_certificates (
    id text NOT NULL,
    tournament_id text,
    title text NOT NULL,
    template_type text DEFAULT 'classic'::text,
    signature_data text,
    border_color text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: tournament_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tournament_events (
    id text NOT NULL,
    tournament_id text,
    master_event_id text,
    entry_limit integer DEFAULT 32 NOT NULL,
    format text NOT NULL,
    scoring_format text DEFAULT '21-point'::text NOT NULL,
    registrations_count integer DEFAULT 0,
    entry_fee numeric(10,2),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    gender_restriction character varying(20) DEFAULT 'open'::character varying,
    age_limit integer,
    age_restriction_type character varying(10) DEFAULT 'max'::character varying,
    event_type character varying(20),
    gender character varying(20),
    age_category character varying(20),
    min_age integer,
    max_age integer,
    sport character varying(50) DEFAULT 'badminton'::character varying,
    CONSTRAINT tournament_events_format_check CHECK ((format = ANY (ARRAY['knockout'::text, 'round_robin'::text, 'swiss'::text, 'league'::text, 'hybrid'::text])))
);


--
-- Name: tournament_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tournament_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tournament_id text,
    user_id text,
    user_name text DEFAULT 'Anonymous'::text,
    feedback_type text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: tournament_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tournament_media (
    id text NOT NULL,
    tournament_id text,
    uploaded_by text,
    file_url text NOT NULL,
    caption text,
    media_type character varying(20) DEFAULT 'image'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    match_id character varying(255)
);


--
-- Name: tournaments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tournaments (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    location text,
    banner text,
    start_date date,
    end_date date,
    type text NOT NULL,
    status text NOT NULL,
    created_by text,
    team_size_limit integer DEFAULT 4,
    team_tie_events text[] DEFAULT '{MS,MD,XD}'::text[],
    team_tie_configs jsonb DEFAULT '[]'::jsonb,
    bonus_point_margin integer DEFAULT 5,
    bonus_point_value integer DEFAULT 1,
    age_cutoff_date date,
    withdraw_date date,
    admins text[] DEFAULT '{}'::text[],
    payment_options jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    collects_fees boolean DEFAULT false,
    entry_fee numeric(10,2) DEFAULT 0.00,
    currency character varying(3) DEFAULT 'INR'::character varying,
    stripe_account_id character varying(100),
    platform_fee_percentage numeric(5,2) DEFAULT 2.00,
    sport character varying(50) DEFAULT 'badminton'::character varying,
    CONSTRAINT tournaments_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'open'::text, 'live'::text, 'completed'::text, 'cancelled'::text]))),
    CONSTRAINT tournaments_type_check CHECK ((type = ANY (ARRAY['individual'::text, 'team'::text])))
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    registration_id text,
    tournament_id text,
    amount numeric(10,2) NOT NULL,
    platform_fee numeric(10,2) NOT NULL,
    currency character varying(3) NOT NULL,
    status character varying(20) NOT NULL,
    stripe_session_id character varying(255),
    stripe_charge_id character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_logins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_logins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    login_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address character varying(45),
    user_agent text,
    status character varying(50) NOT NULL
);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_logs (id, user_id, user_name, activity_type, details, created_at) FROM stdin;
1de60bdf-b93f-4704-9c5e-71018b783d90	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 05:37:07.977013+00
f01e9dc8-2b2a-4095-bbcd-f3f7ba863fde	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:27:26.005035+00
a4ac091f-3ccf-4029-8602-ef5353e5998a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:27:44.391011+00
fbd3bede-16ef-492b-9453-1e33dc8dce91	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 08:58:19.579151+00
a308ec16-f934-4bbc-b192-67a9a5744d82	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 14:27:26.872601+00
1114582f-43a4-44d6-9fa6-a72ce3ac1d46	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:02:50.009188+00
63fcf5a8-aa9c-4345-99a4-463ac372e90b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 10:04:29.359106+00
052be95f-ade9-49e5-824b-c2fb81f1875e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 05:37:07.977042+00
eae4a8d0-e2ae-4790-a04e-26d6a642e236	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:30:31.211786+00
7114f482-6544-45ce-8db2-d09694c094bc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:30:31.226143+00
474816f4-f3d1-4674-a191-8b1e71cfa863	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 08:58:31.157143+00
392c10bc-4ac3-4b51-838c-6525e8094cae	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 06:13:18.656851+00
a2359558-8572-4e29-b302-59c0d8fe4137	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 06:13:34.283575+00
99461d11-a3ed-490a-93e1-d1fccd5a2768	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 06:13:42.829474+00
b1b3ea1a-8c59-413a-9767-1d2be59cc4c2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 06:13:42.887919+00
47475602-69e1-4a17-a430-fd361d1bc937	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:08:05.541051+00
1d6b3b7c-bfeb-41d1-80fb-a57195f36b9b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:08:06.94032+00
8941c536-10ff-4e2d-93d4-c6de746e55ba	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:11:02.668504+00
fecc93ca-6ad7-43fe-ad0f-4c2ae727fa8d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:11:11.790178+00
aaa6cacf-4956-46b5-8453-f2c2dba262fb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:12:08.397276+00
8f2651f8-b901-4864-aa06-e1e9ad192e6c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 10:04:29.370177+00
46188fb3-f1ac-4cb1-a227-22d9a012f3b1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 05:51:02.767835+00
b65075e0-00ed-47df-8f76-c93be689e30f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:30:51.50309+00
fb57ab36-be50-4a9e-99d7-31aa4a4c5523	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 08:58:31.174424+00
68952387-b409-424d-8a1c-8c80d9c76ba1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 08:58:35.307674+00
1205ab74-2bfd-4876-bbf6-10a40daf9b9a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 08:58:35.333991+00
0910b61d-6208-45c1-8363-ffdf9dd15d0c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 06:13:34.277455+00
c3668926-7e0b-487c-bf33-4c7bb29c3241	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 06:15:13.983601+00
fe3d056b-0733-4629-b712-d1df2bd4bc54	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 06:15:16.690628+00
d95eeb2d-1b5a-418a-a88b-7c88096e9402	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 06:15:16.701788+00
5e4f0b29-092d-463f-bce4-45d3a7a679a7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 06:15:31.511016+00
db4668e2-f155-470e-ae96-a09b9727f31f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:08:05.545361+00
12ad94b7-43ce-402a-92c3-bc1f31cf1437	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:44:27.070552+00
be76b88d-c4f3-4902-bac8-dc60b98db81a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:44:37.070547+00
9ce0c917-2d7d-4e16-9c78-0887a2115645	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:44:40.437129+00
9601e9fb-8695-4e35-824c-e009b1a083a8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 05:54:28.804738+00
270db803-e070-4fcc-9c02-11cb399fa496	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 05:54:36.880533+00
e461b912-bd2e-4b2a-9e5d-c61ed9727c28	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 05:54:39.642824+00
acefc833-a748-49f6-af38-12776b35766e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 05:54:39.826475+00
4e8db7f5-0018-4d66-8efc-eb5f2fd6e3a7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:30:51.503862+00
9603f216-01a6-40d5-9ce5-cf7745ab97aa	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 09:20:40.159936+00
b4ab6bc9-7739-4e43-9b90-2113f70a0f67	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 06:15:35.015907+00
b1ee3733-db3f-4c3f-81bc-7ebc56c40642	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 06:15:35.029085+00
8fc582e7-f290-4bdc-8f12-8c07b142d484	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 06:16:27.135109+00
8dcc4469-756a-45a0-9213-ad46c9d1ac99	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 06:16:30.381693+00
7f680472-6ff1-42fb-a4a6-9b7de04bb0d4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:08:06.931027+00
18aeba2f-1931-4fac-9c44-1fdf8c930d0b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:11:02.667584+00
04eb2bdc-22aa-4e37-a322-0234e7b617c7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:11:11.790243+00
6de40e46-3ed3-491d-9483-b9d4a0ce44db	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:44:27.070551+00
e7e32e44-e4cb-4932-bc8a-cd75031aad37	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:44:37.063547+00
85b8808d-9ae5-4db9-b087-2c29ee52241f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:44:39.468358+00
7d7a793a-5456-4a06-a170-0f1ebccb86b6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:44:39.477024+00
8945d20e-2337-4912-a03c-1c15bfb3db48	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:45:46.482134+00
364bcbe3-9427-45e3-9f5c-9813d984e54d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:46:09.072746+00
9fe7f9b7-3834-49a6-aebf-a542c0972ad1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:46:09.138935+00
a3c2e173-ad32-407f-a3a5-71fbcefdd6d6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 05:54:36.88404+00
47941fda-d725-4dbc-b344-121b4ebf97b4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:39:54.272782+00
68839560-7df4-4b5a-a86b-5ac5bd3c5be0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 09:20:40.187958+00
261dbd8b-6b20-44f3-8edd-df359149ba9b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 06:16:27.135328+00
33450e78-deeb-484d-a6a7-93b77019a43e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 06:16:30.374679+00
d52149dd-a237-44d6-b5e8-8c4a63ab74b1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:16:29.025378+00
7d0f3100-86e6-4d95-ab09-44b84e3c0671	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:44:40.447224+00
2dd1c2a1-8396-4c8f-a430-6c7cb07118aa	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 05:56:17.872846+00
2e811280-4e90-42ec-8296-4c266758c013	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:52:53.060124+00
fbfd94a6-7c1f-4885-b73e-a6b5549aae26	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:52:53.117575+00
4e42cdf9-05b7-496b-9a3f-ac2289552968	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:52:53.143549+00
8166aa4c-daea-4076-9673-444ea9aee9c7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:53:05.061347+00
93503235-64e9-40e5-91f7-994715483397	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 09:30:56.637795+00
5ee47129-7d66-47bc-aafa-f3fbfb897bff	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 09:30:56.651136+00
621d5b29-6e75-4708-85fe-ddd041095c86	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 06:20:59.995321+00
84fa8abd-5479-45fa-8419-8a5d71583cc5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 06:21:05.812336+00
6feaa12b-327a-49cb-a452-4387fe620a9e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:28:22.074433+00
dffb0094-7d2d-4b25-8f13-944f83b68159	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:28:24.707725+00
6f94e607-fc8e-4009-916d-390c4deb0300	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:29:41.964975+00
6e11d108-ac1c-45f8-8413-61dc7ec5f2f6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:31:18.269702+00
b6cefaa9-3084-4ba6-8ced-a1fa12dd9543	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:31:55.757485+00
5b5f298b-9ef1-4093-96dc-4bbc45545127	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:45:46.476539+00
349d9078-d6f6-4de5-ac81-5d5b6d3f39d0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:47:33.970871+00
fdcad6ef-c14e-43bb-8cdc-e228ae305dfe	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:47:33.98872+00
935595ac-7ab3-48f8-9042-55cca6beadb2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:48:52.125317+00
19a6ec92-62e6-4c1b-a1b0-b63ad1616d42	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:49:30.889814+00
df4540df-1b2a-4f4d-b9f3-70373390ef4f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:49:40.18248+00
fd7aed34-95de-4dd7-853d-b71a370483cb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:49:49.253369+00
9d56bedd-2fcd-4efa-bc82-bb039b830bef	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:50:09.931635+00
3fbc68c3-ca8f-4764-bab3-179c6f714011	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:50:09.939975+00
02573f5b-60d8-4d4e-ab0c-5eb6b2d7d536	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:50:11.225423+00
bbcd9142-6311-4013-b908-23203c3ce43b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 05:56:17.893497+00
26fd0540-6d3e-4bc1-ac8e-a2b2d0b6463c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:00:56.250973+00
39876f26-0813-4744-a494-44d7a960496d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:53:05.043729+00
45579f71-84ce-41bf-ac80-a85c0c3c0a18	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:53:05.067753+00
ca558572-1504-40d3-bf72-ad39777dc357	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:53:28.648385+00
61c12481-e4bb-4e93-ae4f-4f1892b0d15a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:53:28.709697+00
7f65af40-56c3-4736-be75-fed89ff0f519	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 09:31:00.382385+00
c4661754-64f2-49e2-a698-76bff768ca76	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 09:32:51.10693+00
d556c3f5-8232-48ae-8a1e-c52e80eb9196	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 06:21:05.813538+00
fa45ce48-09d8-4409-a922-a38d7ae16642	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:28:22.080502+00
e157da87-6eb9-4fbc-9a10-ebba11f1410d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:28:24.779615+00
7601e519-0ca3-493c-ac72-8d5270c68e76	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:29:43.930711+00
50791db1-ef80-4f79-a013-8254eb5711ae	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:29:43.964433+00
6649cf6e-cc10-45ff-a273-ce33122b8954	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:31:15.721779+00
0fb70d88-ed67-44a8-b11e-fdaa5a540cf5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:31:18.260362+00
03f94a2a-9488-4e40-b8f8-db388d5f7b0c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:31:51.639791+00
5d6ae7fe-163a-471e-9d53-23adabd8990d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:31:55.753875+00
9203e006-ab5c-44d0-ab8d-dd55f2af46db	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:47:35.406661+00
4e657960-1018-431f-8404-3017def9be15	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:47:35.418598+00
5231f28d-7f1e-4c9c-a3c6-3b2f576d45e1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:48:52.134553+00
34c78892-7fd3-4196-8a2f-5ad3ecae771b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:48:57.989223+00
5b338b77-9234-4909-8b27-eeffd03d9739	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:48:58.028014+00
1f3e4bf0-6d7a-4540-94dd-822faf5203f3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:49:15.169072+00
319ee1e7-23e9-4dc4-a917-e2d026b8932e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:49:33.829857+00
770b976d-81dc-4481-a4ca-56daa4f5c516	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:49:38.482606+00
b3460aea-3501-4087-bb93-c8c5ca36111a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:49:40.195493+00
606107b1-eade-418c-af37-eceab8322d83	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:49:53.337256+00
31a9b15e-76c6-49d0-8f13-494ac94f25c8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:50:11.231165+00
6ef36440-bacc-4fa5-bf34-d0d6d9b9baa5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 12:01:45.159562+00
01af7821-f255-449c-af9f-754370c20c61	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 12:09:59.748025+00
fd7444fd-820f-46bd-b59b-53472a2ae020	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 12:22:30.493089+00
32adba80-370a-4f88-86a1-7358a3de8bec	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 12:22:30.570949+00
97fc05a6-fcb8-4c8f-9f65-8ecaf38c25a5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 12:22:53.463024+00
c61e9996-06dd-47cb-81ee-b3e119210aa4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 12:22:53.496656+00
7fb7aa9e-7e9a-42e2-819b-e8d6757082e3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 12:22:58.681751+00
4b9134a5-bbcc-4322-b278-6627c23afbe7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 12:22:58.689636+00
0937c086-6c58-464a-81d4-2e5c30194ae3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 12:23:06.305388+00
d5ce8a42-f4d1-44d3-ae34-4a364ca33be6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 12:27:44.678117+00
0678a84d-7d94-4d1b-a0fa-7e703ad19ec0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 12:27:49.006621+00
2791f088-88c7-4869-8d13-e5a17fb746c6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 12:27:49.051789+00
93b482a4-6cc2-49c5-b2a3-f27e593eff7e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 12:28:03.077943+00
f3387d46-e850-422e-a1ba-5370d075fcf3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 12:28:07.516567+00
386bf66d-e4fd-41b4-935d-88568864e484	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 12:28:18.806396+00
7c6723d4-8d52-428c-a140-b4d776bd2bb1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 12:28:18.806225+00
8d5f080e-5a84-4166-b8c5-d8f0f8a1e558	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:52:49.653418+00
7a7ea588-49ca-4f61-9017-a7563e3b327f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:52:51.321935+00
2373295e-defe-4577-9bc2-8935a96dc8e3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:52:53.314068+00
64632ae0-d0db-4fb4-a682-79abd7f5e563	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:52:55.316587+00
dccba811-199e-4e63-9ec1-c7f7172d73a6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:52:57.328312+00
5273ac7e-de2d-4efe-8a21-a0da0066dd5f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:52:59.319485+00
49a3cfe1-40fd-4ae1-a203-ef6ca0fb764f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:01.377067+00
d779c401-e466-4ee0-976b-700ae75351c5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:03.377737+00
1525378f-abed-4ffc-b28d-589cf836c942	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:05.369003+00
6695fde7-6ec8-42bd-8638-a6ad391f9760	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:07.381952+00
e50dca72-9c4e-4970-8f90-5f46c3d7add1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:09.370176+00
5d97f044-555e-4a42-95c9-0f58217a8ba1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:11.365724+00
9f204779-5167-400c-8ee6-ee7b1faef765	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:13.363828+00
8220675b-3a90-49a3-a12d-f00a81787bd7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:15.367436+00
eed9ae3a-495a-4b31-8156-9429cb8d748c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:17.402201+00
452a2ae1-9904-4217-a7ae-66b919cbe07c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:19.363579+00
4e63ded3-24f5-4551-82b1-4ca7a61c2b51	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:21.361585+00
025dcd32-133c-4d9d-9ddc-f81b5fab0bf9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:23.383487+00
d983ac8a-44a8-4095-a465-a050d498fee7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:23.647424+00
135b6134-13f7-4323-a0c2-06e1fea2c079	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:23.675677+00
3968152c-7b50-4b40-aa72-c7ef52a17b21	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:25.379907+00
82e2edaa-5bb2-4672-b2fd-3c3463558c29	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:27.392596+00
54709dc3-46ec-410f-919f-fe039877d715	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:29.371462+00
505032b3-d83f-4057-b396-9fd3bbe70efb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:31.403859+00
aed3d91b-e51c-4584-a592-ff7aac9264f7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:33.363043+00
6781bf2e-c6a9-4c3b-8d08-a8c6f21022ef	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:35.39946+00
f68c5262-9b28-4668-9b77-cfea3c5bbf1f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:37.367302+00
5cd30b20-ed8f-4169-895a-e2f5133d034f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:39.364055+00
44943599-7c8b-435f-b0d7-a8524a377511	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:41.37887+00
54f9092e-7dd2-4811-a1ea-3625654a04dd	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:43.381639+00
ef3b4f7f-44f0-4a77-842a-081699d8a358	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:43.627846+00
f8998057-3f2b-4f1a-89d3-7c25cc9a9803	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:43.638236+00
251d428f-7174-437f-8566-76b7f49bc7ea	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:45.384449+00
86971f16-4d05-40a7-a03f-60b09215fa43	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:47.368241+00
96f3cc00-93e3-4e27-83cd-aa2f538385f9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:49.377696+00
ecf810fa-384d-4d16-9120-59747db0d930	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:51.369839+00
b3622466-afb1-41df-8c04-06cb52b50935	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:53.365825+00
8175fdc8-256b-40d7-8fab-386ae061aedd	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:55.374568+00
0cdc34a0-1850-43c0-abdc-6fed5f6ae029	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:57.362999+00
acd93def-3c32-4918-b482-8884bfade2c7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:53:59.364379+00
e41b61df-c0d9-4081-8643-8fe636b11839	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:54:13.7057+00
f1c662e7-0be9-4f9a-8dff-efda67286b99	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:54:13.714924+00
f1e434ec-1aaa-4ee7-8afa-fe32bf4bb03e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:54:26.403347+00
8e988a70-8711-465c-81d6-1752ce709717	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:54:32.628294+00
a1764623-b708-44b5-82ba-d123b2961b91	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:54:32.826598+00
2ff43225-82a6-4355-b02d-fe4030c26190	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:55:26.453983+00
4a72b775-4816-43c2-bf4c-2a3891f934e0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:55:39.043147+00
6388e371-9d68-42f7-ab82-233dc7990364	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:55:39.047135+00
e180bfa6-dff8-4802-8a51-4e5039d5a511	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:55:40.642539+00
9ac27448-d16c-47d7-951f-ad0587766305	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:55:40.653025+00
68caf92e-ee70-4190-8678-5e9736ffeb68	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:55:51.632714+00
248a025f-d510-49dc-b75c-7cd1f865bcce	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:55:51.632716+00
6b6343c5-c77e-4c97-9a9c-de0a32de71ec	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:56:26.700267+00
3b73929d-ac8e-43b6-b389-48ea9f0a36b9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:56:50.84441+00
de2852fe-a66f-49e5-8e94-34514f0e2e68	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:56:51.056445+00
df10e737-ff35-44bb-b462-2a65e491e1f7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:57:26.411739+00
20748678-e043-416d-9e6e-3d2bd6275129	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:57:53.323073+00
f43d13d4-9cef-4022-92ed-762df4744fee	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:57:55.362976+00
9241a905-8832-48d1-9bfb-b10968baa198	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:58:01.317214+00
7fc5537a-4b46-4867-a376-9199a59acd43	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:58:05.665848+00
f97d5438-2823-4de0-8943-f4dee6cc79c4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 05:56:19.313188+00
bc3ae7e5-5529-4292-9ef6-233fecee899b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 05:56:19.322263+00
2cf43dbf-a506-400a-a3f8-e8d37a429d7b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:53:28.675586+00
c00e6f33-0087-4f41-b9e7-e1b26227aef4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 09:31:00.394592+00
554cffd3-22ad-4235-8246-65f0c5e8e324	GUEST	Anonymous Visitor	CREATE_EVENT	Created event "Men's Open Volleyball" under tournament: t_7pd_vpl_s2	2026-10-06 09:31:59.452604+00
b8afb398-2eeb-4ee4-8284-0b52b7f2ca8d	GUEST	Anonymous Visitor	CREATE_EVENT	Created event "Women's Open Volleyball" under tournament: t_wvpl_2026	2026-10-06 09:32:34.065759+00
26a35eba-1f3f-414a-bbe9-e22ab8aeaf6e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 09:32:46.464061+00
b15ccee7-7455-4550-8d68-74d7e8720c3f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 09:32:46.476909+00
a49e2635-f589-4ba3-9c2c-23c8d1d321d9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 09:32:51.113839+00
16ec7392-ffeb-402d-ad02-0b3cad45bdb6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:14:38.188827+00
9bd612da-82cc-4e37-bd50-6361c2a5a189	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:15:48.92745+00
d7350381-2b2c-45d8-958c-57b7e92c8b1f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:35:31.278261+00
cf2f1dcb-4c87-4dd6-bc10-61fb05afbc0d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:35:42.363299+00
f16cbbe4-ca8b-4ecd-a93a-85f165eae131	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:35:42.366418+00
265e6efb-2bc9-422d-a1f5-81693d5a9894	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:49:15.166418+00
b2806876-83d8-41b2-b062-af8a76bc8022	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:49:33.808331+00
75a96a36-4395-4aeb-96f2-f1554978b3fd	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:57:11.808926+00
525f921c-b251-4f9d-ad50-c6dc18fd223a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:57:11.814853+00
17e56e83-80b1-4945-babb-91f259890d4c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:57:21.801772+00
adab9eee-03c3-4bd4-bcab-b9057b6f9e84	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:57:21.905263+00
4607a137-f10a-4f25-8c0b-337592c9c1cc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:57:50.747027+00
ab96952c-5ea7-4181-9cee-c3bb9c8cde93	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:57:51.328484+00
128d85c7-3560-4110-aacd-77cdd7e89f74	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:57:57.366463+00
18cb79df-e8f7-4db0-869c-716ed91d8718	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:57:59.317238+00
8b581f40-927e-4908-be6d-bc305b2278ae	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:58:03.31357+00
64fb6672-ee1b-4eb1-9530-6c03b29939b7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:58:13.112008+00
e5995925-03bf-4635-b4b8-fb286bc836ea	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 17:58:13.111844+00
daa131ba-8a98-4738-a0d0-f521263bdcc6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:00:56.293197+00
6fc2a0cd-7ec8-4b49-953e-ff3eed1e58d9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:00:58.525492+00
1f48596e-9352-4846-bc0a-6b0bd22265a6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:00:58.539574+00
e5f994ef-8e71-49f6-bf99-976298448627	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:10:18.483271+00
d62a2092-8934-4a15-b7a4-f1a2e825358f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:10:20.417711+00
edc1f897-366f-4022-8175-a69ec5d14ced	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:10:22.385662+00
0ae06053-4701-46c3-843e-e8d808d61454	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:10:24.380733+00
fbde8c3d-b18f-456e-890d-686e17a78feb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:10:26.416006+00
d9082faa-1e64-4201-aab3-0506cd081bf7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:10:28.377873+00
eab4f57c-7e81-477b-9c71-c0f05b278e6b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:10:30.38247+00
c571f6e9-2367-4e46-b782-301b5a4c6e36	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:10:32.38991+00
88f9bb01-4b61-4968-be5c-c0f760378bc2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:10:34.378669+00
4b285238-da4b-40c0-9dc7-ae6c7cfa2430	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:10:36.387351+00
7b426b31-2e9a-42bd-bf66-097f96d87843	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:10:38.380001+00
8602feeb-f882-4136-8a94-7b5f9bca996b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:10:45.36771+00
89b42dcd-c234-4925-abb0-a57f9e3369ae	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:10:49.84986+00
1553ee3c-57f9-4fe4-a02b-cad61e9b60d4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:10:51.793601+00
d299ef66-0a76-4f9d-b4b9-74705b2484bc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:12:56.419486+00
df586779-fec3-4b70-9fe3-0d366c279846	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:12:56.454305+00
75bd2ef7-f78d-447a-add6-b36d970737a2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:23:43.068719+00
ca07595a-0109-481c-b151-8106a61f347b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:28:35.701622+00
3a7a4dcc-8073-4f01-b404-276e2c31d2f0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:28:42.424845+00
42545136-8e3b-4a5a-ac6d-f97ad3d80fc9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:28:42.425032+00
564021b0-0c64-4aba-a3d3-527254605fb5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:29:03.004335+00
9aeaffc5-b814-48dd-8ee0-cebe11dae8bd	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:29:05.17076+00
85007c95-6a2f-4bb3-a98a-0dcf1d4b8a18	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:29:05.188457+00
2a80bf1a-070a-48c0-bf80-1a81d03d7408	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:30:15.932103+00
29ec970b-abb3-4ac2-9f33-72d1aa3be22f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:30:21.496923+00
fa3c85d3-f8b1-47a1-b8c2-ac26d9404676	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:30:21.49692+00
776cf034-4a9b-4fb3-99cd-86c176a775ac	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:30:25.260271+00
7110c5bf-bdf4-41bf-be7a-18850176cce7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:30:25.326804+00
da832acc-7f5d-4ba4-bf60-fb0afa7c23b0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:31:48.619595+00
60fc3b05-4c65-41ab-8593-f8a20c56dac7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:31:48.669873+00
32d77322-5178-4fee-943a-7cf80b3b9ecc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:32:05.864076+00
521fd02c-59ef-4fa0-a6d7-c19ef9af4570	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:32:05.874093+00
54d93a95-3833-4012-81d9-ac4eb4f58dda	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:32:08.856193+00
d4557cbc-ab04-4494-a17a-3c260c515189	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:32:09.047522+00
d4107e90-979b-4c7b-8fc1-f0fafcd3af75	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:32:57.452747+00
6482c69d-89cf-40f0-9e71-9084de30f0ee	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:32:57.461976+00
65c94799-181c-4694-b02e-371b1dbfe4a2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:33:08.082824+00
261668ec-7f39-496e-bb65-4aee5dbb1aa6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:33:08.182254+00
7df36b44-b0a7-4a7a-b30a-6556cbb3b57c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:33:24.09314+00
7d8505e5-f0b7-40cb-9dd9-3f52d87d2d9c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:33:24.09314+00
b77f130d-9474-4647-8030-032308d95215	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:34:23.303594+00
1e0b70cb-09a9-43a8-83bc-73701203cedb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:34:23.473664+00
9a61af86-d3df-472e-9a81-304667b2e4cc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:34:34.118588+00
5cc9d428-14b5-4bed-bb21-fc7ea2523111	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:34:34.134415+00
f04df760-e179-48d9-86c7-11b1098d1386	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:34:45.336457+00
0f5b93e8-d22f-4722-810a-23a22aafe301	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:34:45.580252+00
45e643ea-7b13-4f77-b298-253af6e2869c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:34:47.318845+00
d87b7ea1-de69-4f50-9774-109522a8a610	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:34:47.345485+00
dd9c08dc-9b42-4daf-9572-e8adf07ce493	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:35:52.758162+00
464686aa-7f13-4376-a039-1074d41be308	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:35:52.905946+00
60d30ab7-46e0-451a-8dba-0697e5afe250	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:39:59.677848+00
8d8562ed-28b6-4142-8f67-125ac60f1788	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:10.214119+00
51395494-6a9b-43ed-9670-45246613d019	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:12.175249+00
c867e407-c742-4736-8ed5-7b41ba339f43	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:14.191327+00
97fa3a52-5dda-412b-a570-a2eb64ea3636	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:16.175878+00
53239d08-a9a3-4a70-a507-ec15f4ad73c1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:18.193033+00
04883c31-5e66-4678-85ef-b2cf9f8e8940	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:20.202891+00
1c0fdbc2-5252-4e0d-8628-600496fceddc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:22.173492+00
38e8f823-dba4-4131-a1a8-5ff760312296	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:24.178177+00
5ac3f613-3952-48bf-a020-efd04872331c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:26.196591+00
1a8784fe-08b2-4c14-aa62-816d6e147215	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:28.175941+00
894c57cc-d65e-4c0b-87e0-f6b27582bb04	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:30.178944+00
71f4a7f5-fea2-4bc1-82da-d06a986f230d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:38.18543+00
8c33a631-d301-4b5c-aba4-b92f673331a9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:56.189399+00
d913eeac-31de-46d1-ab39-b6faf96b8339	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:42:00.171092+00
b935b5ba-4e68-4423-9a78-70dcae52aeeb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:42:04.171818+00
2a98f03e-8efb-4f35-8cc1-ff87169b3d19	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:42:14.194515+00
056391e1-05dc-413e-b3ec-56df293ebd95	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:42:22.17894+00
2299a565-f09e-4826-94fb-ffe329d6e63f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:42:28.178539+00
827b759b-1cbe-4ff5-97e3-e46ceb4f741f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:42:30.177739+00
07b39896-3baf-41de-b61b-39c2537fc5d8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:00:56.251397+00
e61a13fc-c41a-470f-8ec9-841175ad7d6f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:02:25.212653+00
c94ce6ae-1c3d-4c1e-b28c-0f25e3e828ef	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:02:25.219681+00
ec43baec-852c-442e-a04f-916b272be773	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:03:36.634179+00
ab4b2f6d-3d69-43f2-b161-c61aa6d6f753	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:59:09.933069+00
1b8e32e9-4549-4a91-b1f9-62efb4cb616e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:59:09.96868+00
5a95adce-2e78-421a-840d-20c170911aa0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 09:34:25.397202+00
882183cc-88cf-4010-82b9-a74e69aefdb2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:21:45.544794+00
b8454a6e-db99-42d6-9173-cca49f0a6267	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:21:45.559119+00
47deeacb-4521-4cf1-9025-221021a20f2e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:35:31.284151+00
8a3227b2-6479-4f7f-a74c-91f6f3d4a4ae	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:35:40.028851+00
7a5b7ba3-fcc3-4525-80a1-dbd27c94b267	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:35:40.035529+00
cc386921-3949-42d7-94f3-5ec9a2a5e6f1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:35:46.477955+00
b80bfcc3-f1e9-43d6-8a19-88b0dcd64ea1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:49:49.249242+00
6667fbe4-2eeb-4a05-8ee0-6fe64adbdccb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 11:49:53.321443+00
dee3f75e-e478-42bf-bc33-473053558e08	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:32.192116+00
c64b6a3a-76a4-4910-b2a1-1cfb3b34b974	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:34.173577+00
3c845d36-5a08-4124-af8e-e7651fa614ba	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:36.173412+00
90c13ecd-a94b-4306-9461-40518f77440c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:40.173801+00
de8f35d0-39f4-4b1b-aecd-db45432cc906	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:42.17123+00
4947dbc9-ff6a-437c-a293-3ada64b7e33c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:44.197025+00
93ad3134-4592-4577-b868-26525c23ee17	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:46.173072+00
366f96aa-322c-40de-8492-19e611541a52	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:48.170062+00
54d60fdf-2ec5-47da-8f1f-bc6abb493764	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:50.192159+00
d192ff84-30b5-4369-9e81-274ef20e1b5c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:52.174353+00
9ae07b31-d014-4331-98e6-6e5fa4cc6f7a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:54.170857+00
c2b510a3-6b3c-4c64-b40b-24234a58f645	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:41:58.171806+00
f9cd4a37-f4e9-49c1-8e0a-dd46c15d2940	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:42:02.183135+00
e2b60d9e-0408-4d8b-b7e4-9ee7e155e543	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:42:06.183429+00
5f13d3f7-4243-4d99-9f80-c69431c8d88a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:42:08.198384+00
0e9e6b65-d3f1-4ff1-a4e5-68045c338967	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:42:10.189139+00
e6b27ba0-ad34-4e61-a4cb-39aa62ce642c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:42:12.171572+00
0102edc6-e450-452b-bb05-73d61c8c1ee5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:42:16.171236+00
af25443f-7744-4451-a864-1a8443310cac	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:42:18.171537+00
3340af2d-800e-415c-a56b-b492eabdd3bb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:42:20.18028+00
74eb0c35-adf0-476e-bf9e-d78835533058	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:42:24.171106+00
de1d01d2-5f4d-4ca6-b8c0-382fad54936c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:42:26.18147+00
526e4a39-8098-4181-bb60-1db28f6a4d1f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:55:57.907819+00
68e56955-5eeb-435a-9c40-24b5e367b85c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:55:57.91318+00
41c26b26-a998-4bbc-8939-47b640baa01e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:05.213006+00
fd323c56-ea31-40e7-b38a-778abd2955ad	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:07.163948+00
358c7b35-49a5-4972-a86a-82b1a3375969	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:09.17604+00
ea24f660-b777-4174-850c-569ce5f674ee	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:11.161303+00
f1311342-eb34-44aa-ba19-24fea9cad629	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:13.156765+00
01df7954-d513-4ccc-a81f-2d5023ce8086	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:14.402973+00
ffb3f763-4552-4d8d-bdb9-7811aa5e5b76	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:14.411347+00
860150d9-2c9b-4f07-9477-c8c46d0d4ed4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:16.36476+00
6f8ead2a-0603-4e5b-a295-bf02e9a6393b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:16.983872+00
75392d5e-827a-4316-acd4-1c3cc0766117	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:16.988685+00
8280bd72-0b95-487d-b4f0-deb201256817	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:18.95931+00
e2b14164-05d5-4efc-b986-cdc09ab8c84c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:19.921575+00
d7460a2c-aedf-4131-ba73-db9721e5ffa1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:19.921574+00
0125e109-23ee-4ab7-82e4-348f90c02b6e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:21.902706+00
f7ca2ca5-8a5f-466d-96e1-468d2898d101	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:22.703216+00
977d76eb-c97b-449d-a18f-d326f264ad7c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:22.703285+00
3a6ebb33-1dfe-4c42-a435-38bb5b809764	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:24.701324+00
114d89fc-7907-4d74-a46f-64fe8582dbb8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:25.365948+00
32ffb1a4-4fa3-4ab7-8200-a271df638929	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:25.384354+00
989de2d5-df82-4364-94ff-b5a980e86c72	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:27.354101+00
b7a5bb82-cfe4-43a1-9d3b-8d452e6416b4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:29.355076+00
c4be6987-4bda-4bad-bbbd-8544749f812d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:31.347651+00
5c18a6cd-e188-40ab-91b9-709ed8f295dc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:33.350182+00
72201d27-5fff-4843-9cc7-fcf7e76e0be6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:35.356353+00
3e83351f-2443-48e6-a142-604575e28b38	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:37.350124+00
3c3f2f45-a625-4728-8494-ed1ba44f324e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:39.342198+00
1511f8cd-6097-4bba-af84-f113e4f99a82	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:41.345643+00
456be5d0-722c-4d19-9c7f-e59563e40c94	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:43.373867+00
33781979-7e07-436f-b43e-9ac00ef3769f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:45.407288+00
840a2e3d-1d13-4335-ae4e-ac47c2c445e3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:55.168384+00
c269e5f2-5087-4b97-b3bb-c9b0bc49bb01	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:56:55.168318+00
6700cdaf-c6a0-4dcb-96fa-899370f13b3f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:57:47.178347+00
ff3b6290-1ab6-4722-aaab-aa8e20720fc4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:57:50.178653+00
e7558306-c059-4afd-ba7c-465f340b2b14	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:57:50.185859+00
5165163e-420f-4c12-aafa-90a811ed4534	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:57:54.283142+00
71b33fed-a8e9-46e1-a6f9-c2a112020293	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:57:54.28839+00
e9b43ccb-a0bf-4703-b7ea-b2015708218a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:58:03.361003+00
42076689-230a-431b-8b57-035b4235e908	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:58:03.518447+00
8600e003-123b-43e7-ad9e-017b6f86dc0d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:58:20.733839+00
7bbf9408-28fd-4334-a789-e00d48ac1220	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:58:20.733764+00
340c0049-7f98-4d8d-9752-b0cde35d26c6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:59:12.554074+00
f890a779-fb64-4661-ab85-217386082143	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:59:12.723094+00
14a2b61c-7a86-4da7-aeb3-53cb9bc41943	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:59:14.378042+00
a3c70960-1513-415a-b9ab-43014011c82f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:59:14.419476+00
12d78962-e02d-43b5-93ac-78c455a33128	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:59:30.613312+00
b9429a32-7038-43be-9e0c-6d7ce450124a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:59:30.776542+00
801681e2-1663-49a8-b503-56510a1b55d2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:59:54.051606+00
a1be1f2c-0454-4578-9e0b-c94e9c3043d6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:00:00.812045+00
48db56fb-9ea4-4059-a7c1-7035af94df85	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:00:49.184929+00
845bcb8c-e488-4725-8c00-679b5b020de8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:00:51.180117+00
ff1c947b-8cd5-472e-894e-8d1420b50b50	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:00:57.181762+00
f88b9caf-247d-4ab0-994f-83709bfa32b7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:03.193893+00
efaee57c-76cc-4b7e-a212-1c64a05d754a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:09.189464+00
480a2d43-dfc8-4331-9a97-e36e5b475d55	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:11.20797+00
6a932b0e-b3d7-442c-a008-4bfc2d45fc12	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:13.384096+00
58483296-d475-4327-924c-589dc25a29bc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:15.379493+00
c2db8f1b-e2ce-481c-a525-2d70b31ecdb9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:21.38683+00
21e0338d-22d9-4b14-a453-31f9ef72e0e9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:23.386072+00
9c3ce293-3fa1-4715-8993-800f99167da0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:25.390244+00
c2268c26-7dfd-4d29-bb2c-cbfd9c9684ef	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:27.380523+00
e40fd890-8fae-4151-954c-cbe05cf9ed6b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:31.53519+00
ed390881-d92f-4538-a7cb-8ec345abb27d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:35.412567+00
0dd0bd5e-47e8-458b-adce-288ed3815dd8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:39.382317+00
cad0e97c-2224-4429-b31f-2040be04bc50	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:45.381016+00
346202c6-e5dc-41da-949e-72b52d59f569	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:59.429292+00
f23a0dbe-d98d-4f8a-8116-c8f73c6b6db3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:07.389559+00
94965651-aaa5-451e-b46a-cd6e0d85e42c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:19.376586+00
84fe8a5d-af3b-44aa-85f4-afe084eaed53	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:21.374041+00
e7bcfc53-137d-4ec9-bc1b-bd9092bfb53c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:23.381018+00
96652e11-eb54-4f58-aa2b-5307362fca74	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:25.3934+00
2d30d1cb-3930-4a60-bcee-b53b24ee4081	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:27.374763+00
32cd35f3-3290-4a75-a34d-9c4734501e39	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:31.76458+00
ef188e0e-27fa-416a-a7cb-8acffc30167e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:31.803718+00
faac3b4b-c94f-4075-a20c-47ee3f329f96	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:33.390802+00
e6848066-62ac-487a-8597-b6bfb47be76b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:01:06.816591+00
c2ec7b8c-fe7e-4d6e-bd24-fca24291cbd5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:02:51.914817+00
31d0c1f4-1441-494a-91d3-2b0521af86ce	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:03:36.635435+00
90db0fe6-8460-47f4-8d28-b5eaea3a7263	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:59:09.940045+00
c2a468fc-ee81-4b46-865a-367df3186e2f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 09:34:25.408612+00
f96494e2-77b8-4ef9-bc33-e777c5f22f47	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:24:34.754708+00
83139df6-730d-4c1c-8900-589c9ec81778	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:35:46.471277+00
1490cbe9-55f4-40cd-8f29-2cfc7e6410e1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 18:59:54.069657+00
8bede3a9-3323-4d04-a201-e1124f3812b0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:00:00.715649+00
2f5a4ad2-59f7-4395-b78b-4c1ebccf69b7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:00:47.873701+00
7d601f45-e139-4ab4-89a7-b47669b8871b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:00:49.178446+00
a0c130a3-2cf3-4b0c-a951-aa253d995b5a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:00:53.187373+00
98c510e8-9650-4a7a-8855-53fb193bcf05	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:00:55.19496+00
fc34464e-0f49-4683-8792-65200b77f0a1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:00:59.18404+00
3cc6555f-263f-4298-9b55-1ea3b4e4bf41	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:01.186651+00
61be8c82-272c-4b00-b898-8cbb88fa8b00	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:05.201412+00
5631d6eb-62ca-4962-aa87-28204a69ba8d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:07.38566+00
0f04153e-9526-4e99-8b57-ac55115b2933	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:17.387715+00
9f3a3c8e-9822-440a-af78-2a1e90706600	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:19.387051+00
b1c5507c-25dc-4b4f-bd8f-56672da9cfbb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:29.408363+00
60a75ad2-0dff-41b1-8724-019d0dc117b3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:33.390673+00
d166d29f-2c87-40df-922d-678e5b7262de	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:37.391976+00
2f2829bd-fafb-4065-888c-dcc7a3057ba0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:41.389166+00
77b6afdd-b29a-4eee-8c94-d46573c2f41a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:43.380439+00
8458249f-d798-4b8e-82ff-d20e79f355f7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:47.390093+00
f4bec0ce-03dc-48e2-acb0-716ea2c93731	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:49.426331+00
82949436-34f9-418b-95bf-66e32bb93e44	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:51.382326+00
57babfcb-99c5-4fac-bbf2-141800ae5413	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:53.388816+00
6f2ad702-f0fa-4282-a286-49900cffe842	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:55.380329+00
94a7bbf8-b7e3-48ad-9fc3-1b76e71eed64	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:01:57.39483+00
5b27a853-5df0-446d-84bb-2379ffe7a9a5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:01.476654+00
7fc464bf-442b-4249-9203-468462ced2a1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:03.462032+00
4a897919-3cab-4689-9afd-9959e132c373	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:05.381854+00
6d30c5f5-4c12-4f8b-af43-48b0b5097bff	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:09.387578+00
0f3bf8a0-e375-41c1-808d-793907e91284	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:11.391796+00
7245683f-96d4-42b1-ad2c-88a1ef60985f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:13.372379+00
d000c3f5-256e-4c6e-b3a3-4944e6b3cb7f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:15.375152+00
d53a6083-fd2d-48b6-bd36-f1e03cd4df3f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:17.383612+00
f2125d1f-2955-4343-88c5-354db43e13ff	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:29.396688+00
b1e78eae-71e5-47bc-9634-dfed7fb67c58	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:30.336987+00
a6ee9a53-93f4-41ef-b4e3-2311f7aa50c2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:30.345461+00
3963f58a-7fd7-42b9-b222-98f5257cde0a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:31.377194+00
ceecef07-1b6b-4d21-b347-8b6300335530	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:35.411906+00
2a4f0dc2-b6e4-42c1-a128-d29ed6f60dd0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:37.383002+00
6affedb2-0381-4ed8-b22e-83b4af9618fe	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:39.382657+00
e1bbff3f-fa03-4a71-9c85-ae0c8a3c540a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:41.391491+00
386a04a1-2e7f-41b3-8897-091e2ad6875e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:43.386704+00
116318ec-04ae-4ab2-99f7-497ef0610139	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:45.398262+00
5330d61b-ee67-40db-97bf-6abaac941a6b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:47.421026+00
49492ccb-0b73-4f15-8f9a-12b4f1023f5e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:49.239435+00
3f2db337-4d52-4fd7-bf3f-882affb768dc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:49.282303+00
d0e36644-3cb1-45db-a38d-48ed806bdabd	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:49.397089+00
9b8260af-b706-4b25-8268-e10f5d801eaa	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:50.717178+00
15628122-ac99-4e8e-bc64-77f94401e463	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:50.846952+00
c9eb1e88-ca92-4f6c-b9fd-5ff7d83fc508	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:51.388257+00
0fb53b6e-3f76-4d37-9068-65f5a2f23314	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:53.380638+00
c64addc3-9b08-48b1-9617-d0117ffad7ad	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:55.382826+00
9726cdd0-1c99-4e66-8c3f-78ed8d0704d3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:57.385545+00
52832806-ecbf-4de0-a2f0-7503e93b14cf	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:02:59.381905+00
29d08736-36eb-4c15-8003-c946de10cf86	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:01.384567+00
8b2429ed-ec3a-406e-a78c-6fda881bf358	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:03.379617+00
d432f3a6-93c2-4f6a-9d4e-38c7b49b9d47	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:05.38027+00
11f6f66f-78a1-4dfb-8757-c0860eaa2839	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:07.397643+00
035baf4e-f5d5-4230-ae11-4709eeada2b0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:09.381362+00
bcb07165-ad2a-4bac-9cd5-b221d24f3b44	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:11.384151+00
89fecdbb-79c5-4314-9ce0-5ccbd9b38c63	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:13.393597+00
2e60aae9-055f-44cd-8e90-9806693806a4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:15.381766+00
25242ace-1ceb-440e-aded-a31ce6ca8579	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:17.388289+00
8caf999c-4f02-422e-803a-3831fcf5e8c8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:19.387612+00
18516f72-4f06-4e9b-8675-896ef7cd6691	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:21.381887+00
283d6857-a959-4ae6-9ba5-e5baacdb6402	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:23.388393+00
b6e1108b-875e-4fe8-afe7-4a958e8e7601	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:25.387174+00
45b30390-5c89-40fc-b974-edad089227c5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:27.393052+00
5bca763d-2492-494a-bc51-b456c6af0304	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:29.385638+00
6cf3093f-080c-4ce8-adf2-7f560141f7f7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:31.383622+00
d317e98d-0a38-4c6d-a0ee-13613b8e402c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:33.38132+00
97db29ca-af59-4e70-997e-4e49b452ed9b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:35.389242+00
218afd08-b6cc-4bdb-80ca-bd5b4dc1fa03	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:37.385948+00
1c6d2b82-1e6d-4ab3-b162-38c53566fafa	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:41.399683+00
80297b1d-88de-48ec-b2b3-bcc52c99dbeb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:25.385365+00
70a7c38b-848f-4044-93f2-3f3593c13eb5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:29.430534+00
98825788-0b8b-4b2b-bb9d-99cc36104807	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:31.386527+00
041c0d48-2410-4ccd-ba72-dc848ef9e245	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:35.382112+00
bc2c2693-3c64-41a5-a57f-f640ba11ddfc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:41.379458+00
c59292fa-d58e-4709-a7b5-e50acd76dfde	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:45.380512+00
dcd46e99-466a-4831-963b-627263be08b2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:55.383708+00
d2144f97-4ff4-4783-b957-100bf3ea877f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:59.378461+00
db767708-3330-46d3-8af9-65bb1d4695c5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:03.415584+00
8b137ced-17c3-4c3e-a021-3ebb158e92af	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:05.392866+00
fefccc69-e2c7-4392-9641-74d62af1845a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:09.380941+00
9d1ecff4-c784-4d55-ac66-049f902f417b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:13.381439+00
6eaa5a34-b4ae-4526-a25d-7163b58ae9ed	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:23.395757+00
68362d55-d3e1-47e7-8bea-69085716d31f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:25.409191+00
8e564b54-af38-4dfd-afa0-ff03820d3214	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:29.393714+00
48cc2dde-a07a-4c44-abb5-a47f9069f5bf	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:35.38293+00
e74e3ebd-9e5f-4684-9985-ac99bf6467a6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:53.380124+00
7cd72b4d-fd23-45fa-8641-7698f9239490	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:06:05.391067+00
be477390-1c06-42fd-831a-df898c34c35e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:06:09.379895+00
6fe935ba-8217-4178-bf1a-b1e8a391487b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:07:26.429413+00
8802b868-c67e-4950-934f-4169263448dc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:01:06.828731+00
0a775eb0-0585-4981-89e2-589e10746fb7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:59:37.740263+00
0c135f8c-5930-4e1b-a670-b0872905879f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:59:37.98784+00
4fee0753-4a4c-43d5-bda4-80554d2579b3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 09:38:41.121534+00
6044cb8f-1c6c-440d-8aa7-f7101d44add3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 09:38:42.956894+00
673bf807-19dc-4bc7-a1b8-bcd0ce50fe63	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:24:38.391163+00
53bef220-b78d-436e-a0db-075ab6ece4d9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:24:38.437558+00
8e125570-aa1e-4b8d-af01-03236122046b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:38:10.686975+00
c4999c2d-0f19-43ab-8391-f500ed028c8e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:38:16.438601+00
f03d9649-999a-4c63-a754-0765c2eb97c4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:38:16.443665+00
a1f42816-a4a8-4462-ada9-ffe8c96e3d67	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:39:57.435998+00
ebcdb5ea-a660-4b80-b77c-73481b52a905	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:39:59.422124+00
294ab7cc-6a10-4bf3-a639-8faab6b35e05	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:40:24.718119+00
d167ea57-fc6f-4113-bf9d-86cd79505498	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:40:26.289787+00
84e0c428-4fd7-4107-ac3e-f46cb52246f2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:39.383364+00
57100f07-4715-4c89-b236-59c11f8d745d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:49.384828+00
7ad14330-748c-44fe-9f81-839659b63560	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:51.380413+00
0de79e92-0f73-4fbf-bb8f-b3fa90232e26	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:57.380123+00
63d50e84-c312-41d8-9f65-f2a4ed142695	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:05.379289+00
d57e75fa-06a6-45b6-b560-f0aca9e76a19	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:09.381872+00
ff8212b2-afae-49b0-8015-d95c62b0a165	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:21.383132+00
24275f7b-3ed0-4672-8a89-20115cea2d6a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:02:51.739398+00
2da2a1a0-4e43-40c9-902b-ce58d11dbed2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:59:37.943559+00
d7fc37a5-dabf-4709-80d6-215fa848cc28	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 09:38:41.141448+00
a6346d75-1854-41c2-be8c-4329bd585619	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:36:09.627811+00
b83b9785-7aca-4e77-be51-02979aac34aa	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:36:14.053101+00
b4d5c428-e75c-404e-bcf0-41b5e716f497	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:36:49.574312+00
4672c9d9-e983-4c0b-9455-79ea2d295213	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:36:51.472979+00
61bd1558-bc0c-4cd9-aa6a-69b82b5f5074	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:40:24.708272+00
e3906b5d-f23b-465f-8808-84e29f9a14fc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:43.397832+00
6b76f227-e3ec-420d-816e-620107dfef43	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:53.388924+00
a2663b8b-cb53-4c14-a67a-b83cdfcfcd3a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:01.380689+00
17a94887-9cd8-4142-9bae-01db51d38295	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:07.382679+00
59e4fe57-a97f-4d3f-b2b3-22baebe4e5e8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:17.383361+00
5df634d2-8e1a-4a9a-9c09-6590ca4b4e15	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:19.414659+00
25e689d9-74fd-4d40-911f-eebd5b88578e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:23.387774+00
41d6f311-9383-4fc4-88a5-c4808d94c9ac	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:27.387583+00
98e78d0a-a66f-4eb9-a505-a6c729121dc1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:10:44.446935+00
ebea4ff2-8e60-48c1-b59b-b9b3119d9f34	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:05:09.077563+00
a01d8368-90bb-4cc5-a6ec-17d9f60bad76	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 09:38:42.969788+00
9a9ac77d-4a05-445f-82f5-0d2fbdd6e46a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:36:14.06323+00
60f2617c-07b5-4e5e-ba35-4da947b291e0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:36:42.957445+00
e6aab336-affc-447e-a04d-3286a9c9c889	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:36:49.570177+00
34440c0b-af1d-45b6-be34-f860b1bd4bc0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:36:51.464829+00
3e1e4ae4-8303-4e76-becc-d63cce83083d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:36:54.715085+00
1b624b2b-2487-4cfe-a945-56ebc9cdae10	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:37:14.595785+00
52572e13-599f-4541-adb6-333485f507d4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:37:14.5989+00
fedfbe20-42e2-4119-911e-b00d5778f080	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:40:26.324914+00
fdeb6ff3-3464-4afc-b5db-c0ecfb1faee7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:45.394168+00
afe8e1b4-4b21-44c5-b548-7124a065d04b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:59.380243+00
2f4cdcb9-605b-4911-ada8-13367f31a955	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:03.379573+00
b29aa9af-db67-4600-a484-d3946b1c7557	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:11.379134+00
551e04c8-eee8-4102-8d2f-690d38d87f48	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:37.384878+00
c04a0ae9-710c-487f-92ea-59c700fe3550	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:39.380963+00
fdd35470-19fc-4fdd-98e4-2245d8ba769c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:43.382686+00
d1da7583-ffed-4dfa-b486-ae893a7299ea	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:47.380723+00
459ef294-9701-43f6-bd20-e513a3cce4fc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:49.383943+00
9e02a8f2-e1bb-4a76-b5b2-a3b0dc0b76a3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:51.380535+00
08396e12-a095-49ee-ab6f-f2d5cb867b26	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:53.387008+00
4b54d3b1-f857-4984-9f32-19d31a4d2c42	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:57.386909+00
b735d51e-e4b7-4435-b5d1-b67315d0c3cd	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:01.39218+00
d6924d18-c5f7-4f54-a3ca-f10fae683f7d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:07.384177+00
456e2aac-4612-4f34-a146-339b80fa07b3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:11.382775+00
72606588-4881-4b95-8324-265134bd3eff	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:15.381354+00
e4ad0863-2ce0-4ad1-931c-d73e90d8df7b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:17.381839+00
3c8af74b-88f5-46e5-b505-21e0b0e34c64	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:19.382813+00
059509d9-ff2b-4d50-a283-ef34b4cdb727	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:21.379669+00
b94cf86a-38dd-4201-a6a3-22e3d18b55d8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:27.402851+00
5bf91fb4-670b-4267-883d-743262a97b72	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:31.42544+00
4f571425-4e46-475c-ac9b-70e5ea56d221	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:33.381055+00
4a994278-9466-41b6-aa9b-7fb4a2b3195d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:37.391777+00
704709cd-3f89-4141-8257-f32f680c2f93	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:39.380482+00
205d2ad0-cb0d-44ff-93b0-c22b45653282	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:41.384483+00
396c20c8-7cd0-487a-b56a-936c90a047f3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:43.384347+00
39f85733-c9a4-4ecc-9fff-cd8b5ca061c2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:45.379112+00
4768940b-6969-4793-9a8b-080f05b364e8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:47.381613+00
817eff7c-aa7f-4fc1-8ba9-0fe00b636cba	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:49.38329+00
15bbbb73-d5d0-4d9d-b3d3-c03f5911a471	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:51.382089+00
1b3ede02-3b02-43b4-a7fd-1e74a0a5be79	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:55.425216+00
73e49b25-819e-4b88-ab1f-63f3236a24e5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:57.420099+00
cbaa58fc-4347-476c-90e6-b4eb05e29ef9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:05:59.39586+00
8b58c55d-bc47-457c-b32f-516e437480a6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:06:01.401965+00
b1aeb36a-5994-4cba-9e50-b871547ed7bd	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:06:03.388282+00
c2433695-d360-4843-89dc-f5cde521e709	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:06:07.383736+00
bb122283-f5c4-4b1e-b1c3-505aaf20de09	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:06:26.38685+00
e5f18def-28ab-4004-b95c-0ac331b427a5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:10:44.462239+00
8f395e1d-74f0-427b-b739-75e1dcec6fdf	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:10:47.473431+00
36cb1430-07a8-422a-9698-f01593064a61	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:11:03.585553+00
33f9b50c-be22-4a4f-9a7a-fb0e141f097e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:14:36.239543+00
def4ebd6-a668-480b-97a3-3c8e0ce5a641	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:05:38.953438+00
4ae67db5-dc98-48f1-8cc9-50a59a9bfebc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:05:45.088066+00
786fb77b-f930-421f-bd73-1fa31781e3cc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:06:26.080541+00
0f17178c-767a-4585-a836-97b49487b92b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:08:53.112139+00
012af5e5-c41a-44e5-aa85-750a5fd1ef1d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:09:00.709426+00
be10d5ee-d1b5-4519-8162-89feca1b3063	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:09:09.865495+00
5d914544-e7a7-4acc-8e13-90371123624a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:09:09.885508+00
cba8255c-85ea-4373-a12e-6fcde0b70f9c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:09:12.898919+00
2b91b353-af4c-44b5-91d9-bfd99b61ef9d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:36:54.719106+00
25a8412d-f305-4496-888f-ebe925290d9b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:46:37.280674+00
dfa4eb99-d8da-4630-857d-4d2e48af94c7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:46:37.314674+00
32b49188-31c4-4bbb-a99a-1be15ec39531	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:47.379475+00
302bf97e-c370-4cd7-9835-03507e3ef653	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:10:47.461044+00
76d575c0-df65-4b5d-b942-00e1b5c726a5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:11:03.588007+00
b298409d-1ad4-45aa-ba72-bbab649722ee	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:14:36.239293+00
0273e0e8-7138-444a-8fe5-fc4c2ef61382	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:14:57.721+00
35fb6c71-a6e0-4fd1-8f42-6f42c6c37b7e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:05:38.966471+00
3a1b9470-1eb4-4482-a091-eb095542352e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:05:45.096297+00
aa8708d5-2502-460b-92a7-61b670c27212	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:08:53.101782+00
8356885f-e73a-423c-8978-ecdd1f29b61d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:09:00.68694+00
3f967b27-216b-4560-863a-1fa6e7e21ab5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:09:06.889065+00
dfb0b8ee-0d7b-43f7-b6bd-9ca20e593af9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:39:25.310811+00
830ab570-b84e-44eb-a9dc-fb98153ba30f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:39:29.425204+00
ac215889-ec3e-410a-a068-8c765398a6ce	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:47:17.998037+00
901109ec-b39d-4787-8ce3-6913f973687d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:47:22.860628+00
7475dac8-8c11-459b-82ab-edc216d1a006	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:47:24.706286+00
eff3fdae-7ba7-4692-b708-4b57dbf1f510	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:03:55.386045+00
3ffb75bc-33e8-4665-8aac-0f94ad1fb784	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:13.391879+00
4e52fabd-93d0-49ca-838c-331ae867c326	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:15.402228+00
8fa10319-39a4-432e-8392-824fd7b54262	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:04:33.380653+00
c96f667f-1c44-4aab-8a2c-ba7626ba230f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:08:26.475534+00
666f8db8-c552-4deb-8104-20c3a6a1f02d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:08:51.34514+00
efe7dc60-6b26-43ce-b9d9-401a678d29ed	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:08:51.348341+00
0e8aa249-13c7-47b0-aa69-bb4073b8dfed	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:09:02.122847+00
ab2ae5e5-a9f3-4d32-805d-02a3005b6321	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:09:02.140579+00
6e4460ec-976d-43f2-b2cf-867b9f48cb3b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:09:07.276679+00
5d7e41a9-c73e-407e-b1d3-fe754aa62abc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:09:07.317825+00
a4f76bc9-82f7-499b-8b37-f6e11e77a12e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:09:26.423327+00
ad24fe3a-f90c-450b-828d-d31531e4e17e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:10:12.72415+00
96163dc1-b469-4a02-84a2-415373897695	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:10:13.211634+00
eaf5de6b-0035-49fa-9bc5-6e5d1ead343d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:10:15.217295+00
dc07f668-e8bd-4e0c-a9be-844e093e4e0d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:10:17.192357+00
727cac6b-7749-4e4c-9f28-0aeb4b2d2713	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:10:19.14635+00
4a185eed-e3e7-4ced-a572-409c1b8e59ce	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:10:19.150982+00
c2b204fe-aa03-48f7-aded-a089373ce00f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:10:21.481533+00
cd5bd12f-54b5-4b2e-8ed9-6d46b1f39415	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:10:23.385493+00
d5a71b6b-c239-44a5-a72d-5b485bb95d28	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:10:25.477659+00
dde4f805-2159-4702-89bf-b788aed4eefe	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:10:27.399782+00
e0d80ee6-fbc3-464c-be3e-7bfdddf95e1c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:10:29.4002+00
1a6e00e1-d4ab-422e-82ed-8b65b9fc10f8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:10:31.393527+00
e8fc2f49-f407-49c1-97f1-29c708c871b8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:10:33.421951+00
286adcd4-f243-4d58-81f9-35687f85465b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:10:33.525824+00
21387841-2a32-4e20-a44f-5ef34c69e4c9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:10:33.600244+00
830860d9-5aba-4c57-b47e-7dd4ff653e53	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:10:33.6124+00
7342ece6-a635-45a7-8f00-9e11a9545a72	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:10:53.552915+00
4a05ead3-6389-4fc7-8e1d-027f61e4686b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:10:54.665872+00
53c0d45b-2e59-4792-a6f9-e24144d15867	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:10:57.406936+00
ae08e390-a32c-4265-99a4-f5100c846eea	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:10:59.474577+00
80874e4b-2ae5-4da2-8b16-46965c4f2154	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:01.402479+00
d1b3078a-2079-420a-985c-b8d54c39989c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:03.457731+00
140aa5de-0485-41c6-9e02-6cb5bda2dcda	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:05.402531+00
f12473a6-eafa-4e33-a906-b00104517e8d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:07.409361+00
9a13ad9e-a2c2-4448-9bde-de98af004344	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:09.390103+00
4882812b-281e-48e1-9141-66a58a6862be	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:11.436662+00
ba0cdd0b-c36d-4765-a5a5-235cf8cac762	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:13.380423+00
572a7f7d-b0ce-4473-9039-5e12f9ba7ac3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:15.39053+00
ea523167-929c-474d-8a2f-6cb204f16840	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:17.431083+00
dda91324-cc03-4663-b225-e82ede6760d6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:19.393965+00
8ffa26fb-f4ca-4fb8-97c7-6584416feaf6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:21.443081+00
0911b5e3-86a1-4ee3-b6c9-0d6edc08f526	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:23.42698+00
25e9192d-dd54-4dc1-801a-487a4fc29f57	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:25.438261+00
5007028d-ea5c-492d-8a64-7c275a526e63	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:27.398684+00
07e9220a-45ef-4d96-89b3-59f6100a0b78	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:29.389931+00
d4f1ff02-0523-4748-ab32-53cc4ec775d9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:31.396833+00
0177fffd-56d1-408e-b199-ea07809c7343	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:33.394822+00
8707ef00-5430-4236-8136-0e20ce277ab0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:35.393497+00
4861d9c6-ea63-430c-804f-6c6d5b4201eb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:37.383643+00
4c244f95-9aa8-4711-9fdc-7edbc71bfe4f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:39.395156+00
3fe0ae17-5fbc-4d49-b5b6-eef88305ded9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:41.442822+00
b1ba241e-79d1-4485-a6e0-99e770c32460	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:42.61592+00
48cf2dd0-09aa-4806-af7f-139fe2a27d93	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:45.406547+00
abe65c16-25d1-47da-9424-a9c44e20f262	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:47.410161+00
cac24a57-c47f-4d88-bb09-f233db957a7e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:49.384242+00
9b71d59a-7b94-40eb-af6d-5e64ed75c4c0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:51.390228+00
dde1f88d-ee91-4132-8497-f97fff31ccdd	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:53.393399+00
e5bcf14e-7749-40c7-991c-45ea5fda6545	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:55.389851+00
e861d5bd-4216-4323-8444-12956673a8a1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:57.462738+00
0cfbd31d-bd63-44ca-9111-81c007cfc01d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:11:59.392339+00
d589d269-5252-41f5-9c8c-f9cee0f518ca	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:01.389377+00
01a29175-ea4a-46f4-860a-e131381ddc79	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:03.383378+00
7708aca2-c6f5-4c03-a4fb-72aecd32d30a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:05.390319+00
f0557b1b-798b-4e9a-8d25-e5c7821a706f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:07.383454+00
0622e255-d580-4051-9f51-6ff12f45b83e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:09.383943+00
4483dbd3-1999-490e-8e79-3344bef26879	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:11.392562+00
8d12bb7f-c684-4f3f-be26-bafafbc27580	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:13.384237+00
b4ff86b7-6177-4dec-a439-12b457d1f393	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:14.218407+00
c0106620-b4fc-4842-9a23-4c8fce518c5f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:14.232645+00
66749553-d6bc-4d40-8e8d-e9bddbf5dcfe	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:17.399485+00
d2d7f9ba-0c87-425d-aa7f-fba51e12032a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:21.421119+00
00986390-2029-4371-bac3-4dfa6dedc876	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:31.544145+00
268e3624-6f7c-429e-8630-93e1434143e1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:47.401212+00
ed0b3202-6e23-4530-980e-6ee369df5ce4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:07.396002+00
e28121d9-d0fc-4c5c-ba74-c544d80643c4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:25.550521+00
bc450bf7-43df-430b-adf4-4c4478385c72	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:26.850203+00
4bdc7b68-ea1e-4308-be67-f02040494c38	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:26.855349+00
38eec6a8-6d99-4270-a23e-a34e5351d24d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:31.384391+00
72a957c9-4c62-47a6-86d6-d4cc1961c01c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:17:17.042726+00
832868ce-b63d-4658-9da5-c6a5617d37a7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:14:36.260445+00
3275f0af-8b59-4aa9-940b-f46ae6d75a34	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:15:29.391388+00
7e2c2775-b9fd-4bec-8f04-afbbd15c0adb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:09:06.89382+00
18f3ed61-f60d-4722-b7d7-70d8e84a8169	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:39:29.413124+00
46c5069c-5456-4d60-aad4-c032667152d5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:47:20.854251+00
f6e99009-e39f-4def-994e-75b909179c4b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:47:20.892678+00
633a9693-d01d-455e-b78b-58bdaa67b2b7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:47:30.318639+00
3e5f6a25-915d-4f71-9fd3-f48ef546003c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:47:30.321026+00
c128d9f7-d306-4f2c-9701-f9b611d1df12	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:47:32.31711+00
e6bb1a3d-4752-40ac-bcd3-daabc6ed31e8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:47:34.214617+00
150844a4-2c94-4f37-ae54-4bcd7b49d452	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:49:19.066703+00
8a602ec5-d6d2-4991-9b76-fa4bd7cf4667	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:49:25.6687+00
0cdfe34f-1dec-4bf9-ad91-3a47a24e3ffd	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:49:26.237303+00
2dc2d34d-d352-4d92-b756-cd28354ff42e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:49:28.379365+00
cfbc88e5-df27-4190-a3ad-b71534501040	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:49:39.150538+00
b575501c-9b3b-4bb6-bbf4-002e71253180	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:49:42.664868+00
1e8f7f37-75f9-40c5-b7ae-2580a9ac9665	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:49:57.195821+00
1cd14881-8832-447e-8c90-4dd2a13b21b0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:49:58.844938+00
30509b40-a414-42e3-aba7-da7c7b884977	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:50:00.843339+00
aed9576d-8d59-493d-b90f-3bc4ff13bcc1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:50:09.531595+00
21ee5eb3-bf29-42bc-9eb8-79ca6fd8a403	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:15.480958+00
5f3b5119-4532-4fb6-937b-a60638f82c9e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:19.398546+00
d4aea726-d819-47f0-a9d4-70f5140ca41b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:55.427468+00
b0735635-1a56-4203-a572-9305d575d06b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:01.391056+00
79c00d4a-9cb0-4931-a4b4-429ba2acce7b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:17.387655+00
0186d88f-b0c1-494e-884a-1868068725d3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:29.427822+00
cc4b4e33-8aa6-49ce-8b02-e65008946d1e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:33.384707+00
aa06457b-7dc9-4c15-a446-d76cac4c4bfb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:37.40079+00
b2a56dfb-1662-4b2f-919e-1cc3e7452101	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:43.383186+00
4544984c-a828-4cb7-a7c9-a67b4de51129	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:17:17.065696+00
4b183c86-d0e5-4972-bb19-758baaa80ebe	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:14:57.721062+00
b4f7ba41-2178-4b87-88f1-7d85761d1fd0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:14:57.767583+00
bd41eb5f-7e8e-4346-9950-35ba070c8d79	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:15:52.091756+00
85b52eb9-16ff-44b7-aaea-6a276fda88d1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:18:29.870269+00
d750ac4e-54c1-4e2e-99c5-a9fef4c9141e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:09:12.893668+00
6a6602d9-fc27-4cbf-9fe2-eb1d1720421a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:45:58.597233+00
b0e36064-c4ee-4935-86a9-d3021b1c34f7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:46:01.613801+00
68080148-d0d0-484b-a4b9-d596e5e3de80	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:46:19.846389+00
a25c55c1-8e10-4d05-9c72-6706225cc134	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:49:19.055846+00
bcdbee1c-a22c-4131-9e2c-dc732f507724	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:49:25.677341+00
d818143f-d85f-41a1-846b-a7ecca5433bd	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:49:26.236977+00
e27c0f9b-4f25-4bda-9b45-37777936d016	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:49:28.333415+00
ff414d9b-7eae-4636-81cd-748db12ff1b7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:49:39.150538+00
66ded2ac-2f0f-419e-ab7d-06f888dcd213	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:50:03.532978+00
5ff2940b-b766-473a-949b-7275444a1624	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:50:07.52973+00
b59f6b83-392e-4195-a956-369f8b87b862	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:50:10.841938+00
1cd6c7e3-d52b-4c09-88ed-28cc452553fd	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:50:13.737792+00
31768576-9d61-4fe8-ab6a-8263ff9b7140	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:23.514663+00
369b0d25-13e1-441b-be33-c86c231aa187	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:25.395599+00
ff8e4d3d-f4e8-406c-87e6-0486523b29c3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:31.389059+00
62dd3c18-b93c-48cc-a878-37f61817ded6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:34.318983+00
87ad8c8f-26a8-4114-8cd9-ed4f32ae9def	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:35.41859+00
324b6f74-6508-4925-b131-fd2227a0cabb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:37.392055+00
6b23eefe-643f-43ac-ac16-b9fd40726e5b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:17:21.203728+00
7bfe06b0-be31-4ade-aa09-0482fe82f62d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:18:29.849058+00
b89e1181-d5ae-4082-a18d-22a5e49362b8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:09:48.717088+00
b4ac3f7d-7059-40bf-8fa9-3a06f19eca09	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:09:48.746889+00
b45f8aa3-6ff3-415c-8029-28f443e6173a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:46:01.602041+00
2dd2eb4b-a75c-432e-a6f4-8ccc34f1349e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:46:17.491243+00
11abc37c-4496-4623-8d18-e492864e0f2d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:49:42.676383+00
bbc129cc-d287-4f49-a7e2-94316f229d2f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:49:58.837723+00
d40dbb84-7f5d-40c8-84ed-ac735493f640	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:50:05.532524+00
b88ec46e-27a5-46a4-89d0-7ed1997ab5a5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:50:12.84518+00
fe36df30-021d-47e4-8023-aa907bf85506	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:27.400718+00
944c346a-660f-4213-abc5-c2c1750f15a5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:31.55157+00
0536896c-97ab-447c-a253-57735d5c91be	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:33.389269+00
133fe494-5cef-466e-a4be-4e87a695cad4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:39.38554+00
182da10d-7d78-4afd-92e8-9139082b63d9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:41.403801+00
a6922a25-b251-47c9-b18c-469b606991ea	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:43.38369+00
c567e069-463d-4113-b76e-324c93d49b6f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:45.401942+00
9e07203d-0775-450d-a03e-750a902565f6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:49.388498+00
7a33e5e4-14b7-4b74-aafe-7f6cfbc7b3ee	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:57.399981+00
4f0cc679-14e8-4045-a329-8c0c85ca8804	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:03.386582+00
cc262d55-470b-431a-b327-6d9c4520992c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:11.38909+00
03ac01d0-54c4-4594-9f6f-3169eb9c0aa6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:15.507018+00
472a879a-ea5d-4579-b3f8-e547fdebbd23	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:19.392761+00
d6c1bcf4-daeb-49cf-bb85-866b9ee4a746	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:17:21.211394+00
59337241-c9a8-4642-a22e-4568555886c6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:19:40.79669+00
f3481e5e-0506-457b-aff9-86a05cfe83c9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:21:13.435283+00
ff0bc6b9-7aed-4211-8d3a-38d956e6b2a4	GUEST	Anonymous Visitor	UPDATE_TOURNAMENT_STATUS	Set tournament status to open for ID: t_7pd_vpl_s2	2026-10-06 07:21:55.19564+00
934a7bf1-143a-4326-be62-274e086f7dde	GUEST	Anonymous Visitor	UPDATE_TOURNAMENT_STATUS	Set tournament status to live for ID: t_7pd_vpl_s2	2026-10-06 07:22:16.45309+00
c61c5dc8-67e5-47bd-9617-d45afd3d83ac	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:22:21.379303+00
185a23fe-b217-4ddf-bfd2-3e4d02f9d6ad	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:22:25.362736+00
5d5d1d41-856d-4c50-9a18-ee1fd1ec0072	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:10:14.870958+00
bbb59eff-e3aa-49ac-9c00-e4355a1f7a78	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:10:14.875084+00
e24cd220-4eba-48cb-b068-3848ca16b4f3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:46:05.396115+00
e5229836-c897-4387-940e-ec5ddbb22712	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:46:05.410468+00
970dbf97-2e1e-48ec-918e-d92401c8c878	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:50:20.211626+00
9f48b351-bbec-4f03-be3f-bf5c89a3531a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:50:24.79858+00
5dd0ca5a-5549-4dd7-b06b-f771dcf6b147	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:51:31.665083+00
02fda8fe-b8ca-40b2-9d40-c5e67337f2bf	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:29.409057+00
f818ee0c-846b-4157-843a-d46cf78b8c17	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:34.330734+00
1f36e70d-bb78-4502-ba02-12d94fc4c6ab	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:19:27.789361+00
be84ad88-8c4c-4f90-b6c8-14e07824d786	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:19:27.803518+00
fd7c709e-7c66-492a-bc33-acffe553ca12	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:19:28.275275+00
26ec5111-154c-4712-84e6-59c84b239a3f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:19:28.284046+00
14908656-9c13-4eb9-8797-43cc14eab5f0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:19:46.032899+00
c92a78ec-6049-415f-a3e2-d5565bd8e2a6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:21:13.428895+00
ac7ccd95-8edb-4f06-b289-83b521807103	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:22:25.362722+00
a2e7fa47-9792-4405-a3e3-3bb6e5169d52	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:24:04.659703+00
83da26b1-2f22-4723-a686-02127f13a0d0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:24:07.520537+00
fa65e97f-130b-4748-9746-6445cce592a0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:24:20.504429+00
0854e281-591e-47c0-9d29-b31f2822947b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:15:41.365443+00
e9878638-f037-4549-9438-3a8b4d3d4a89	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:17:32.116439+00
c4758e07-a4f9-45d7-bf6f-f2b98e8074e5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:46:17.495594+00
3356b3d3-e625-473d-a85d-f0e02991a89b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:50:20.216543+00
9657a48d-271c-4b75-bf3f-b64ad6e6c6f8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:50:24.798422+00
2702a863-c138-41f8-a29c-172f4534d8e2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:50:28.869452+00
a215c11d-ca50-4a78-87e3-f9f0d144d261	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:51.413056+00
b23f6a32-ba31-473f-a5ab-68e2970f82d9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:53.49052+00
5f4d5d3c-017e-42e1-b5f9-cbec75935c80	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:12:59.863824+00
6e37a2d8-0417-42df-8555-9d4630a64cf2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:05.44757+00
a211edae-7f21-4d8f-84b9-45cd8fc256fb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:09.383666+00
a44e3dcd-484f-4f78-b5bc-cbbe795fdd42	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:13.384669+00
cf9cc168-c726-42d5-9f17-cc3a84dce596	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:21.390129+00
647fc53f-b6c5-4271-98f6-557edf69ce21	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:23.399749+00
a16e5a73-afb8-462f-87d4-f1035215b616	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:27.385439+00
33a30ff8-2b34-4448-8896-97db5f4b8631	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:29.786668+00
fa723343-5328-4d85-b919-9bf4d8f9bb0c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:29.794124+00
d43febf1-48f8-4260-a11f-d50717999ed6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:35.399525+00
f83bb074-c31f-45be-befd-f434e810a404	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:37.382402+00
6216492e-3de0-4e92-a107-d3b08a451be5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:37.390628+00
c8e09083-6c5b-44e0-8c15-795ef776bc24	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:39.384917+00
71e8ec5c-cea3-4dcd-a84d-4f2b3a9a87ec	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:41.391028+00
9b4cfbee-31c8-4292-9e90-0dfbc4aa4b11	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:45.412416+00
a67198a1-4b27-447a-af69-f5fedc872308	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:47.433856+00
d16c0ce7-a6c4-40ad-b621-d588a47e07ef	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:49.392723+00
2702f836-f121-4429-924a-baaf3cc332f3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:51.404328+00
6d97c683-ce37-4978-957c-586b430902be	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:53.390169+00
1be791ba-eae8-47df-a0de-b7dc6091ff72	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:55.40377+00
a8804a1c-4676-4acf-8aa2-c83e1f72701a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:57.449299+00
479048c8-a3b3-4453-8ba3-0597f983dc41	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:13:59.38763+00
23d1c713-cd9b-4f4d-b79f-c9b7dcca394a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:01.382459+00
7e06b692-2f4b-4f5a-a5de-190e93b98585	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:03.391607+00
73255543-f54d-4798-8b04-854102c1aef9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:05.387319+00
8507daad-9d17-4538-92c5-299d0627e0fd	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:07.404665+00
6db59fdb-67e2-4e58-893a-8d7f9c0cd18d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:09.383136+00
6ccbd33c-632a-452b-afb4-25e22b66d847	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:11.394631+00
af765f93-39d4-4edb-99ae-9af3abd5bd81	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:13.38188+00
8ecf0cca-9846-4505-b3f4-8334ad754b1f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:15.611428+00
713565db-d5fc-4935-bcbc-775c67d7ab70	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:17.394035+00
a9e95502-8257-4c8a-8e86-57eae4f6d5d1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:19.386816+00
b05ef747-df87-4c06-b610-d0bbaa840fb0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:21.384874+00
9a63f9a0-7211-4809-8f26-658edb54fa3d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:23.385395+00
9ae31514-9662-46af-9fcc-7e1c9e374d2a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:25.443091+00
5182fd3f-ed9b-47fc-8b55-e9bb2f72a6f2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:27.394269+00
921e70a9-4ed3-4021-9a4f-56e6a3e61b45	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:29.394486+00
4f0176f3-24dc-48f3-bab4-c1e4b01ce3f8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:31.391568+00
a4e1d134-00a7-4f14-a151-7f8b52d8cbf9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:33.381179+00
5976730d-b16d-4499-8fa5-65cf1013bb3a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:35.406665+00
3f3b4af3-ce1b-439d-9d3f-75ec9416c479	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:37.447233+00
ad58ccbb-f11c-4cbf-92c4-5feb715923d0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:39.385355+00
760b6f56-93d4-414a-9c3b-ec5236d91295	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:41.389108+00
e1028275-4e0b-46be-946e-ca91b31fca0c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:43.383747+00
03063666-8cc7-4c61-8777-e7d2a279d770	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:45.410194+00
96c01ae8-e328-40e7-9b1a-02d0141b498c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:47.399276+00
880738e5-7d8e-4ad2-ba52-afbc26e3daf1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:49.385926+00
8d524540-ff7d-49c5-aae4-2fbe38a7197f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:50.206437+00
d7bf3d81-ddcb-4884-8769-ff3aad65c691	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:50.222341+00
5f96c02d-8150-4e0d-aabf-aacfc256c689	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:51.397578+00
f9b140ac-75cb-4b91-9aaa-855ac566af93	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:53.424327+00
c66b7eaf-0e50-400e-9bb0-cc9d4c6367d2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:55.401001+00
4301cb13-2400-4dea-b5bc-9d128df1ab1d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:57.384989+00
b2a1ccbd-394d-4e77-9609-c05202e47902	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:14:59.394437+00
cdcd0812-9e40-41a9-807a-19e5849f30c1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:01.384226+00
dc64581e-2340-4525-b0e1-369f5af21c6e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:03.38663+00
8239c2d7-d190-438e-89cf-b866438647e0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:05.397289+00
8c2ec476-605b-40e5-8be3-08ea1fa9e6b8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:07.401018+00
29ceb69f-6024-4508-ad4a-b74fd3ef3622	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:09.401998+00
c13cfd6e-5f73-4dee-aa85-aa45fcba1ab7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:11.407178+00
4481df71-4dce-4ecd-9553-89aefb1fea27	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:13.386389+00
f6255689-c1f0-46b5-8505-8bc8417e35e2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:15.397894+00
8d6eb1ac-4c07-4d09-ab1a-4ff1628b877a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:17.391665+00
dc184be0-448b-4fbc-9dbf-1565616c7f1d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:19.387385+00
85d6c77f-c52a-486f-af64-0cdcaca0695a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:21.38633+00
8d7a0f1b-5405-4c23-bf3b-d2dddf452de0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:23.541102+00
6bde16d8-6aa1-4bf0-9ebd-ab79e1ec97a0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:25.482533+00
07a64b4b-eeee-4873-b5ac-862347234d04	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:27.391379+00
f23d2125-42d4-44d0-ae41-9d8387e1c9a7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:29.390381+00
dfd3569a-8a8a-464e-b8d6-5b68bae0123c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:31.395737+00
277bc188-af20-4a6e-9fea-116fab0e74d9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:41.396667+00
474fa07a-6819-46dd-9b8d-f8ccef4edd48	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:47.473105+00
a18d2356-c5d1-45e5-8030-a3ac56f5a118	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:51.388627+00
b427ef27-c675-46da-8ace-91acad206f37	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:55.42222+00
711aaf52-e1e1-40d2-8dad-72cea7533672	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:57.387582+00
9c533a53-3d02-427f-a391-65b9d9338969	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:59.392906+00
176ee065-ebaa-4321-96ce-c3481fef7df1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:03.394809+00
bb248bf1-f735-442e-ae1d-656e422785d3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:05.461311+00
29adcb58-0952-4ce7-8931-1ba5dc03db85	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:09.405009+00
87081c36-d8ba-4dfe-8902-d168bd9dfab2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:21.396996+00
2b4bfe09-ea45-487a-b183-c867a375f4d4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:25.521334+00
707e7df1-48ae-45e1-816d-5c43fc0b8728	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:27.384558+00
b4f04923-fc34-4730-ad0b-9297fc55ec95	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:35.406097+00
2a2b5bb2-74d5-4078-a997-2c006304e146	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:37.385723+00
360a59bf-d4a5-4bb9-afeb-567d5fd38497	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:43.454526+00
efc63762-07fc-42f7-8479-dfc65f70b7da	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:19:29.189383+00
cb083138-3550-4db9-ba58-7a0d636cbed5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:19:46.034539+00
7c617fc5-3dc3-47d3-adec-363b0be16411	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:15:41.366352+00
ecc6986c-d5a6-49f4-a084-e009e1571065	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 10:17:32.124113+00
4ec48565-8ec5-41b3-83e7-955a9eab8703	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 07:46:19.821296+00
dbe0a81b-e279-4075-8a21-a5dd59f42570	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:50:28.85708+00
afe1e4cf-b28b-4e06-95ae-908b2ce765ac	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:51:31.679686+00
64674e61-bc1d-4c5b-be5b-68ba8eaedc9e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:33.394722+00
d63c4fb0-4897-4d72-9504-2735f8210915	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:37.384384+00
40950dfb-a314-4a19-b6f2-75d7b2780f49	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:39.400582+00
3d585fce-06cb-469d-9094-a867ab48ba8f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:45.396398+00
7cf0a1bc-c9da-4701-93b3-ddd0530abd47	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:49.424129+00
f81bea4e-e516-4350-b567-79b184dd6922	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:53.491337+00
d309f78f-2a13-415e-b471-293d331a12bb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:07.384365+00
8d14c3ae-f92c-483f-947b-2e335bc82493	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:13.392328+00
38f97216-4e54-426d-8ab0-eec81cbb2dcc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:15.410624+00
53d44f63-5961-4195-ae90-1b99394b955c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:17.41676+00
27413b2c-8eea-463b-b227-c9c9bcfa7fe0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:19.391812+00
a859325b-3b58-4829-b1b6-cea3cc29d50b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:23.386892+00
218226a5-8c2f-44f0-b098-2cca937a3f98	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:29.388613+00
2fe3e800-f6f4-42c8-8489-fdaec988564a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:31.419282+00
d04887e5-5e86-4d7c-a472-927c2a488da6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:33.439271+00
2784034e-5ee8-43a3-a1df-063d5cd76ce4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:39.382427+00
fefa8bcc-30e9-4b5b-84b6-4416957ce7de	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:41.38504+00
f9072ada-2f3e-4858-86ee-10a05a3ca527	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:17:26.515045+00
152adf4b-e061-400a-9c15-9e0d1e5f2042	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:19:29.199565+00
d4da9b23-3f5f-4f3a-9ea0-858d909da7c2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:22:21.336683+00
a4637245-5835-46a3-a3c1-f85c9ed2244f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:22:53.890447+00
cfbfc5da-6233-4211-8063-c83ffe909ff7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:22:53.900652+00
0235ea33-a10d-415a-bb1a-d422b4e8cfbe	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:24:04.663044+00
7cc16c46-8605-4f13-b25f-fec86da09bee	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:24:18.770907+00
bef72089-0e36-4d33-84b8-b733367f8ae4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:24:20.324091+00
98f255f5-d675-4160-b3ec-e5728224c9e1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:24:43.83903+00
443a4f67-0c77-4b1b-aaf5-c4fc1529ce42	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:26:43.120563+00
c554d306-e968-4c92-9fe1-b00deb240553	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:26:43.125421+00
eaf4420f-9518-43e0-9d33-58dd5d34ffd4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 14:02:40.252982+00
d9c7fe0f-6557-4de2-a85d-01afaa8b84a5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 14:02:40.258367+00
c030a0cb-a250-404e-bd80-08e76d7e943c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 14:02:51.817948+00
4cfae9ae-2449-4207-baee-20d1671cef7c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 14:02:51.822264+00
00c2b122-80cc-44c7-aa93-22bf5630bc1e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 08:02:36.328853+00
f1f4feeb-eae8-41b3-a232-b73a0a6e6d48	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:57:53.465535+00
f7307e39-9075-41a9-b570-3c0323a8697b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:57:53.469745+00
db76c14a-2f9c-480d-b763-c924a1a624c7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:35.426472+00
9a3097e1-dee3-4b2b-9547-45982b61638d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:15:43.392374+00
3313d288-ed93-46c5-9f0a-8686cb7aa214	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:01.388636+00
9734a618-f6c8-4054-9a38-bb9096eeb952	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:16:11.394589+00
40c0fbf6-cb39-4d27-8f86-b7616d22a7fa	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:18:26.457598+00
471a3287-43dc-41cc-ad24-bbcf3ff764f0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:08.352083+00
a681c25d-3405-47c5-9bec-ac41d6d56ad8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:08.604372+00
08ea0c39-948f-40d9-950e-98ece0085c60	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:10.603206+00
f26b01fb-dfe8-4399-9cb2-1570de26da0e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:12.606052+00
50e0a094-0963-4681-b848-1e0497abe8b5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:14.609145+00
a451f5b7-6c6b-4803-93cc-63443a11a9ac	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:16.604725+00
9b75dab3-b978-4bfc-90fa-fd636042c4be	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:18.608982+00
e51ed4bf-2924-4e6e-8364-bd828d3070f5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:20.063978+00
60646f88-c519-4b04-94f0-5bc671155d3a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:20.067321+00
7f432030-6290-41ff-89ef-1966a410cbba	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:22.025409+00
26eef706-38e7-46d6-9ba6-7d490a604dcb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:23.508318+00
3bb936e2-cfdb-48ad-9cd5-3303b0be0e33	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:23.511261+00
b91a7211-dd46-47dd-9a63-af5bfafc5fa3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:25.486267+00
67aea597-38b0-4144-b297-9b25037a61aa	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:27.491003+00
dabce563-f152-4c5c-811d-104a3db2b1f2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:29.489783+00
4cf5642c-b95f-4a79-a57d-97aff2033700	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:31.485034+00
e6fe6835-20a2-4c56-806b-3972080874d7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:33.485945+00
8e492560-a09f-45aa-b75f-97292ac0b1a7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:35.484303+00
a6bd2f36-9ba3-4396-a304-6289a714dde0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:37.491484+00
61b99649-05d6-4eba-b8f8-101fc594bba2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:39.487859+00
45d77720-d25f-4a9d-8bad-aa252b4a9d85	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:41.481731+00
fe426d25-ab2a-448e-a1f1-f3a42149b1c7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:43.485798+00
427f7cea-feb2-423f-9d3f-f1e755b3cee1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:45.482146+00
12d14d12-b246-47d1-aa53-2f3d1b0e9b5e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:47.488288+00
4073d1e3-fec4-4535-8424-6cf813563594	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:50.387152+00
27a5beb8-abdb-4795-af5a-a5653ac80e2a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:52.386158+00
011a9b8e-c3cd-4c30-902c-4e147796d92c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:54.406633+00
0f39f1a2-3a5e-4ab0-9de2-9c7cf5d03bd7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:56.387386+00
0685896a-4acf-4e33-99e4-23092bca00cb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:19:58.384796+00
27c5f428-70a8-42b9-80e4-9a1884b0e7e8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:00.385677+00
78b40b2e-cb0a-4379-8865-ec1e2bc2b0e1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:02.387298+00
ae6b6d84-2b7f-4380-bd01-fc6be6a6768b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:04.394511+00
f8662da5-18ec-43da-bd4b-d7be7025179e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:06.383794+00
f526ee14-f5eb-434d-9f28-694fa2f743c2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:08.385453+00
7ada6f23-05e9-47a8-be3d-5bf292493a46	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:10.394275+00
9b735c31-c9a7-47e1-9b99-18ace98ff60c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:12.382573+00
14d4cc38-e02b-4297-8fdc-b6280a16911c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:14.399726+00
dc15ad39-f5a5-491e-a7d3-c6a04338b9f7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:16.383963+00
4fd4d334-f246-4193-9fcd-bff50eb598b9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:18.384344+00
fd0cb2e5-0f84-4c50-aa51-0c7f9ecff8e7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:20.385784+00
d0db028c-62f8-4c2c-9047-bf8b6b5f5e45	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:22.384919+00
3272da5b-ddcc-4b23-9bfa-062b202cfa46	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:24.385346+00
bd647df5-0a20-4456-a2f8-2ea948420290	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:26.442135+00
7122a839-b673-4744-887e-a4d6d115b13c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:28.39231+00
b4d18e38-5d42-459a-9568-f613d7b72781	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:30.40426+00
207fd99a-73ae-4f55-a20a-41d75b0e2587	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:32.387843+00
fd487e8e-6dc5-40dc-a3a7-41eb5872d713	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:34.383673+00
28b903e9-caee-435f-aa4c-40d464103cad	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:36.384429+00
3a481844-f409-4ca6-96bd-7ec3dc7733ea	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:38.385251+00
61429379-b5d3-4e89-b291-f588db3db717	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:40.384363+00
c5b5d93d-b380-4b64-93ce-4bf4f4ac99be	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:42.383004+00
8d80cae6-68ba-4525-a2a6-3f6d8f47eaf4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:44.390569+00
9623268c-2354-48c6-aece-addbaa9707aa	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:46.387995+00
fdabea5e-6f9d-42f4-91e9-65aba26b3c20	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:48.387352+00
508f5aaa-a286-4936-ae8b-6f46ce06cc86	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:50.386033+00
b18b2862-4977-4c4d-8e6a-02ff9e722a88	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:52.384957+00
f1d002e0-8e48-40bb-a2ab-b92c317235e6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:54.38548+00
0ce9ffe0-5ad7-44c2-9619-af3268ab1ca4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:56.395986+00
14a1f556-22b6-4ba3-9658-fff4cb3bd4ba	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:20:58.384845+00
47cdacea-4f95-4f70-a597-59a554450273	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:00.38162+00
34e7f6dd-2235-4191-8383-3184344e78ad	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:02.386355+00
d7247650-950d-4d76-a8fd-72ad404c7f3d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:04.399666+00
c866d4b2-05b8-4f2f-94c3-2205cd5213fb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:06.383416+00
40dd36a3-a382-4f1a-bc53-cc699415deb5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:08.388802+00
c6ea0142-9091-4d3c-9d17-a9647aaee1b1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:10.391605+00
b93ead27-0b25-4abf-a7e7-c8fe228c076b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:12.391877+00
d652a592-ebc8-4a28-ba52-0e6cd8964b5f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:14.392962+00
bd61fc08-156d-45fb-8d16-21c6981b97e0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:18.385295+00
50ff26e7-e746-45b0-a0ea-d2df008ef44b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:22.387934+00
eefbfe35-bbbf-42e1-92f3-7328c5f83483	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:32.489642+00
6c2deeb7-4936-43b7-97e4-ef0dcb42c2b4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:34.400555+00
9fa883a7-ca5b-43da-b36d-1cab6e2dc308	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:22:54.264984+00
ac792bad-f705-43c2-902e-50da5921c177	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:24:07.507327+00
0072ab77-e58d-4ebb-96e8-1574c1306741	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:24:18.768215+00
c1cef2bc-c449-4ae6-9429-7ac8e6aa34c5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:24:41.76833+00
814d5ad4-1dce-49dc-ada0-d63412865668	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:24:44.026823+00
9bd97d51-d218-4262-879f-c92487afdb93	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:26:46.895159+00
3089602f-cedd-42fc-9ae3-282d44bfbfcf	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:26:48.359563+00
a25d35e7-ad19-4a27-a5b1-4a97f8cf5fba	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:27:44.391031+00
bee6c949-cf4e-4a2f-a422-3fe0df44f103	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 14:14:15.202107+00
1689f659-2f67-4574-bf5f-c79640e58908	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 14:14:15.207237+00
605015b5-2b4d-4332-8ebd-5d90fbc96ff7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 14:15:10.087614+00
307ed48c-35cf-4955-a4a6-36d07195673e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 14:15:15.291994+00
d1c45389-168b-48cb-9bb7-21439d3f5348	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 08:58:51.438705+00
d66818c5-4f07-4021-807b-cdfe249debd6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 08:59:32.150653+00
cc2b9806-9dce-462a-9100-44e0b70034c3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 08:59:42.80264+00
529caf4f-b2ae-4fa6-b9d0-654a54281c05	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:00:06.468345+00
60d97c20-73cd-420a-bed7-ea1d6ecba2bc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:02:22.03829+00
ae954699-27a2-4005-b4b0-681d74ac8bb0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:02:22.054844+00
a6864672-c382-41d5-8124-87bbb8d2bd1d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:02:24.571187+00
67887fb2-028d-48b5-aad6-73cff373db63	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:02:24.598349+00
4bc94b5a-5ecd-48a4-aa20-8665c0c6f76f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:02:26.966513+00
772c1666-9768-41b3-b072-5bfa79031cb7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:57:55.020813+00
b2bfef6a-a7d7-48d7-9160-3001d0494e37	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:57:55.032093+00
b44ddcef-4f5a-4d2b-a0b1-00ebe93fd49c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:16.386478+00
413f5e14-45e7-4496-b469-a0530bc78176	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:20.39811+00
f8790cc2-4939-41f4-97f3-4c709b078fd1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:24.381716+00
b113065b-7cd2-4283-9e62-a82cf61d196c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:26.406158+00
96b9a137-02af-4f42-b36b-1ae305c57602	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:28.389806+00
785e5d4f-5b33-48d8-9be2-a9a5e9ee9d90	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:30.385661+00
18a9a54b-1c6c-40b7-a662-cccdf6333523	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:36.401306+00
55419dc2-12d8-4644-8485-a930f8a92cb5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:38.485712+00
dadcbbc2-9cc9-4340-9893-79cce564e9da	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:40.409882+00
4dc0ca01-af4a-47cb-bffd-47ee4fdcbacd	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:42.391185+00
9a60b45a-8bd4-45ae-991f-e6f91b6419de	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:44.4342+00
293f582d-9aa1-4f97-8305-54e41b5e4c45	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:46.463479+00
aff46723-e1e7-420e-9986-be77729e2bf8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:48.412089+00
d1230c78-b005-4d9b-a676-c09bfd994b03	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:50.466295+00
fab1a166-1711-400c-b4bf-a315246c681a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:52.397164+00
17089d80-8fda-4fec-9861-5740a4ac419b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:54.38842+00
81b734f4-5c8f-4141-bdf3-96d726cdd892	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:56.448327+00
065cd59f-c401-4f80-bce0-2a8f5949b0f0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:21:58.397076+00
ea6b1c5a-61f3-46e0-9547-ce3d5e7c18c9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:00.399009+00
3a67da31-ef54-4c79-80c3-4a2dd18e4dea	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:02.390348+00
4831f94c-f208-44a2-a662-029302581026	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:04.385434+00
430dd6c7-c2b7-40ef-9ad5-0af7e984b048	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:06.45852+00
c8b97d65-110a-4d54-a700-be514f910e34	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:08.392504+00
6cbbee47-c88c-45f3-9de6-a8def8164fc7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:10.384966+00
e13f5f9c-028d-4a36-a001-90d9a192a2ed	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:12.398714+00
67cb5abd-054e-4d7a-a0c8-8d1ccfb61b5b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:14.407815+00
7118029d-f418-4b9d-9607-1ad355915656	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:16.439773+00
b62fb5a6-3f7b-4242-a3a3-c388d257553b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:18.428503+00
85cffcdc-5fb4-4f75-a97d-4d0795eeca1f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:20.387499+00
e8b2a37f-96d1-4812-b435-1db7265ab01e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:22.54274+00
cf813111-639b-497d-9b34-631c36f76d28	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:24.400929+00
ac5fe5e2-ec74-4cb2-a800-12b3936b14f8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:26.442541+00
17945828-bad9-4891-89a9-b93a75859707	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:28.387545+00
cee5ec72-bc15-4dd1-9486-78f8b5e52eac	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:30.391963+00
7fcc2715-02f7-4dc1-ab55-ee2d86b6e4aa	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:32.819717+00
67ce99db-35fd-448d-b940-f0f2ac179f24	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:34.385402+00
5e1c90d5-28a3-4988-8d8d-4002568e821a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:36.384793+00
0036191a-9a1a-420b-bb26-237e6143150a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:38.390232+00
7362e62c-f37d-455e-8301-af95e05bd603	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:40.383852+00
34812d31-a6c7-4b3b-bcc4-0a0ce2324941	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:42.384361+00
31548dc9-4da2-44f5-ab65-0038efb02008	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:44.388039+00
0922bbdf-610f-4fc9-a7bd-094a5bd210ae	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:46.382421+00
fa972f8c-b0aa-4039-8b37-cf79be11f64b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:48.385362+00
84c3a29d-7aae-4045-81f8-ae67a8fc9339	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:50.402044+00
404616a4-4cb8-4155-84d9-692aacc00d41	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:52.383814+00
91c0c45b-d181-418e-82c2-4e1a6f9293a4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:53.485685+00
579b89d4-736a-4be3-ab70-f1beeec5c146	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:55.505395+00
68b855a2-32b9-4d16-a341-878308cd628d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:57.485248+00
174ef194-05bf-497b-94df-14c2516a7121	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:22:59.325037+00
5ed65860-a848-4065-8dcd-cea66e343712	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:23:06.52238+00
91658a98-b8c9-46a8-8939-645c258d9d22	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:23:06.525376+00
804168a8-b7e6-458b-860f-6ea838142281	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:23:53.400182+00
c005185b-d8a6-464b-99fe-16507c4f95be	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:23:53.408488+00
7199c62f-5740-4d18-a9dd-5e2f76729ff6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:39:55.78833+00
8eaec71a-2c26-4580-8c42-4be1c91fe154	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:39:59.957015+00
513d9d4f-efce-4d2d-a515-0b3f95b3793d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:39:59.963594+00
dd25b40c-a8d6-43c2-9a21-37bfec5c617c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:40:04.195503+00
f68f5a99-ba28-4068-a644-c8f21dadd3fc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:40:04.35285+00
904dd961-13f4-4116-abb9-15ae4d943358	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:41:34.474524+00
aa840aa3-8396-458f-ab7e-b1b8f8e97436	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:59:28.658821+00
d42d29d7-d7ab-430f-b5ab-d7ffebb74f1c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:59:28.658877+00
b1f66a8a-85fe-424f-b881-fc0c6bc465bb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:59:37.962218+00
98987e72-5287-4567-bddb-b78368ad19e6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:59:38.15458+00
88fe0a09-0e11-42da-9e8c-ec14c494b0ce	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:59:38.689686+00
12da8aa1-c721-4528-9d12-c1f4cf88c55d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:59:38.72127+00
bbadb30a-d871-423d-bad8-b6e218025d8f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 19:59:44.453018+00
5efcfdc4-4cfc-48fd-b3b9-1ae6165091f5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:01:19.145141+00
6df96035-4289-43b7-a9e7-599c1d220bf0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:01:19.152123+00
8b740b14-6391-410e-b4af-cf7b5211a879	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:01:41.77998+00
d128cd3c-2884-48eb-ac9f-d8cd7eea5fdf	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:05:26.577349+00
a24bdabe-01ac-4dd8-8268-beeeed60a09e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:05:26.58814+00
6e17706f-f15a-4d97-95ca-626fb2dc8fd5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:05:57.451514+00
533f0e1c-9717-4223-b247-b21942efe64d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:05:57.455105+00
2393e117-4765-45cf-874f-171fb697f465	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:09:55.020067+00
2f87bad6-135c-4d4a-a386-461cd875f334	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:09:57.8295+00
0453c0b4-5f33-47b4-9b76-4644d19339ea	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:09:57.84296+00
9db3d6a2-5483-4daa-8454-138cc4ee6752	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:10:16.387789+00
69a63663-f786-4974-9e24-36004729c4d3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:10:18.309833+00
f9fc9b6c-613e-45c0-b5ad-db2420ee5598	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:10:20.301087+00
a743797e-27a5-4b77-b1ba-d2c094a9d92a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:10:22.305316+00
10242852-1259-4246-969a-8045a01ab099	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:10:24.295532+00
0d6816da-db32-41d4-b151-d40d5a862f12	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:10:26.299932+00
ed6d29f3-c2e7-450b-840c-94d83b9f7a4d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:10:30.975001+00
9afc0653-a3df-4d88-b3dd-dc34c3750018	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:25:12.425393+00
b3821383-b043-4a0b-9337-e61670c7487a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:25:27.162414+00
82a514f0-77cf-49e7-8ec6-effc1ef21514	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:25:46.146366+00
b71fb126-d166-4b43-8f4f-b5170f84e699	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:25:46.154089+00
e9a18385-059a-4213-a354-b15501056b67	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:05.859607+00
7f19271c-c0b8-488e-8c2e-5e658696c8fd	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:05.857721+00
26f29196-4a45-4f27-b093-6839b65093eb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:06.040694+00
1321f6b8-417a-4fb1-b7da-87bce1937bb4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:06.127137+00
4bb9bc7c-f72e-4ab5-83de-145772536bfd	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:06.156121+00
e7c26c89-a0c6-4401-b56c-faefbe350c15	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:06.230655+00
83350dac-f184-48e6-9f3f-be00c8813092	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:20.024454+00
76fcfb10-f177-4bec-a507-64f677ec8a51	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:20.021512+00
4774ba52-bc99-4d83-ab32-e7172f500758	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:20.640539+00
064b5581-8b53-4b74-ab6d-9f740911d034	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:20.964491+00
6e51a374-925c-4654-b381-047a57ab9e4a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:20.993098+00
5c8b4b19-6502-4d9e-b764-54cd51083127	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:21.10425+00
71bd4131-f022-491e-98f3-5cec5a94d406	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:28.992394+00
6defa60b-bacf-4564-9f8a-21fcbbfa3c3c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:38.162302+00
abce2783-6c9b-4217-a148-f3f382d655ba	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:38.169507+00
5b886f7f-4e72-48b2-9874-4c57d5a2b1db	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:43.565289+00
f16deffc-97ef-4aad-b546-2632dd4c69c8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:43.575994+00
c59e1b3a-a4fe-4bb0-ac4d-22c836645be6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:43.578595+00
042d4b2c-6e41-4373-a5c5-1168334a782a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:43.59108+00
696dc620-79f0-421b-bfc2-27a041e6124d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:43.631867+00
5d09f7df-3b97-4608-97a2-53ceb8baaa96	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:43.650323+00
7b8a9e8d-c555-4eda-b237-9a7d18df6567	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:44.308633+00
a1615546-7ffe-45ed-946e-486a055d2415	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:46.270456+00
9ddef42e-7723-45a4-9e5b-86162ef18de2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:48.282036+00
d8b4a9d6-74bf-47fa-a596-bd68a53e43ea	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:50.273197+00
f8efcc0a-4860-4480-8c27-65b1ff39b54e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:52.278259+00
955c02a6-1aa0-40cb-82c0-60d54768f4dc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:52.467603+00
2f658243-672a-4b5e-88b4-98d50e6a5ef4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:52.478291+00
f6205266-06a7-42dc-befd-7272e1411e5a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:54.337608+00
73999848-a541-4f45-b4a8-ce4fac14bfc5	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:56.337052+00
69ee18a5-a2a1-4cde-8df7-921e4eb8d419	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:28:58.335705+00
e367884a-9d63-46b0-9505-8ce4bfd83964	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:00.335427+00
f7f3e1bc-31b0-406f-9ade-46dce6160b59	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:02.344581+00
1393f4b2-7d7b-4a8d-9cd0-45925456aaf0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:04.335959+00
c442a3f9-8f4d-4379-9dd9-ea198eb71a3e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:06.335197+00
ce5783dd-1334-4440-affb-298586c65cfc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:08.33536+00
b3130f9a-a102-4a84-a2a4-55c92fe75073	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:10.336254+00
1c03897f-ee50-45ef-ad56-11ea04f696d0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:12.35503+00
19f497a7-0a23-4645-bdda-abb36fd9cf89	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:14.346145+00
b74ce131-3a9f-43a2-9aa7-d50e22528098	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:16.331149+00
48f966b4-3e85-4a03-8105-b6e318aa9bd1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:18.441188+00
3ab9bcda-157a-4d31-bbe1-9b444682d3a1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:20.347243+00
b4919468-ef5c-4dc5-a011-4a1c0c110ea8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:22.341994+00
3fe62e71-984d-459b-bca7-413f35ed37fa	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:24.339408+00
73e42dd3-23c2-4e46-ad1d-6c282d80f7b1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:26.345525+00
38e70770-bf46-45c9-896b-d8d4e3696e76	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:28.33934+00
5f0160c3-8e4b-408f-a972-787bd25f99c4	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:30.3344+00
a075964a-e367-4841-b303-6179822d0918	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:33.721776+00
99f6054c-aa6a-4a28-b6e4-9c3332ade1c8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:38.443474+00
f746212e-3533-4ebb-be0a-bafa019f7138	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:38.443361+00
7e6db762-4504-47bc-8421-6db03d358add	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:53.253054+00
ae2c0a08-8cac-49f3-8853-69a1ffdbbed3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:29:53.370123+00
6fe9b539-ef06-4114-82b8-9d9c2fb92a52	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:30:40.291537+00
3221ffcd-499f-48ac-b164-0654440c8759	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:30:40.291536+00
26ced588-f16b-4d55-bde4-c148c13d7f93	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:30:46.575689+00
8b9f7578-91fa-4a56-90c1-9fe46cab756b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:22:54.279719+00
fc1002c4-36f0-4ce7-ab8b-6ad45a05507f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:24:41.777223+00
1b48e77a-dc60-423d-807a-3ecdc7e44806	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 14:14:56.775714+00
a494a13b-9e38-411c-ad58-a4dbc57bf2ba	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 14:14:56.781372+00
d176f440-bc3f-48a9-9c8c-638c0bd0f6a1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 14:15:10.089305+00
7472c477-8fd1-4e88-a908-f9b673438e58	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 14:15:15.294842+00
935b14bf-80b6-4949-8cd0-c1ed433f0cb0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 08:58:53.962476+00
83ea1f61-3ecb-433f-8d83-4d039aa739e0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 08:59:32.143363+00
7cb52868-002d-483c-a334-827fcba5d6d2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:02:26.959417+00
6a4be708-5233-4f39-9d0a-aeb6b3946177	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:02:46.010564+00
71b4573c-a52a-4c39-a3c5-519c5a02af84	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 09:02:50.019666+00
bd25881b-3419-4e38-b786-f3ad5d137061	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 10:02:16.449124+00
e0fafa5f-a618-4c23-83c7-724758ceb69a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 10:03:58.985867+00
b1cb4873-dbf3-4149-bf5c-8e820982ddfc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 10:04:28.162091+00
369a6af9-b1f6-4937-a53b-d2795255fd32	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 10:04:28.171788+00
53edd3bf-56e5-4eaa-a9a1-b949866f032b	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 10:04:40.744713+00
ec2b6d66-ec0c-4555-aee5-d39e564a6d7c	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 10:04:40.824652+00
e046fa39-6013-4398-84e9-1a3003b25df0	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:30:46.517568+00
34357761-de5a-4012-86b2-1c2ca7ada9df	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:27:24.65482+00
06d7931f-97eb-4f9d-ad43-34ae7de0799e	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:26:48.362655+00
c8ace160-dd0a-470a-9aed-8128dc150a82	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 14:25:57.669297+00
c3639820-7580-4deb-b4fa-ceaa0b8347a7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 14:25:57.675184+00
e2df7ae5-61d2-4913-8550-a5a5debe9571	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 08:58:53.971062+00
b70941c3-1087-45ad-85e4-558ee09fbd64	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 10:02:16.459069+00
e4c38b39-f973-4c9b-88c2-d8da84716d8a	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 10:02:18.786024+00
89e4ca82-d5e4-45b4-a427-8bab08132011	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 10:03:58.994338+00
e8f49e1b-19b0-4071-9a4b-1f1f4c49bda2	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:32:26.042216+00
6a147186-6a10-4eb4-8d0c-d9cc10e45cbc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:32:26.048091+00
d4a09b5f-4bd2-4cc9-b121-32cfc6f93145	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:32:31.569596+00
8c0e0f25-95f8-4f35-ae37-eebd6243229d	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:32:31.750767+00
bbac18a2-8a98-4ee6-a91d-3ac97792c9bf	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:32:51.549075+00
c96ede00-b9fa-491d-8195-a7db691a366f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:32:51.558135+00
177f5c36-09d5-44d6-a2a0-198d8d43f9fd	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:32:53.892976+00
78f15984-5eb1-4d78-8331-a826aca67bbb	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:32:54.035931+00
b9c57539-d0b1-467f-b624-2ba258bc64be	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:34:06.239755+00
e6380584-6638-44a3-bd36-899aaab17e83	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:34:13.678324+00
d4ecb776-547d-46db-b7cf-1b171a794f72	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:34:13.717063+00
c3920dda-5e3a-49d7-bf49-a370070602f3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:34:15.390823+00
2b82e01a-8803-465f-a363-8e180e47a05f	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:34:15.40108+00
49cd43f4-5577-4f8a-aa10-558017c281c6	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:34:56.371366+00
36188599-3e8c-4a61-90f0-19c2760368df	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:34:56.379142+00
78167b6c-b8de-430d-b04e-687e74b44544	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:36:20.686056+00
78ed9e1f-7a3e-4f3a-8587-a886b5cd1151	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:36:23.832432+00
da205234-d380-4e63-99a9-e9c923400add	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:36:23.841008+00
269e22d3-0dcc-4b44-b3c3-5ddce0bba357	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-05 20:38:24.815287+00
b0bbdc71-d866-4d0d-95e5-11cbc62e54e7	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 06:27:26.004492+00
902fb800-5b25-4ad8-88d7-5f52b60d5a74	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 07:27:38.006993+00
e5793ad0-d206-46e5-91bd-630386a8f037	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 14:26:51.796836+00
d086c2ba-15af-43cd-88af-356232177da1	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 14:26:51.800938+00
fdf3758a-1e7a-4bd0-9a40-ae0344f77581	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 14:27:26.295597+00
50e1e0e6-8168-4daf-9a7a-5f73c31a88e9	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 14:27:26.321556+00
faefbd63-470a-4afc-94d9-c700b81516cc	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-06 14:27:26.885316+00
0880ac70-5c91-4550-99d3-a9a5d2cbc034	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 08:59:01.41941+00
98913893-1462-4ab2-8e5d-f1f52f993200	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 08:59:40.837096+00
eba4cb15-4b01-4da2-8cee-58a0b6576ce3	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 08:59:42.813721+00
96b2de39-47ff-48a8-bea7-f2b85078c6b8	GUEST	Anonymous Visitor	PAGE_VIEW	Viewed tournaments dashboard	2026-10-07 10:02:18.778919+00
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, action, category, user_id, user_name, details, created_at) FROM stdin;
aud_1	CREATE_TOURNAMENT	TOURNAMENT	usr_admin_2	Neha Sharma	Created new tournament bracket configurations on reference node #321.	2026-04-27 12:45:18+00
audit-6287ec33-f5f4-4320-80fb-5b574883aa2c	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-06 10:08:51.6943+00
audit-c261f73d-092e-431f-8e59-b3941d70e4c3	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 06:14:02.308408+00
audit-79b0613e-3afb-4ce6-8b5a-c8114202c284	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 06:15:02.488364+00
audit-cc9396ab-9901-4d57-b88e-4d3d72d5a4ed	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:44.663209+00
aud_6	CREATE_TOURNAMENT	TOURNAMENT	usr_admin_1	Vikas Sharma	Created new tournament bracket configurations on reference node #169.	2026-05-05 12:45:18+00
audit-e249e68b-666b-43fd-8d46-67816a6378dd	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:45.348875+00
aud_8	ASSIGN_UMPIRE	TOURNAMENT	usr_admin_1	Vikas Sharma	Assigned official court umpire for scheduling block on reference node #636.	2026-05-15 12:45:18+00
audit-e386d6d2-fb45-45a7-b505-97378c4ab9ac	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:46.360454+00
audit-d1b6b9d2-cc84-4225-a91b-e5068104d54d	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:46.698514+00
audit-43b31b69-91ba-4f90-8024-5e472f09739a	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:48.751719+00
aud_12	APPROVE_REGISTRATION	TOURNAMENT	usr_admin_1	Vikas Sharma	Approved player event entry registration form on reference node #855.	2026-05-22 12:45:18+00
aud_13	ASSIGN_UMPIRE	TOURNAMENT	usr_admin_1	Vikas Sharma	Assigned official court umpire for scheduling block on reference node #938.	2026-04-30 12:45:18+00
audit-c5790cef-9bf6-45ca-8f38-6c3343cc1699	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:49.087436+00
audit-1eeaa6ab-1fad-4690-82e7-7592dee24887	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:51.48699+00
audit-67fc4c9a-a2c8-43e3-aac9-808ffabcf4f3	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:52.478732+00
audit-05a9775e-aae9-49ed-9fef-6ba0f8042137	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:53.575476+00
audit-679cb00d-2d28-40be-87c6-d7e53c3eb452	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:53.9071+00
audit-9b7ff0ab-287d-47c0-bef4-0ef831c104f5	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:55.070147+00
audit-2d942f87-f91d-442e-bf05-3b09526b1b96	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:58.510916+00
audit-93320479-fc55-4e77-9377-e542c530e18c	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:00.335195+00
aud_22	APPROVE_REGISTRATION	TOURNAMENT	usr_admin_1	Vikas Sharma	Approved player event entry registration form on reference node #832.	2026-05-03 12:45:18+00
aud_23	ASSIGN_UMPIRE	TOURNAMENT	usr_admin_2	Neha Sharma	Assigned official court umpire for scheduling block on reference node #744.	2026-05-13 12:45:18+00
aud_24	DECLARE_WINNER	TOURNAMENT	usr_admin_2	Neha Sharma	Declared match winner and closed tournament tie on reference node #412.	2026-05-04 12:45:18+00
audit-ad78ccec-0956-4954-82de-b585296e9ae5	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:11.64751+00
audit-d1634531-b005-44fa-83f7-10b5aea38c31	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-07 09:48:44.567653+00
al-d60727a5	User Role Changed	auth	sysadmin1	System Admin	Changed roles for user 'Manish Patil' (umpire_1@matchpoint.io) from [umpire, player] to [umpire, player, broadcaster]	2026-10-07 09:49:07.310169+00
audit-e6795f10-a18c-4a30-8a85-3b56d5904d17	PUT /api/v1/profiles/usr_umpire_1/roles	system	sysadmin1	sysadmin@matchpoint.io	Request: PUT /api/v1/profiles/usr_umpire_1/roles, Response Status: 200	2026-10-07 09:49:07.314031+00
audit-0cc09e17-b4a1-4f92-9156-d8e7b86fde89	PUT /api/v1/matches/m-upload-1791296696451-3	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-3, Response Status: 200	2026-10-07 09:49:31.177143+00
audit-2142833a-2191-43bf-9eab-f5492f0d7886	POST /api/v1/matches/viewers	match	usr_umpire_1	umpire_1@matchpoint.io	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-07 09:50:20.262622+00
aud_31	CREATE_TOURNAMENT	TOURNAMENT	usr_admin_2	Neha Sharma	Created new tournament bracket configurations on reference node #570.	2026-05-28 12:45:18+00
audit-17f39a05-33a3-4fb9-89e6-9014b66f304c	PUT /api/v1/matches/m-upload-1791296696451-3	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-3, Response Status: 200	2026-10-07 10:04:45.792999+00
audit-49d9cb8b-d3b0-47bf-991a-d8576cdded73	PUT /api/v1/matches/m-upload-1791296696451-3	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-3, Response Status: 200	2026-10-07 10:04:47.369308+00
audit-af18903c-731b-4eb5-ae96-c2e0a60cd9c1	PUT /api/v1/matches/m-upload-1791296696451-3	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-3, Response Status: 200	2026-10-07 10:04:47.622438+00
aud_36	CREATE_TOURNAMENT	TOURNAMENT	usr_admin_1	Vikas Sharma	Created new tournament bracket configurations on reference node #702.	2026-05-16 12:45:18+00
aud_39	DECLARE_WINNER	TOURNAMENT	usr_admin_2	Neha Sharma	Declared match winner and closed tournament tie on reference node #272.	2026-05-04 12:45:18+00
aud_42	APPROVE_REGISTRATION	TOURNAMENT	usr_admin_2	Neha Sharma	Approved player event entry registration form on reference node #780.	2026-05-16 12:45:18+00
aud_45	UPDATE_SCORE	TOURNAMENT	usr_admin_2	Neha Sharma	Corrected score sheet values via tournament administrator override on reference node #952.	2026-04-23 12:45:18+00
aud_47	APPROVE_REGISTRATION	TOURNAMENT	usr_admin_1	Vikas Sharma	Approved player event entry registration form on reference node #193.	2026-06-01 12:45:18+00
audit-8a81fbb6-b481-4132-84fb-6a9d01fcb58a	PUT /api/v1/events/e1791279154035-vb_women_open-0	event	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/events/e1791279154035-vb_women_open-0, Response Status: 200	2026-10-06 10:45:03.876117+00
log-1791283503882-64	Event "e1791279154035-vb_women_open-0" updated	event	\N	Vikas Sharma	Fields: entry_limit, format, scoring_format, entry_fee	2026-10-06 10:45:03.886456+00
audit-177fd87d-84cd-494e-a82b-d4c3303f5225	PUT /api/v1/events/e1791279119394-vb_men_open-0	event	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/events/e1791279119394-vb_men_open-0, Response Status: 200	2026-10-06 10:45:27.965876+00
log-1791283527969-484	Event "e1791279119394-vb_men_open-0" updated	event	\N	Vikas Sharma	Fields: entry_limit, format, scoring_format, entry_fee	2026-10-06 10:45:27.97327+00
audit-db5c7dc2-5e2a-4483-ab44-ba5e1889c1a0	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-07 06:16:25.604785+00
audit-3434e8c4-5558-431f-8334-4319f31745eb	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:52.14579+00
audit-d12ba9f5-03b0-4f92-97b3-322f3ed65b1c	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:52.324956+00
aud_55	UPDATE_SCORE	TOURNAMENT	usr_admin_2	Neha Sharma	Corrected score sheet values via tournament administrator override on reference node #246.	2026-04-20 12:45:18+00
audit-fa8439f4-4161-4084-b010-42fb39fe843e	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:53.217096+00
aud_57	APPROVE_REGISTRATION	TOURNAMENT	usr_admin_1	Vikas Sharma	Approved player event entry registration form on reference node #566.	2026-05-16 12:45:18+00
audit-6f930a72-cbb3-4912-bc32-6b76f5fd8abf	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:53.396763+00
audit-e806aba1-32f3-40f9-8fd1-1c93edf1490b	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:53.741225+00
audit-bd5a9c24-4c5f-4bb3-89db-fdae58a4f5ea	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:54.070195+00
aud_61	CREATE_TOURNAMENT	TOURNAMENT	usr_admin_1	Vikas Sharma	Created new tournament bracket configurations on reference node #855.	2026-05-23 12:45:18+00
audit-58e573a4-3348-483f-baca-5c62c4fecee2	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:54.89166+00
aud_63	ASSIGN_UMPIRE	TOURNAMENT	usr_admin_2	Neha Sharma	Assigned official court umpire for scheduling block on reference node #135.	2026-05-13 12:45:18+00
audit-a2c2437b-d9cb-4077-be69-51bf6efb83c3	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:55.609409+00
audit-56c8064b-5d11-4db6-ba74-26b76e496aa8	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:55.821767+00
audit-3706ce0d-212a-47aa-a971-a924a9287203	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:56.565603+00
audit-64a88b73-3989-4b65-8237-700bb88c9fe9	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:01.515065+00
audit-ae182fe9-b19b-40a4-baa4-d114704dace8	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:02.753867+00
audit-260243dd-d701-426a-ad52-4fdea07f787a	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-07 09:49:17.435283+00
audit-4a8dea09-c4dc-4043-acba-fba9035c8f75	PUT /api/v1/matches/m-upload-1791296696451-3	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-3, Response Status: 200	2026-10-07 09:49:32.129078+00
audit-48a12731-30a1-4c0f-a107-430806e3fdef	POST /api/v1/matches/viewers	match	usr_umpire_1	umpire_1@matchpoint.io	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-07 09:50:28.873846+00
audit-7bd2aa07-a1c3-4dd2-ac34-0b7130e7327d	PUT /api/v1/matches/m-upload-1791296696451-3	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-3, Response Status: 200	2026-10-07 10:04:48.301945+00
audit-9bfb715a-ab46-4959-ab9c-743812d648d7	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:37.755904+00
aud_74	DECLARE_WINNER	TOURNAMENT	usr_admin_1	Vikas Sharma	Declared match winner and closed tournament tie on reference node #690.	2026-06-01 12:45:18+00
audit-1074beb9-ed5b-45b3-b5c4-38f41a470c19	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:38.714412+00
audit-7b8d4809-d769-467a-aac3-e8d50ad8147f	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:38.860301+00
aud_77	APPROVE_REGISTRATION	TOURNAMENT	usr_admin_1	Vikas Sharma	Approved player event entry registration form on reference node #167.	2026-05-31 12:45:18+00
audit-a65c2174-37f3-4e23-b84f-57418a157fb0	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:39.204856+00
audit-a483f013-ea8d-4b3d-9fe2-dd0a84458fa0	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:40.279562+00
aud_82	APPROVE_REGISTRATION	TOURNAMENT	usr_admin_2	Neha Sharma	Approved player event entry registration form on reference node #828.	2026-05-29 12:45:18+00
aud_84	DECLARE_WINNER	TOURNAMENT	usr_admin_2	Neha Sharma	Declared match winner and closed tournament tie on reference node #931.	2026-04-25 12:45:18+00
aud_86	CREATE_TOURNAMENT	TOURNAMENT	usr_admin_1	Vikas Sharma	Created new tournament bracket configurations on reference node #786.	2026-05-25 12:45:18+00
aud_88	ASSIGN_UMPIRE	TOURNAMENT	usr_admin_1	Vikas Sharma	Assigned official court umpire for scheduling block on reference node #926.	2026-05-12 12:45:18+00
audit-19eb2ddc-4694-4e53-8d09-e671db5bf78f	PUT /api/v1/tournaments/t_wvpl_2026	tournament	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/tournaments/t_wvpl_2026, Response Status: 200	2026-10-06 14:02:23.127214+00
log-1791295343131-854	Tournament "WVPL 2026" updated	tournament	\N	Vikas Sharma	Fields: name, description, location, start_date, end_date, age_cutoff_date, withdraw_date, type, status, sport, team_size_limit, team_tie_configs, team_tie_events, bonus_point_margin, bonus_point_value, admins, collects_fees, entry_fee, currency, payment_options (Status: live)	2026-10-06 14:02:23.135707+00
audit-ac41b9e9-591a-46cf-9f1c-40238595f3a6	PUT /api/v1/tournaments/t_7pd_vpl_s2	tournament	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/tournaments/t_7pd_vpl_s2, Response Status: 200	2026-10-06 14:02:37.031607+00
log-1791295357035-11	Tournament "7PD VPL Season 2" updated	tournament	\N	Vikas Sharma	Fields: name, description, location, start_date, end_date, age_cutoff_date, withdraw_date, type, status, sport, team_size_limit, team_tie_configs, team_tie_events, bonus_point_margin, bonus_point_value, admins, collects_fees, entry_fee, currency, payment_options (Status: live)	2026-10-06 14:02:37.039471+00
audit-d577e957-6cee-47ec-9ccb-194ecb7fe864	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-07 07:21:32.718259+00
audit-a3b60852-43c8-49fe-b126-40cf734aa591	PUT /api/v1/profiles/sysadmin1	system	sysadmin1	sysadmin@matchpoint.io	Request: PUT /api/v1/profiles/sysadmin1, Response Status: 200	2026-10-07 07:22:25.434009+00
aud_99	DECLARE_WINNER	TOURNAMENT	usr_admin_2	Neha Sharma	Declared match winner and closed tournament tie on reference node #477.	2026-04-26 12:45:18+00
audit-855a2bdd-6d13-40ef-9170-6a549bf44623	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:14.514486+00
audit-be4ba2fb-e36e-4b9a-9d1f-4f97ec6129b9	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:18.764607+00
audit-d665722c-3587-4663-ac3c-f2b130e58fd1	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:19.194588+00
audit-01a4c1ad-d790-4335-bebe-ace60f6b737b	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:19.671379+00
audit-aec01992-6712-4738-bdfb-0e988d7754e7	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:20.348415+00
aud_105	UPDATE_SCORE	TOURNAMENT	usr_admin_2	Neha Sharma	Corrected score sheet values via tournament administrator override on reference node #974.	2026-05-17 12:45:18+00
audit-e516242e-0382-4272-b8c3-85d094e07397	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:20.669662+00
audit-33e7e0b4-c128-442a-8e5f-f50dc62c54ab	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:20.842364+00
audit-22f1933c-ccb1-4195-a7ab-3b844d5c034e	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:21.002945+00
audit-3f90a5dd-60a6-4989-b618-c882fcefdaa2	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:21.353432+00
audit-844ebbe0-5cc7-40c5-8321-ac7e2d0af2bd	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:21.906548+00
aud_111	CREATE_TOURNAMENT	TOURNAMENT	usr_admin_2	Neha Sharma	Created new tournament bracket configurations on reference node #135.	2026-05-13 12:45:18+00
aud_113	ASSIGN_UMPIRE	TOURNAMENT	usr_admin_1	Vikas Sharma	Assigned official court umpire for scheduling block on reference node #771.	2026-05-01 12:45:18+00
aud_120	UPDATE_SCORE	TOURNAMENT	usr_admin_2	Neha Sharma	Corrected score sheet values via tournament administrator override on reference node #884.	2026-05-03 12:45:18+00
audit-28a283d7-cb71-4e52-ba92-0d0b4b04e86f	POST /api/v1/matches/viewers	match	\N	GUEST	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-05 12:22:30.908648+00
audit-5f3b5510-5d35-4778-a7bd-c140c5827fee	POST /api/v1/matches/viewers	match	\N	GUEST	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-05 12:22:58.827165+00
audit-7797b716-9f84-439b-bb15-0f53d02eb7c7	POST /api/v1/matches/viewers	match	\N	GUEST	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-05 12:27:44.765913+00
audit-7588cff5-b309-4abd-ab9a-c45d5a152742	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-05 17:53:16.110274+00
audit-a6261bf4-88e5-434f-80d1-4648e65a9826	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-05 17:57:10.366738+00
audit-7cfa5baf-c6c0-459a-b1c2-fef70886afff	PUT /api/v1/matches/m_vb_live_final	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_vb_live_final, Response Status: 200	2026-10-05 17:57:35.064749+00
audit-04c719d7-3abc-4272-8446-c7750839805f	PUT /api/v1/matches/m_vb_live_final	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_vb_live_final, Response Status: 200	2026-10-05 17:57:36.126006+00
audit-f8e8d7ff-20f6-46ef-be97-15dadf49dcd1	PUT /api/v1/matches/m_vb_live_final	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_vb_live_final, Response Status: 200	2026-10-05 17:57:47.052284+00
audit-0c068d25-7333-43d1-9198-f9b0bbd6401e	POST /api/v1/matches/viewers	match	usr_umpire_1	umpire_1@matchpoint.io	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-05 17:58:13.303112+00
audit-d0e7f103-2ea2-4023-8d80-8f139c66b79c	PUT /api/v1/matches/m_vb_live_final	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_vb_live_final, Response Status: 200	2026-10-05 17:58:26.922866+00
audit-b6252f30-7f2d-4a74-b520-0685345b6475	PUT /api/v1/matches/m_e_t_40_1_r2_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_e_t_40_1_r2_1, Response Status: 200	2026-10-05 17:58:47.541978+00
audit-a3514b4c-cae4-4fac-a108-49241de3c9d7	PUT /api/v1/matches/m_e_t_40_1_r2_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_e_t_40_1_r2_1, Response Status: 200	2026-10-05 17:58:48.314687+00
audit-b747597b-d206-44a4-8f1f-ad84e25af8cb	POST /api/v1/matches/viewers	match	usr_umpire_1	umpire_1@matchpoint.io	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-05 18:00:58.713255+00
audit-f91a77df-b750-4b9c-bfc0-d70480449711	PUT /api/v1/matches/m_vb_live_final	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_vb_live_final, Response Status: 200	2026-10-05 18:01:45.082709+00
audit-d791053d-8f0e-4cdf-a667-0c1f40cf1f57	PUT /api/v1/matches/m_vb_live_final	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_vb_live_final, Response Status: 200	2026-10-05 18:02:07.3956+00
audit-0ab1776d-9037-44f5-9a34-a9f20b4ca43d	PUT /api/v1/matches/m_vb_live_final	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_vb_live_final, Response Status: 200	2026-10-05 18:02:09.205855+00
audit-d2c2e864-e7bd-46ee-b804-3f67bbd80ba8	PUT /api/v1/matches/m_vb_live_final	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_vb_live_final, Response Status: 200	2026-10-05 18:02:10.396229+00
audit-889d7213-234d-4e55-b2ed-b8610ad05faa	PUT /api/v1/matches/m_vb_live_final	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_vb_live_final, Response Status: 200	2026-10-05 18:02:11.35363+00
audit-0723580e-557e-4137-8fa5-f93861d56c4b	POST /api/v1/matches/viewers	match	usr_umpire_1	umpire_1@matchpoint.io	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-05 18:02:14.421+00
audit-2eef39c3-792c-4a83-a678-1c256c0ed6ac	POST /api/v1/matches/viewers	match	usr_umpire_1	umpire_1@matchpoint.io	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-05 18:02:26.439139+00
audit-46812b02-1d7c-49bf-b035-cc6931dcf847	POST /api/v1/matches/viewers	match	usr_umpire_1	umpire_1@matchpoint.io	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-05 18:28:42.549231+00
log-1791225089217-918	Match Paused	match	\N	Manish Patil	Match: Kavita Singh vs Manoj Pillai | Score: 14-16 | Paused by umpire	2026-10-05 18:31:29.263847+00
audit-5911b182-e8e9-4f74-9ff0-1b7bee42a40f	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-05 18:32:04.600224+00
audit-93ea427a-9050-473f-adad-d89870a8abec	POST /api/v1/matches/batch	match	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/matches/batch, Response Status: 201	2026-10-05 18:33:03.810946+00
audit-714f7a50-8f29-4801-807b-5e00dfab1540	POST /api/v1/matches/batch	match	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/matches/batch, Response Status: 201	2026-10-05 18:33:46.623338+00
audit-da7909f2-c7c7-4c64-9d04-35879ecbb174	POST /api/v1/matches	match	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/matches, Response Status: 201	2026-10-05 18:34:10.471412+00
audit-50fa72ee-cc7f-48a0-a226-b848f99ab988	PUT /api/v1/matches/rr-e_vb_tour_1-poolstage-r1-m1	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/rr-e_vb_tour_1-poolstage-r1-m1, Response Status: 200	2026-10-05 18:35:15.906664+00
audit-32fcbb34-293a-4ff5-9f22-514b2a8f1cc4	PUT /api/v1/matches/m-custom-1791225250406	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791225250406, Response Status: 200	2026-10-05 18:35:15.925066+00
log-1791225315929-615	Round name updated	match	\N	System / Guest	Event ID: e_vb_tour_1, Round: 1, Name: Round 1	2026-10-05 18:35:15.935121+00
audit-12d834df-d35a-43b5-9f9e-b7e7df0761a9	DELETE /api/v1/matches/m-custom-1791225250406	match	usr_admin_1	admin_1@matchpoint.io	Request: DELETE /api/v1/matches/m-custom-1791225250406, Response Status: 204	2026-10-05 18:35:23.201279+00
audit-0e841cc9-d716-4d77-8b7f-aebf0ab888a3	POST /api/v1/matches	match	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/matches, Response Status: 201	2026-10-05 18:35:37.838096+00
audit-c45697cc-ad3a-43ed-9765-015f71f14ff2	POST /api/v1/matches/viewers	match	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-05 18:55:57.99966+00
audit-4cf63540-fedc-41f9-bd0f-cbe8749d6795	POST /api/v1/matches/batch	match	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/matches/batch, Response Status: 201	2026-10-05 18:59:09.022032+00
audit-fba1ee84-ec09-4201-8cf7-9aa59dd63b39	POST /api/v1/matches/batch	match	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/matches/batch, Response Status: 201	2026-10-05 18:59:17.029308+00
audit-5eaba691-a5f6-48ac-ab83-895adcce4148	POST /api/v1/matches	match	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/matches, Response Status: 201	2026-10-05 18:59:28.835002+00
audit-cb3979ff-b765-41a3-b6ba-1eb8d452e2e5	PUT /api/v1/matches/rr-e_vb_tour_1-poolstage-r1-m1	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/rr-e_vb_tour_1-poolstage-r1-m1, Response Status: 200	2026-10-05 18:59:37.882513+00
audit-0edcd716-92c4-4acb-8daa-bff62f6a81c2	PUT /api/v1/matches/m-custom-1791226768817	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 18:59:42.070636+00
audit-eca61f0a-ed55-4b48-b00c-2cefd64cc858	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-05 18:59:52.708963+00
audit-109421c6-d18f-4c39-8b89-3d28604a0419	PUT /api/v1/matches/rr-e_vb_tour_1-poolstage-r1-m1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/rr-e_vb_tour_1-poolstage-r1-m1, Response Status: 200	2026-10-05 19:00:11.75685+00
audit-6b2f7589-d2f9-41bb-9105-c9d8cec79c89	PUT /api/v1/matches/rr-e_vb_tour_1-poolstage-r1-m1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/rr-e_vb_tour_1-poolstage-r1-m1, Response Status: 200	2026-10-05 19:00:16.360231+00
audit-e9ebfe50-2892-4838-8e86-fcd03dfc5eb0	PUT /api/v1/matches/rr-e_vb_tour_1-poolstage-r1-m1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/rr-e_vb_tour_1-poolstage-r1-m1, Response Status: 200	2026-10-05 19:00:19.835221+00
audit-53a3247b-eb58-45b4-94ae-61950cbd0c02	PUT /api/v1/matches/rr-e_vb_tour_1-poolstage-r1-m1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/rr-e_vb_tour_1-poolstage-r1-m1, Response Status: 200	2026-10-05 19:00:24.515445+00
audit-1679d977-ae49-4d48-8771-fb7351d8e8ff	POST /api/v1/matches/viewers	match	usr_umpire_1	umpire_1@matchpoint.io	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-05 19:00:26.459562+00
audit-2adeaf71-3ff4-450f-88cd-582e549c4d29	PUT /api/v1/matches/rr-e_vb_tour_1-poolstage-r1-m1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/rr-e_vb_tour_1-poolstage-r1-m1, Response Status: 200	2026-10-05 19:00:27.218362+00
audit-b940a1ff-e032-48ff-be3f-28979f0fff9c	PUT /api/v1/matches/rr-e_vb_tour_1-poolstage-r1-m1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/rr-e_vb_tour_1-poolstage-r1-m1, Response Status: 200	2026-10-05 19:00:33.461405+00
audit-ff47d620-1a79-436a-a0bc-b49dd260450c	PUT /api/v1/matches/rr-e_vb_tour_1-poolstage-r1-m1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/rr-e_vb_tour_1-poolstage-r1-m1, Response Status: 200	2026-10-05 19:01:26.74061+00
audit-19adc023-8d23-44b9-9267-b2b03e5c8793	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:01:33.388012+00
audit-34f13e0d-505b-4b6d-b1e2-3828010841b4	POST /api/v1/matches/viewers	match	usr_umpire_1	umpire_1@matchpoint.io	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-05 19:01:33.519993+00
audit-d3f66102-5b01-45f5-a10b-e2a06bb3e080	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:01:35.992886+00
audit-108aa090-3960-4145-98c7-9c82adffca76	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:01:36.56999+00
audit-27a6864e-89cd-4a39-b560-e1de2b5c7cb3	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:01:37.159469+00
log-1791279157956-164	Event "e_wvpl_league" deleted	event	\N	Vikas Sharma	Event ID: e_wvpl_league	2026-10-06 09:32:37.960377+00
audit-446a44d3-28ef-4e96-8159-fda85035afda	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:01:37.708325+00
audit-02e71691-9de0-4a38-bb8f-442dda5f5928	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:01:38.186534+00
audit-395830d4-2e64-47cd-8242-7ea31e17a895	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:02:05.532897+00
audit-c972f91f-8d78-4331-a639-60f732ffb186	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:02:16.923146+00
audit-b20dcc4c-cd3e-4261-af9c-e2bcb691c695	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:02:17.565256+00
audit-a6e747b9-ea22-44a9-8986-ba023d3bc691	POST /api/v1/matches/batch	match	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/matches/batch, Response Status: 201	2026-10-06 14:12:49.605024+00
audit-8fbf4d96-f257-4ae1-85b4-619c6c282c63	DELETE /api/v1/matches/m-upload-1791295969489-7	match	usr_admin_1	admin_1@matchpoint.io	Request: DELETE /api/v1/matches/m-upload-1791295969489-7, Response Status: 204	2026-10-06 14:13:07.027317+00
audit-3c7e9a14-eec3-4d0a-9710-87bdf644bafa	POST /api/v1/matches	match	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/matches, Response Status: 201	2026-10-06 14:13:49.771386+00
audit-6c5c0b0b-389c-44fc-ba3e-8d48e5651467	PUT /api/v1/matches/m-custom-1791296029744	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791296029744, Response Status: 200	2026-10-06 14:14:04.093573+00
log-1791296044095-653	Round name updated	match	\N	System / Guest	Event ID: e1791279119394-vb_men_open-0, Round: 2, Name: Final WVPL	2026-10-06 14:14:04.10125+00
audit-ccb9dfc0-e949-4f71-86f3-724be5250a90	PUT /api/v1/matches/m-upload-1791295969489-1	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791295969489-1, Response Status: 200	2026-10-06 14:14:36.766278+00
audit-83b1a09b-97a3-4d56-8001-97b0994955bd	PUT /api/v1/matches/m-upload-1791295969489-2	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791295969489-2, Response Status: 200	2026-10-06 14:14:38.51742+00
audit-01bb4016-5a0c-4cb1-b17e-4dc101738bf2	PUT /api/v1/matches/m-upload-1791295969489-3	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791295969489-3, Response Status: 200	2026-10-06 14:14:40.253618+00
audit-197aff7e-448b-4142-8703-dfa6463b9417	PUT /api/v1/matches/m-upload-1791295969489-4	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791295969489-4, Response Status: 200	2026-10-06 14:14:42.256741+00
audit-02d9842e-d8e8-4f85-ac17-f496e46659ad	PUT /api/v1/matches/m-upload-1791295969489-5	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791295969489-5, Response Status: 200	2026-10-06 14:14:43.933743+00
audit-ece926a5-9cc3-4ff5-9c72-da64f1f6e0b0	PUT /api/v1/matches/m-custom-1791296029744	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791296029744, Response Status: 200	2026-10-06 14:14:48.332074+00
audit-de091018-7267-4e93-818f-84795c6699c5	DELETE /api/v1/matches/m-upload-1791296160840-7	match	usr_admin_1	admin_1@matchpoint.io	Request: DELETE /api/v1/matches/m-upload-1791296160840-7, Response Status: 204	2026-10-06 14:16:05.572158+00
audit-99821923-e0e0-46d4-bc1c-231485dfa1b8	POST /api/v1/matches	match	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/matches, Response Status: 201	2026-10-06 14:16:45.147262+00
audit-e8041fcd-451b-4128-b785-ec6b35fb6376	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-07 07:36:48.30053+00
audit-233d7b50-d8a2-47ba-9105-0f7b4f9e4eff	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:18.594212+00
audit-ed08879e-3e69-4008-a957-ed998a93a06b	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:19.504652+00
audit-214a1414-103b-4492-90d9-c04621681955	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:20.176631+00
audit-056e4ed9-46dd-4f22-94da-e23afe44e975	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:20.498512+00
audit-09d58393-8607-4c9b-b950-ab9853473163	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:21.162142+00
audit-29caf4d4-034e-4f63-b01b-f0291711ee0e	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:22.614374+00
audit-25605770-5e86-4904-b529-05037fb06d36	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:23.675799+00
audit-1b848c7d-1460-485f-987c-d24831cd6b46	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:24.011932+00
audit-c93f6756-293b-4eef-af33-cc6eebf44474	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:25.482366+00
audit-9b19e821-d616-4e64-aae2-d0389011035e	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:26.024237+00
audit-0e339521-e990-4081-9c54-57a24e27ff68	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:26.907286+00
audit-4f94a00c-0416-4d71-b204-9c320e57c057	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-07 09:57:52.347428+00
audit-e8534640-cca0-43b5-a9fa-f5a956b0f3a3	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-07 11:44:35.781958+00
log-1791373490304-560	Match Reset by Admin	match	\N	Admin 1	Match ID 'm-upload-1791296696451-2' was completely reset to scheduled state with cleared scores by admin.	2026-10-07 11:44:50.309137+00
audit-edc79fc3-7cba-4a33-8168-9f7090229357	PUT /api/v1/matches/m-upload-1791296696451-3	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-3, Response Status: 200	2026-10-07 11:45:16.019234+00
log-1791373516022-627	Match Reset by Admin	match	\N	Admin 1	Match ID 'm-upload-1791296696451-3' was completely reset to scheduled state with cleared scores by admin.	2026-10-07 11:45:16.027286+00
audit-22763705-7a25-4bdc-85b5-9e3ceadf9972	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:02:02.856621+00
audit-43526f17-9c73-4752-91f9-ef22ffc305d4	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-05 19:02:47.884454+00
audit-08d900e8-5c7e-422e-9c28-10f166e29bff	PUT /api/v1/matches/m-upload-1791295969489-6	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791295969489-6, Response Status: 200	2026-10-06 14:14:46.512105+00
audit-b84ceaad-1a5d-447b-81ee-2951ee02d892	POST /api/v1/matches/batch	match	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/matches/batch, Response Status: 201	2026-10-06 14:16:00.870509+00
al-790c7d21	Match Media Uploaded	match	usr_admin_1	Vikas Sharma	Uploaded media item to match 'm-upload-1791296696451-1' (Caption: Smashers vs Spikers)	2026-10-07 07:38:55.964197+00
audit-bcc6b3d6-cf1f-4cd6-a547-ae7eadf3313b	POST /api/v1/matches/m-upload-1791296696451-1/media	match	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/matches/m-upload-1791296696451-1/media, Response Status: 200	2026-10-07 07:38:55.972585+00
audit-24f1caf8-36cc-49fb-bfaf-cd7e112f595d	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:19.357126+00
audit-d521bf96-5ccb-4ed1-88f6-e0201dc84f3f	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:22.273869+00
audit-1e6362d8-852d-478c-8796-440bc05c6a2f	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:24.66557+00
audit-5e3b3011-01ef-4761-8aa9-a37ffe5fb517	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:27.583174+00
audit-4d77fff9-955f-464d-9db4-8238f0ccf5cb	PUT /api/v1/profiles/usr_admin_1	system	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/profiles/usr_admin_1, Response Status: 200	2026-10-07 10:02:05.007365+00
audit-b34a964f-80f9-4b46-a111-af7c2a864504	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 11:44:50.299509+00
audit-09cfb915-09e0-400a-b18d-b5c0b00cdd4e	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:44:55.780686+00
audit-769ca547-5f0d-444b-bed7-45a8c0bcddfa	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-07 11:45:45.186617+00
audit-b4cf8323-db9e-4275-a7d2-1639d7f4f334	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:13.704549+00
audit-1dde43aa-5670-4e0a-94a1-b3263f518bf9	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:17.560078+00
audit-66f25c39-462c-45d2-92d2-968e32f66019	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:18.06503+00
audit-09380f31-1a7d-4948-b8f5-2c26b63dca20	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:20.04194+00
audit-7b8ada49-3ce3-4561-a89d-83ef15f98a8e	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:20.667811+00
audit-d89ef9a8-0cc6-4307-8642-d0ce8fbd155c	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:21.740657+00
audit-f1523dd8-b778-4870-b3ce-055f9cc2bd0c	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:22.363847+00
audit-9c041730-0d2f-4411-8906-5f06d2b3d696	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:22.547389+00
audit-b8b62ffc-3601-483c-847d-526a63fe2063	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:23.112418+00
audit-d5df011d-eed8-421b-ba5f-6e2147f12e88	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:23.673364+00
audit-11437f7c-c651-4a26-9565-4ff4b350a617	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:24.521589+00
audit-6f9105df-fa5c-4b50-bc82-4219e3528e8e	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:24.986259+00
audit-e8542437-c2ac-4021-a2be-73d594fd2d3e	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:25.571202+00
audit-ef6a33d8-98cb-4b4d-b6e0-f85d81dc3636	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:26.132829+00
audit-ee5425ab-e5c8-4564-8c3a-2e5923024958	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:26.784895+00
audit-6bddf8ed-717d-4df7-9995-50dec7430929	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:27.265758+00
audit-db4d2346-29f0-49b5-8a83-8673b0016d2a	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:27.658816+00
audit-d46f36d0-1ba9-4ea9-93e9-2c04ef7fe2b2	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:28.908806+00
audit-792aadc6-07ff-4959-b748-bfb0a8e7bdf6	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:29.747838+00
audit-41cc75cd-5710-4414-9332-04b77543581d	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:31.773247+00
audit-64c93a11-6102-419c-aa40-2a0249f85ce0	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:02:04.125199+00
audit-f33054f1-f049-4232-899a-540ca955a725	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:02:16.104731+00
audit-1faebaba-a84e-4d52-84c8-116199cbb238	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:02:20.08872+00
audit-e7067c44-76f6-41d6-a4ec-497b382a0ce1	PUT /api/v1/matches/m-custom-1791296205133	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791296205133, Response Status: 200	2026-10-06 14:16:52.207438+00
log-1791296212211-83	Round name updated	match	\N	System / Guest	Event ID: e1791279154035-vb_women_open-0, Round: 2, Name: Final	2026-10-06 14:16:52.21408+00
audit-8afcf45c-3e25-4fe9-b5ac-e205ce205714	DELETE /api/v1/matches/m-custom-1791296029744	match	usr_admin_1	admin_1@matchpoint.io	Request: DELETE /api/v1/matches/m-custom-1791296029744, Response Status: 204	2026-10-06 14:17:10.048391+00
audit-407626e2-5be4-4c43-94a2-da9ec90a45c2	DELETE /api/v1/matches/m-upload-1791295969489-1	match	usr_admin_1	admin_1@matchpoint.io	Request: DELETE /api/v1/matches/m-upload-1791295969489-1, Response Status: 204	2026-10-06 14:17:11.949956+00
audit-c3f96949-11c5-49b7-86fe-6501cd794d34	DELETE /api/v1/matches/m-upload-1791295969489-2	match	usr_admin_1	admin_1@matchpoint.io	Request: DELETE /api/v1/matches/m-upload-1791295969489-2, Response Status: 204	2026-10-06 14:17:13.728553+00
audit-510ff046-2cea-43fc-8175-fad680e6611b	DELETE /api/v1/matches/m-upload-1791295969489-3	match	usr_admin_1	admin_1@matchpoint.io	Request: DELETE /api/v1/matches/m-upload-1791295969489-3, Response Status: 204	2026-10-06 14:17:15.42867+00
audit-567bdecc-d325-49aa-9b6f-c44faec03181	DELETE /api/v1/matches/m-upload-1791295969489-4	match	usr_admin_1	admin_1@matchpoint.io	Request: DELETE /api/v1/matches/m-upload-1791295969489-4, Response Status: 204	2026-10-06 14:17:18.12003+00
audit-944b1dd6-6a53-4228-a68d-6ee3f7e25659	DELETE /api/v1/matches/m-upload-1791295969489-5	match	usr_admin_1	admin_1@matchpoint.io	Request: DELETE /api/v1/matches/m-upload-1791295969489-5, Response Status: 204	2026-10-06 14:17:20.118695+00
audit-42b22e17-5340-46bc-b734-ee1a95aa941d	DELETE /api/v1/matches/m-upload-1791295969489-6	match	usr_admin_1	admin_1@matchpoint.io	Request: DELETE /api/v1/matches/m-upload-1791295969489-6, Response Status: 204	2026-10-06 14:17:21.783816+00
audit-b89c3e8e-16c1-48ed-a6db-01974118ac02	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-07 09:08:04.189563+00
audit-4b0c67b2-aa45-4491-a38d-a8494ca024f8	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:22.07511+00
audit-28b38028-1bfe-4661-967c-70b37180038b	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:22.444449+00
audit-486144ff-54c5-40a3-9278-84ddbaf2406e	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:22.775597+00
audit-23cb1413-b884-4629-bc00-32f1d81e806a	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:22.952545+00
audit-5782756f-30c3-4676-ac12-07b81664ed5f	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:23.087134+00
audit-eeeedef3-c6e8-46f7-a0be-94ef93d0c289	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:23.839842+00
audit-957f1ff2-b425-4e00-9b5d-b413238699d8	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:24.183825+00
audit-1e5a47e1-09ea-46e9-9d95-91b49dd7258a	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:24.345506+00
audit-b37a9f1f-c457-4d6a-b05e-655eee7261e0	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:24.490418+00
audit-f90dd1cc-0746-4010-8ef9-dbbbed346ace	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:24.840774+00
audit-447c3499-ff89-4332-bba4-86cf2f5cadc1	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:24.995341+00
audit-752e4474-3bfd-40b1-84b9-d6d4856f2372	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:25.652552+00
audit-29dea49d-e1ce-44da-a9ce-c497e4b94eee	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:26.367022+00
audit-d6262ee2-b3d5-43ed-9147-60d1714ac18a	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:26.547833+00
audit-beb31cfb-daa9-423b-93b4-6e7a641789c5	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:26.732114+00
audit-8f367f18-79a7-40cf-bcf1-c6d509e23676	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:27.065618+00
audit-03fb6d19-320a-4001-8f07-f61a5788eb95	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:27.246278+00
audit-3607953d-e33c-4426-b120-b799cc86a0db	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:29:27.429016+00
audit-ec257338-ce03-4843-933a-ef4f0501d13e	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-07 10:02:14.914762+00
log-1791373495784-715	Match Reset by Admin	match	\N	Admin 1	Match ID 'm-upload-1791296696451-1' was completely reset to scheduled state with cleared scores by admin.	2026-10-07 11:44:55.788286+00
audit-f8dbee12-8be3-448b-83ac-15ba48262e37	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:40.45393+00
audit-4ef3c931-30f0-495a-8680-84bdf0582b86	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:02:06.108199+00
audit-cdb2b61e-eb56-4a1e-9d83-85567f8083da	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-05 19:09:00.850924+00
audit-5697a64f-d918-424f-8f4a-8656b93fdc0c	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:09:51.064411+00
audit-1cbc7ac5-a331-470b-8c27-cb86264fc1ce	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:09:53.683945+00
audit-bc232c72-3907-439c-84c8-743511eba31b	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:09:56.663507+00
al-b35d9134	Match Media Uploaded	match	usr_umpire_1	Manish Patil	Uploaded media item to match 'm-custom-1791226768817' (Caption: Match 1)	2026-10-05 19:11:54.760388+00
audit-1eb27317-1103-48a5-9e0e-5072a79ed748	POST /api/v1/matches/m-custom-1791226768817/media	match	usr_umpire_1	umpire_1@matchpoint.io	Request: POST /api/v1/matches/m-custom-1791226768817/media, Response Status: 200	2026-10-05 19:11:54.778991+00
audit-0ee1ef04-7a33-40c8-a0f6-ee84216f316d	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:12:05.473493+00
audit-50b8c843-65d8-4a09-9002-c764350eede8	POST /api/v1/matches/viewers	match	usr_umpire_1	umpire_1@matchpoint.io	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-05 19:12:31.660603+00
audit-75744207-c124-40e4-9c70-65b35137a0d9	POST /api/v1/matches/viewers	match	usr_umpire_1	umpire_1@matchpoint.io	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-05 19:13:26.924204+00
audit-2dade1a8-f1b1-438b-99dd-5b9e06ed78de	POST /api/v1/matches/viewers	match	usr_umpire_1	umpire_1@matchpoint.io	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-05 19:13:37.442022+00
audit-c084eff5-afba-4798-9fd5-53c2e9979f91	POST /api/v1/polls/match/rr-e_vb_tour_1-poolstage-r1-m1	system	usr_umpire_1	umpire_1@matchpoint.io	Request: POST /api/v1/polls/match/rr-e_vb_tour_1-poolstage-r1-m1, Response Status: 201	2026-10-05 19:14:29.007467+00
audit-dec613d4-652a-4f18-9bd9-f3993280c6c6	POST /api/v1/polls/71dfed48-325f-486a-ba7e-379d575ccf4a/vote	system	usr_umpire_1	umpire_1@matchpoint.io	Request: POST /api/v1/polls/71dfed48-325f-486a-ba7e-379d575ccf4a/vote, Response Status: 200	2026-10-05 19:14:32.363481+00
audit-4495dd88-9da6-4c28-bce8-cc58cc75618b	POST /api/v1/polls/955b4858-673b-461c-a420-137f0b551a63/vote	system	usr_umpire_1	umpire_1@matchpoint.io	Request: POST /api/v1/polls/955b4858-673b-461c-a420-137f0b551a63/vote, Response Status: 200	2026-10-05 19:14:37.547647+00
audit-b6055362-3e27-496f-8348-5f4a4b0a9325	POST /api/v1/matches/viewers	match	usr_umpire_1	umpire_1@matchpoint.io	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-05 19:23:06.612019+00
audit-b92f6add-0f9a-4083-9a9f-8920e70e6948	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:40:08.411534+00
audit-df6d92fa-9648-466e-afad-65a9cb51e7df	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:40:37.960229+00
audit-ec86a237-cc9f-429e-ba92-171d7171ebaf	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:40:47.355103+00
audit-c052a442-e925-4141-9b86-0bd982ee1da3	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:40:49.439727+00
audit-f7f94488-14be-4934-bdf5-c15b8942a62e	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:40:50.17609+00
audit-bcd8f447-88fd-4aa3-8abe-e84af0751963	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:41:16.01826+00
audit-568440fb-f052-4b43-a7f4-7051f5a3c23a	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:41:17.763578+00
audit-81084155-e4ab-40ee-bf26-ef6f43062e8d	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:42:30.591781+00
audit-a581edaa-c8a4-4c52-977f-14f7dc8a1788	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:42:34.301864+00
audit-f28983a8-09f3-4ab2-8740-d8c12e32d18b	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:42:46.031405+00
audit-0640f3b0-f896-4cf6-9c0c-105edef73357	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:42:52.558786+00
audit-36ff0a0c-0293-4694-bb06-ccca9c114050	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:42:56.781744+00
audit-6e3b6a17-833a-4b59-bc20-284f5b113de7	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:43:16.974607+00
audit-ba7851f6-2ae0-47ff-9b05-d5f17e88cf32	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:43:19.939326+00
audit-2217c2be-ae6b-4718-b26f-35225c3aeaa5	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:43:25.668382+00
audit-7da44603-4e2f-4bc9-9a73-75a80ce658cb	PUT /api/v1/matches/m-custom-1791226768817	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791226768817, Response Status: 200	2026-10-05 19:43:32.257814+00
audit-96d06df4-99e2-4af6-b946-5ba8a5be57fe	DELETE /api/v1/tournaments/t_volleyball_championship	tournament	\N	GUEST	Request: DELETE /api/v1/tournaments/t_volleyball_championship, Response Status: 403	2026-10-05 20:00:15.527234+00
audit-b6389789-ddd3-46ec-90ea-67c99ac7e15f	DELETE /api/v1/matches/rr-e_vb_tour_1-poolstage-r1-m1	match	\N	GUEST	Request: DELETE /api/v1/matches/rr-e_vb_tour_1-poolstage-r1-m1, Response Status: 403	2026-10-05 20:00:15.584219+00
audit-c88059aa-6639-4fe9-8d3a-af51b100fe81	DELETE /api/v1/matches/m-custom-1791226768817	match	\N	GUEST	Request: DELETE /api/v1/matches/m-custom-1791226768817, Response Status: 403	2026-10-05 20:00:15.608245+00
audit-afa492f2-b57f-445f-9d63-65d673a47ea2	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 401	2026-10-05 20:00:28.782376+00
audit-04150b64-1b95-4f0c-ac4a-788fdc684316	POST /api/v1/matches/batch	match	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/matches/batch, Response Status: 201	2026-10-06 14:24:56.578026+00
audit-c387eabe-6ce3-4900-9dd3-f477e52aabb4	POST /api/v1/matches	match	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/matches, Response Status: 201	2026-10-06 14:25:35.279605+00
audit-c8be112d-e1b6-4132-b006-046ecd7c7c9c	PUT /api/v1/matches/m-custom-1791296735258	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791296735258, Response Status: 200	2026-10-06 14:25:42.624065+00
audit-f183d3e1-b153-4722-abf7-c4f6a702f6e7	POST /api/v1/matches/viewers	match	\N	GUEST	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-05 20:09:57.948616+00
log-1791296742627-892	Round name updated	match	\N	System / Guest	Event ID: e1791279119394-vb_men_open-0, Round: 2, Name: Final	2026-10-06 14:25:42.630995+00
audit-d67a4eaf-0f49-4844-8363-dbc43a150504	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-06 14:26:05.509588+00
audit-5d8491ab-9a14-4a62-8673-e69a1fc86f9f	POST /api/v1/matches/viewers	match	\N	GUEST	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-05 20:25:12.590483+00
audit-0c433093-96a8-4ca3-baf2-3c5ba5238ae0	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-06 14:26:07.268827+00
audit-15ad4e23-cd18-4b2c-9f09-f4510d0c2c8a	PUT /api/v1/matches/m-upload-1791296696451-3	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-3, Response Status: 200	2026-10-06 14:26:08.803669+00
audit-f6b41c6c-0993-4a90-b299-c9e6454cf8b7	PUT /api/v1/matches/m-upload-1791296696451-4	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-4, Response Status: 200	2026-10-06 14:26:10.62518+00
audit-4448880e-da82-4874-af6a-d42f18b3df8d	PUT /api/v1/matches/m-upload-1791296696451-5	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-5, Response Status: 200	2026-10-06 14:26:12.798135+00
audit-d019677d-65a6-4689-88ae-e726ddbbb2c5	PUT /api/v1/matches/m-upload-1791296696451-7	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-7, Response Status: 200	2026-10-06 14:26:16.45909+00
audit-86b29833-5a05-47a3-9490-780d425d1e33	PUT /api/v1/matches/m-upload-1791296696451-8	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-8, Response Status: 200	2026-10-06 14:26:18.713501+00
audit-058a121b-1e87-4aa1-a6c5-eac7e46ee7c7	PUT /api/v1/matches/m-upload-1791296696451-10	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-10, Response Status: 200	2026-10-06 14:26:23.840433+00
audit-d82b39ba-330c-4c2a-baa1-f128173ce9aa	PUT /api/v1/matches/m-upload-1791296696451-11	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-11, Response Status: 200	2026-10-06 14:26:27.34515+00
audit-46f98591-ce15-435f-801e-a242395cbce6	PUT /api/v1/matches/m-upload-1791296696451-13	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-13, Response Status: 200	2026-10-06 14:26:31.278947+00
audit-dbef9f6f-29e1-4746-a95e-7d0cbc6341ce	PUT /api/v1/matches/m-upload-1791296696451-14	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-14, Response Status: 200	2026-10-06 14:26:33.105247+00
audit-52a034d7-930c-4f56-a573-b3d7e21bd232	PUT /api/v1/matches/m-upload-1791296696451-15	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-15, Response Status: 200	2026-10-06 14:26:35.086872+00
audit-d7850c10-7c9d-4b86-8993-7cf5968fd124	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-07 09:11:01.369496+00
audit-04473d7b-e0e6-44ba-b364-70709b5e8f8e	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-07 09:35:28.037201+00
audit-212fa61e-6998-4cba-bcd4-8ed2fd86b94c	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-07 09:35:38.745637+00
audit-aefa0258-637e-4691-8425-17af32f6b6cc	PUT /api/v1/profiles/usr_umpire_1	system	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/profiles/usr_umpire_1, Response Status: 200	2026-10-07 10:04:25.017016+00
audit-b63f9dce-3b56-4fc0-b410-91259f614492	PUT /api/v1/matches/m-upload-1791296696451-3	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-3, Response Status: 200	2026-10-07 10:04:45.567185+00
audit-b096af80-c21c-4fbb-a957-d45e07d42cbe	PUT /api/v1/matches/m-upload-1791296696451-3	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-3, Response Status: 200	2026-10-07 10:04:46.637121+00
audit-a7462a6d-b02f-428e-871c-4bffcdd9dadc	PUT /api/v1/matches/m-upload-1791296696451-3	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-3, Response Status: 200	2026-10-07 10:04:49.638038+00
audit-d1be62df-c1e3-4d72-8014-ef11954c4975	PUT /api/v1/matches/m-upload-1791296696451-3	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-3, Response Status: 200	2026-10-07 10:04:49.81554+00
audit-c4b0e9c9-f536-4d3d-ae7b-f67e7afb7b8e	PUT /api/v1/matches/m-upload-1791296696451-3	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-3, Response Status: 200	2026-10-07 10:04:50.006664+00
audit-4b4d1c06-dbd9-456e-afb6-02db6b15abd7	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:16.404544+00
audit-85e3f706-8108-4a22-b5a5-ecfb858d839b	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:17.045711+00
audit-f066f0de-32f0-46be-8842-2d82dccab23d	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:30.084988+00
audit-cc16503d-4c12-499a-b6ed-89457f4b9397	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:37.366649+00
audit-7734c4da-32d0-432c-93ad-70fbff377787	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:39.035452+00
audit-bc90e6bb-5010-479e-a2cb-8d89af07fbb5	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:40.595362+00
audit-60115b56-de15-43b9-b319-e6a38f25b14f	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:41.230585+00
audit-ebdc9ec8-2679-4fa5-aeaf-c4c93eccd0c0	POST /api/v1/matches/viewers	match	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-07 11:49:47.613028+00
audit-a7cb0075-704f-4b95-923c-fde2c5f29054	PUT /api/v1/matches/m-upload-1791296696451-6	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-6, Response Status: 200	2026-10-06 14:26:14.720817+00
audit-f0b3df84-3042-474e-81f3-e35062ad1dbb	POST /api/v1/matches/viewers	match	\N	GUEST	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-05 20:28:38.299375+00
audit-3e022aff-1072-4762-8d6b-80321a7c91cd	POST /api/v1/matches/viewers	match	\N	GUEST	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-05 20:28:43.674283+00
audit-68dd6cc6-54ac-4d26-87a7-1fb3f03c5e5f	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-05 20:29:37.083528+00
audit-aab30316-d9d5-4bbe-872d-e0441db8e515	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:18.442283+00
audit-7b54b6b5-62ea-47e8-81b6-9d25023a65f7	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:18.830768+00
audit-7f6ec05b-00ca-484f-817c-4832f2c06112	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:19.040103+00
audit-9e373c74-f03e-447b-99cc-2545da7bed9b	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:19.229376+00
audit-ca9f7695-efa6-4f12-9b6f-06c794fa6eac	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:19.41177+00
audit-0b34deec-1e7b-419f-8af7-5712d270cf2f	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:19.848304+00
audit-c042c04b-d9db-4eb2-977f-737e1a92b5d8	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:20.192213+00
audit-e632abcb-1528-45f8-a721-38e1959cfae7	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:21.299367+00
audit-a3d5ab51-b08c-47a8-8dbf-976ddc49a287	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:32.698169+00
audit-94502f66-a0ea-4baa-be36-8ed6b8ee3443	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:33.055979+00
audit-7840fb88-b03e-4d48-9e5a-4e6f4b8f015b	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:33.270063+00
audit-43f5396e-8a75-4a39-a400-8c51a6454c53	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:33.446439+00
audit-43d588c4-6355-41bc-bd8f-7848912cefe4	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:33.632556+00
audit-c11d96da-2205-47ff-9691-94bc320b8526	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:33.832408+00
audit-b1791654-a4d1-4634-98f7-d250fd9fd8d7	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:37.858216+00
audit-412e6cfe-4d5d-44fd-816f-6c8b55e84bed	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:38.271705+00
audit-bed47ddb-8d92-4395-8433-7765c581eac2	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:38.464286+00
audit-f234b11e-684c-4497-8995-c3737c769a43	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:38.674303+00
audit-f082a7f5-c6e7-4cc0-9854-f651c52d1511	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:38.875609+00
audit-cf61d4e6-21b2-42c4-9e15-c1ad9bac9922	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:39.14287+00
audit-8a25126c-ad1b-42e8-9f21-b54091b64336	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:39.713239+00
audit-89160909-7a47-43b8-8c62-cc4f43b0946a	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:47.140659+00
audit-306ecb0e-4656-4b85-a0ab-dc87c339ffce	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:31:49.546129+00
audit-a21b4ba5-d295-4c46-ab97-e85ac6c7737d	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-05 20:32:24.862826+00
audit-cc9c4e2d-c6d9-4db8-8de5-e711cc4f7a38	PUT /api/v1/matches/m_7pd_1	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:32:35.65899+00
audit-3c3b936c-39fc-4c68-bba3-79f57184e4ba	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-05 20:32:50.266999+00
audit-3c31d650-1bc7-43fe-9262-6fce135069dc	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:32:55.564278+00
audit-9a8d5ca0-a77d-43cf-a8df-892cece8acac	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-05 20:32:57.39422+00
audit-4fe29f72-db1f-40a8-bea9-28ee9c7dd215	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-05 20:34:12.454084+00
audit-e38f2803-02af-41ee-be2b-4d9881e77935	PUT /api/v1/matches/m_7pd_1	match	\N	GUEST	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 403	2026-10-06 05:54:15.139933+00
audit-f3f5916f-e82b-4a36-a6ab-3989a85cb384	PUT /api/v1/matches/m_7pd_1	match	\N	GUEST	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 403	2026-10-06 05:54:15.474483+00
audit-66402446-9662-4dc8-8914-de3e266b8c2a	PUT /api/v1/matches/m_7pd_1	match	\N	GUEST	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 403	2026-10-06 05:54:15.791417+00
audit-1e4fc012-7034-482a-9e35-f2301330f2bd	PUT /api/v1/matches/m_7pd_1	match	\N	GUEST	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 403	2026-10-06 05:54:16.020907+00
audit-4d35e4c3-1408-4d63-8350-1abf44b1b0fb	PUT /api/v1/matches/m_7pd_1	match	\N	GUEST	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 403	2026-10-06 05:54:16.251996+00
audit-50120f72-2e56-474f-b0a8-26bbec5e7133	PUT /api/v1/matches/m_7pd_1	match	\N	GUEST	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 403	2026-10-06 05:54:16.513805+00
audit-58ff9383-d9de-4ba0-8559-476e7fc0aef3	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-06 05:54:35.382475+00
audit-1d5dc790-d624-41a6-b592-9430bd276e03	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:41.581394+00
audit-4ce61189-c705-41e0-9ce8-370284426ba4	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:41.991981+00
audit-e4b7c7b7-3b02-442c-90f4-9b91a0d0ba4c	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:42.605157+00
audit-023237d9-54fc-4085-bf17-60a41e709650	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:43.540542+00
audit-9656728b-be00-49e1-9326-e8c8fdce1570	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:44.0487+00
audit-76999fee-c225-4836-ada7-476b951c3d22	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:45.061717+00
audit-3769deee-c6aa-4335-ba06-9a8aa5106f5a	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:45.220951+00
audit-2fbae427-6785-45c1-8d7d-3c20bbe60c43	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:45.393577+00
audit-c29e9f30-1c47-4f2f-8f76-7dba6db3c65a	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:45.564127+00
audit-168007c5-9761-42a2-8c56-558263e3703e	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:45.732352+00
audit-eb2ac15b-14c1-426d-a65e-ad8ee66f2a65	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:45.919269+00
audit-0c6a28b8-5da3-4032-9072-af784da9425f	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:46.089929+00
audit-4f571c97-38ae-4cab-b745-4e1f4777a6ad	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:46.252934+00
audit-4ebc8a89-3c92-4829-8dc8-8960d917f975	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:46.479522+00
audit-8b6117df-1d9b-4130-96fa-1aa16497f5e3	PUT /api/v1/matches/m-upload-1791296696451-9	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-9, Response Status: 200	2026-10-06 14:26:21.39859+00
audit-5d381b71-7924-41a1-9be8-1546260d7e7c	PUT /api/v1/matches/m-upload-1791296696451-12	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-12, Response Status: 200	2026-10-06 14:26:29.367951+00
audit-28fdeb32-f1c2-4f87-9d9d-b0476babe828	PUT /api/v1/matches/m-custom-1791296735258	match	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/matches/m-custom-1791296735258, Response Status: 200	2026-10-06 14:26:37.551856+00
audit-157be4bb-559d-4452-9606-6860b0c3ef66	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:32.797606+00
audit-acf13802-ea4f-4565-85bd-35183bd54fa1	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:43.858102+00
audit-5b26af9d-1dd0-417d-83df-157843ed2766	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:51.299758+00
audit-6eacc621-1bfa-4ee2-b48c-e719400cc780	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:57.233514+00
al-3aeb7317	Match Media Uploaded	match	usr_admin_1	Vikas Sharma	Uploaded media item to match 'm-upload-1791296696451-1' (Caption: null)	2026-10-07 09:38:04.83336+00
audit-903758d7-4189-439a-81ff-241f14242361	POST /api/v1/matches/m-upload-1791296696451-1/media	match	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/matches/m-upload-1791296696451-1/media, Response Status: 200	2026-10-07 09:38:04.840595+00
audit-b6915cf9-e280-403a-a557-f46bc597b1ae	PUT /api/v1/matches/m-upload-1791296696451-3	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-3, Response Status: 200	2026-10-07 10:04:44.627651+00
audit-25f7d61c-6268-41ce-af9f-5903dcec6703	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:32.186914+00
audit-77420a78-3433-4f4b-b81b-bc4a9ece0608	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:32.640245+00
audit-f5a256ba-6823-4f89-a8a3-3edbe467c3ef	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:33.658036+00
audit-ca65ca6b-4bee-4371-9f96-21e9d391bdf8	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:34.102451+00
audit-0181d6e5-eb45-426c-90de-491aaee06857	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:35.143463+00
audit-9f1fe32d-b60f-433b-86d4-42ab1a0afb7a	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:35.29303+00
audit-90d86092-acd7-43ff-b604-d28adfb5dcec	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:35.727218+00
audit-fa980b73-62fd-4ead-859d-d58043cf6f4f	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:36.858202+00
audit-21ff8e1b-0c45-44fc-a434-03f46ee15a87	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:37.03137+00
audit-4e4db3aa-f837-4754-bd5c-7a71dcbf488c	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:37.194706+00
audit-f9a174bf-e6b1-4581-9bba-3b59678ae411	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:37.561231+00
audit-f22cc31b-e0c2-40b3-89cf-7376182fc5bc	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:42.34807+00
audit-467a6274-8a73-4a6f-b813-a2215ddc97ae	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:42.820485+00
audit-4a6f9982-4d60-49ae-87a8-e11db0931432	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:43.003141+00
audit-363b28a0-662f-4bb5-b38a-d86fcf0e005f	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:43.18707+00
audit-ce14da10-ea23-4e46-a26a-db9564b4c037	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:43.377039+00
audit-6a8faa2a-b1dd-49c9-b7e4-a904a0f2f92c	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:43.716832+00
audit-841acdce-a781-409b-87b9-822be370d950	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:43.879989+00
audit-c3f8eb24-4157-4c2a-9a04-64fd33ca8821	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:44.194571+00
audit-beddf843-16d4-4649-8bf5-f391e84a59cf	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:44.373376+00
audit-117bff8f-1fa2-4dbd-809a-88e06a97d23d	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:44.552381+00
audit-c82c680f-21f3-45a1-95b2-16c92f365418	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:44.773928+00
audit-8869bd0e-1245-4703-a661-04b513df2603	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 05:54:44.897225+00
audit-80b6cc5f-c4fb-4bec-88b7-c616a72b6fa7	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-06 05:56:16.376294+00
audit-5cdcebd8-1206-49fe-afbd-37fc0c55f2e3	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-06 06:11:02.249865+00
audit-1a8b860a-90d2-434f-a4e8-0f1bee0a02a9	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-06 06:17:15.597789+00
audit-8aad5c7d-75e6-4156-abb3-d62bbbad7c44	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-06 06:20:49.664201+00
audit-d2f41c77-afa4-4ee3-9cfa-cddb25858c86	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-06 06:22:52.481319+00
audit-c72a233a-5e55-4a49-a513-23878cc31651	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-06 07:19:44.596151+00
audit-8d4770f0-e505-42ee-9d44-2ee40b350cc0	POST /api/v1/master-events	system	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/master-events, Response Status: 201	2026-10-06 07:20:48.983637+00
audit-2e355952-fc07-4509-b713-f8e861214ded	POST /api/v1/master-events	system	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/master-events, Response Status: 201	2026-10-06 07:21:10.575442+00
audit-17919c4d-eca3-4796-925e-46f8fa94bb0c	PUT /api/v1/tournaments/t_7pd_vpl_s2	tournament	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/tournaments/t_7pd_vpl_s2, Response Status: 200	2026-10-06 07:21:55.186616+00
audit-4fd1c0a3-754a-48ba-8744-78ebc593b0ef	PUT /api/v1/tournaments/t_7pd_vpl_s2	tournament	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/tournaments/t_7pd_vpl_s2, Response Status: 200	2026-10-06 07:22:16.444483+00
audit-31b7cdb7-d8c2-4f7a-818e-0a893678e78b	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-06 07:24:40.570446+00
audit-b0f77920-3202-475f-941a-db42231c2402	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:24:58.352155+00
audit-ef76f64f-f8b7-4411-8b85-a1e72b5dda3c	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:24:58.77587+00
audit-fc49589e-d02c-41ed-8769-57bf23be7469	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:24:59.164248+00
audit-15f85da5-d145-4b66-9e94-59807ab968a2	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:24:59.365661+00
audit-71671eeb-efc8-47c0-b51e-990bbc2f9137	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:24:59.517938+00
audit-83c249b1-196d-401b-a8d1-51245f620223	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:00.482461+00
audit-78607409-0c57-47ab-b275-58ffd42cfefa	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:00.652312+00
audit-5941602b-c400-4a94-9d5c-7861a143ee00	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:00.80854+00
audit-322a4536-8882-49fc-8afd-6fb1de82eb63	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:00.987839+00
audit-025a925e-09d3-4add-835a-52dc07e74061	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:01.177514+00
audit-51251cba-4919-495c-a3aa-d57b70e7dcf5	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:01.32616+00
audit-f759c5c6-9f75-4b56-ab21-163bc11d330b	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:01.509416+00
audit-c7143cfb-d31c-4b51-b046-5aa3a7ed99e6	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:01.703716+00
audit-541afa82-a26e-4aa5-90ba-66989e7e07af	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:01.899156+00
audit-90b757a0-4216-4c2f-8675-41ba2ca97979	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:02.082801+00
audit-45a834df-6cda-483f-9567-ae565efb272d	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:05.484362+00
audit-ee79175d-2742-4398-8369-c78f11f0e27d	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:06.843309+00
audit-1ff7d4ab-dcf1-4efb-af1d-b9213a9878b6	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:07.63994+00
audit-cdcad00d-1e0c-460b-9303-ae467316cc8f	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:07.799978+00
audit-8384221f-875a-4826-80b2-a398cdb3d908	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:08.523858+00
audit-ef96cd9b-857e-40a7-8010-cc7c567c1954	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:08.699179+00
audit-4470ec4b-502f-4773-9174-fb79395ef833	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:08.867708+00
audit-e7f50dec-e20d-49da-8ba2-adfb18308e98	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:09.246021+00
audit-5327d793-2f7b-44be-b176-a540100af05c	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:11.826618+00
audit-637ddd26-0d4b-40f0-9f0b-68e0e784ce8d	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:37.672067+00
audit-2b205991-0fd5-4b76-a44f-758b73adac0c	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:40.918066+00
audit-1b5aa7f0-508f-4ec8-90aa-194e952341ae	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:41.784886+00
audit-b9ac8ffc-5ea5-42ab-be6c-66bc56037442	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:41.965225+00
audit-0450fc60-8bfd-4729-a018-f61d94e262c8	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:42.125866+00
audit-b8ce59c6-397d-4248-aae1-c90b8573ea68	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:42.469527+00
audit-46858e97-564a-4d43-b0f1-d396cadd6dfd	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:43.731668+00
audit-977a4f4a-8575-47f2-b5e1-0bbea83b8f05	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:43.906234+00
audit-9a7c5dd5-3f95-41e1-894e-2da9555042c2	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:44.242981+00
audit-4c0ddeed-3e5c-403f-8594-296ea25fb992	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:45.129281+00
audit-30b7f895-4f2e-4c50-8a6c-1491ec55fd6f	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:45.62868+00
audit-6b224d5c-10ea-4606-b3ce-e09bcee4905c	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:46.660324+00
audit-559ef5d6-5006-411c-bae7-dcc8599e6a63	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:46.848311+00
audit-636f1ff2-04d1-429d-a192-d9aa755094c4	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:47.01098+00
audit-cc8ceeab-350f-46ac-b941-cf08a9355744	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:48.066771+00
audit-4056d668-912c-41b2-aeac-847dd0c0b55e	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:48.424361+00
audit-24af6454-51b6-45ac-84b1-e016db97d47f	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:48.633817+00
audit-dab941dc-a3df-4b5f-bc8e-3e5a1f59ac46	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:48.882217+00
audit-88cac39b-4c93-427e-a535-f5cdb59f9311	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:49.101637+00
audit-52ef321f-b2a8-4fe2-9bbc-1a29d9fda057	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:50.594414+00
audit-fd4fb96b-8c4d-40cc-bb7a-dc6b166932f1	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:50.935693+00
audit-408269f0-f3d4-4285-a417-9ce18334d423	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:51.940261+00
audit-d30252dc-a49e-436c-94f7-ae154de590ba	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:52.17539+00
audit-e5ba3d02-cc9c-457e-96a0-74bd68ffbf07	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:53.183166+00
audit-6173a400-53da-4033-bec9-66fb5ded4a18	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:26:01.214424+00
audit-fc4d32a2-26de-41c4-b95a-39fa8d82e913	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-07 06:13:32.896182+00
audit-11b0efa7-8e51-473b-aed8-25409cb737a7	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 06:13:50.536264+00
audit-246de221-9398-4da5-83d6-2a8c15fa12e4	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 06:13:51.949953+00
audit-a5cb0466-5b2e-40bc-aeb6-7f7dcadff1a3	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 06:13:59.839474+00
audit-8e6579c2-fded-4525-a4eb-0ea0cfb7a888	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 06:14:05.240938+00
audit-13d4e0f9-ba81-4723-8a24-c5d51b862851	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:07.012262+00
audit-8119ca59-e62f-4cb7-acdc-a49755452aa2	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:07.194139+00
audit-9c901959-df6c-4a23-bc18-021fab671eaf	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:07.975366+00
audit-e20b4911-9120-47f6-bcc9-f4f3bd48d5d5	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:08.154734+00
audit-9cf0b26f-df14-43de-8729-563b70474f9b	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:08.343537+00
audit-5ad43296-8304-428e-91a9-86f25ea2cd74	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:09.047222+00
audit-7de0c242-3019-41e6-943c-d312c076ee24	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:09.413864+00
audit-511d1387-85d1-4f02-82df-e472c32ef08b	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:11.639839+00
audit-d1b05fff-471b-4f0f-a1db-db025c8f82c9	PUT /api/v1/matches/m_7pd_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_7pd_1, Response Status: 200	2026-10-06 07:25:13.229991+00
audit-3f289c34-f860-4b88-b635-3ca2877fe7a9	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:41.080937+00
audit-0760fd87-a055-4225-859e-1f5fbf7a0a7b	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:41.449437+00
audit-1bfde705-7acb-41a9-8832-2ce69ca8b92a	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:41.637599+00
audit-b6a347fd-7c28-4551-a395-639249f0e37c	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:42.308152+00
audit-f449843e-ee0c-49fc-89f3-dcc61b3ddf2a	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:42.655466+00
audit-19ba3e26-1331-4d2d-ba0d-5674b914df19	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:42.955018+00
audit-c8e127bf-1c74-471c-a755-218589c585a1	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:44.07549+00
audit-56ea536f-76f4-468d-88f7-d6cc7522db4e	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:44.436496+00
audit-c1fef4b4-4e1e-4814-9451-a123f33e4945	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:44.658343+00
audit-04d300dd-44f0-4239-88d0-e97ef672eaa7	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:45.810749+00
audit-61b15030-5ec9-498d-a7fd-e29908fb4ebf	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:45.992742+00
audit-e786d33d-f812-4715-9035-4ea9f793d9fb	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:46.483705+00
audit-0f294e7f-dd62-42ab-9489-96d60833a823	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:48.258392+00
audit-c605716a-e625-427f-a2fa-8a7a5b455325	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:50.774151+00
audit-c11ed07c-dcb8-4ba2-8886-7cdb2e6e9889	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:51.168204+00
audit-bb80293f-b1d5-4b82-ac69-31b0e33d969a	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:51.423231+00
audit-de5004ab-9cda-43da-baeb-9a503d66b98b	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:25:52.649344+00
audit-f1114ebc-44e8-433e-98fa-e579f7f4b0e1	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:26:00.021111+00
audit-6a0975a9-a030-4073-9202-9556e9f1caac	PUT /api/v1/matches/m_wvpl_1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m_wvpl_1, Response Status: 200	2026-10-06 07:26:07.268711+00
audit-4bdb4174-3587-44e5-bfd4-a1bb9cabf077	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-06 07:26:40.642432+00
audit-a879beeb-4581-4423-a3aa-02271cb8009a	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-06 07:29:17.678035+00
audit-e08ae9ea-e334-474b-9d96-3052457cae69	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-06 08:58:29.669445+00
audit-df8f8e7e-847d-49a7-b1e5-9ff026ed881b	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-06 09:22:14.203355+00
audit-2f86fa16-1738-42d0-8dbe-fabcee6dbed1	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-06 09:30:55.218353+00
audit-a30686b8-64a9-40e5-b735-5013926c07cb	POST /api/v1/events	event	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/events, Response Status: 201	2026-10-06 09:31:59.444798+00
log-1791279119457-792	Event "Men's Open Volleyball" created	event	\N	Administrator	Format: league, Category: OPEN, Limit: 54	2026-10-06 09:31:59.464806+00
audit-4be9edb6-ff45-4fe7-984c-74f52d7d7cd7	DELETE /api/v1/events/e_7pd_vpl_league	event	usr_admin_1	admin_1@matchpoint.io	Request: DELETE /api/v1/events/e_7pd_vpl_league, Response Status: 204	2026-10-06 09:32:07.736166+00
log-1791279127739-874	Event "e_7pd_vpl_league" deleted	event	\N	Vikas Sharma	Event ID: e_7pd_vpl_league	2026-10-06 09:32:07.743116+00
audit-4f591277-0e08-4df0-85c0-99e3d197b154	POST /api/v1/events	event	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/events, Response Status: 201	2026-10-06 09:32:34.055993+00
log-1791279154069-854	Event "Women's Open Volleyball" created	event	\N	Administrator	Format: league, Category: OPEN, Limit: 32	2026-10-06 09:32:34.073399+00
audit-19a32b4c-e670-4b7f-8e31-56a86155d8ab	DELETE /api/v1/events/e_wvpl_league	event	usr_admin_1	admin_1@matchpoint.io	Request: DELETE /api/v1/events/e_wvpl_league, Response Status: 204	2026-10-06 09:32:37.952697+00
audit-8b386d85-90f2-4579-a9cd-09736e33fabd	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-06 09:34:20.857898+00
audit-9d576869-c61a-4e0a-ad8c-d4e0877eb6e8	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-06 09:34:33.903781+00
audit-d77301fe-13e1-4944-b439-894c7defaa96	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-06 09:38:39.500474+00
audit-87564e0a-67f1-4fe4-87fe-b8a00bf97267	PUT /api/v1/events/e1791279119394-vb_men_open-0	event	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/events/e1791279119394-vb_men_open-0, Response Status: 200	2026-10-06 09:38:53.311275+00
log-1791279533315-119	Event "e1791279119394-vb_men_open-0" updated	event	\N	Vikas Sharma	Fields: entry_limit, format, scoring_format, entry_fee	2026-10-06 09:38:53.318901+00
audit-3e4afa27-0480-46d7-b9c3-69a1fb23e5f9	PUT /api/v1/events/e1791279154035-vb_women_open-0	event	usr_admin_1	admin_1@matchpoint.io	Request: PUT /api/v1/events/e1791279154035-vb_women_open-0, Response Status: 200	2026-10-06 09:39:00.798594+00
log-1791279540802-817	Event "e1791279154035-vb_women_open-0" updated	event	\N	Vikas Sharma	Fields: entry_limit, format, scoring_format, entry_fee	2026-10-06 09:39:00.805704+00
audit-22bc7725-a4e9-493c-a956-51a4c5da6f6b	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 06:13:56.496715+00
audit-280b87a6-c9be-4aca-88b8-d35a44cbb0ee	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 06:14:08.794686+00
audit-b8a5e3df-df2b-461c-9f1d-6921ed21539e	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 06:14:14.851869+00
audit-cbe05b79-608d-4cbb-967e-4c04c0a48e48	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:34.242829+00
audit-e083b595-b884-4fce-b19d-c4f70ec0dbb2	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:39.421592+00
audit-90d0befc-7d36-4650-9254-e683c4184154	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:42.200686+00
audit-fdc3d7ce-4fd3-42fd-a3ae-4efd1d4d6bfe	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:42.842309+00
audit-3984503c-a86b-41a3-837a-908a667afeb3	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:44.473864+00
audit-3dcd1a39-af28-4997-b893-c8f1de87ab6c	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:44.834992+00
audit-adea044f-1575-4633-952f-e7e75c69afcc	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:45.009669+00
audit-a97e3f01-fb19-48ce-a53f-81ac5f8aac00	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:45.174031+00
audit-843587a0-dce5-41a1-b5d4-1e0ba07817ad	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:46.010396+00
audit-fd39cdcd-ad00-460c-a75f-1714d72736d8	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:46.198722+00
audit-de2e525a-c5be-4221-b6ee-26e032be56c1	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:46.528948+00
audit-86c86f9f-acf9-4815-b76b-c86e11f1e419	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:46.858009+00
audit-e7c3e8ab-e350-49a3-afaa-5c8715ca5f35	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:47.045564+00
audit-a406a830-c837-481b-a4cd-923637569cfe	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:47.192451+00
audit-bb462c1b-c187-41b0-a0bf-18be1217899a	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:48.895885+00
audit-efb099dc-96b9-4e5c-93f4-fa8fe08ff6cb	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:49.257164+00
audit-9fa0622f-83fd-4146-9c52-5121d71f866a	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:49.435728+00
audit-631e85d2-af92-44a9-82bf-75f847e14803	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:49.621357+00
audit-b18414c8-c5d6-4d41-bc87-ca25b48e7f0b	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:49.781951+00
audit-b4d72411-a930-4ee7-8b5f-b27f80aa3511	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:49.967695+00
audit-da388118-f8a2-434b-9074-de8bac56cbcc	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:51.139661+00
audit-10d982f3-1f59-4765-94d0-37249787541a	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:51.644077+00
audit-2ea0e997-0fad-4c14-bc42-86a76a3fb657	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:51.811161+00
audit-e8c1cebd-f2b1-4809-8564-95ba3d732180	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 09:28:51.974277+00
audit-a97cdbd6-ed03-4de5-9f3a-bb0b9e6962cb	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-07 09:47:43.880255+00
audit-dd43b0db-c7d6-49bb-9db2-5d3a33e9aadc	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:41.401141+00
audit-fb35c15c-5311-45cb-b238-af621c524a7b	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:41.58191+00
audit-3611a86f-b806-47a6-a3bf-0c5ba9d7d1db	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:46.590183+00
audit-d87c1175-9e89-4878-8ece-e381b615dd6f	POST /api/v1/matches/viewers	match	usr_umpire_1	umpire_1@matchpoint.io	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-07 11:46:47.592555+00
audit-4543f845-cd11-4c83-8597-c576f983988a	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:48.117357+00
audit-54fbc2a5-558e-4101-9591-82937ba07236	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:49.209781+00
audit-48dea69b-4d67-4882-b6a1-498c8fb560c2	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:51.704301+00
audit-bf08dbce-d2d8-4e91-9a3a-8b22b8e6dbc2	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:51.835391+00
audit-b14f3ee4-0ba7-4d62-828e-b9ba686abad0	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:52.029552+00
audit-93885c2c-353c-4797-9ec2-bc8b8b1a6573	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:54.57446+00
audit-0e6edcc2-60d0-426f-b4db-4bd3a73f13d2	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:54.951813+00
audit-3a2d668b-5522-4935-83bc-99690d18d241	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:55.33526+00
audit-837b7494-1a53-41ea-b8f0-d601958a5628	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:57.64597+00
audit-6ed19684-5ac9-4254-9377-61151af411f0	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:04.230644+00
audit-631d30e5-0b28-40dd-a13e-2f0822adbb31	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:07.429749+00
audit-343e679d-44f0-4c7c-83a7-7f71b0be287e	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:08.855237+00
audit-5008bc86-8016-43f3-a936-55834a056829	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:11.183599+00
audit-06c9c1bc-2706-4d2b-b95e-3a874b446918	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:11.669313+00
audit-3f6ec928-328f-4a87-b15d-07ca590cb663	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:13.030803+00
audit-128374c8-ee10-4639-97f3-611d15319b4b	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:13.661575+00
audit-02533ffc-9561-43df-a798-4bd96774cc31	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:14.618659+00
audit-33e024d1-3b5c-46b6-8a47-2ac077a4b610	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:15.300371+00
audit-1680bde7-bda2-4b27-a42a-1ffe39c7b3b1	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:16.11889+00
audit-11f8c2ba-df84-4d5d-a8df-074288e50b21	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:16.87035+00
audit-5065d02e-9b8a-4726-a33e-9756ebe2bed7	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:17.470065+00
audit-2adc68d6-c51e-47a5-b67a-99bb879906e2	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:18.62622+00
audit-712e3f9a-08d4-4ccd-bc70-2a0ad9743b9d	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:19.311716+00
audit-b0f9fa8e-5d2e-4590-b917-1c6d097fc201	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:42.070982+00
audit-8f81b00a-47fe-43fd-bd46-554141c0ba93	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:44.041785+00
audit-cde79994-5bfe-4b93-9159-6da1705d9f60	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:44.216747+00
audit-a5d0a266-0587-4690-ba3c-02df76de022f	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:45.200296+00
audit-f0b2242c-dff9-4828-8b3a-2d306b2b5316	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:45.366318+00
audit-54db426b-1d05-433f-9544-26b122377a17	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:45.527171+00
audit-bd4a0999-ab19-403d-b3a3-99ad51688638	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:46.052584+00
audit-8e904657-03b9-4085-bffe-f10fe4158b0a	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:46.219219+00
audit-3cb15d5f-c033-4850-bacd-9d824cdb35ad	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:46.392414+00
audit-53fe7777-7213-4041-8437-04d0e65513cb	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:47.4351+00
audit-3dbcef48-63a4-49f8-be90-ad7fb35fdd51	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:47.60484+00
audit-578172b1-09d7-45cb-a944-9d6d8c346838	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:47.779919+00
audit-6a438632-c35b-4f6b-94dc-bbf8107cac24	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:47.938648+00
audit-76c17246-1d5c-4338-a7d8-2703a1c02f81	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:48.293123+00
audit-7cf5ff32-2f73-478b-8582-7c9932ea7a8e	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:49.563089+00
audit-a5b4191c-8c85-45d8-a666-5c1d9b19a82e	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:49.733338+00
audit-66163056-57f9-4094-aa28-d8aa12942e68	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:50.394172+00
audit-ca466ab5-c8cd-4b84-9d2c-90536d0d0621	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:51.479468+00
audit-93fdb7d3-5f14-4ed7-bc53-c00103794121	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:52.222108+00
audit-694a0f47-a9c2-4094-8cbb-51ea6b459187	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:52.590888+00
audit-8c14f43e-f053-4a4e-858f-b88771a8c551	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:57.145422+00
audit-b56cbdb2-bc92-481f-8ef9-10302bb0b917	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:57.308395+00
audit-09c8d10c-e1ba-4c03-b8de-3e3e8b332b0e	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:57.467284+00
audit-ab27c3d3-0911-4f77-9cda-d646da95fbf4	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:57.798963+00
audit-8a86e4d3-60a1-4453-b89c-ee38357342d2	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:58.84255+00
audit-d9223663-77a3-40f7-ab1f-5e53dc54e486	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:59.006218+00
audit-24ce80c7-5f9c-4783-b7e2-3ddd68f5d865	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:59.195954+00
audit-b8bb21aa-0d0d-42d2-8397-0b7d715ed12f	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:59.372598+00
audit-474f6f88-685d-45bb-87b8-ab5064bc9f16	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:59.547632+00
audit-bb31c050-f373-46d2-9908-a6b8f329eebc	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:59.719656+00
audit-08fbe12a-a1d9-47e8-be70-5e33fa5b567a	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:46:59.93441+00
audit-cbcfa451-2175-4801-891b-0ae32fdc176e	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:00.136314+00
audit-f52c82a3-35b9-4e9d-8b63-69b625007e8c	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:03.816688+00
audit-86949865-4783-4996-a1ed-e23e94d1a53c	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:03.971461+00
audit-6a753900-868b-4e43-87fc-7d39e718ef98	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:04.408165+00
audit-ca49b761-93e5-4128-ae67-edccf1786254	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:04.575654+00
audit-a3fc18d8-64c1-495e-8015-ffccfb73bdc9	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:04.764204+00
audit-bb7358fd-bf26-4c7f-8fcc-8de7199335db	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:04.93258+00
audit-89639294-803a-4d0d-9e90-cbc368653897	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:05.102594+00
audit-97a833ed-5857-49f5-bdb6-572eea2f3d88	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:05.742741+00
audit-5cb8e06c-aea5-4159-a4fc-7a27ac0bdd17	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:05.929902+00
audit-d2634681-926d-4b39-a0da-2c9f965053ae	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:06.10191+00
audit-e3f9180a-4d5e-4df1-b050-5bce35ecae7d	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:06.286836+00
audit-7853e4de-049e-4786-84f7-d89a9ac6b8f0	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:06.46756+00
audit-8a8ad5dc-3c44-4f29-ab74-e35ad2c38e42	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:07.044893+00
audit-b8ff4273-7eb5-4321-9df0-b578f8b7158a	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:07.221042+00
audit-8b126f89-ffcd-480e-a8b4-dbe7507b82cf	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:08.075078+00
audit-e4c6a896-b6e8-4746-8b9f-398dc93b8cdd	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:08.668285+00
audit-15d71e7d-ddb8-4d7f-a3ec-a2cdcea94470	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:10.152705+00
audit-3bd93af2-f605-49e7-bd47-2196a6040f4a	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:10.439225+00
audit-7e04d2db-850f-4c32-8d52-ff921e68bd15	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:10.616423+00
audit-57b9e5c2-3532-46e8-89b3-776efa593544	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:19.915843+00
audit-e6cec4ed-4d07-4cc1-88ec-1b6350c70cc6	PUT /api/v1/matches/m-upload-1791296696451-1	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-1, Response Status: 200	2026-10-07 11:47:20.373651+00
audit-35160c7e-3e97-4a24-b4e8-a26adeed1926	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-07 11:47:32.698172+00
audit-dff70628-c981-409e-a4a8-bd5045ca0ac4	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-07 11:48:50.861728+00
audit-cae62ce5-dd90-4f17-961c-ab4d65717310	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 11:49:02.926906+00
audit-d5c27621-321b-4b44-9725-305aac09354c	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 11:49:04.420997+00
audit-87463563-c0ea-4636-9da9-b29dccd69e0a	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 11:49:05.013127+00
audit-69a8a228-448c-4fcd-ad98-a5e69ea8dbe2	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 11:49:05.543795+00
audit-336469e4-2e0f-4c2a-9bec-fc332fc33269	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 11:49:06.038429+00
audit-fe2a3bf8-f81f-4147-b596-ddea27c9d2a3	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 11:49:07.136617+00
audit-bd678466-3c1b-41bc-ac6c-e4ff70302652	PUT /api/v1/matches/m-upload-1791296696451-2	match	usr_umpire_1	umpire_1@matchpoint.io	Request: PUT /api/v1/matches/m-upload-1791296696451-2, Response Status: 200	2026-10-07 11:49:07.298912+00
audit-083e67c6-990b-4277-a6c3-726a903c92b7	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-07 11:49:13.784171+00
audit-c7ef9216-1702-44a4-823b-a1a0e4fed190	POST /api/v1/matches/viewers	match	usr_admin_1	admin_1@matchpoint.io	Request: POST /api/v1/matches/viewers, Response Status: 200	2026-10-07 11:49:33.826274+00
audit-2c748c61-71aa-4e5c-b10e-ad2ef68599c9	POST /api/v1/auth/login	auth	\N	GUEST	Request: POST /api/v1/auth/login, Response Status: 200	2026-10-07 11:50:08.706542+00
\.


--
-- Data for Name: database_restore_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.database_restore_requests (id, backup_data, requested_by, approved_by, status, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: events_master; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.events_master (id, name, event_type, category, gender, min_age, max_age, created_at) FROM stdin;
bs_u9	Under-9 Boys Singles	singles	junior	Male	0	9	2026-10-05 11:50:58.381058+00
gs_u9	Under-9 Girls Singles	singles	junior	Female	0	9	2026-10-05 11:50:58.38236+00
bs_u11	Under-11 Boys Singles	singles	junior	Male	0	11	2026-10-05 11:50:58.383291+00
gs_u11	Under-11 Girls Singles	singles	junior	Female	0	11	2026-10-05 11:50:58.384325+00
bs_u13	Boys Singles Under-13	singles	junior	Male	0	13	2026-10-05 11:50:58.38511+00
gs_u13	Girls Singles Under-13	singles	junior	Female	0	13	2026-10-05 11:50:58.385937+00
bd_u13	Boys Doubles Under-13	doubles	junior	Male	0	13	2026-10-05 11:50:58.386557+00
gd_u13	Girls Doubles Under-13	doubles	junior	Female	0	13	2026-10-05 11:50:58.387425+00
bs_u15	Boys Singles Under-15	singles	junior	Male	0	15	2026-10-05 11:50:58.388601+00
gs_u15	Girls Singles Under-15	singles	junior	Female	0	15	2026-10-05 11:50:58.38938+00
bd_u15	Boys Doubles Under-15	doubles	junior	Male	0	15	2026-10-05 11:50:58.390123+00
gd_u15	Girls Doubles Under-15	doubles	junior	Female	0	15	2026-10-05 11:50:58.390733+00
bs_u17	Boys Singles Under-17	singles	junior	Male	0	17	2026-10-05 11:50:58.391501+00
gs_u17	Girls Singles Under-17	singles	junior	Female	0	17	2026-10-05 11:50:58.392248+00
bd_u17	Boys Doubles Under-17	doubles	junior	Male	0	17	2026-10-05 11:50:58.393389+00
gd_u17	Girls Doubles Under-17	doubles	junior	Female	0	17	2026-10-05 11:50:58.394235+00
bs_u19	Boys Singles Under-19	singles	junior	Male	0	19	2026-10-05 11:50:58.39512+00
gs_u19	Girls Singles Under-19	singles	junior	Female	0	19	2026-10-05 11:50:58.395979+00
bd_u19	Boys Doubles Under-19	doubles	junior	Male	0	19	2026-10-05 11:50:58.396658+00
gd_u19	Girls Doubles Under-19	doubles	junior	Female	0	19	2026-10-05 11:50:58.397914+00
xd_u19	Mixed Doubles Under-19	doubles	junior	Mixed	0	19	2026-10-05 11:50:58.399119+00
ms_open	Men's Singles	singles	open	Male	0	100	2026-10-05 11:50:58.399947+00
ws_open	Women's Singles	singles	open	Female	0	100	2026-10-05 11:50:58.400657+00
md_open	Men's Doubles	doubles	open	Male	0	100	2026-10-05 11:50:58.40126+00
wd_open	Women's Doubles	doubles	open	Female	0	100	2026-10-05 11:50:58.40196+00
xd_open	Mixed Doubles	doubles	open	Mixed	0	100	2026-10-05 11:50:58.403076+00
ms_v35	Men's Singles 35+	singles	veteran	Male	35	100	2026-10-05 11:50:58.40404+00
md_v45	Men's Doubles 45+	doubles	veteran	Male	45	100	2026-10-05 11:50:58.404895+00
xd_v50	Mixed Doubles 50+	doubles	veteran	Mixed	50	100	2026-10-05 11:50:58.405949+00
ms_corp	Corporate Men's Singles	singles	open	Male	21	100	2026-10-05 11:50:58.406726+00
xd_corp	Corporate Mixed Doubles	doubles	open	Mixed	21	100	2026-10-05 11:50:58.407799+00
bs_school_u15	Inter-School Boys Under-15	singles	junior	Male	0	15	2026-10-05 11:50:58.408839+00
gs_school_u15	Inter-School Girls Under-15	singles	junior	Female	0	15	2026-10-05 11:50:58.40952+00
ms_college	Inter-College Men's Singles	singles	open	Male	17	25	2026-10-05 11:50:58.410139+00
md_college	Inter-College Men's Doubles	doubles	open	Male	17	25	2026-10-05 11:50:58.410864+00
team_open	Franchise Team Championship	team	open	Open	0	100	2026-10-05 11:50:58.411521+00
ms_inter	Intermediate Singles Challenge	singles	open	Open	0	100	2026-10-05 11:50:58.412772+00
md_adv	Advanced Doubles Challenge	doubles	open	Open	0	100	2026-10-05 11:50:58.41362+00
xd_parent_child	Parent-Child Open Doubles	doubles	open	Mixed	0	100	2026-10-05 11:50:58.414784+00
xd_family	Family Mixed Doubles	doubles	open	Mixed	0	100	2026-10-05 11:50:58.416213+00
md_wooden	Wooden Racket Open Doubles	doubles	open	Open	0	100	2026-10-05 11:50:58.417355+00
vb_men_open	Men's Open Volleyball	team	open	Male	16	60	2026-10-05 12:21:31.452146+00
vb_women_open	Women's Open Volleyball	team	open	Female	16	60	2026-10-05 12:21:31.452146+00
vb_mixed_open	Mixed Open Volleyball	team	open	Mixed	16	60	2026-10-05 12:21:31.452146+00
vb_u19_boys	Under-19 Boys Volleyball	team	junior	Male	12	19	2026-10-05 12:21:31.452146+00
vb_u19_girls	Under-19 Girls Volleyball	team	junior	Female	12	19	2026-10-05 12:21:31.452146+00
vb_corp_open	Corporate Volleyball Cup	team	open	Open	21	60	2026-10-05 12:21:31.452146+00
mens_team	Men's Team	team	open	Male	0	100	2026-10-06 07:20:48.862875+00
womens_team	Women's Team	team	open	Female	0	100	2026-10-06 07:21:10.558259+00
\.


--
-- Data for Name: feature_flags; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feature_flags (id, flag_key, name, description, is_enabled, config, created_at, updated_at) FROM stdin;
ec5d2b8e-a96c-48b5-9c46-71f7f33818ec	sport_badminton	Badminton	Enable Badminton sport selection and live view panels	t	\N	2026-10-05 11:48:09.116802+00	2026-10-05 11:48:09.116802+00
645bd570-ed97-4c32-b899-9dddd762fdfd	sport_table_tennis	Table Tennis	Enable Table Tennis sport selection and live view panels	f	\N	2026-10-05 11:48:09.119329+00	2026-10-05 11:48:09.119329+00
aadacea9-6311-4087-8f14-8906330fb59d	sport_squash	Squash	Enable Squash sport selection and live view panels	f	\N	2026-10-05 11:48:09.11975+00	2026-10-05 11:48:09.11975+00
e722afb2-744e-46d6-a455-1d7aab38db5e	sport_tennis	Tennis	Enable Tennis sport selection and live view panels	f	\N	2026-10-05 11:48:09.120446+00	2026-10-05 11:48:09.120446+00
034e38aa-4c07-4f9d-9b77-050ff5eaebbc	sport_cricket	Cricket	Enable Cricket sport selection and live view panels	f	\N	2026-10-05 11:48:09.121696+00	2026-10-05 11:48:09.121696+00
2c00ab60-45a6-4c7b-95b0-c0bf4455d72d	sport_basketball	Basketball	Enable Basketball sport selection and live view panels	f	\N	2026-10-05 11:48:09.122102+00	2026-10-05 11:48:09.122102+00
d9c88842-b662-4aa2-b92c-7063386b2222	feature_polls	Live Match Polls	Enable audience poll panels	t	\N	2026-10-05 11:48:09.122575+00	2026-10-05 11:48:09.122575+00
6bd5341d-d97e-4b40-904a-c40ca5db5bac	feature_watch	Watch Live Streams	Enable direct live stream redirect buttons	t	\N	2026-10-05 11:48:09.123032+00	2026-10-05 11:48:09.123032+00
1516b46b-6b7e-4fa7-8fb0-f02fb23c8ffb	feature_comments	Live Comments/Chat	Enable user commentary sidebar sections	t	\N	2026-10-05 11:48:09.123454+00	2026-10-05 11:48:09.123454+00
9f50bcae-5fb3-4570-9aac-5264df747635	feature_media	Live Media Uploads	Enable viewing photos and videos uploaded by users	t	\N	2026-10-05 11:48:09.124129+00	2026-10-05 11:48:09.124129+00
adc9d99d-b438-45c5-ba96-2a78387a1d60	sport_volleyball	Volleyball	Enable Volleyball sport selection and live view panels	t	\N	2026-10-05 11:48:09.121119+00	2026-10-05 11:48:09.121119+00
\.


--
-- Data for Name: match_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.match_comments (id, match_id, user_id, user_name, message, created_at) FROM stdin;
\.


--
-- Data for Name: match_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.match_history (id, match_id, tournament_id, event_id, umpire_id, umpire_name, player1_name, player2_name, scoring_format, best_of_games, court, points_history, sets_snapshot, total_duration_seconds, play_time_seconds, paused_time_seconds, started_at, ended_at, winner_id, winner_name, final_status, created_at) FROM stdin;
\.


--
-- Data for Name: match_polls; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.match_polls (id, match_id, question, options, votes, created_at) FROM stdin;
\.


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.matches (id, tournament_id, event_id, fixture_round, fixture_position, court, player1_id, player1_name, player2_id, player2_name, umpire_id, umpire_name, scheduled_time, actual_start_time, actual_end_time, duration_seconds, status, winner_id, sets, sub_matches, is_adhoc, adhoc_type, max_viewers, sport, sport_metadata, round_name) FROM stdin;
m-upload-1791296696451-3	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	0	0	7 PD Sports Arena	team_smashers	Smashers	team_servers	Servers	usr_umpire_1	Manish Patil	2026-10-10 19:00:00+00	\N	\N	0	scheduled	\N	[{"winner_id": null, "set_number": 1, "is_complete": false, "player1_score": 0, "player2_score": 0}]	\N	\N	\N	1	volleyball	{}	1
m-custom-1791296205133	t_wvpl_2026	e1791279154035-vb_women_open-0	2	0	7 PD Sports Arena	tbd	TBD	tbd	TBD	\N	\N	2026-10-18 19:00:00+00	\N	\N	\N	scheduled	\N	[]	\N	\N	\N	\N	volleyball	\N	Final
m-upload-1791296696451-4	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	0	0	7 PD Sports Arena	team_spikers	Spikers	team_netbreakers	Netbreakers	usr_umpire_1	Manish Patil	2026-10-10 20:30:00+00	\N	\N	\N	scheduled	\N	[]	\N	\N	\N	\N	volleyball	{}	1
m-upload-1791296696451-5	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	0	0	7 PD Sports Arena	team_smashers	Smashers	team_netbreakers	Netbreakers	usr_umpire_1	Manish Patil	2026-10-11 07:00:00+00	\N	\N	\N	scheduled	\N	[]	\N	\N	\N	\N	volleyball	{}	1
m-upload-1791296696451-6	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	0	0	7 PD Sports Arena	team_gamechangers	Gamechangers	team_blockbusters	Blockbusters	usr_umpire_1	Manish Patil	2026-10-11 08:30:00+00	\N	\N	\N	scheduled	\N	[]	\N	\N	\N	\N	volleyball	{}	1
m-upload-1791296696451-7	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	0	0	7 PD Sports Arena	team_spikers	Spikers	team_gamechangers	Gamechangers	usr_umpire_1	Manish Patil	2026-10-11 19:00:00+00	\N	\N	\N	scheduled	\N	[]	\N	\N	\N	\N	volleyball	{}	1
m-upload-1791296696451-8	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	0	0	7 PD Sports Arena	team_servers	Servers	team_blockbusters	Blockbusters	usr_umpire_1	Manish Patil	2026-10-11 20:30:00+00	\N	\N	\N	scheduled	\N	[]	\N	\N	\N	\N	volleyball	{}	1
m-upload-1791296696451-9	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	0	0	7 PD Sports Arena	team_spikers	Spikers	team_blockbusters	Blockbusters	usr_umpire_1	Manish Patil	2026-10-17 07:00:00+00	\N	\N	\N	scheduled	\N	[]	\N	\N	\N	\N	volleyball	{}	1
m-upload-1791296696451-10	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	0	0	7 PD Sports Arena	team_servers	Servers	team_gamechangers	Gamechangers	usr_umpire_1	Manish Patil	2026-10-17 08:30:00+00	\N	\N	\N	scheduled	\N	[]	\N	\N	\N	\N	volleyball	{}	1
m-upload-1791296696451-11	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	0	0	7 PD Sports Arena	team_smashers	Smashers	team_gamechangers	Gamechangers	usr_umpire_1	Manish Patil	2026-10-17 19:00:00+00	\N	\N	\N	scheduled	\N	[]	\N	\N	\N	\N	volleyball	{}	1
m-upload-1791296696451-12	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	0	0	7 PD Sports Arena	team_netbreakers	Netbreakers	team_blockbusters	Blockbusters	usr_umpire_1	Manish Patil	2026-10-17 20:30:00+00	\N	\N	\N	scheduled	\N	[]	\N	\N	\N	\N	volleyball	{}	1
m-upload-1791296160840-1	t_wvpl_2026	e1791279154035-vb_women_open-0	0	0	7 PD Sports Arena	team_wvpl_legends	Legends	team_wvpl_strikers	Strikers	\N	\N	2026-10-10 07:45:00+00	\N	\N	\N	scheduled	\N	[]	\N	\N	\N	\N	volleyball	{}	1
m-upload-1791296160840-2	t_wvpl_2026	e1791279154035-vb_women_open-0	0	0	7 PD Sports Arena	team_wvpl_blazers	Blazers	team_wvpl_aces	Aces	\N	\N	2026-10-10 19:45:00+00	\N	\N	\N	scheduled	\N	[]	\N	\N	\N	\N	volleyball	{}	1
m-upload-1791296160840-3	t_wvpl_2026	e1791279154035-vb_women_open-0	0	0	7 PD Sports Arena	team_wvpl_blazers	Blazers	team_wvpl_strikers	Strikers	\N	\N	2026-10-11 07:45:00+00	\N	\N	\N	scheduled	\N	[]	\N	\N	\N	\N	volleyball	{}	1
m-upload-1791296160840-4	t_wvpl_2026	e1791279154035-vb_women_open-0	0	0	7 PD Sports Arena	team_wvpl_legends	Legends	team_wvpl_aces	Aces	\N	\N	2026-10-11 19:45:00+00	\N	\N	\N	scheduled	\N	[]	\N	\N	\N	\N	volleyball	{}	1
m-upload-1791296696451-13	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	0	0	7 PD Sports Arena	team_smashers	Smashers	team_blockbusters	Blockbusters	usr_umpire_1	Manish Patil	2026-10-18 07:00:00+00	\N	\N	\N	scheduled	\N	[]	\N	\N	\N	\N	volleyball	{}	1
m-custom-1791296735258	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	2	0	7 PD Sports Srena	tbd	TBD	tbd	TBD	usr_umpire_1	Manish Patil	2026-10-18 20:00:00+00	\N	\N	\N	scheduled	\N	[]	\N	\N	\N	\N	volleyball	\N	Final
m-upload-1791296696451-14	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	0	0	7 PD Sports Arena	team_spikers	Spikers	team_servers	Servers	usr_umpire_1	Manish Patil	2026-10-18 07:45:00+00	\N	\N	\N	scheduled	\N	[]	\N	\N	\N	\N	volleyball	{}	1
m-upload-1791296696451-15	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	0	0	7 PD Sports Arena	team_netbreakers	Netbreakers	team_gamechangers	Gamechangers	usr_umpire_1	Manish Patil	2026-10-18 08:30:00+00	\N	\N	\N	scheduled	\N	[]	\N	\N	\N	\N	volleyball	{}	1
m-upload-1791296160840-5	t_wvpl_2026	e1791279154035-vb_women_open-0	0	0	7 PD Sports Arena	team_wvpl_strikers	Strikers	team_wvpl_aces	Aces	\N	\N	2026-10-17 07:45:00+00	\N	\N	\N	scheduled	\N	[]	\N	\N	\N	\N	volleyball	{}	1
m-upload-1791296160840-6	t_wvpl_2026	e1791279154035-vb_women_open-0	0	0	7 PD Sports Arena	team_wvpl_legends	Legends	team_wvpl_blazers	Blazers	\N	\N	2026-10-17 19:45:00+00	\N	\N	\N	scheduled	\N	[]	\N	\N	\N	\N	volleyball	{}	1
m-upload-1791296696451-2	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	0	0	7 PD Sports Arena	team_servers	Servers	team_netbreakers	Netbreakers	usr_umpire_1	Manish Patil	2026-10-10 08:30:00+00	2026-10-07 11:49:02.893+00	\N	4	running	\N	[{"winner_id": null, "set_number": 1, "is_complete": false, "player1_score": 2, "player2_score": 4}, {"winner_id": null, "set_number": 2, "is_complete": false, "player1_score": 0, "player2_score": 0}, {"winner_id": null, "set_number": 3, "is_complete": false, "player1_score": 0, "player2_score": 0}]	\N	\N	\N	1	volleyball	{"stats_p1": {"aces": 0, "blocks": 0, "attacks": 0, "opponent_errors": 0}, "stats_p2": {"aces": 0, "blocks": 0, "attacks": 0, "opponent_errors": 0}, "rotation_p1": [3, 4, 5, 6, 1, 2], "rotation_p2": [4, 5, 6, 1, 2, 3], "timeouts_p1": 0, "timeouts_p2": 0, "match_format": "best_of_3", "serving_team": "player2", "last_point_type": "quick", "last_point_scorer": "player2", "deciding_set_points": 15, "standard_set_points": 25, "max_timeouts_per_set": 2}	1
m-upload-1791296696451-1	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	0	0	7 PD Sports Arena	team_smashers	Smashers	team_spikers	Spikers	usr_umpire_1	Manish Patil	2026-10-10 07:00:00+00	2026-10-07 11:46:13.675+00	2026-10-07 11:47:20.333+00	66	completed	team_spikers	[{"winner_id": "player1", "set_number": 1, "is_complete": true, "player1_score": 25, "player2_score": 21}, {"winner_id": "player2", "set_number": 2, "is_complete": true, "player1_score": 15, "player2_score": 25}, {"winner_id": "player2", "set_number": 3, "is_complete": true, "player1_score": 17, "player2_score": 19}]	\N	\N	\N	\N	volleyball	{"stats_p1": {"aces": 4, "blocks": 2, "attacks": 3, "opponent_errors": 8}, "stats_p2": {"aces": 3, "blocks": 10, "attacks": 6, "opponent_errors": 4}, "rotation_p1": [2, 3, 4, 5, 6, 1], "rotation_p2": [3, 4, 5, 6, 1, 2], "timeouts_p1": 0, "timeouts_p2": 0, "match_format": "best_of_3", "serving_team": "player2", "last_point_type": "quick", "last_point_scorer": "player2", "deciding_set_points": 15, "standard_set_points": 25, "max_timeouts_per_set": 2}	1
\.


--
-- Data for Name: password_resets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_resets (id, email, otp_hash, expires_at, attempts, is_verified, reset_token, created_at) FROM stdin;
\.


--
-- Data for Name: payment_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_orders (id, user_id, registration_id, amount, currency, razorpay_order_id, status, created_at) FROM stdin;
09e097ee-a1e0-4238-ace6-b2bc0b4443c3	usr_tarun_jha	reg_7pd_tarun_jha	300.00	INR	order_manual_7pd_tarun_jha	paid	2026-10-06 09:55:40.640589+00
9d36578b-af89-4229-9f7c-dab8f467ff28	usr_pradyumna_juikar	reg_7pd_pradyumna_juikar	300.00	INR	order_manual_7pd_pradyumna_juikar	paid	2026-10-06 09:55:40.640589+00
84434efe-e8dc-4d76-b902-39e43054653c	usr_sushant_mane	reg_7pd_sushant_mane	300.00	INR	order_manual_7pd_sushant_mane	paid	2026-10-06 09:55:40.640589+00
3d701428-49a3-4db8-ad57-59edb124f08f	usr_anand_kulkarni	reg_7pd_anand_kulkarni	300.00	INR	order_manual_7pd_anand_kulkarni	paid	2026-10-06 09:55:40.640589+00
3b1bd6d7-8272-4b15-8aeb-fd3701b3589e	usr_yogesh_m	reg_7pd_yogesh_m	300.00	INR	order_manual_7pd_yogesh_m	paid	2026-10-06 09:55:40.640589+00
7e5889e1-215f-44bf-9825-c8d25a5393e5	usr_ranjit_savant	reg_7pd_ranjit_savant	300.00	INR	order_manual_7pd_ranjit_savant	paid	2026-10-06 09:55:40.640589+00
36fb259b-9e66-4a00-855a-2c8e15c90b7f	usr_vikas_paliwal	reg_7pd_vikas_paliwal	300.00	INR	order_manual_7pd_vikas_paliwal	paid	2026-10-06 09:55:40.640589+00
692db57c-85a3-4453-8b1e-697c1792d91d	usr_anup_chudiwal	reg_7pd_anup_chudiwal	300.00	INR	order_manual_7pd_anup_chudiwal	paid	2026-10-06 09:55:40.640589+00
1bce2089-8c3b-4361-ba9f-ea0ddd86ab6d	usr_shivraj_harale	reg_7pd_shivraj_harale	300.00	INR	order_manual_7pd_shivraj_harale	paid	2026-10-06 09:55:40.640589+00
b11b6811-3c65-4545-967b-476d816e8216	usr_prashant_omble	reg_7pd_prashant_omble	300.00	INR	order_manual_7pd_prashant_omble	paid	2026-10-06 09:55:40.640589+00
36267d3c-5524-4d1a-9c1d-48e3cff3cb14	usr_sagar_vekanjkar	reg_7pd_sagar_vekanjkar	300.00	INR	order_manual_7pd_sagar_vekanjkar	paid	2026-10-06 09:55:40.640589+00
4ba96a14-96ef-45dc-ae75-6c0ba453f9bd	usr_nilesh_gaikwad	reg_7pd_nilesh_gaikwad	300.00	INR	order_manual_7pd_nilesh_gaikwad	paid	2026-10-06 09:55:40.640589+00
1266d8ec-3fe0-4633-9fd1-ca15d0d5a746	usr_shivraj_salve	reg_7pd_shivraj_salve	300.00	INR	order_manual_7pd_shivraj_salve	paid	2026-10-06 09:55:40.640589+00
48655e2e-c59e-400d-979e-83a91de1b6a1	usr_harsh_munot	reg_7pd_harsh_munot	300.00	INR	order_manual_7pd_harsh_munot	paid	2026-10-06 09:55:40.640589+00
9517c55a-697a-4be8-9ff2-5268ae8e58ee	usr_sibendra_singh	reg_7pd_sibendra_singh	300.00	INR	order_manual_7pd_sibendra_singh	paid	2026-10-06 09:55:40.640589+00
2a0ef409-e9aa-45aa-a0be-73066e0723c2	usr_vinay_mahadik	reg_7pd_vinay_mahadik	300.00	INR	order_manual_7pd_vinay_mahadik	paid	2026-10-06 09:55:40.640589+00
497c43fd-2413-4871-9d85-d9eccb99b267	usr_himanshu_rajpali	reg_7pd_himanshu_rajpali	300.00	INR	order_manual_7pd_himanshu_rajpali	paid	2026-10-06 09:55:40.640589+00
bf1c88be-b12b-47fb-8304-7455160d1fc8	usr_rohit_kashyap	reg_7pd_rohit_kashyap	300.00	INR	order_manual_7pd_rohit_kashyap	paid	2026-10-06 09:55:40.640589+00
9d99dbd8-afce-43d6-a57e-69dc9cdde9af	usr_rudra_pathak	reg_7pd_rudra_pathak	300.00	INR	order_manual_7pd_rudra_pathak	paid	2026-10-06 09:55:40.640589+00
1bc2b9c4-bce2-4fbf-a307-6996da04796f	usr_abie	reg_7pd_abie	300.00	INR	order_manual_7pd_abie	paid	2026-10-06 09:55:40.640589+00
ae222aea-e959-426f-b2c4-3d0a53d58185	usr_neeraj	reg_7pd_neeraj	300.00	INR	order_manual_7pd_neeraj	paid	2026-10-06 09:55:40.640589+00
87b7797a-d751-495f-b9f8-58d59c7718b7	usr_tushar_lokhande	reg_7pd_tushar_lokhande	300.00	INR	order_manual_7pd_tushar_lokhande	paid	2026-10-06 09:55:40.640589+00
98af4533-888e-4c3c-97fa-66c6300d39f2	usr_niranjan_nande	reg_7pd_niranjan_nande	300.00	INR	order_manual_7pd_niranjan_nande	paid	2026-10-06 09:55:40.640589+00
6def9aff-fc35-4553-abe3-08573f680d23	usr_suyash_m_harkare	reg_7pd_suyash_m_harkare	300.00	INR	order_manual_7pd_suyash_m_harkare	paid	2026-10-06 09:55:40.640589+00
487d82c1-5dc8-4100-9902-9e59e1970e18	usr_c_kishor_ladekar	reg_7pd_c_kishor_ladekar	300.00	INR	order_manual_7pd_c_kishor_ladekar	paid	2026-10-06 09:55:40.640589+00
f8e55944-eafc-42d6-83f4-f66ff18b8e04	usr_onkar_jagtap	reg_7pd_onkar_jagtap	300.00	INR	order_manual_7pd_onkar_jagtap	paid	2026-10-06 09:55:40.640589+00
1b327fd6-c221-41ce-861b-36ace9f5dbc7	usr_asif_tamboli	reg_7pd_asif_tamboli	300.00	INR	order_manual_7pd_asif_tamboli	paid	2026-10-06 09:55:40.640589+00
3a890ec5-13ef-486f-8def-7b8a2d5b8723	usr_amit_chougule	reg_7pd_amit_chougule	300.00	INR	order_manual_7pd_amit_chougule	paid	2026-10-06 09:55:40.640589+00
701e5498-bc02-4bfe-9518-de1453259798	usr_vinod_mulik	reg_7pd_vinod_mulik	300.00	INR	order_manual_7pd_vinod_mulik	paid	2026-10-06 09:55:40.640589+00
f995b0ba-1e4c-4be5-ac46-3f65ed2da4fc	usr_vinod_digole	reg_7pd_vinod_digole	300.00	INR	order_manual_7pd_vinod_digole	paid	2026-10-06 09:55:40.640589+00
662b19c5-2194-4b06-b0bc-5c538ae5220e	usr_rakesh_rane	reg_7pd_rakesh_rane	300.00	INR	order_manual_7pd_rakesh_rane	paid	2026-10-06 09:55:40.640589+00
50510069-8a33-4127-8c98-12362e38751f	usr_shreyas_mohite	reg_7pd_shreyas_mohite	300.00	INR	order_manual_7pd_shreyas_mohite	paid	2026-10-06 09:55:40.640589+00
5882e3a9-9ccd-465c-bd27-56b557f73123	usr_yogesh_jadhav	reg_7pd_yogesh_jadhav	300.00	INR	order_manual_7pd_yogesh_jadhav	paid	2026-10-06 09:55:40.640589+00
a3c88267-3be2-40c3-b821-cfa0645434f2	usr_kavish_gianani	reg_7pd_kavish_gianani	300.00	INR	order_manual_7pd_kavish_gianani	paid	2026-10-06 09:55:40.640589+00
adc98777-22d9-454f-bfb9-4135dc3a83ff	usr_vaijnath_pawar	reg_7pd_vaijnath_pawar	300.00	INR	order_manual_7pd_vaijnath_pawar	paid	2026-10-06 09:55:40.640589+00
844ae5c9-1710-4bc2-a09c-7800ae73a5d5	usr_akshay_tamane	reg_7pd_akshay_tamane	300.00	INR	order_manual_7pd_akshay_tamane	paid	2026-10-06 09:55:40.640589+00
b650c789-9497-4a20-9c4f-b9955ef1bccd	usr_pandurang_biradar	reg_7pd_pandurang_biradar	300.00	INR	order_manual_7pd_pandurang_biradar	paid	2026-10-06 09:55:40.640589+00
bed1719c-0068-4582-b32d-50882f30b11e	usr_yash_bhame	reg_7pd_yash_bhame	300.00	INR	order_manual_7pd_yash_bhame	paid	2026-10-06 09:55:40.640589+00
f20cea16-b974-4d3f-8350-0726eb995623	usr_bharat_patil	reg_7pd_bharat_patil	300.00	INR	order_manual_7pd_bharat_patil	paid	2026-10-06 09:55:40.640589+00
ad513bd1-e05a-41c6-9da2-e9b7344e6821	usr_vaibhav_gunjal	reg_7pd_vaibhav_gunjal	300.00	INR	order_manual_7pd_vaibhav_gunjal	paid	2026-10-06 09:55:40.640589+00
9b6f4719-136e-4159-b46f-936651881a68	usr_rahul_pawar	reg_7pd_rahul_pawar	300.00	INR	order_manual_7pd_rahul_pawar	paid	2026-10-06 09:55:40.640589+00
82a568a9-8fbe-472a-b006-4763f31c2497	usr_dr_amit_r_m	reg_7pd_dr_amit_r_m	300.00	INR	order_manual_7pd_dr_amit_r_m	paid	2026-10-06 09:55:40.640589+00
80e68d1d-53c1-4ac8-9c51-e30ef56a01dd	usr_sachin_kable	reg_7pd_sachin_kable	300.00	INR	order_manual_7pd_sachin_kable	paid	2026-10-06 09:55:40.640589+00
97657ea5-9ec9-44e2-96aa-947196d74553	usr_pankaj_sehra	reg_7pd_pankaj_sehra	300.00	INR	order_manual_7pd_pankaj_sehra	paid	2026-10-06 09:55:40.640589+00
3b72a3b1-e62a-43ab-a100-16863e9f7899	usr_shailesh_sapate	reg_7pd_shailesh_sapate	300.00	INR	order_manual_7pd_shailesh_sapate	paid	2026-10-06 09:55:40.640589+00
4a64d7f6-9b90-4d63-aab2-cb518f10cd9e	usr_harshit_upadhyay	reg_7pd_harshit_upadhyay	300.00	INR	order_manual_7pd_harshit_upadhyay	paid	2026-10-06 09:55:40.640589+00
c6b23bbc-f783-4011-b275-e37b67f070e0	usr_ajit_sarwale	reg_7pd_ajit_sarwale	300.00	INR	order_manual_7pd_ajit_sarwale	paid	2026-10-06 09:55:40.640589+00
d6c8b004-f17f-4ac6-9c1b-af77fb0b94ab	usr_mahesh_dhole	reg_7pd_mahesh_dhole	300.00	INR	order_manual_7pd_mahesh_dhole	paid	2026-10-06 09:55:40.640589+00
724a5628-abb9-4329-83cb-8f924d858527	usr_ashwin_sutar	reg_7pd_ashwin_sutar	300.00	INR	order_manual_7pd_ashwin_sutar	paid	2026-10-06 09:55:40.640589+00
192dcef3-8110-4d08-ab88-2191e1fc5956	usr_manish_mishra	reg_7pd_manish_mishra	300.00	INR	order_manual_7pd_manish_mishra	paid	2026-10-06 09:55:40.640589+00
d57304c8-a498-4e02-bb96-1b95d3ceeb25	usr_jayesh_deore	reg_7pd_jayesh_deore	300.00	INR	order_manual_7pd_jayesh_deore	paid	2026-10-06 09:55:40.640589+00
edf9b808-941c-4360-af03-73fa9aca891b	usr_neha_s	reg_wvpl_neha_s	200.00	INR	order_manual_wvpl_neha_s	paid	2026-10-06 09:55:40.640589+00
47d594db-92c7-4b32-9cd3-0eb9266cde4b	usr_pooja_kable	reg_wvpl_pooja_kable	200.00	INR	order_manual_wvpl_pooja_kable	paid	2026-10-06 09:55:40.640589+00
dfe13ab4-6e04-4b31-8a91-af1132d9db3e	usr_urmila_d	reg_wvpl_urmila_d	200.00	INR	order_manual_wvpl_urmila_d	paid	2026-10-06 09:55:40.640589+00
854b93e1-dc49-4812-a682-39a2aebbafd5	usr_swati_bhange	reg_wvpl_swati_bhange	200.00	INR	order_manual_wvpl_swati_bhange	paid	2026-10-06 09:55:40.640589+00
ddc0dd0c-7495-410e-bdb2-3550a7dd090a	usr_dr_archana	reg_wvpl_dr_archana	200.00	INR	order_manual_wvpl_dr_archana	paid	2026-10-06 09:55:40.640589+00
0fb81d8e-03ec-442f-8815-70baf155dc87	usr_pratima_patil	reg_wvpl_pratima_patil	200.00	INR	order_manual_wvpl_pratima_patil	paid	2026-10-06 09:55:40.640589+00
3e055fd8-029a-4c38-ab70-9487e666a8f4	usr_shivani_kohli	reg_wvpl_shivani_kohli	200.00	INR	order_manual_wvpl_shivani_kohli	paid	2026-10-06 09:55:40.640589+00
add5dac0-d9f9-4d74-bf13-4b9351de4aa3	usr_snehali	reg_wvpl_snehali	200.00	INR	order_manual_wvpl_snehali	paid	2026-10-06 09:55:40.640589+00
7e77a0c5-a1fc-44e2-a8fc-7bd01b5a0bc4	usr_nishita_p	reg_wvpl_nishita_p	200.00	INR	order_manual_wvpl_nishita_p	paid	2026-10-06 09:55:40.640589+00
6328f74c-a6d6-49ee-928f-3f9a0420f22a	usr_snehal_patil	reg_wvpl_snehal_patil	200.00	INR	order_manual_wvpl_snehal_patil	paid	2026-10-06 09:55:40.640589+00
a9a2113d-01e5-4918-9edd-8185cbb17fb4	usr_aarti_sehera	reg_wvpl_aarti_sehera	200.00	INR	order_manual_wvpl_aarti_sehera	paid	2026-10-06 09:55:40.640589+00
3a2d2351-ea1d-4bec-927b-7084d42559a2	usr_aakansha_p	reg_wvpl_aakansha_p	200.00	INR	order_manual_wvpl_aakansha_p	paid	2026-10-06 09:55:40.640589+00
80f701de-de7d-4ba2-b17d-30792070d2dc	usr_priyanka_shinde	reg_wvpl_priyanka_shinde	200.00	INR	order_manual_wvpl_priyanka_shinde	paid	2026-10-06 09:55:40.640589+00
8e1fb614-8bfa-431e-b197-729c5b1ed112	usr_priya_w	reg_wvpl_priya_w	200.00	INR	order_manual_wvpl_priya_w	paid	2026-10-06 09:55:40.640589+00
ae1e98de-8081-4c2e-bc85-d224d2b118de	usr_heena_t	reg_wvpl_heena_t	200.00	INR	order_manual_wvpl_heena_t	paid	2026-10-06 09:55:40.640589+00
f24cebc3-60be-4833-a9e6-6f2401e38679	usr_rohini_j	reg_wvpl_rohini_j	200.00	INR	order_manual_wvpl_rohini_j	paid	2026-10-06 09:55:40.640589+00
f623eaa6-bdb0-4bf8-956a-f7e742aade8d	usr_purva_p	reg_wvpl_purva_p	200.00	INR	order_manual_wvpl_purva_p	paid	2026-10-06 09:55:40.640589+00
658b9472-97f4-41d9-a8a5-8bd4a7b79bf3	usr_sneha_desai	reg_wvpl_sneha_desai	200.00	INR	order_manual_wvpl_sneha_desai	paid	2026-10-06 09:55:40.640589+00
3ae9411b-d6c6-43fb-9eac-40f81b7491de	usr_pooja_s	reg_wvpl_pooja_s	200.00	INR	order_manual_wvpl_pooja_s	paid	2026-10-06 09:55:40.640589+00
4de79465-c3d4-4fa5-9f5d-85f07aed0fd4	usr_sonal_bhoyar	reg_wvpl_sonal_bhoyar	200.00	INR	order_manual_wvpl_sonal_bhoyar	paid	2026-10-06 09:55:40.640589+00
afee0773-36fe-4a54-a081-1faebb05d3bf	usr_deepa_shetty	reg_wvpl_deepa_shetty	200.00	INR	order_manual_wvpl_deepa_shetty	paid	2026-10-06 09:55:40.640589+00
d1fcdb77-4baa-497e-b2f8-3a03e7136862	usr_sheetal_dhole	reg_wvpl_sheetal_dhole	200.00	INR	order_manual_wvpl_sheetal_dhole	paid	2026-10-06 09:55:40.640589+00
0dcb9267-e3ac-46eb-9769-64fbcac051ca	usr_shardha_omble	reg_wvpl_shardha_omble	200.00	INR	order_manual_wvpl_shardha_omble	paid	2026-10-06 09:55:40.640589+00
af4373e5-e4d2-43d3-8271-ce1168cdb6c4	usr_ritu_m	reg_wvpl_ritu_m	200.00	INR	order_manual_wvpl_ritu_m	paid	2026-10-06 09:55:40.640589+00
3c80001d-489e-433d-baba-e8a4762267e9	usr_mansa_patil	reg_wvpl_mansa_patil	200.00	INR	order_manual_wvpl_mansa_patil	paid	2026-10-06 09:55:40.640589+00
53fb7841-1d73-4b69-86ef-9d60def1cb9a	usr_jayalaxmi	reg_wvpl_jayalaxmi	200.00	INR	order_manual_wvpl_jayalaxmi	paid	2026-10-06 09:55:40.640589+00
eb87f5a6-7e8b-430d-8a73-c9fc78948a7f	usr_vrushali_p	reg_wvpl_vrushali_p	200.00	INR	order_manual_wvpl_vrushali_p	paid	2026-10-06 09:55:40.640589+00
00b8230a-aac6-4d70-a478-1c6f800cd637	usr_purva_bonde	reg_wvpl_purva_bonde	200.00	INR	order_manual_wvpl_purva_bonde	paid	2026-10-06 09:55:40.640589+00
b508676a-2d4c-49a4-9364-656c75db4ed5	usr_priyanka_t	reg_wvpl_priyanka_t	200.00	INR	order_manual_wvpl_priyanka_t	paid	2026-10-06 09:55:40.640589+00
f85de264-1ed1-4fa9-a5f3-f00b850acccf	usr_nidhi_s	reg_wvpl_nidhi_s	200.00	INR	order_manual_wvpl_nidhi_s	paid	2026-10-06 09:55:40.640589+00
ba26343a-ce95-4463-a4af-e59e35377bd6	usr_deepika_n	reg_wvpl_deepika_n	200.00	INR	order_manual_wvpl_deepika_n	paid	2026-10-06 09:55:40.640589+00
bde97b67-4f48-4dcd-ba44-2d7f82612394	usr_pankti_p	reg_wvpl_pankti_p	200.00	INR	order_manual_wvpl_pankti_p	paid	2026-10-06 09:55:40.640589+00
\.


--
-- Data for Name: payment_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_transactions (id, order_id, razorpay_payment_id, payment_method, status, paid_at) FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, email, name, phone, roles, avatar, password_hash, age, gender, date_of_birth, created_at) FROM stdin;
usr_umpire_1	umpire_1@matchpoint.io	Umpire 1	+91 91234 00001	{umpire,player,broadcaster}	https://api.dicebear.com/7.x/adventurer/svg?seed=usr_umpire_1	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	38	Male	1988-02-11	2026-10-05 11:50:58.122012+00
usr_shivraj_salve	shivraj_salve@7pdvpl.io	Shivraj Salve	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_harsh_munot	harsh_munot@7pdvpl.io	Harsh Munot	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_sibendra_singh	sibendra_singh@7pdvpl.io	Sibendra Singh	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_vinay_mahadik	vinay_mahadik@7pdvpl.io	Vinay Mahadik	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_himanshu_rajpali	himanshu_rajpali@7pdvpl.io	Himanshu Rajpali	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_rohit_kashyap	rohit_kashyap@7pdvpl.io	Rohit Kashyap	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_rudra_pathak	rudra_pathak@7pdvpl.io	Rudra Pathak	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_abie	abie@7pdvpl.io	Abie	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_neeraj	neeraj@7pdvpl.io	Neeraj	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_tushar_lokhande	tushar_lokhande@7pdvpl.io	Tushar Lokhande	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_niranjan_nande	niranjan_nande@7pdvpl.io	Niranjan Nande	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_suyash_m_harkare	suyash_m_harkare@7pdvpl.io	Suyash M Harkare	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_c_kishor_ladekar	c_kishor_ladekar@7pdvpl.io	C.kishor Ladekar	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_onkar_jagtap	onkar_jagtap@7pdvpl.io	Onkar Jagtap	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_asif_tamboli	asif_tamboli@7pdvpl.io	Asif Tamboli	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_amit_chougule	amit_chougule@7pdvpl.io	Amit Chougule	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_vinod_mulik	vinod_mulik@7pdvpl.io	Vinod Mulik	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_vinod_digole	vinod_digole@7pdvpl.io	Vinod Digole	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_rakesh_rane	rakesh_rane@7pdvpl.io	Rakesh Rane	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_shreyas_mohite	shreyas_mohite@7pdvpl.io	Shreyas Mohite	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_yogesh_jadhav	yogesh_jadhav@7pdvpl.io	Yogesh Jadhav	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_kavish_gianani	kavish_gianani@7pdvpl.io	Kavish Gianani	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_vaijnath_pawar	vaijnath_pawar@7pdvpl.io	Vaijnath Pawar	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_akshay_tamane	akshay_tamane@7pdvpl.io	Akshay Tamane	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_pandurang_biradar	pandurang_biradar@7pdvpl.io	Pandurang Biradar	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_yash_bhame	yash_bhame@7pdvpl.io	Yash Bhame	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_bharat_patil	bharat_patil@7pdvpl.io	Bharat Patil	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_vaibhav_gunjal	vaibhav_gunjal@7pdvpl.io	Vaibhav Gunjal	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_rahul_pawar	rahul_pawar@7pdvpl.io	Rahul Pawar	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_dr_amit_r_m	dr_amit_r_m@7pdvpl.io	Dr Amit R M	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_sachin_kable	sachin_kable@7pdvpl.io	Sachin Kable	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_pankaj_sehra	pankaj_sehra@7pdvpl.io	Pankaj Sehra	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_shailesh_sapate	shailesh_sapate@7pdvpl.io	Shailesh Sapate	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_harshit_upadhyay	harshit_upadhyay@7pdvpl.io	Harshit Upadhyay	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_ajit_sarwale	ajit_sarwale@7pdvpl.io	Ajit Sarwale	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_mahesh_dhole	mahesh_dhole@7pdvpl.io	Mahesh Dhole	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_ashwin_sutar	ashwin_sutar@7pdvpl.io	Ashwin Sutar	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_manish_mishra	manish_mishra@7pdvpl.io	Manish Mishra	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_jayesh_deore	jayesh_deore@7pdvpl.io	Jayesh Deore	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_neha_s	neha_s@wvpl.io	Neha S	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_pooja_kable	pooja_kable@wvpl.io	Pooja Kable	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_urmila_d	urmila_d@wvpl.io	Urmila D	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_swati_bhange	swati_bhange@wvpl.io	Swati Bhange	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_dr_archana	dr_archana@wvpl.io	Dr. Archana	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_pratima_patil	pratima_patil@wvpl.io	Pratima Patil	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_shivani_kohli	shivani_kohli@wvpl.io	Shivani Kohli	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_snehali	snehali@wvpl.io	Snehali	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_nishita_p	nishita_p@wvpl.io	Nishita P	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_snehal_patil	snehal_patil@wvpl.io	Snehal Patil	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_aarti_sehera	aarti_sehera@wvpl.io	Aarti Sehera	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_aakansha_p	aakansha_p@wvpl.io	Aakansha P	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_priyanka_shinde	priyanka_shinde@wvpl.io	Priyanka Shinde	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_priya_w	priya_w@wvpl.io	Priya W	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_heena_t	heena_t@wvpl.io	Heena T	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
TBD	tbd@matchpoint.io	TBD	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	99	Male	\N	2026-10-08 09:00:18.646593+00
sysadmin2	sysadmin2@matchpoint.io	Preeti Nair	\N	{system_admin}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	32	Female	\N	2026-10-08 09:00:18.652751+00
usr_tarun_jha	tarun_jha@7pdvpl.io	Tarun Jha	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_pradyumna_juikar	pradyumna_juikar@7pdvpl.io	Pradyumna Juikar	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
sysadmin1	sysadmin@matchpoint.io	System Admin	9999999999	{system_admin}		$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	26	Male	2000-01-01	2026-10-05 11:57:25.956582+00
usr_admin_2	admin_2@matchpoint.io	Neha Sharma	+91 98765 00002	{admin,player}	https://api.dicebear.com/7.x/adventurer/svg?seed=usr_admin_2	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	30	Female	1996-01-14	2026-10-05 11:50:58.106361+00
usr_admin_1	admin_1@matchpoint.io	Admin 1	+91 98765 00001	{admin,player}	https://api.dicebear.com/7.x/adventurer/svg?seed=usr_admin_1	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	50	Male	1976-04-06	2026-10-05 11:50:58.094042+00
usr_sushant_mane	sushant_mane@7pdvpl.io	Sushant Mane	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_anand_kulkarni	anand_kulkarni@7pdvpl.io	Anand Kulkarni	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_yogesh_m	yogesh_m@7pdvpl.io	Yogesh M	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_ranjit_savant	ranjit_savant@7pdvpl.io	Ranjit Savant	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_vikas_paliwal	vikas_paliwal@7pdvpl.io	Vikas Paliwal	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_anup_chudiwal	anup_chudiwal@7pdvpl.io	Anup Chudiwal	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_shivraj_harale	shivraj_harale@7pdvpl.io	Shivraj Harale	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_prashant_omble	prashant_omble@7pdvpl.io	Prashant Omble	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_sagar_vekanjkar	sagar_vekanjkar@7pdvpl.io	Sagar Vekanjkar	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_nilesh_gaikwad	nilesh_gaikwad@7pdvpl.io	Nilesh Gaikwad	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Male	\N	2026-10-06 09:55:40.640589+00
usr_rohini_j	rohini_j@wvpl.io	Rohini J	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_purva_p	purva_p@wvpl.io	Purva P	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_sneha_desai	sneha_desai@wvpl.io	Sneha Desai	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_pooja_s	pooja_s@wvpl.io	Pooja S	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_sonal_bhoyar	sonal_bhoyar@wvpl.io	Sonal Bhoyar	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_deepa_shetty	deepa_shetty@wvpl.io	Deepa Shetty	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_sheetal_dhole	sheetal_dhole@wvpl.io	Sheetal Dhole	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_shardha_omble	shardha_omble@wvpl.io	Shardha Omble	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_ritu_m	ritu_m@wvpl.io	Ritu M	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_mansa_patil	mansa_patil@wvpl.io	Mansa Patil	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_jayalaxmi	jayalaxmi@wvpl.io	Jayalaxmi	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_vrushali_p	vrushali_p@wvpl.io	Vrushali P	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_purva_bonde	purva_bonde@wvpl.io	Purva Bonde	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_priyanka_t	priyanka_t@wvpl.io	Priyanka T	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_nidhi_s	nidhi_s@wvpl.io	Nidhi S	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_deepika_n	deepika_n@wvpl.io	Deepika N	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
usr_pankti_p	pankti_p@wvpl.io	Pankti P	\N	{player}	\N	$2a$10$5sSWn.aPSSbyDir19seHjeTnVUGFyI6zgFlsnb1LX5O5jFqWhOExO	\N	Female	\N	2026-10-06 09:55:40.640589+00
\.


--
-- Data for Name: registrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, disqualification_reason, registered_at, seed, partner_name, partner_email, partner_gender, partner_age, payment_status, payment_method) FROM stdin;
reg_7pd_tarun_jha	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_tarun_jha	Tarun Jha	tarun_jha@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_pradyumna_juikar	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_pradyumna_juikar	Pradyumna Juikar	pradyumna_juikar@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_sushant_mane	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_sushant_mane	Sushant Mane	sushant_mane@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_anand_kulkarni	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_anand_kulkarni	Anand Kulkarni	anand_kulkarni@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_yogesh_m	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_yogesh_m	Yogesh M	yogesh_m@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_ranjit_savant	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_ranjit_savant	Ranjit Savant	ranjit_savant@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_vikas_paliwal	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_vikas_paliwal	Vikas Paliwal	vikas_paliwal@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_anup_chudiwal	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_anup_chudiwal	Anup Chudiwal	anup_chudiwal@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_shivraj_harale	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_shivraj_harale	Shivraj Harale	shivraj_harale@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_prashant_omble	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_prashant_omble	Prashant Omble	prashant_omble@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_sagar_vekanjkar	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_sagar_vekanjkar	Sagar Vekanjkar	sagar_vekanjkar@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_nilesh_gaikwad	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_nilesh_gaikwad	Nilesh Gaikwad	nilesh_gaikwad@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_shivraj_salve	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_shivraj_salve	Shivraj Salve	shivraj_salve@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_harsh_munot	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_harsh_munot	Harsh Munot	harsh_munot@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_sibendra_singh	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_sibendra_singh	Sibendra Singh	sibendra_singh@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_vinay_mahadik	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_vinay_mahadik	Vinay Mahadik	vinay_mahadik@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_himanshu_rajpali	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_himanshu_rajpali	Himanshu Rajpali	himanshu_rajpali@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_rohit_kashyap	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_rohit_kashyap	Rohit Kashyap	rohit_kashyap@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_rudra_pathak	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_rudra_pathak	Rudra Pathak	rudra_pathak@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_abie	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_abie	Abie	abie@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_neeraj	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_neeraj	Neeraj	neeraj@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_tushar_lokhande	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_tushar_lokhande	Tushar Lokhande	tushar_lokhande@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_niranjan_nande	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_niranjan_nande	Niranjan Nande	niranjan_nande@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_suyash_m_harkare	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_suyash_m_harkare	Suyash M Harkare	suyash_m_harkare@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_c_kishor_ladekar	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_c_kishor_ladekar	C.kishor Ladekar	c_kishor_ladekar@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_onkar_jagtap	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_onkar_jagtap	Onkar Jagtap	onkar_jagtap@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_asif_tamboli	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_asif_tamboli	Asif Tamboli	asif_tamboli@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_amit_chougule	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_amit_chougule	Amit Chougule	amit_chougule@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_vinod_mulik	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_vinod_mulik	Vinod Mulik	vinod_mulik@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_vinod_digole	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_vinod_digole	Vinod Digole	vinod_digole@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_rakesh_rane	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_rakesh_rane	Rakesh Rane	rakesh_rane@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_shreyas_mohite	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_shreyas_mohite	Shreyas Mohite	shreyas_mohite@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_yogesh_jadhav	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_yogesh_jadhav	Yogesh Jadhav	yogesh_jadhav@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_kavish_gianani	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_kavish_gianani	Kavish Gianani	kavish_gianani@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_vaijnath_pawar	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_vaijnath_pawar	Vaijnath Pawar	vaijnath_pawar@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_akshay_tamane	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_akshay_tamane	Akshay Tamane	akshay_tamane@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_pandurang_biradar	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_pandurang_biradar	Pandurang Biradar	pandurang_biradar@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_yash_bhame	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_yash_bhame	Yash Bhame	yash_bhame@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_bharat_patil	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_bharat_patil	Bharat Patil	bharat_patil@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_vaibhav_gunjal	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_vaibhav_gunjal	Vaibhav Gunjal	vaibhav_gunjal@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_rahul_pawar	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_rahul_pawar	Rahul Pawar	rahul_pawar@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_dr_amit_r_m	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_dr_amit_r_m	Dr Amit R M	dr_amit_r_m@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_sachin_kable	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_sachin_kable	Sachin Kable	sachin_kable@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_pankaj_sehra	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_pankaj_sehra	Pankaj Sehra	pankaj_sehra@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_shailesh_sapate	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_shailesh_sapate	Shailesh Sapate	shailesh_sapate@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_harshit_upadhyay	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_harshit_upadhyay	Harshit Upadhyay	harshit_upadhyay@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_ajit_sarwale	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_ajit_sarwale	Ajit Sarwale	ajit_sarwale@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_mahesh_dhole	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_mahesh_dhole	Mahesh Dhole	mahesh_dhole@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_ashwin_sutar	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_ashwin_sutar	Ashwin Sutar	ashwin_sutar@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_manish_mishra	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_manish_mishra	Manish Mishra	manish_mishra@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_7pd_jayesh_deore	t_7pd_vpl_s2	e1791279119394-vb_men_open-0	usr_jayesh_deore	Jayesh Deore	jayesh_deore@7pdvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_neha_s	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_neha_s	Neha S	neha_s@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_pooja_kable	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_pooja_kable	Pooja Kable	pooja_kable@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_urmila_d	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_urmila_d	Urmila D	urmila_d@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_swati_bhange	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_swati_bhange	Swati Bhange	swati_bhange@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_dr_archana	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_dr_archana	Dr. Archana	dr_archana@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_pratima_patil	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_pratima_patil	Pratima Patil	pratima_patil@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_shivani_kohli	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_shivani_kohli	Shivani Kohli	shivani_kohli@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_snehali	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_snehali	Snehali	snehali@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_nishita_p	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_nishita_p	Nishita P	nishita_p@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_snehal_patil	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_snehal_patil	Snehal Patil	snehal_patil@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_aarti_sehera	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_aarti_sehera	Aarti Sehera	aarti_sehera@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_aakansha_p	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_aakansha_p	Aakansha P	aakansha_p@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_priyanka_shinde	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_priyanka_shinde	Priyanka Shinde	priyanka_shinde@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_priya_w	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_priya_w	Priya W	priya_w@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_heena_t	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_heena_t	Heena T	heena_t@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_rohini_j	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_rohini_j	Rohini J	rohini_j@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_purva_p	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_purva_p	Purva P	purva_p@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_sneha_desai	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_sneha_desai	Sneha Desai	sneha_desai@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_pooja_s	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_pooja_s	Pooja S	pooja_s@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_sonal_bhoyar	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_sonal_bhoyar	Sonal Bhoyar	sonal_bhoyar@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_deepa_shetty	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_deepa_shetty	Deepa Shetty	deepa_shetty@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_sheetal_dhole	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_sheetal_dhole	Sheetal Dhole	sheetal_dhole@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_shardha_omble	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_shardha_omble	Shardha Omble	shardha_omble@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_ritu_m	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_ritu_m	Ritu M	ritu_m@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_mansa_patil	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_mansa_patil	Mansa Patil	mansa_patil@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_jayalaxmi	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_jayalaxmi	Jayalaxmi	jayalaxmi@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_vrushali_p	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_vrushali_p	Vrushali P	vrushali_p@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_purva_bonde	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_purva_bonde	Purva Bonde	purva_bonde@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_priyanka_t	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_priyanka_t	Priyanka T	priyanka_t@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_nidhi_s	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_nidhi_s	Nidhi S	nidhi_s@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_deepika_n	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_deepika_n	Deepika N	deepika_n@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
reg_wvpl_pankti_p	t_wvpl_2026	e1791279154035-vb_women_open-0	usr_pankti_p	Pankti P	pankti_p@wvpl.io	approved	\N	2026-10-06 09:55:40.640589+00	\N	\N	\N	\N	\N	paid	cash
\.


--
-- Data for Name: support_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.support_requests (id, name, email, organization, message, status, created_at) FROM stdin;
9c761f42-0488-4d06-a495-85b8882d34d5	Requester 1	requester_1@external.com	Smash Club Association	Interested in scheduling inter-district leagues on MatchPoint.	resolved	2026-05-28 12:45:18+00
69f46d65-81a6-497c-ad51-68ff62c891e8	Requester 2	requester_2@external.com	Youth Badminton School	Seeking partner integration terms for junior state tournaments.	resolved	2026-05-11 12:45:18+00
dca85483-5dd2-4585-bffc-4c81c874eb38	Requester 3	requester_3@external.com	Individual Player	Having trouble recovering my registration confirmation code.	resolved	2026-05-24 12:45:18+00
883eb14f-aec8-4d86-a45f-f71e19805d39	Requester 4	requester_4@external.com	District Association Coordinator	How do we request custom custom-sized tournaments with 64 slots?	resolved	2026-05-30 12:45:18+00
a0fe4b32-48c0-465e-86ac-ca5521c127a8	Requester 5	requester_5@external.com	Smash Club Association	Interested in scheduling inter-district leagues on MatchPoint.	resolved	2026-05-10 12:45:18+00
545bedb1-1515-4d35-9188-f50930ecc78f	Requester 6	requester_6@external.com	Youth Badminton School	Seeking partner integration terms for junior state tournaments.	resolved	2026-05-10 12:45:18+00
9e6b6d71-b134-4a8b-977a-d47ba56a60fe	Requester 7	requester_7@external.com	Individual Player	Having trouble recovering my registration confirmation code.	resolved	2026-05-15 12:45:18+00
9c7d26bf-9419-4fa5-a85e-7f2b077c0439	Requester 8	requester_8@external.com	District Association Coordinator	How do we request custom custom-sized tournaments with 64 slots?	resolved	2026-05-19 12:45:18+00
2c53957d-9912-47ee-8559-6cbf2d35c722	Requester 9	requester_9@external.com	Smash Club Association	Interested in scheduling inter-district leagues on MatchPoint.	resolved	2026-05-07 12:45:18+00
7f078345-9e70-4448-ba6d-1d4997fd42a2	Requester 10	requester_10@external.com	Youth Badminton School	Seeking partner integration terms for junior state tournaments.	resolved	2026-05-22 12:45:18+00
8b33ecab-1809-45c7-8ff1-322df6171259	Requester 11	requester_11@external.com	Individual Player	Having trouble recovering my registration confirmation code.	open	2026-05-17 12:45:18+00
cbc3db3d-9bf1-47f9-aef0-77c05b764b56	Requester 12	requester_12@external.com	District Association Coordinator	How do we request custom custom-sized tournaments with 64 slots?	open	2026-05-28 12:45:18+00
4a49890e-231d-493b-b97b-c86a66da1878	Requester 13	requester_13@external.com	Smash Club Association	Interested in scheduling inter-district leagues on MatchPoint.	open	2026-05-25 12:45:18+00
4f687137-5d22-485e-ba34-d6cbc5e1cbc1	Requester 14	requester_14@external.com	Youth Badminton School	Seeking partner integration terms for junior state tournaments.	open	2026-05-19 12:45:18+00
0ddd0ae5-e97e-403d-99fd-16bc09b6291c	Requester 15	requester_15@external.com	Individual Player	Having trouble recovering my registration confirmation code.	open	2026-05-23 12:45:18+00
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teams (id, name, tournament_id, logo_color, captain_id, players) FROM stdin;
team_smashers	Smashers	t_7pd_vpl_s2	#DC2626	\N	{"Tarun Jha","Pradyumna Juikar","Sushant Mane","Anand Kulkarni","Yogesh M","Ranjit Savant","Vikas Paliwal","Anup Chudiwal","Shivraj Harale"}
team_spikers	Spikers	t_7pd_vpl_s2	#2563EB	\N	{"Prashant Omble","Sagar Vekanjkar","Nilesh Gaikwad","Shivraj Salve","Harsh Munot","Sibendra Singh","Vinay Mahadik","Himanshu Rajpali"}
team_servers	Servers	t_7pd_vpl_s2	#059669	\N	{"Rohit Kashyap","Rudra Pathak",Abie,Neeraj,"Tushar Lokhande","Niranjan Nande","Suyash M Harkare","C.kishor Ladekar","Onkar Jagtap"}
team_netbreakers	Netbreakers	t_7pd_vpl_s2	#7C3AED	\N	{"Asif Tamboli","Amit Chougule","Vinod Mulik","Vinod Digole","Rakesh Rane","Shreyas Mohite","Yogesh Jadhav","Kavish Gianani"}
team_gamechangers	Gamechangers	t_7pd_vpl_s2	#EA580C	\N	{"Vaijnath Pawar","Akshay Tamane","Pandurang Biradar","Yash Bhame","Bharat Patil","Vaibhav Gunjal","Rahul Pawar","Dr Amit R M"}
team_blockbusters	Blockbusters	t_7pd_vpl_s2	#0284C7	\N	{"Sachin Kable","Pankaj Sehra","Shailesh Sapate","Harshit Upadhyay","Ajit Sarwale","Mahesh Dhole","Ashwin Sutar","Manish Mishra","Jayesh Deore"}
team_wvpl_blazers	Blazers	t_wvpl_2026	#EA580C	\N	{"Neha S","Pooja Kable","Urmila D","Swati Bhange","Dr. Archana","Pratima Patil","Shivani Kohli",Snehali}
team_wvpl_strikers	Strikers	t_wvpl_2026	#0284C7	\N	{"Nishita P","Snehal Patil","Aarti Sehera","Aakansha P","Priyanka Shinde","Priya W","Heena T","Rohini J"}
team_wvpl_aces	Aces	t_wvpl_2026	#0D9488	\N	{"Purva P","Sneha Desai","Pooja S","Sonal Bhoyar","Deepa Shetty","Sheetal Dhole","Shardha Omble","Ritu M"}
team_wvpl_legends	Legends	t_wvpl_2026	#831843	\N	{"Mansa Patil",Jayalaxmi,"Vrushali P","Purva Bonde","Priyanka T","Nidhi S","Deepika N","Pankti P"}
\.


--
-- Data for Name: tournament_certificates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tournament_certificates (id, tournament_id, title, template_type, signature_data, border_color, created_at) FROM stdin;
\.


--
-- Data for Name: tournament_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tournament_events (id, tournament_id, master_event_id, entry_limit, format, scoring_format, registrations_count, entry_fee, created_at, gender_restriction, age_limit, age_restriction_type, event_type, gender, age_category, min_age, max_age, sport) FROM stdin;
e1791279119394-vb_men_open-0	t_7pd_vpl_s2	vb_men_open	54	league	25-point-best-of-3	51	300.00	2026-10-06 09:31:59.435347+00	open	\N	max	\N	\N	\N	\N	\N	volleyball
e1791279154035-vb_women_open-0	t_wvpl_2026	vb_women_open	32	league	25-point-best-of-3	32	200.00	2026-10-06 09:32:34.050156+00	open	\N	max	\N	\N	\N	\N	\N	volleyball
\.


--
-- Data for Name: tournament_feedback; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tournament_feedback (id, tournament_id, user_id, user_name, feedback_type, message, created_at) FROM stdin;
\.


--
-- Data for Name: tournament_media; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tournament_media (id, tournament_id, uploaded_by, file_url, caption, media_type, created_at, match_id) FROM stdin;
media-8dc2017a	t_7pd_vpl_s2	usr_admin_1	https://www.youtube.com/watch?v=5_udZLcJEHs	Smashers vs Spikers	video	2026-10-07 07:38:55.952687+00	m-upload-1791296696451-1
media-48ef4608	t_7pd_vpl_s2	usr_admin_1	https://www.youtube.com/watch?v=m7WZNiDj9CA	\N	video	2026-10-07 09:38:04.815413+00	m-upload-1791296696451-1
\.


--
-- Data for Name: tournaments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tournaments (id, name, slug, description, location, banner, start_date, end_date, type, status, created_by, team_size_limit, team_tie_events, team_tie_configs, bonus_point_margin, bonus_point_value, age_cutoff_date, withdraw_date, admins, payment_options, created_at, collects_fees, entry_fee, currency, stripe_account_id, platform_fee_percentage, sport) FROM stdin;
t_wvpl_2026	WVPL 2026	wvpl-2026	WVPL 2026 - Women's Volleyball Premier League. Play, Compete, Support, Empower.	7PD Sports Complex, Pune	/tournaments/wvpl/poster.jpg	2026-10-10	2026-10-18	team	live	usr_admin_1	8	{vb_women_league}	[{"name": "vb_women_league", "count": 1, "event_id": "vb_women_league"}]	5	1	\N	\N	{}	[{"details": {"payment_link": ""}, "enabled": false, "provider": "razorpay"}, {"details": null, "enabled": true, "provider": "mock"}]	2026-10-05 20:25:05.686579+00	t	200.00	INR	\N	2.00	volleyball
t_7pd_vpl_s2	7PD VPL Season 2	7pd-vpl-season-2	7PD VPL Season 2 - Men's Volleyball Tournament. More Than a Game: Unite, Play, Thrive.	7PD Sports Arena, Pune	/tournaments/7pd-vpl/poster.jpg	2026-10-10	2026-10-18	team	live	usr_admin_1	9	{vb_men_league}	[{"name": "vb_men_league", "count": 1, "event_id": "vb_men_league"}]	5	1	\N	\N	{}	[{"details": {"payment_link": ""}, "enabled": false, "provider": "razorpay"}, {"details": null, "enabled": true, "provider": "mock"}]	2026-10-05 20:24:54.838884+00	t	300.00	INR	\N	2.00	volleyball
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transactions (id, registration_id, tournament_id, amount, platform_fee, currency, status, stripe_session_id, stripe_charge_id, created_at) FROM stdin;
\.


--
-- Data for Name: user_logins; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_logins (id, user_id, login_time, ip_address, user_agent, status) FROM stdin;
9a83f68b-f1df-4e57-a549-a674b8201afb	usr_admin_1	2026-10-06 10:08:51.688887+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
5b85a06a-a68d-4ecb-b76f-401733ad1c5a	usr_umpire_1	2026-10-06 05:54:35.343975+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	success
04edafb9-c925-4c95-9af5-4af12f6106fb	usr_umpire_1	2026-10-07 09:35:28.019428+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
d465a550-a2fb-4f73-9212-329dbc9c2557	sysadmin1	2026-10-06 07:29:17.65973+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	success
77ff982e-c64a-4fc8-bedc-192065e5e2db	usr_admin_1	2026-10-06 08:58:29.59829+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
7d0430f1-918d-4554-89bd-8070b034f2af	usr_admin_1	2026-10-07 09:35:38.742463+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
846bffbd-f3e3-4ee8-ac30-497674d37bca	usr_admin_1	2026-10-07 11:47:32.69348+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
8f155c66-fa51-467e-92f0-34b515909adf	usr_umpire_1	2026-10-07 11:48:50.856117+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
31da79bc-c46e-4300-bdd3-447aa7862341	usr_umpire_1	2026-10-07 11:50:08.702138+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
31a33ec6-1826-4cd0-a805-82c0cc288e02	usr_umpire_1	2026-10-07 06:13:32.891149+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
c7457228-182e-46fd-975b-e6ae75917a68	sysadmin1	2026-10-07 09:47:43.876413+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
2e8f4704-67cf-47c0-ae99-89539fc57008	usr_admin_1	2026-10-06 05:56:16.359108+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	success
ce40587b-2681-4885-87d4-be8e5653d17e	sysadmin1	2026-10-06 09:22:14.19711+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
2bc168c4-0b0c-43b4-b49b-17c2c6eb67e5	sysadmin1	2026-10-07 09:48:44.561176+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
f96bfa84-c587-454e-a0cc-439b2b1d4062	usr_admin_1	2026-10-07 11:49:13.779767+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
7cf604ca-7c8e-4db8-8a5b-de1dcab5fd4f	usr_umpire_1	2026-10-06 06:11:02.239528+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	success
881929ac-3ef5-43e7-9695-fa505872f97c	usr_admin_1	2026-10-06 09:30:55.210809+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
cfad6b65-d7f5-4616-9c90-90d42be16b43	usr_admin_1	2026-10-07 06:16:25.599888+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
fd2fee48-b749-495c-97f6-29ed8c73c683	usr_umpire_1	2026-10-07 09:49:17.430994+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
d069bd6d-73f4-4606-951a-ee004bfe3760	sysadmin1	2026-10-07 07:21:32.708511+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
c5afd1a5-715d-4766-85e4-47a922ed176b	usr_admin_1	2026-10-07 09:57:52.336414+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
a66ad9a4-5493-4330-98f8-e0cdf025d531	usr_admin_1	2026-10-06 06:17:15.582422+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	success
73a02004-bfb8-4419-8f26-0fddf372aaeb	usr_admin_2	2026-10-06 09:34:20.849925+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
47ecb2a9-2f33-49d8-ac80-8b9e1e1e5b39	sysadmin1	2026-10-06 09:34:33.900462+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
a9ae077a-06fe-456c-b038-2719d263f532	sysadmin1	2026-10-06 06:20:49.648043+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	success
057ee835-fe6b-4f5f-83cf-00a263f97303	usr_admin_1	2026-10-06 06:22:52.462965+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	success
b007cfa9-37ee-4c26-996c-b03cb4add83e	usr_admin_1	2026-10-06 09:38:39.493102+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
e4af003f-e096-4b8b-a617-71b00e23666b	usr_admin_1	2026-10-07 07:36:48.291526+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
cff73393-7b17-47d0-8e73-03d4ab0d2af2	usr_umpire_1	2026-10-07 10:02:14.909091+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
696291c9-e6a6-4eb5-ab8e-5232d3d2ebcf	usr_admin_1	2026-10-06 07:19:44.527326+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	success
660e5a4d-c681-4e86-a7d4-fd4a28fda1c6	usr_admin_1	2026-10-07 09:08:04.175828+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
37d89131-19e6-4a80-94b9-8ff528cc3ca6	usr_admin_1	2026-10-07 11:44:35.775763+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
1591f28c-88c8-490f-a413-d153e096ae8b	usr_umpire_1	2026-10-07 09:11:01.358138+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
439eba22-c78d-4923-80e4-89b3b68a1d11	usr_umpire_1	2026-10-06 07:24:40.550543+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	success
0acd05bc-895d-4b6b-b021-3febcd44de93	usr_umpire_1	2026-10-06 07:26:40.626635+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	success
51a7a3da-c7df-4dec-8924-68d501021fcb	usr_umpire_1	2026-10-07 11:45:45.181129+00	172.19.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	success
07784d03-e3a5-436b-9346-39a8ffbf2fd6	usr_admin_1	2026-10-05 17:53:15.923446+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	success
824ad65d-7e82-4805-99eb-487821a7ab30	usr_umpire_1	2026-10-05 17:57:10.352546+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	success
7648f53d-4c04-4fb7-8f6b-eb38c26b364d	usr_admin_1	2026-10-05 18:32:04.587594+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	success
bccc9bb2-7be3-4f60-a78b-8a4f55a34b6e	usr_umpire_1	2026-10-05 18:59:52.691113+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	success
75fb0172-867d-4dcc-ba46-d7d3686e4b44	usr_admin_1	2026-10-05 19:02:47.86873+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	success
3d1e1d70-fbe1-40de-921d-e0ddc14d3c31	usr_umpire_1	2026-10-05 19:09:00.797565+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	success
6518db0c-e043-4ae1-bba2-bd622412b371	usr_umpire_1	2026-10-05 20:29:37.063857+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	success
e91a2d89-dd57-4101-8c1c-b8c1d4600e7f	usr_admin_1	2026-10-05 20:32:24.85052+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	success
844ad838-6cef-4da7-ad6c-d505da9f1c57	usr_umpire_1	2026-10-05 20:32:50.254258+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	success
7af49c14-325f-4e74-9d1a-5a4775c683d1	usr_admin_1	2026-10-05 20:34:12.446836+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	success
\.


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: database_restore_requests database_restore_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.database_restore_requests
    ADD CONSTRAINT database_restore_requests_pkey PRIMARY KEY (id);


--
-- Name: events_master events_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events_master
    ADD CONSTRAINT events_master_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_flag_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_flag_key_key UNIQUE (flag_key);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: match_comments match_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_comments
    ADD CONSTRAINT match_comments_pkey PRIMARY KEY (id);


--
-- Name: match_history match_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_history
    ADD CONSTRAINT match_history_pkey PRIMARY KEY (id);


--
-- Name: match_polls match_polls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_polls
    ADD CONSTRAINT match_polls_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: payment_orders payment_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_pkey PRIMARY KEY (id);


--
-- Name: payment_orders payment_orders_razorpay_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_razorpay_order_id_key UNIQUE (razorpay_order_id);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_razorpay_payment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_razorpay_payment_id_key UNIQUE (razorpay_payment_id);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: registrations registrations_event_id_player_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_event_id_player_id_key UNIQUE (event_id, player_id);


--
-- Name: registrations registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_pkey PRIMARY KEY (id);


--
-- Name: support_requests support_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_requests
    ADD CONSTRAINT support_requests_pkey PRIMARY KEY (id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: tournament_certificates tournament_certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_certificates
    ADD CONSTRAINT tournament_certificates_pkey PRIMARY KEY (id);


--
-- Name: tournament_certificates tournament_certificates_tournament_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_certificates
    ADD CONSTRAINT tournament_certificates_tournament_id_key UNIQUE (tournament_id);


--
-- Name: tournament_events tournament_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_events
    ADD CONSTRAINT tournament_events_pkey PRIMARY KEY (id);


--
-- Name: tournament_feedback tournament_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_feedback
    ADD CONSTRAINT tournament_feedback_pkey PRIMARY KEY (id);


--
-- Name: tournament_media tournament_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_media
    ADD CONSTRAINT tournament_media_pkey PRIMARY KEY (id);


--
-- Name: tournaments tournaments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_pkey PRIMARY KEY (id);


--
-- Name: tournaments tournaments_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_slug_key UNIQUE (slug);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_stripe_session_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_stripe_session_id_key UNIQUE (stripe_session_id);


--
-- Name: user_logins user_logins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_logins
    ADD CONSTRAINT user_logins_pkey PRIMARY KEY (id);


--
-- Name: idx_activity_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_logs_created_at ON public.activity_logs USING btree (created_at);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_match_comments_match; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_match_comments_match ON public.match_comments USING btree (match_id);


--
-- Name: idx_match_comments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_match_comments_user_id ON public.match_comments USING btree (user_id);


--
-- Name: idx_match_history_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_match_history_event ON public.match_history USING btree (event_id);


--
-- Name: idx_match_history_match; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_match_history_match ON public.match_history USING btree (match_id);


--
-- Name: idx_match_history_tournament; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_match_history_tournament ON public.match_history USING btree (tournament_id);


--
-- Name: idx_matches_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_event_id ON public.matches USING btree (event_id);


--
-- Name: idx_matches_p1_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_p1_id ON public.matches USING btree (player1_id);


--
-- Name: idx_matches_p2_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_p2_id ON public.matches USING btree (player2_id);


--
-- Name: idx_matches_player1_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_player1_id ON public.matches USING btree (player1_id);


--
-- Name: idx_matches_player2_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_player2_id ON public.matches USING btree (player2_id);


--
-- Name: idx_matches_sport; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_sport ON public.matches USING btree (sport);


--
-- Name: idx_matches_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_status ON public.matches USING btree (status);


--
-- Name: idx_matches_tour_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_tour_id ON public.matches USING btree (tournament_id);


--
-- Name: idx_matches_tournament_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_tournament_id ON public.matches USING btree (tournament_id);


--
-- Name: idx_matches_umpire_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_umpire_id ON public.matches USING btree (umpire_id);


--
-- Name: idx_matches_winner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_winner_id ON public.matches USING btree (winner_id);


--
-- Name: idx_password_resets_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_resets_email ON public.password_resets USING btree (email);


--
-- Name: idx_payment_orders_razorpay_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_orders_razorpay_order_id ON public.payment_orders USING btree (razorpay_order_id);


--
-- Name: idx_payment_orders_registration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_orders_registration_id ON public.payment_orders USING btree (registration_id);


--
-- Name: idx_payment_orders_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_orders_user_id ON public.payment_orders USING btree (user_id);


--
-- Name: idx_payment_transactions_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_order_id ON public.payment_transactions USING btree (order_id);


--
-- Name: idx_profiles_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);


--
-- Name: idx_registrations_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registrations_event_id ON public.registrations USING btree (event_id);


--
-- Name: idx_registrations_player_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registrations_player_id ON public.registrations USING btree (player_id);


--
-- Name: idx_registrations_tour_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registrations_tour_id ON public.registrations USING btree (tournament_id);


--
-- Name: idx_registrations_tournament_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registrations_tournament_id ON public.registrations USING btree (tournament_id);


--
-- Name: idx_teams_captain_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_captain_id ON public.teams USING btree (captain_id);


--
-- Name: idx_teams_tour_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_tour_id ON public.teams USING btree (tournament_id);


--
-- Name: idx_tournament_events_master_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tournament_events_master_event ON public.tournament_events USING btree (master_event_id);


--
-- Name: idx_tournament_events_tour_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tournament_events_tour_id ON public.tournament_events USING btree (tournament_id);


--
-- Name: idx_tournament_feedback_tournament; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tournament_feedback_tournament ON public.tournament_feedback USING btree (tournament_id);


--
-- Name: idx_tournament_media_tour; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tournament_media_tour ON public.tournament_media USING btree (tournament_id);


--
-- Name: idx_tournament_media_uploaded_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tournament_media_uploaded_by ON public.tournament_media USING btree (uploaded_by);


--
-- Name: idx_tournaments_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tournaments_created_by ON public.tournaments USING btree (created_by);


--
-- Name: idx_tournaments_sport; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tournaments_sport ON public.tournaments USING btree (sport);


--
-- Name: idx_tournaments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tournaments_status ON public.tournaments USING btree (status);


--
-- Name: idx_transactions_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_session ON public.transactions USING btree (stripe_session_id);


--
-- Name: idx_user_logins_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_logins_time ON public.user_logins USING btree (login_time);


--
-- Name: idx_user_logins_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_logins_user_id ON public.user_logins USING btree (user_id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: match_comments match_comments_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_comments
    ADD CONSTRAINT match_comments_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: match_comments match_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_comments
    ADD CONSTRAINT match_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: match_history match_history_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_history
    ADD CONSTRAINT match_history_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.tournament_events(id) ON DELETE CASCADE;


--
-- Name: match_history match_history_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_history
    ADD CONSTRAINT match_history_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: match_history match_history_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_history
    ADD CONSTRAINT match_history_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;


--
-- Name: match_polls match_polls_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_polls
    ADD CONSTRAINT match_polls_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: matches matches_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.tournament_events(id) ON DELETE CASCADE;


--
-- Name: matches matches_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;


--
-- Name: matches matches_umpire_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_umpire_id_fkey FOREIGN KEY (umpire_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: payment_orders payment_orders_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.registrations(id) ON DELETE CASCADE;


--
-- Name: payment_orders payment_orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: payment_transactions payment_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.payment_orders(id) ON DELETE CASCADE;


--
-- Name: registrations registrations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.tournament_events(id) ON DELETE CASCADE;


--
-- Name: registrations registrations_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: registrations registrations_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;


--
-- Name: teams teams_captain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_captain_id_fkey FOREIGN KEY (captain_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: teams teams_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;


--
-- Name: tournament_certificates tournament_certificates_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_certificates
    ADD CONSTRAINT tournament_certificates_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;


--
-- Name: tournament_events tournament_events_master_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_events
    ADD CONSTRAINT tournament_events_master_event_id_fkey FOREIGN KEY (master_event_id) REFERENCES public.events_master(id) ON DELETE RESTRICT;


--
-- Name: tournament_events tournament_events_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_events
    ADD CONSTRAINT tournament_events_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;


--
-- Name: tournament_feedback tournament_feedback_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_feedback
    ADD CONSTRAINT tournament_feedback_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;


--
-- Name: tournament_media tournament_media_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_media
    ADD CONSTRAINT tournament_media_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;


--
-- Name: tournament_media tournament_media_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_media
    ADD CONSTRAINT tournament_media_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: tournaments tournaments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: user_logins user_logins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_logins
    ADD CONSTRAINT user_logins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict OboyUMVXKWtE91zJV5sk99LsJgg7kH0VFMqHRJpjlJfKvWIyzji2ui2IvmbTrZL

