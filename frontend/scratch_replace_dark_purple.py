import os

replacements = {
    '#A855F7': '#6B21A8',
    'rgba(168, 85, 247,': 'rgba(107, 33, 168,',
    '#C084FC': '#7E22CE',
    'rgba(192, 132, 252,': 'rgba(126, 34, 206,',
    '#9333EA': '#4C1D95'
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
