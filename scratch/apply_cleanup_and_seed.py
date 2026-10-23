import subprocess
import re

img1_teams = {
    'team_smashers': {
        'name': 'Smashers',
        'players': [
            'Tarun Jha', 'Pradyumna Juikar', 'Sushant Mane', 'Anand Kulkarni', 
            'Yogesh M', 'Ranjit Savant', 'Vikas Paliwal', 'Anup Chudiwal', 'Shivraj Harale'
        ]
    },
    'team_spikers': {
        'name': 'Spikers',
        'players': [
            'Prashant Omble', 'Sagar Vekanjkar', 'Nilesh Gaikwad', 'Shivraj Salve', 
            'Harsh Munot', 'Sibendra Singh', 'Vinay Mahadik', 'Himanshu Rajpali'
        ]
    },
    'team_servers': {
        'name': 'Servers',
        'players': [
            'Rohit Kashyap', 'Rudra Pathak', 'Abie', 'Neeraj', 
            'Tushar Lokhande', 'Niranjan Nande', 'Suyash M Harkare', 'C.kishor Ladekar', 'Onkar Jagtap'
        ]
    },
    'team_netbreakers': {
        'name': 'Netbreakers',
        'players': [
            'Asif Tamboli', 'Amit Chougule', 'Vinod Mulik', 'Vinod Digole', 
            'Rakesh Rane', 'Shreyas Mohite', 'Yogesh Jadhav', 'Kavish Gianani'
        ]
    },
    'team_gamechangers': {
        'name': 'Gamechangers',
        'players': [
            'Vaijnath Pawar', 'Akshay Tamane', 'Pandurang Biradar', 'Yash Bhame', 
            'Bharat Patil', 'Vaibhav Gunjal', 'Rahul Pawar', 'Dr Amit R M'
        ]
    },
    'team_blockbusters': {
        'name': 'Blockbusters',
        'players': [
            'Sachin Kable', 'Pankaj Sehra', 'Shailesh Sapate', 'Harshit Upadhyay', 
            'Ajit Sarwale', 'Mahesh Dhole', 'Ashwin Sutar', 'Manish Mishra', 'Jayesh Deore'
        ]
    }
}

img2_teams = {
    'team_wvpl_blazers': {
        'name': 'Blazers',
        'players': [
            'Neha S', 'Pooja Kable', 'Urmila D', 'Swati Bhange', 
            'Dr. Archana', 'Pratima Patil', 'Shivani Kohli', 'Snehali'
        ]
    },
    'team_wvpl_strikers': {
        'name': 'Strikers',
        'players': [
            'Nishita P', 'Snehal Patil', 'Aarti Sehera', 'Aakansha P', 
            'Priyanka Shinde', 'Priya W', 'Heena T', 'Rohini J'
        ]
    },
    'team_wvpl_aces': {
        'name': 'Aces',
        'players': [
            'Purva P', 'Sneha Desai', 'Pooja S', 'Sonal Bhoyar', 
            'Deepa Shetty', 'Sheetal Dhole', 'Shardha Omble', 'Ritu M'
        ]
    },
    'team_wvpl_legends': {
        'name': 'Legends',
        'players': [
            'Mansa Patil', 'Jayalaxmi', 'Vrushali P', 'Purva Bonde', 
            'Priyanka T', 'Nidhi S', 'Deepika N', 'Pankti P'
        ]
    }
}

def slugify(name):
    clean = re.sub(r'[^a-zA-Z0-9]+', '_', name.strip().lower()).strip('_')
    return clean

# Default bcrypt password hash for 'password123'
DEFAULT_HASH = '$2a$10$6kZL12T1Vp3Ey/./uVTxi.diAwU7TAnsOaQcgjA7AMD8QCQQ8d2Kq'

sql_statements = []

sql_statements.append("BEGIN;")

# 1. Update tournaments created_by to usr_admin_1
sql_statements.append("""
UPDATE tournaments 
SET created_by = 'usr_admin_1' 
WHERE id IN ('t_7pd_vpl_s2', 't_wvpl_2026');
""")

# 2. Delete unwanted tournaments and their related items
# Keep only 't_7pd_vpl_s2' and 't_wvpl_2026'
sql_statements.append("""
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
""")

# 3. Clean up audit logs and user logins referencing other users
sql_statements.append("""
DELETE FROM audit_logs WHERE user_id NOT IN ('sysadmin1', 'usr_admin_1', 'usr_admin_2', 'usr_umpire_1');
DELETE FROM user_logins WHERE user_id NOT IN ('sysadmin1', 'usr_admin_1', 'usr_admin_2', 'usr_umpire_1');
""")

# 4. Delete all existing profiles EXCEPT SystemAdmin, Admin_1, Admin_2, Umpire_1
sql_statements.append("""
DELETE FROM profiles WHERE id NOT IN ('sysadmin1', 'usr_admin_1', 'usr_admin_2', 'usr_umpire_1');
""")

