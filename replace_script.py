import os

def replace_in_file(path, replacements):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    changed = False
    for old, new in replacements.items():
        if old in content:
            content = content.replace(old, new)
            changed = True
            print(f"Replaced {old} -> {new} in {path}")
    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

replacements = {
    '"Pending"': '"submitted"',
    "'Pending'": "'submitted'",
    '"Shortlisted"': '"shortlisted"',
    "'Shortlisted'": "'shortlisted'",
    '"Accepted"': '"accepted"',
    "'Accepted'": "'accepted'",
    '"Rejected"': '"rejected"',
    "'Rejected'": "'rejected'"
}

dirs_to_check = [
    r"c:\Users\ABINISH\Desktop\HyperHire\src\components\applications",
    r"c:\Users\ABINISH\Desktop\HyperHire\src\app\(dashboard)\applications"
]

for d in dirs_to_check:
    for root, _, files in os.walk(d):
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                path = os.path.join(root, file)
                replace_in_file(path, replacements)
