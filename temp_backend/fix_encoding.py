
import os

file_path = r"c:\Users\adhin\OneDrive\Desktop\VS CODE\project\BLOOD_BANK\banking_systemremastered\BLOOD_BANK_SYSTEM_advanced\app.py"

try:
    with open(file_path, 'rb') as f:
        content = f.read()
    
    # Replace null bytes
    clean_content = content.replace(b'\x00', b'')
    
    # Also fix potential UTF-16 BOM if present due to PowerShell redirection
    if clean_content.startswith(b'\xff\xfe') or clean_content.startswith(b'\xfe\xff'):
        # It might be utf-16
        try:
            text = content.decode('utf-16')
            clean_content = text.encode('utf-8')
        except:
            pass
            
    with open(file_path, 'wb') as f:
        f.write(clean_content)
        
    print("Successfully removed null bytes.")
except Exception as e:
    print(f"Error: {e}")
