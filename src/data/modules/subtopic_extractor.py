import json
import os

def main():
    # 1. Prompt the user for the file name
    file_path = input("Please enter the path to the JSON file: ").strip()

    # 2. Check if the file exists
    if not os.path.exists(file_path):
        print(f"Error: The file '{file_path}' was not found.")
        return

    try:
        # 3. Open and parse the JSON file
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # 4. Handle both a single dictionary or a list of dictionaries
        if isinstance(data, list):
            # Extract unique subtopics using a set
            subtopics = {item.get("Subtopic") for item in data if "Subtopic" in item}
        elif isinstance(data, dict):
            subtopic = data.get("Subtopic")
            subtopics = {subtopic} if subtopic else set()
        else:
            print("Error: Unexpected JSON format.")
            return

        # 5. Output the results
        if subtopics:
            print("\n--- Extracted Subtopics ---")
            for i, topic in enumerate(sorted(filter(None, subtopics)), 1):
                print(f"{i}. {topic}")
        else:
            print("No subtopics found in the file.")

    except json.JSONDecodeError:
        print("Error: The file is not a valid JSON.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    main()
