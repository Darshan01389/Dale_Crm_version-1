import os

replacements = {
    # Replace normal purples
    '#A855F7': '#0369A1',
    '#a855f7': '#0369A1',
    'rgba(168, 85, 247,': 'rgba(3, 105, 161,',
    
    '#C084FC': '#0284C7',
    '#c084fc': '#0284C7',
    'rgba(192, 132, 252,': 'rgba(2, 132, 199,',
    
    '#9333EA': '#075985',
    '#9333ea': '#075985',
    
    # Replace the dark purples introduced by previous script
    '#6B21A8': '#0369A1',
    '#6b21a8': '#0369A1',
    'rgba(107, 33, 168,': 'rgba(3, 105, 161,',
    
    '#7E22CE': '#0284C7',
    '#7e22ce': '#0284C7',
    'rgba(126, 34, 206,': 'rgba(2, 132, 199,',
    
    '#4C1D95': '#075985',
    '#4c1d95': '#075985',

    # Let's also check for Tailwind classes just in case they were used, though the previous scripts used hex/rgba
    # We won't touch text-purple-500 unless it's strictly requested, we focus on the hex codes
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
