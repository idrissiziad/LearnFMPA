import json

def remove_na_choices(input_file, output_file):
    try:
        # Load the JSON data
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for question in data:
            # Identify all choice letters present in the question (e.g., A, B, C, D, E)
            # We look for keys ending in '_Text' to find the prefixes
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

        # Save the cleaned data to a new file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print(f"Success! Cleaned file saved as: {output_file}")

    except Exception as e:
        print(f"An error occurred: {e}")

# Usage
if __name__ == "__main__":
    # Change these filenames to match your local files
    input_filename = "Juillet 2024 (Normale).json"
    output_filename = "Juillet_2024_Cleaned.json"
    
    remove_na_choices(input_filename, output_filename)
