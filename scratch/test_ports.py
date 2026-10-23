import socket

hosts = [
    "aws-0-ap-south-1.pooler.supabase.com",
    "aws-1-ap-southeast-1.pooler.supabase.com",
    "db.pcfwdibqnpvikdntgypw.supabase.co"
]
ports = [5432, 6543]

print("=== Socket Connectivity Test ===")
for host in hosts:
    for port in ports:
        print(f"Testing {host}:{port} ...", end="", flush=True)
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(5.0)
            s.connect((host, port))
            s.close()
            print(" SUCCESS!")
        except Exception as e:
            print(f" FAILED ({e})")
