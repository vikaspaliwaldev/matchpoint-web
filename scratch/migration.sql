BEGIN;

UPDATE tournaments 
SET created_by = 'usr_admin_1' 
WHERE id IN ('t_7pd_vpl_s2', 't_wvpl_2026');


DELETE FROM match_history WHERE tournament_id NOT IN ('t_7pd_vpl_s2', 't_wvpl_2026');
DELETE FROM match_comments WHERE match_id IN (SELECT id FROM matches WHERE tournament_id NOT IN ('t_7pd_vpl_s2', 't_wvpl_2026'));
DELETE FROM matches WHERE tournament_id NOT IN ('t_7pd_vpl_s2', 't_wvpl_2026');
DELETE FROM tournament_certificates WHERE tournament_id NOT IN ('t_7pd_vpl_s2', 't_wvpl_2026');
DELETE FROM tournament_feedback WHERE tournament_id NOT IN ('t_7pd_vpl_s2', 't_wvpl_2026');
DELETE FROM tournament_media WHERE tournament_id NOT IN ('t_7pd_vpl_s2', 't_wvpl_2026');
DELETE FROM teams WHERE tournament_id NOT IN ('t_7pd_vpl_s2', 't_wvpl_2026');
DELETE FROM payment_orders WHERE registration_id IN (SELECT id FROM registrations WHERE tournament_id NOT IN ('t_7pd_vpl_s2', 't_wvpl_2026'));
DELETE FROM registrations WHERE tournament_id NOT IN ('t_7pd_vpl_s2', 't_wvpl_2026');
DELETE FROM tournament_events WHERE tournament_id NOT IN ('t_7pd_vpl_s2', 't_wvpl_2026');
DELETE FROM tournaments WHERE id NOT IN ('t_7pd_vpl_s2', 't_wvpl_2026');


DELETE FROM audit_logs WHERE user_id NOT IN ('sysadmin1', 'usr_admin_1', 'usr_admin_2', 'usr_umpire_1');
DELETE FROM user_logins WHERE user_id NOT IN ('sysadmin1', 'usr_admin_1', 'usr_admin_2', 'usr_umpire_1');


