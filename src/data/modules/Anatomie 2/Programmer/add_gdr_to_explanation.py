import json
import re
import os

def list_files(extension):
    return [f for f in os.listdir('.') if f.endswith(extension)]

def select_file(extension, prompt):
    files = list_files(extension)
    if not files:
        print(f"No {extension} files found.")
        return None
    print(f"\n--- Available {extension} files ---")
    for i, file in enumerate(files):
        print(f"{i + 1}: {file}")
    while True:
        try:
            choice = int(input(f"{prompt} (Enter the number): ")) - 1
            if 0 <= choice < len(files): return files[choice]
        except ValueError: pass
        print("Invalid selection.")

def add_gdr_to_explanation():
    # 1. Select files
    txt_file = select_file(".txt", "Select Answer Key")
    json_file = select_file(".json", "Select Question Data")
    if not txt_file or not json_file: return

    # 2. Parse TXT file 
    # UPDATED REGEX: Added 'O' and 'o' to the allowed characters
    txt_entries = [] 
    with open(txt_file, 'r', encoding='utf-8') as f:
        for line in f:
            match = re.search(r'(\d+)\s*:\s*([A-EOo]+)', line)
            if match:
                txt_entries.append((int(match.group(1)), list(match.group(2).upper())))
    
    answer_dict = dict(txt_entries)

    # 3. Load JSON
    with open(json_file, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    # 4. Decide Matching Strategy
    use_sequential = len(questions) == len(txt_entries)
    
    if use_sequential:
        print(f"Counts match ({len(questions)} items). Using Sequential Mapping.")
    else:
        print(f"Counts differ (JSON: {len(questions)}, TXT: {len(txt_entries)}). Using ID Mapping.")

    # 5. Process Questions
    updated_count = 0
    for i, question in enumerate(questions):
        correct_letters = None

        if use_sequential:
            correct_letters = txt_entries[i][1]
        else:
            possible_id_fields = ["Question_Number", "Number", "ID", "id", "q_no"]
            for field in possible_id_fields:
                if field in question:
                    q_id = int(question[field])
                    correct_letters = answer_dict.get(q_id)
                    break
        
        if correct_letters:
            # NEW LOGIC: If 'O' is found in the answer key, 
            # remove any existing GDRs and skip adding new ones for this question.
            is_omitted = 'O' in correct_letters
            
            for letter in ['A', 'B', 'C', 'D', 'E']:
                expl_key = f"Choice_{letter}_Explanation"
                if expl_key in question:
                    current_text = (question[expl_key] or "").strip()
                    
                    # If letter is correct AND question is NOT omitted
                    if letter in correct_letters and not is_omitted:
                        if "[GDR]" not in current_text:
                            spacer = " " if current_text else ""
                            question[expl_key] = f"{current_text}{spacer}[GDR]"
                    else:
                        # Clean up GDR if it's the wrong letter OR if question is omitted ('O')
                        question[expl_key] = current_text.replace(" [GDR]", "").replace("[GDR]", "").strip()
            
            updated_count += 1

    # 6. Save
    output_filename = json_file.replace(".json", "_GDR_Updated.json")
    with open(output_filename, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=4, ensure_ascii=False)

    print(f"\nDone! Processed {updated_count} questions.")
    print(f"File saved as: {output_filename}")

if __name__ == "__main__":
    add_gdr_to_explanation()
