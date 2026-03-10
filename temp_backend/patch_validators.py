import re

with open('validators.py', 'r') as f:
    content = f.read()

# Remove specific problematic keyword arguments from Field(...)
content = re.sub(r',\s*min_length=\d+', '', content)
content = re.sub(r',\s*max_length=\d+', '', content)
content = re.sub(r',\s*gt=\d+', '', content)
content = re.sub(r',\s*le=\d+', '', content)
content = re.sub(r',\s*ge=\d+', '', content)
content = re.sub(r',\s*pattern="[^"]+"', '', content)
content = re.sub(r',\s*regex="[^"]+"', '', content)

with open('validators.py', 'w') as f:
    f.write(content)

print("Patched validators.py")
