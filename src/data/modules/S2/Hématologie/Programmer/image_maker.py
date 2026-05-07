import json
import re
import os

def select_json_file():
    # Get all .json files in current directory
    files = [f for f in os.listdir('.') if f.endswith('.json') and not f.endswith('_Updated.json')]
    
    if not files:
        print("No .json files found in the folder.")
        return None

    print("\nAvailable JSON files:")
    for i, file in enumerate(files, 1):
        print(f"{i}. {file}")
    
    while True:
        try:
            choice = int(input("\nSelect the file number to process: "))
            if 1 <= choice <= len(files):
                return files[choice - 1]
            print("Invalid choice.")
        except ValueError:
            print("Please enter a number.")

def process_pharmacology_data():
    # 1. Select the file
    input_file = select_json_file()
    if not input_file:
        return

    # 2. Get user configuration
    base_name = input("Enter the base image name (e.g., pharmaco): ").strip()
    try:
        padding_count = int(input("How many digits should the page number contain (e.g., 4 for '0002')? "))
    except ValueError:
        print("Invalid input. Padding must be a number.")
        return

    # 3. Load the JSON data
    with open(input_file, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            print(f"Error: {input_file} is not a valid JSON file.")
            return

    # UPDATED REGEX: 
    # 1. Matches "Page"
    # 2. Optionally matches " Global" or " Globale" (the 'e' is now optional)
    # 3. Captures the digits/ranges
    page_regex = re.compile(r"Page\s+(?:Global[e]?\s+)?([\d\-/]+)", re.IGNORECASE)

    # 4. Process the entries
    for entry in data:
        # Check choices A through E
        for char in ['A', 'B', 'C', 'D', 'E']:
            explanation_key = f"Choice_{char}_Explanation"
            image_key = f"Choice_{char}_Image"
            
            # Ensure the key exists in the JSON entry
            if explanation_key in entry:
                explanation_text = entry.get(explanation_key, "")
                match = page_regex.search(explanation_text)
                
                if match:
                    raw_pages = match.group(1)
                    # Split by hyphen or slash (handles 659-660 or 636/649)
                    page_parts = re.split(r'[-/]', raw_pages)
                    
                    # Clean, pad, and add extension
                    formatted_images = [
                        f"{base_name}-{p.strip().zfill(padding_count)}.avif" 
                        for p in page_parts if p.strip().isdigit()
                    ]

                    if len(formatted_images) == 1:
                        entry[image_key] = formatted_images[0]
                    elif len(formatted_images) > 1:
                        entry[image_key] = formatted_images
                    else:
                        entry[image_key] = ""
                else:
                    entry[image_key] = ""

    # 5. Save the result
    output_file = input_file.replace('.json', '_Updated.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    
    print("-" * 40)
    print(f"SUCCESS!")
    print(f"Input file:  {input_file}")
    print(f"Output file: {output_file}")
    print(f"Format Example: {base_name}-{'2'.zfill(padding_count)}.avif")
    print("-" * 40)

if __name__ == "__main__":
    process_pharmacology_data()
