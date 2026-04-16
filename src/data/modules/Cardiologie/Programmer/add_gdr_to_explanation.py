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

    # 2. Parse TXT file into a list of tuples (to preserve order)
    # and a dictionary (to allow ID searching)
    txt_entries = [] # List of (id, letters)
    with open(txt_file, 'r', encoding='utf-8') as f:
        for line in f:
            match = re.search(r'(\d+)\s*:\s*([A-E]+)', line)
            if match:
                txt_entries.append((int(match.group(1)), list(match.group(2))))
    
    answer_dict = dict(txt_entries)

    # 3. Load JSON
    with open(json_file, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    # 4. Decide Matching Strategy
    # If counts match, we go purely by order (Position-independent of ID)
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
            # Strategy 1: Map 1st JSON to 1st TXT line, etc.
            correct_letters = txt_entries[i][1]
        else:
            # Strategy 2: Look for an ID field in the JSON to match the TXT number
            possible_id_fields = ["Question_Number", "Number", "ID", "id", "q_no"]
            for field in possible_id_fields:
                if field in question:
                    q_id = int(question[field])
                    correct_letters = answer_dict.get(q_id)
                    break
        
        # If we found a match for this question, apply [GDR]
        if correct_letters:
            for letter in ['A', 'B', 'C', 'D', 'E']:
                expl_key = f"Choice_{letter}_Explanation"
                if expl_key in question:
                    current_text = (question[expl_key] or "").strip()
                    
                    if letter in correct_letters:
                        if "[GDR]" not in current_text:
                            spacer = " " if current_text else ""
                            question[expl_key] = f"{current_text}{spacer}[GDR]"
                    else:
                        # Clean up if [GDR] was there wrongly
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
