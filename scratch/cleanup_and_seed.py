import subprocess
import json
import re

# 1. Player rosters from Image 1 (WhatsApp Image 2026-09-26 at 20.29.41.jpeg)
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

# 2. Player rosters from Image 2 (WhatsApp Image 2026-09-30 at 22.10.20.jpeg)
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

print("Loaded definitions successfully.")
