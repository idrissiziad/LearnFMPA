import re
import os
import json

# Configuration: Look for the file in the same directory as this script
FILE_NAME = "Gastro-intestinal.json"

def fix_trailing_commas():
    # Get the absolute path of the script's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, FILE_NAME)

    if not os.path.exists(file_path):
        print(f"❌ Error: Could not find '{FILE_NAME}' in {script_dir}")
        print("Make sure this script is saved in the same folder as the json file.")
        return

    print(f"Reading {file_path}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Create a backup
    with open(file_path + ".bak", 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Backup created (.bak)")

    # 2. Regex to remove trailing commas before } or ]
    # Matches a comma, followed by optional whitespace, followed by a closing bracket/brace
    fixed_content = re.sub(r',(\s*)([}\]])', r'\1\2', content)

    # 3. Verify it is now valid JSON
    try:
        json.loads(fixed_content)
        print("✅ JSON validation passed. The syntax is now correct.")
    except json.JSONDecodeError as e:
        print(f"⚠️ Warning: Trailing commas removed, but JSON is still invalid.")
        print(f"Error details: {e}")

    # 4. Save the fixed content
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(fixed_content)
    
    print(f"🎉 Successfully fixed {FILE_NAME}")

if __name__ == "__main__":
    fix_trailing_commas()