DELETE FROM profiles WHERE id NOT IN ('sysadmin1', 'usr_admin_1', 'usr_admin_2', 'usr_umpire_1');


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_tarun_jha', 'tarun_jha@7pdvpl.io', 'Tarun Jha', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_pradyumna_juikar', 'pradyumna_juikar@7pdvpl.io', 'Pradyumna Juikar', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_sushant_mane', 'sushant_mane@7pdvpl.io', 'Sushant Mane', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_anand_kulkarni', 'anand_kulkarni@7pdvpl.io', 'Anand Kulkarni', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_yogesh_m', 'yogesh_m@7pdvpl.io', 'Yogesh M', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_ranjit_savant', 'ranjit_savant@7pdvpl.io', 'Ranjit Savant', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_vikas_paliwal', 'vikas_paliwal@7pdvpl.io', 'Vikas Paliwal', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_anup_chudiwal', 'anup_chudiwal@7pdvpl.io', 'Anup Chudiwal', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_shivraj_harale', 'shivraj_harale@7pdvpl.io', 'Shivraj Harale', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_prashant_omble', 'prashant_omble@7pdvpl.io', 'Prashant Omble', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_sagar_vekanjkar', 'sagar_vekanjkar@7pdvpl.io', 'Sagar Vekanjkar', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_nilesh_gaikwad', 'nilesh_gaikwad@7pdvpl.io', 'Nilesh Gaikwad', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_shivraj_salve', 'shivraj_salve@7pdvpl.io', 'Shivraj Salve', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_harsh_munot', 'harsh_munot@7pdvpl.io', 'Harsh Munot', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_sibendra_singh', 'sibendra_singh@7pdvpl.io', 'Sibendra Singh', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_vinay_mahadik', 'vinay_mahadik@7pdvpl.io', 'Vinay Mahadik', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_himanshu_rajpali', 'himanshu_rajpali@7pdvpl.io', 'Himanshu Rajpali', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_rohit_kashyap', 'rohit_kashyap@7pdvpl.io', 'Rohit Kashyap', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_rudra_pathak', 'rudra_pathak@7pdvpl.io', 'Rudra Pathak', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_abie', 'abie@7pdvpl.io', 'Abie', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_neeraj', 'neeraj@7pdvpl.io', 'Neeraj', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_tushar_lokhande', 'tushar_lokhande@7pdvpl.io', 'Tushar Lokhande', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_niranjan_nande', 'niranjan_nande@7pdvpl.io', 'Niranjan Nande', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_suyash_m_harkare', 'suyash_m_harkare@7pdvpl.io', 'Suyash M Harkare', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_c_kishor_ladekar', 'c_kishor_ladekar@7pdvpl.io', 'C.kishor Ladekar', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_onkar_jagtap', 'onkar_jagtap@7pdvpl.io', 'Onkar Jagtap', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_asif_tamboli', 'asif_tamboli@7pdvpl.io', 'Asif Tamboli', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_amit_chougule', 'amit_chougule@7pdvpl.io', 'Amit Chougule', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_vinod_mulik', 'vinod_mulik@7pdvpl.io', 'Vinod Mulik', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_vinod_digole', 'vinod_digole@7pdvpl.io', 'Vinod Digole', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_rakesh_rane', 'rakesh_rane@7pdvpl.io', 'Rakesh Rane', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_shreyas_mohite', 'shreyas_mohite@7pdvpl.io', 'Shreyas Mohite', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_yogesh_jadhav', 'yogesh_jadhav@7pdvpl.io', 'Yogesh Jadhav', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_kavish_gianani', 'kavish_gianani@7pdvpl.io', 'Kavish Gianani', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_vaijnath_pawar', 'vaijnath_pawar@7pdvpl.io', 'Vaijnath Pawar', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_akshay_tamane', 'akshay_tamane@7pdvpl.io', 'Akshay Tamane', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_pandurang_biradar', 'pandurang_biradar@7pdvpl.io', 'Pandurang Biradar', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_yash_bhame', 'yash_bhame@7pdvpl.io', 'Yash Bhame', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_bharat_patil', 'bharat_patil@7pdvpl.io', 'Bharat Patil', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_vaibhav_gunjal', 'vaibhav_gunjal@7pdvpl.io', 'Vaibhav Gunjal', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_rahul_pawar', 'rahul_pawar@7pdvpl.io', 'Rahul Pawar', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_dr_amit_r_m', 'dr_amit_r_m@7pdvpl.io', 'Dr Amit R M', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_sachin_kable', 'sachin_kable@7pdvpl.io', 'Sachin Kable', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_pankaj_sehra', 'pankaj_sehra@7pdvpl.io', 'Pankaj Sehra', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_shailesh_sapate', 'shailesh_sapate@7pdvpl.io', 'Shailesh Sapate', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_harshit_upadhyay', 'harshit_upadhyay@7pdvpl.io', 'Harshit Upadhyay', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_ajit_sarwale', 'ajit_sarwale@7pdvpl.io', 'Ajit Sarwale', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_mahesh_dhole', 'mahesh_dhole@7pdvpl.io', 'Mahesh Dhole', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_ashwin_sutar', 'ashwin_sutar@7pdvpl.io', 'Ashwin Sutar', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_manish_mishra', 'manish_mishra@7pdvpl.io', 'Manish Mishra', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_jayesh_deore', 'jayesh_deore@7pdvpl.io', 'Jayesh Deore', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_neha_s', 'neha_s@wvpl.io', 'Neha S', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_pooja_kable', 'pooja_kable@wvpl.io', 'Pooja Kable', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_urmila_d', 'urmila_d@wvpl.io', 'Urmila D', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_swati_bhange', 'swati_bhange@wvpl.io', 'Swati Bhange', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_dr_archana', 'dr_archana@wvpl.io', 'Dr. Archana', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_pratima_patil', 'pratima_patil@wvpl.io', 'Pratima Patil', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_shivani_kohli', 'shivani_kohli@wvpl.io', 'Shivani Kohli', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_snehali', 'snehali@wvpl.io', 'Snehali', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_nishita_p', 'nishita_p@wvpl.io', 'Nishita P', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_snehal_patil', 'snehal_patil@wvpl.io', 'Snehal Patil', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_aarti_sehera', 'aarti_sehera@wvpl.io', 'Aarti Sehera', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_aakansha_p', 'aakansha_p@wvpl.io', 'Aakansha P', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_priyanka_shinde', 'priyanka_shinde@wvpl.io', 'Priyanka Shinde', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_priya_w', 'priya_w@wvpl.io', 'Priya W', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_heena_t', 'heena_t@wvpl.io', 'Heena T', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_rohini_j', 'rohini_j@wvpl.io', 'Rohini J', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_purva_p', 'purva_p@wvpl.io', 'Purva P', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_sneha_desai', 'sneha_desai@wvpl.io', 'Sneha Desai', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_pooja_s', 'pooja_s@wvpl.io', 'Pooja S', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_sonal_bhoyar', 'sonal_bhoyar@wvpl.io', 'Sonal Bhoyar', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_deepa_shetty', 'deepa_shetty@wvpl.io', 'Deepa Shetty', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_sheetal_dhole', 'sheetal_dhole@wvpl.io', 'Sheetal Dhole', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_shardha_omble', 'shardha_omble@wvpl.io', 'Shardha Omble', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_ritu_m', 'ritu_m@wvpl.io', 'Ritu M', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_mansa_patil', 'mansa_patil@wvpl.io', 'Mansa Patil', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_jayalaxmi', 'jayalaxmi@wvpl.io', 'Jayalaxmi', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_vrushali_p', 'vrushali_p@wvpl.io', 'Vrushali P', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_purva_bonde', 'purva_bonde@wvpl.io', 'Purva Bonde', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_priyanka_t', 'priyanka_t@wvpl.io', 'Priyanka T', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_nidhi_s', 'nidhi_s@wvpl.io', 'Nidhi S', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_deepika_n', 'deepika_n@wvpl.io', 'Deepika N', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('usr_pankti_p', 'pankti_p@wvpl.io', 'Pankti P', '{player}', '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_tarun_jha', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_tarun_jha', 'Tarun Jha', 'tarun_jha@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_tarun_jha', 'reg_7pd_tarun_jha', 300.00, 'INR', 'order_manual_7pd_tarun_jha', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_pradyumna_juikar', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_pradyumna_juikar', 'Pradyumna Juikar', 'pradyumna_juikar@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_pradyumna_juikar', 'reg_7pd_pradyumna_juikar', 300.00, 'INR', 'order_manual_7pd_pradyumna_juikar', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_sushant_mane', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_sushant_mane', 'Sushant Mane', 'sushant_mane@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_sushant_mane', 'reg_7pd_sushant_mane', 300.00, 'INR', 'order_manual_7pd_sushant_mane', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_anand_kulkarni', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_anand_kulkarni', 'Anand Kulkarni', 'anand_kulkarni@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_anand_kulkarni', 'reg_7pd_anand_kulkarni', 300.00, 'INR', 'order_manual_7pd_anand_kulkarni', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_yogesh_m', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_yogesh_m', 'Yogesh M', 'yogesh_m@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_yogesh_m', 'reg_7pd_yogesh_m', 300.00, 'INR', 'order_manual_7pd_yogesh_m', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_ranjit_savant', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_ranjit_savant', 'Ranjit Savant', 'ranjit_savant@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_ranjit_savant', 'reg_7pd_ranjit_savant', 300.00, 'INR', 'order_manual_7pd_ranjit_savant', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_vikas_paliwal', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_vikas_paliwal', 'Vikas Paliwal', 'vikas_paliwal@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_vikas_paliwal', 'reg_7pd_vikas_paliwal', 300.00, 'INR', 'order_manual_7pd_vikas_paliwal', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_anup_chudiwal', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_anup_chudiwal', 'Anup Chudiwal', 'anup_chudiwal@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_anup_chudiwal', 'reg_7pd_anup_chudiwal', 300.00, 'INR', 'order_manual_7pd_anup_chudiwal', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_shivraj_harale', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_shivraj_harale', 'Shivraj Harale', 'shivraj_harale@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_shivraj_harale', 'reg_7pd_shivraj_harale', 300.00, 'INR', 'order_manual_7pd_shivraj_harale', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_prashant_omble', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_prashant_omble', 'Prashant Omble', 'prashant_omble@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_prashant_omble', 'reg_7pd_prashant_omble', 300.00, 'INR', 'order_manual_7pd_prashant_omble', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_sagar_vekanjkar', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_sagar_vekanjkar', 'Sagar Vekanjkar', 'sagar_vekanjkar@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_sagar_vekanjkar', 'reg_7pd_sagar_vekanjkar', 300.00, 'INR', 'order_manual_7pd_sagar_vekanjkar', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_nilesh_gaikwad', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_nilesh_gaikwad', 'Nilesh Gaikwad', 'nilesh_gaikwad@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_nilesh_gaikwad', 'reg_7pd_nilesh_gaikwad', 300.00, 'INR', 'order_manual_7pd_nilesh_gaikwad', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_shivraj_salve', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_shivraj_salve', 'Shivraj Salve', 'shivraj_salve@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_shivraj_salve', 'reg_7pd_shivraj_salve', 300.00, 'INR', 'order_manual_7pd_shivraj_salve', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_harsh_munot', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_harsh_munot', 'Harsh Munot', 'harsh_munot@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_harsh_munot', 'reg_7pd_harsh_munot', 300.00, 'INR', 'order_manual_7pd_harsh_munot', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_sibendra_singh', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_sibendra_singh', 'Sibendra Singh', 'sibendra_singh@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_sibendra_singh', 'reg_7pd_sibendra_singh', 300.00, 'INR', 'order_manual_7pd_sibendra_singh', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_vinay_mahadik', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_vinay_mahadik', 'Vinay Mahadik', 'vinay_mahadik@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_vinay_mahadik', 'reg_7pd_vinay_mahadik', 300.00, 'INR', 'order_manual_7pd_vinay_mahadik', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_himanshu_rajpali', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_himanshu_rajpali', 'Himanshu Rajpali', 'himanshu_rajpali@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_himanshu_rajpali', 'reg_7pd_himanshu_rajpali', 300.00, 'INR', 'order_manual_7pd_himanshu_rajpali', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_rohit_kashyap', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_rohit_kashyap', 'Rohit Kashyap', 'rohit_kashyap@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_rohit_kashyap', 'reg_7pd_rohit_kashyap', 300.00, 'INR', 'order_manual_7pd_rohit_kashyap', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_rudra_pathak', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_rudra_pathak', 'Rudra Pathak', 'rudra_pathak@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_rudra_pathak', 'reg_7pd_rudra_pathak', 300.00, 'INR', 'order_manual_7pd_rudra_pathak', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_abie', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_abie', 'Abie', 'abie@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_abie', 'reg_7pd_abie', 300.00, 'INR', 'order_manual_7pd_abie', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_neeraj', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_neeraj', 'Neeraj', 'neeraj@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_neeraj', 'reg_7pd_neeraj', 300.00, 'INR', 'order_manual_7pd_neeraj', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_tushar_lokhande', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_tushar_lokhande', 'Tushar Lokhande', 'tushar_lokhande@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_tushar_lokhande', 'reg_7pd_tushar_lokhande', 300.00, 'INR', 'order_manual_7pd_tushar_lokhande', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_niranjan_nande', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_niranjan_nande', 'Niranjan Nande', 'niranjan_nande@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_niranjan_nande', 'reg_7pd_niranjan_nande', 300.00, 'INR', 'order_manual_7pd_niranjan_nande', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_suyash_m_harkare', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_suyash_m_harkare', 'Suyash M Harkare', 'suyash_m_harkare@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_suyash_m_harkare', 'reg_7pd_suyash_m_harkare', 300.00, 'INR', 'order_manual_7pd_suyash_m_harkare', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_c_kishor_ladekar', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_c_kishor_ladekar', 'C.kishor Ladekar', 'c_kishor_ladekar@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_c_kishor_ladekar', 'reg_7pd_c_kishor_ladekar', 300.00, 'INR', 'order_manual_7pd_c_kishor_ladekar', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_onkar_jagtap', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_onkar_jagtap', 'Onkar Jagtap', 'onkar_jagtap@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_onkar_jagtap', 'reg_7pd_onkar_jagtap', 300.00, 'INR', 'order_manual_7pd_onkar_jagtap', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_asif_tamboli', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_asif_tamboli', 'Asif Tamboli', 'asif_tamboli@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_asif_tamboli', 'reg_7pd_asif_tamboli', 300.00, 'INR', 'order_manual_7pd_asif_tamboli', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_amit_chougule', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_amit_chougule', 'Amit Chougule', 'amit_chougule@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_amit_chougule', 'reg_7pd_amit_chougule', 300.00, 'INR', 'order_manual_7pd_amit_chougule', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_vinod_mulik', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_vinod_mulik', 'Vinod Mulik', 'vinod_mulik@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_vinod_mulik', 'reg_7pd_vinod_mulik', 300.00, 'INR', 'order_manual_7pd_vinod_mulik', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_vinod_digole', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_vinod_digole', 'Vinod Digole', 'vinod_digole@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_vinod_digole', 'reg_7pd_vinod_digole', 300.00, 'INR', 'order_manual_7pd_vinod_digole', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_rakesh_rane', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_rakesh_rane', 'Rakesh Rane', 'rakesh_rane@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_rakesh_rane', 'reg_7pd_rakesh_rane', 300.00, 'INR', 'order_manual_7pd_rakesh_rane', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_shreyas_mohite', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_shreyas_mohite', 'Shreyas Mohite', 'shreyas_mohite@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_shreyas_mohite', 'reg_7pd_shreyas_mohite', 300.00, 'INR', 'order_manual_7pd_shreyas_mohite', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_yogesh_jadhav', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_yogesh_jadhav', 'Yogesh Jadhav', 'yogesh_jadhav@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_yogesh_jadhav', 'reg_7pd_yogesh_jadhav', 300.00, 'INR', 'order_manual_7pd_yogesh_jadhav', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_kavish_gianani', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_kavish_gianani', 'Kavish Gianani', 'kavish_gianani@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_kavish_gianani', 'reg_7pd_kavish_gianani', 300.00, 'INR', 'order_manual_7pd_kavish_gianani', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_vaijnath_pawar', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_vaijnath_pawar', 'Vaijnath Pawar', 'vaijnath_pawar@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_vaijnath_pawar', 'reg_7pd_vaijnath_pawar', 300.00, 'INR', 'order_manual_7pd_vaijnath_pawar', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_akshay_tamane', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_akshay_tamane', 'Akshay Tamane', 'akshay_tamane@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_akshay_tamane', 'reg_7pd_akshay_tamane', 300.00, 'INR', 'order_manual_7pd_akshay_tamane', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_pandurang_biradar', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_pandurang_biradar', 'Pandurang Biradar', 'pandurang_biradar@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_pandurang_biradar', 'reg_7pd_pandurang_biradar', 300.00, 'INR', 'order_manual_7pd_pandurang_biradar', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_yash_bhame', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_yash_bhame', 'Yash Bhame', 'yash_bhame@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_yash_bhame', 'reg_7pd_yash_bhame', 300.00, 'INR', 'order_manual_7pd_yash_bhame', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_bharat_patil', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_bharat_patil', 'Bharat Patil', 'bharat_patil@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_bharat_patil', 'reg_7pd_bharat_patil', 300.00, 'INR', 'order_manual_7pd_bharat_patil', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_vaibhav_gunjal', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_vaibhav_gunjal', 'Vaibhav Gunjal', 'vaibhav_gunjal@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_vaibhav_gunjal', 'reg_7pd_vaibhav_gunjal', 300.00, 'INR', 'order_manual_7pd_vaibhav_gunjal', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_rahul_pawar', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_rahul_pawar', 'Rahul Pawar', 'rahul_pawar@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_rahul_pawar', 'reg_7pd_rahul_pawar', 300.00, 'INR', 'order_manual_7pd_rahul_pawar', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_dr_amit_r_m', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_dr_amit_r_m', 'Dr Amit R M', 'dr_amit_r_m@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_dr_amit_r_m', 'reg_7pd_dr_amit_r_m', 300.00, 'INR', 'order_manual_7pd_dr_amit_r_m', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_sachin_kable', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_sachin_kable', 'Sachin Kable', 'sachin_kable@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_sachin_kable', 'reg_7pd_sachin_kable', 300.00, 'INR', 'order_manual_7pd_sachin_kable', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_pankaj_sehra', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_pankaj_sehra', 'Pankaj Sehra', 'pankaj_sehra@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_pankaj_sehra', 'reg_7pd_pankaj_sehra', 300.00, 'INR', 'order_manual_7pd_pankaj_sehra', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_shailesh_sapate', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_shailesh_sapate', 'Shailesh Sapate', 'shailesh_sapate@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_shailesh_sapate', 'reg_7pd_shailesh_sapate', 300.00, 'INR', 'order_manual_7pd_shailesh_sapate', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_harshit_upadhyay', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_harshit_upadhyay', 'Harshit Upadhyay', 'harshit_upadhyay@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_harshit_upadhyay', 'reg_7pd_harshit_upadhyay', 300.00, 'INR', 'order_manual_7pd_harshit_upadhyay', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_ajit_sarwale', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_ajit_sarwale', 'Ajit Sarwale', 'ajit_sarwale@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_ajit_sarwale', 'reg_7pd_ajit_sarwale', 300.00, 'INR', 'order_manual_7pd_ajit_sarwale', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_mahesh_dhole', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_mahesh_dhole', 'Mahesh Dhole', 'mahesh_dhole@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_mahesh_dhole', 'reg_7pd_mahesh_dhole', 300.00, 'INR', 'order_manual_7pd_mahesh_dhole', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_ashwin_sutar', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_ashwin_sutar', 'Ashwin Sutar', 'ashwin_sutar@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_ashwin_sutar', 'reg_7pd_ashwin_sutar', 300.00, 'INR', 'order_manual_7pd_ashwin_sutar', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_manish_mishra', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_manish_mishra', 'Manish Mishra', 'manish_mishra@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_manish_mishra', 'reg_7pd_manish_mishra', 300.00, 'INR', 'order_manual_7pd_manish_mishra', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_7pd_jayesh_deore', 't_7pd_vpl_s2', 'e1791279119394-vb_men_open-0', 'usr_jayesh_deore', 'Jayesh Deore', 'jayesh_deore@7pdvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_jayesh_deore', 'reg_7pd_jayesh_deore', 300.00, 'INR', 'order_manual_7pd_jayesh_deore', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_neha_s', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_neha_s', 'Neha S', 'neha_s@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_neha_s', 'reg_wvpl_neha_s', 200.00, 'INR', 'order_manual_wvpl_neha_s', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_pooja_kable', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_pooja_kable', 'Pooja Kable', 'pooja_kable@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_pooja_kable', 'reg_wvpl_pooja_kable', 200.00, 'INR', 'order_manual_wvpl_pooja_kable', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_urmila_d', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_urmila_d', 'Urmila D', 'urmila_d@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_urmila_d', 'reg_wvpl_urmila_d', 200.00, 'INR', 'order_manual_wvpl_urmila_d', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_swati_bhange', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_swati_bhange', 'Swati Bhange', 'swati_bhange@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_swati_bhange', 'reg_wvpl_swati_bhange', 200.00, 'INR', 'order_manual_wvpl_swati_bhange', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_dr_archana', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_dr_archana', 'Dr. Archana', 'dr_archana@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_dr_archana', 'reg_wvpl_dr_archana', 200.00, 'INR', 'order_manual_wvpl_dr_archana', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_pratima_patil', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_pratima_patil', 'Pratima Patil', 'pratima_patil@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_pratima_patil', 'reg_wvpl_pratima_patil', 200.00, 'INR', 'order_manual_wvpl_pratima_patil', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_shivani_kohli', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_shivani_kohli', 'Shivani Kohli', 'shivani_kohli@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_shivani_kohli', 'reg_wvpl_shivani_kohli', 200.00, 'INR', 'order_manual_wvpl_shivani_kohli', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_snehali', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_snehali', 'Snehali', 'snehali@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_snehali', 'reg_wvpl_snehali', 200.00, 'INR', 'order_manual_wvpl_snehali', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_nishita_p', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_nishita_p', 'Nishita P', 'nishita_p@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_nishita_p', 'reg_wvpl_nishita_p', 200.00, 'INR', 'order_manual_wvpl_nishita_p', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_snehal_patil', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_snehal_patil', 'Snehal Patil', 'snehal_patil@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_snehal_patil', 'reg_wvpl_snehal_patil', 200.00, 'INR', 'order_manual_wvpl_snehal_patil', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_aarti_sehera', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_aarti_sehera', 'Aarti Sehera', 'aarti_sehera@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_aarti_sehera', 'reg_wvpl_aarti_sehera', 200.00, 'INR', 'order_manual_wvpl_aarti_sehera', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_aakansha_p', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_aakansha_p', 'Aakansha P', 'aakansha_p@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_aakansha_p', 'reg_wvpl_aakansha_p', 200.00, 'INR', 'order_manual_wvpl_aakansha_p', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_priyanka_shinde', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_priyanka_shinde', 'Priyanka Shinde', 'priyanka_shinde@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_priyanka_shinde', 'reg_wvpl_priyanka_shinde', 200.00, 'INR', 'order_manual_wvpl_priyanka_shinde', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_priya_w', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_priya_w', 'Priya W', 'priya_w@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_priya_w', 'reg_wvpl_priya_w', 200.00, 'INR', 'order_manual_wvpl_priya_w', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_heena_t', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_heena_t', 'Heena T', 'heena_t@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_heena_t', 'reg_wvpl_heena_t', 200.00, 'INR', 'order_manual_wvpl_heena_t', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_rohini_j', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_rohini_j', 'Rohini J', 'rohini_j@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_rohini_j', 'reg_wvpl_rohini_j', 200.00, 'INR', 'order_manual_wvpl_rohini_j', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_purva_p', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_purva_p', 'Purva P', 'purva_p@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_purva_p', 'reg_wvpl_purva_p', 200.00, 'INR', 'order_manual_wvpl_purva_p', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_sneha_desai', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_sneha_desai', 'Sneha Desai', 'sneha_desai@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_sneha_desai', 'reg_wvpl_sneha_desai', 200.00, 'INR', 'order_manual_wvpl_sneha_desai', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_pooja_s', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_pooja_s', 'Pooja S', 'pooja_s@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_pooja_s', 'reg_wvpl_pooja_s', 200.00, 'INR', 'order_manual_wvpl_pooja_s', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_sonal_bhoyar', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_sonal_bhoyar', 'Sonal Bhoyar', 'sonal_bhoyar@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_sonal_bhoyar', 'reg_wvpl_sonal_bhoyar', 200.00, 'INR', 'order_manual_wvpl_sonal_bhoyar', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_deepa_shetty', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_deepa_shetty', 'Deepa Shetty', 'deepa_shetty@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_deepa_shetty', 'reg_wvpl_deepa_shetty', 200.00, 'INR', 'order_manual_wvpl_deepa_shetty', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_sheetal_dhole', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_sheetal_dhole', 'Sheetal Dhole', 'sheetal_dhole@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_sheetal_dhole', 'reg_wvpl_sheetal_dhole', 200.00, 'INR', 'order_manual_wvpl_sheetal_dhole', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_shardha_omble', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_shardha_omble', 'Shardha Omble', 'shardha_omble@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_shardha_omble', 'reg_wvpl_shardha_omble', 200.00, 'INR', 'order_manual_wvpl_shardha_omble', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_ritu_m', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_ritu_m', 'Ritu M', 'ritu_m@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_ritu_m', 'reg_wvpl_ritu_m', 200.00, 'INR', 'order_manual_wvpl_ritu_m', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_mansa_patil', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_mansa_patil', 'Mansa Patil', 'mansa_patil@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_mansa_patil', 'reg_wvpl_mansa_patil', 200.00, 'INR', 'order_manual_wvpl_mansa_patil', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_jayalaxmi', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_jayalaxmi', 'Jayalaxmi', 'jayalaxmi@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_jayalaxmi', 'reg_wvpl_jayalaxmi', 200.00, 'INR', 'order_manual_wvpl_jayalaxmi', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_vrushali_p', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_vrushali_p', 'Vrushali P', 'vrushali_p@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_vrushali_p', 'reg_wvpl_vrushali_p', 200.00, 'INR', 'order_manual_wvpl_vrushali_p', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_purva_bonde', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_purva_bonde', 'Purva Bonde', 'purva_bonde@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_purva_bonde', 'reg_wvpl_purva_bonde', 200.00, 'INR', 'order_manual_wvpl_purva_bonde', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_priyanka_t', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_priyanka_t', 'Priyanka T', 'priyanka_t@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_priyanka_t', 'reg_wvpl_priyanka_t', 200.00, 'INR', 'order_manual_wvpl_priyanka_t', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_nidhi_s', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_nidhi_s', 'Nidhi S', 'nidhi_s@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_nidhi_s', 'reg_wvpl_nidhi_s', 200.00, 'INR', 'order_manual_wvpl_nidhi_s', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_deepika_n', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_deepika_n', 'Deepika N', 'deepika_n@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_deepika_n', 'reg_wvpl_deepika_n', 200.00, 'INR', 'order_manual_wvpl_deepika_n', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('reg_wvpl_pankti_p', 't_wvpl_2026', 'e1791279154035-vb_women_open-0', 'usr_pankti_p', 'Pankti P', 'pankti_p@wvpl.io', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';


INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('usr_pankti_p', 'reg_wvpl_pankti_p', 200.00, 'INR', 'order_manual_wvpl_pankti_p', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;


UPDATE tournament_events 
SET registrations_count = (SELECT COUNT(*) FROM registrations WHERE event_id = 'e1791279119394-vb_men_open-0')
WHERE id = 'e1791279119394-vb_men_open-0';


UPDATE tournament_events 
SET registrations_count = (SELECT COUNT(*) FROM registrations WHERE event_id = 'e1791279154035-vb_women_open-0')
WHERE id = 'e1791279154035-vb_women_open-0';


UPDATE teams 
SET players = '{"Tarun Jha","Pradyumna Juikar","Sushant Mane","Anand Kulkarni","Yogesh M","Ranjit Savant","Vikas Paliwal","Anup Chudiwal","Shivraj Harale"}'
WHERE id = 'team_smashers';


UPDATE teams 
SET players = '{"Prashant Omble","Sagar Vekanjkar","Nilesh Gaikwad","Shivraj Salve","Harsh Munot","Sibendra Singh","Vinay Mahadik","Himanshu Rajpali"}'
WHERE id = 'team_spikers';


UPDATE teams 
SET players = '{"Rohit Kashyap","Rudra Pathak","Abie","Neeraj","Tushar Lokhande","Niranjan Nande","Suyash M Harkare","C.kishor Ladekar","Onkar Jagtap"}'
WHERE id = 'team_servers';


UPDATE teams 
SET players = '{"Asif Tamboli","Amit Chougule","Vinod Mulik","Vinod Digole","Rakesh Rane","Shreyas Mohite","Yogesh Jadhav","Kavish Gianani"}'
WHERE id = 'team_netbreakers';


UPDATE teams 
SET players = '{"Vaijnath Pawar","Akshay Tamane","Pandurang Biradar","Yash Bhame","Bharat Patil","Vaibhav Gunjal","Rahul Pawar","Dr Amit R M"}'
WHERE id = 'team_gamechangers';


UPDATE teams 
SET players = '{"Sachin Kable","Pankaj Sehra","Shailesh Sapate","Harshit Upadhyay","Ajit Sarwale","Mahesh Dhole","Ashwin Sutar","Manish Mishra","Jayesh Deore"}'
WHERE id = 'team_blockbusters';


UPDATE teams 
SET players = '{"Neha S","Pooja Kable","Urmila D","Swati Bhange","Dr. Archana","Pratima Patil","Shivani Kohli","Snehali"}'
WHERE id = 'team_wvpl_blazers';


UPDATE teams 
SET players = '{"Nishita P","Snehal Patil","Aarti Sehera","Aakansha P","Priyanka Shinde","Priya W","Heena T","Rohini J"}'
WHERE id = 'team_wvpl_strikers';


UPDATE teams 
SET players = '{"Purva P","Sneha Desai","Pooja S","Sonal Bhoyar","Deepa Shetty","Sheetal Dhole","Shardha Omble","Ritu M"}'
WHERE id = 'team_wvpl_aces';


UPDATE teams 
SET players = '{"Mansa Patil","Jayalaxmi","Vrushali P","Purva Bonde","Priyanka T","Nidhi S","Deepika N","Pankti P"}'
WHERE id = 'team_wvpl_legends';

COMMIT;