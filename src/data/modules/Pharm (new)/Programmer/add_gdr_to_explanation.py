import json
import re
import os

def list_files(extension):
    """Lists files with the given extension in the current directory."""
    return [f for f in os.listdir('.') if f.endswith(extension)]

def select_file(extension, prompt):
    """Prompts the user to select a file from a list."""
    files = list_files(extension)
    if not files:
        print(f"No {extension} files found in the current directory.")
        return None
    
    print(f"\n--- Available {extension} files ---")
    for i, file in enumerate(files):
        print(f"{i + 1}: {file}")
    
    while True:
        try:
            choice = int(input(f"{prompt} (Enter the number): ")) - 1
            if 0 <= choice < len(files):
                return files[choice]
            else:
                print("Invalid selection. Try again.")
        except ValueError:
            print("Please enter a valid number.")

def add_gdr_to_explanation():
    # 1. Select the files
    txt_file = select_file(".txt", "Select your Answer Key file (.txt)")
    if not txt_file: return
    
    json_file = select_file(".json", "Select your Question Data file (.json)")
    if not json_file: return

    # 2. Parse the TXT file for correct answers
    answer_key = {}
    with open(txt_file, 'r', encoding='utf-8') as f:
        for line in f:
            match = re.search(r'(\d+)\s*:\s*([A-E]+)', line)
            if match:
                q_num = int(match.group(1))
                letters = list(match.group(2))
                answer_key[q_num] = letters

    # 3. Load the JSON file
    with open(json_file, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    # 4. Add [GDR] to the Explanation fields
    updated_count = 0
    for index, question in enumerate(questions):
        q_number = index + 1
        if q_number in answer_key:
            correct_letters = answer_key[q_number]
            
            for letter in ['A', 'B', 'C', 'D', 'E']:
                expl_key = f"Choice_{letter}_Explanation"
                
                # Check if this choice is marked as correct in the TXT file
                if letter in correct_letters:
                    # Append [GDR] if it's not already there
                    if "[GDR]" not in question[expl_key]:
                        # Ensure there is a space before adding it
                        explanation = question[expl_key].strip()
                        question[expl_key] = f"{explanation} [GDR]"
                else:
                    # Clean up if [GDR] was accidentally there but choice is incorrect
                    question[expl_key] = question[expl_key].replace(" [GDR]", "").strip()
            
            updated_count += 1

    # 5. Save the result
    output_filename = json_file.replace(".json", "_GDR_Updated.json")
    with open(output_filename, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=4, ensure_ascii=False)

    print(f"\nDone!")
    print(f"Processed {updated_count} questions.")
    print(f"File saved as: {output_filename}")

if __name__ == "__main__":
    add_gdr_to_explanation()
