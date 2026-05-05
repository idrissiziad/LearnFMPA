import json
import os
import glob

def combine_json_files(input_directory, output_filename):
    master_list = []
    
    # Find all .json files in the specified directory
    search_path = os.path.join(input_directory, "*.json")
    json_files = glob.glob(search_path)
    
    if not json_files:
        print("No JSON files found in the directory.")
        return

    print(f"Found {len(json_files)} files. Starting merge...")

    for file_path in json_files:
        # Skip the output file if it already exists in the same folder
        if os.path.basename(file_path) == output_filename:
            continue
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                # Check if the data is a list and append/extend
                if isinstance(data, list):
                    master_list.extend(data)
                else:
                    # If a file contains a single object instead of a list
                    master_list.append(data)
                    
                print(f"Successfully added: {os.path.basename(file_path)}")
        except Exception as e:
            print(f"Error reading {os.path.basename(file_path)}: {e}")

    # Write the combined list to the output file
    with open(output_filename, 'w', encoding='utf-8') as f:
        json.dump(master_list, f, indent=4, ensure_ascii=False)

    print("-" * 30)
    print(f"Done! Combined {len(master_list)} total items into '{output_filename}'.")

if __name__ == "__main__":
    # SETTINGS: Change these to match your setup
    # '.' means the current folder where the script is saved
    INPUT_DIR = '.' 
    OUTPUT_FILE = 'Combined_Pharmacology_Database.json'
    
    combine_json_files(INPUT_DIR, OUTPUT_FILE)
