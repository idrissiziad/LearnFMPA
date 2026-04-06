import json
import re
import os

def process_json():
    # 1. Ask for the prefix
    prefix = input("Enter the image prefix (e.g., pharmacologie): ").strip()
    
    # 2. Ask for the digit padding (e.g., 4 for 0001)
    try:
        padding_input = input("How many digits should the page number have? (e.g., 4 for '0001'): ").strip()
        padding = int(padding_input)
    except ValueError:
        print("Invalid input for digits. Defaulting to no padding.")
        padding = 0

    input_filename = "questions.json"
    output_filename = "questions_with_images.json"

    if not os.path.exists(input_filename):
        print(f"Error: {input_filename} not found.")
        return

    with open(input_filename, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Regex: Matches "(...Page 123)" or "(Page 123, 124)"
    outer_page_regex = re.compile(r'\([^)]*Page\s+([^)]+)\)', re.IGNORECASE)

    choices = ['A', 'B', 'C', 'D', 'E']

    for question in data:
        for letter in choices:
            explanation_key = f"Choice_{letter}_Explanation"
            image_key = f"Choice_{letter}_Image"
            
            if explanation_key in question and question[explanation_key]:
                explanation_text = str(question[explanation_key])
                
                match = outer_page_regex.search(explanation_text)
                
                if match:
                    inner_content = match.group(1)
                    # Find all page numbers
                    page_numbers = re.findall(r'\d+', inner_content)
                    
                    if page_numbers:
                        # 3. Format with leading zeros using .zfill()
                        # '359' with padding 4 becomes '0359'
                        filenames = [f"{prefix}-{num.zfill(padding)}.avif" for num in page_numbers]
                        
                        # Join with comma for your frontend .split(',') logic
                        question[image_key] = ", ".join(filenames)
                    else:
                        question[image_key] = ""
                else:
                    question[image_key] = ""
            elif f"Choice_{letter}_Text" in question:
                question[image_key] = ""

    with open(output_filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    
    print("-" * 30)
    print(f"Done! Results:")
    example_num = "359".zfill(padding)
    example_num2 = "360".zfill(padding)
    print(f" - Transformation: '(Global Page 359, 360)' -> \"{prefix}-{example_num}.avif, {prefix}-{example_num2}.avif\"")
    print(f"File saved as: {output_filename}")

if __name__ == "__main__":
    process_json()