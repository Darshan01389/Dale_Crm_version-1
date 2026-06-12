import os
import re

def audit_buttons(root_dir):
    results = []
    
    for subdir, _, files in os.walk(root_dir):
        for file in files:
            if file.endswith((".jsx", ".tsx")):
                filepath = os.path.join(subdir, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Use a regex that matches <button ... > across multiple lines
                # and captures the full tag opening
                for match in re.finditer(r'<button([^>]+)>(.*?)</button>', content, re.DOTALL):
                    attrs = match.group(1)
                    text = match.group(2).strip()
                    # clean up text a bit
                    text = re.sub(r'\s+', ' ', text)
                    
                    onclick_match = re.search(r'onClick=\{([^}]+)\}', attrs)
                    type_match = re.search(r'type=["\']([^"\']+)["\']', attrs)
                    
                    onclick = onclick_match.group(1).strip() if onclick_match else None
                    b_type = type_match.group(1) if type_match else "button"
                    
                    # check if the text is empty or just an icon
                    if not text:
                        text = "(empty or complex JSX)"
                        
                    results.append({
                        'file': file,
                        'text': text[:50] + ('...' if len(text) > 50 else ''),
                        'onclick': onclick,
                        'type': b_type
                    })
                        
    return results

if __name__ == "__main__":
    src_dir = os.path.abspath("frontend/src")
    buttons = audit_buttons(src_dir)
    
    missing_onclick = [b for b in buttons if not b['onclick'] and b['type'] != 'submit']
    
    with open("button_audit.txt", "w", encoding="utf-8") as f:
        f.write(f"Total buttons found: {len(buttons)}\n")
        f.write(f"Buttons missing onClick (and not type=submit): {len(missing_onclick)}\n\n")
        
        f.write("--- Buttons missing functionality ---\n")
        for b in missing_onclick:
            f.write(f"File: {b['file']} | Text: {b['text']} | Type: {b['type']}\n")
            
        f.write("\n--- All Buttons with onClick ---\n")
        for b in [x for x in buttons if x['onclick']]:
            f.write(f"File: {b['file']} | Text: {b['text']} | onClick: {b['onclick']}\n")