# 5. Insert players from Image 1 (7PD VPL Season 2 - Men's Volleyball)
all_img1_players = []
for team_id, team_info in img1_teams.items():
    for p_name in team_info['players']:
        pid = f"usr_{slugify(p_name)}"
        email = f"{slugify(p_name)}@7pdvpl.io"
        all_img1_players.append((pid, p_name, email, team_id))
        sql_statements.append(f"""
INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('{pid}', '{email}', '{p_name}', '{{player}}', '{DEFAULT_HASH}', 'Male')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;
""")

# 6. Insert players from Image 2 (WVPL 2026 - Women's Volleyball)
all_img2_players = []
for team_id, team_info in img2_teams.items():
    for p_name in team_info['players']:
        pid = f"usr_{slugify(p_name)}"
        email = f"{slugify(p_name)}@wvpl.io"
        all_img2_players.append((pid, p_name, email, team_id))
        sql_statements.append(f"""
INSERT INTO profiles (id, email, name, roles, password_hash, gender)
VALUES ('{pid}', '{email}', '{p_name}', '{{player}}', '{DEFAULT_HASH}', 'Female')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, roles = EXCLUDED.roles;
""")

# 7. Register players for Tournament 1: "7PD VPL Season 2" (Tournament ID: 't_7pd_vpl_s2', Event ID: 'e1791279119394-vb_men_open-0', Amount: 300)
event_id_7pd = 'e1791279119394-vb_men_open-0'
tour_id_7pd = 't_7pd_vpl_s2'

for pid, p_name, email, team_id in all_img1_players:
    reg_id = f"reg_7pd_{slugify(p_name)}"
    sql_statements.append(f"""
INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('{reg_id}', '{tour_id_7pd}', '{event_id_7pd}', '{pid}', '{p_name}', '{email}', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';
""")
    # Also record payment_orders and payment_transactions for full financial ledger compliance
    order_id_sql = f"po_7pd_{slugify(p_name)}"
    sql_statements.append(f"""
INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('{pid}', '{reg_id}', 300.00, 'INR', 'order_manual_7pd_{slugify(p_name)}', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;
""")

# 8. Register players for Tournament 2: "WVPL 2026" (Tournament ID: 't_wvpl_2026', Event ID: 'e1791279154035-vb_women_open-0', Amount: 200)
event_id_wvpl = 'e1791279154035-vb_women_open-0'
tour_id_wvpl = 't_wvpl_2026'

for pid, p_name, email, team_id in all_img2_players:
    reg_id = f"reg_wvpl_{slugify(p_name)}"
    sql_statements.append(f"""
INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, payment_status, payment_method)
VALUES ('{reg_id}', '{tour_id_wvpl}', '{event_id_wvpl}', '{pid}', '{p_name}', '{email}', 'approved', 'paid', 'cash')
ON CONFLICT (id) DO UPDATE SET status = 'approved', payment_status = 'paid', payment_method = 'cash';
""")
    # Also record payment_orders
    sql_statements.append(f"""
INSERT INTO payment_orders (user_id, registration_id, amount, currency, razorpay_order_id, status)
VALUES ('{pid}', '{reg_id}', 200.00, 'INR', 'order_manual_wvpl_{slugify(p_name)}', 'paid')
ON CONFLICT (razorpay_order_id) DO NOTHING;
""")

# 9. Update registrations_count on tournament_events
sql_statements.append(f"""
UPDATE tournament_events 
SET registrations_count = (SELECT COUNT(*) FROM registrations WHERE event_id = '{event_id_7pd}')
WHERE id = '{event_id_7pd}';
""")

sql_statements.append(f"""
UPDATE tournament_events 
SET registrations_count = (SELECT COUNT(*) FROM registrations WHERE event_id = '{event_id_wvpl}')
WHERE id = '{event_id_wvpl}';
""")

# 10. Update team player arrays with clean player names
for team_id, team_info in img1_teams.items():
    player_names_quoted = ",".join([f'"{p}"' for p in team_info['players']])
    sql_statements.append(f"""
UPDATE teams 
SET players = '{{{player_names_quoted}}}'
WHERE id = '{team_id}';
""")

for team_id, team_info in img2_teams.items():
    # Keep format clean without (C) inside array since captain is known or handled in UI
    player_names_quoted = ",".join([f'"{p}"' for p in team_info['players']])
    sql_statements.append(f"""
UPDATE teams 
SET players = '{{{player_names_quoted}}}'
WHERE id = '{team_id}';
""")

sql_statements.append("COMMIT;")

full_sql = "\n".join(sql_statements)
with open('/Users/paliwal/MatchPoint/scratch/migration.sql', 'w') as f:
    f.write(full_sql)

print(f"Generated SQL script with {len(sql_statements)} statements.")
