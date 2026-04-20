import json
import os

def remove_na_choices(input_file):
    try:
        # Create output filename based on input filename
        filename_no_ext = os.path.splitext(input_file)[0]
        output_file = f"{filename_no_ext}_Cleaned.json"

        # Load the JSON data
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for question in data:
            # Identify all choice letters present in the question
            choice_prefixes = [key.split('_Text')[0] for key in list(question.keys()) if key.endswith('_Text')]

            for prefix in choice_prefixes:
                text_key = f"{prefix}_Text"
                
                # Check if the choice text is "NA"
                if question.get(text_key) == "NA":
                    # Delete the related keys for this choice
                    keys_to_delete = [
                        f"{prefix}_Text",
                        f"{prefix}_isCorrect",
                        f"{prefix}_Explanation"
                    ]
                    
                    for k in keys_to_delete:
                        if k in question:
                            del question[k]

        # Save the cleaned data
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print(f"Success! Cleaned: {input_file} -> {output_file}")

    except Exception as e:
        print(f"An error occurred while processing {input_file}: {e}")

if __name__ == "__main__":
    # Get the directory where the script is located
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Find all .json files in that directory
    json_files = [f for f in os.listdir(current_dir) if f.endswith('.json')]
    
    # Filter out files that are already "Cleaned" versions to prevent loops
    files_to_process = [f for f in json_files if not f.endswith('_Cleaned.json')]

    if not files_to_process:
        print("No JSON files found to process.")
    else:
        print(f"Found {len(files_to_process)} file(s). Starting cleanup...")
        for file in files_to_process:
            remove_na_choices(file)
