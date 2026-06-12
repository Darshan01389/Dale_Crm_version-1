import os

replacements = {
    '#1F6E43': '#A855F7',
    'rgba(31, 110, 67,': 'rgba(168, 85, 247,',
    '#10B981': '#C084FC',
    'rgba(16, 185, 129,': 'rgba(192, 132, 252,',
    '#059669': '#9333EA'
}

frontend_src = r"c:\Users\JAYANTH H\OneDrive\Desktop\test\Deal_Crm_Version-0.1\frontend\src"

def process_dir(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.css') or file.endswith('.jsx') or file.endswith('.js'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                for old, new in replacements.items():
                    content = content.replace(old, new)
                    # Also replace lowercase versions just in case
                    content = content.replace(old.lower(), new)
                
                if content != original_content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Updated {path}")

process_dir(frontend_src)
print("Done.")
