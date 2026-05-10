import os

replacements = {
    # Replace Deep Sea Blue base with Indigo (Purple-Blue Mix) Base
    '#0369A1': '#4F46E5',
    '#0369a1': '#4F46E5',
    'rgba(3, 105, 161,': 'rgba(79, 70, 229,',
    
    # Replace Deep Sea Blue lighter with Indigo Lighter
    '#0284C7': '#6366F1',
    '#0284c7': '#6366F1',
    'rgba(2, 132, 199,': 'rgba(99, 102, 241,',
    
    # Replace Deep Sea Blue darker with Indigo Darker
    '#075985': '#4338CA',
    '#075985': '#4338CA',
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
