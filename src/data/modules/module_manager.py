#!/usr/bin/env python3
"""
Module Manager for LearnFMPA
This script allows adding, removing, and displaying modules in the data/modules directory.
"""

import json
import os
import re
import sys
from typing import Dict, List, Optional, Any
from pathlib import Path

# Define the path to the modules directory
MODULES_DIR = Path(__file__).parent
INDEX_FILE = MODULES_DIR / "index.ts"

LEVELS = [
    "1ère année",
    "2ème année",
    "3ème année",
    "4ème année",
    "5ème année",
    "6ème année",
]


class ModuleManager:
    def __init__(self):
        self.modules = []
        self.load_modules()

    def load_modules(self):
        """Load existing modules from the index.ts file"""
        try:
            with open(INDEX_FILE, "r", encoding="utf-8") as f:
                content = f.read()

            # Extract the modules array from the TypeScript file
            start_marker = "export const modules: Module[] = ["
            end_marker = "];"

            start_idx = content.find(start_marker)
            if start_idx == -1:
                print("Error: Could not find modules array in index.ts")
                return

            start_idx += len(start_marker)
            end_idx = content.find(end_marker, start_idx)

            if end_idx == -1:
                print("Error: Could not find end of modules array in index.ts")
                return

            modules_json = content[start_idx:end_idx]

            # Parse the modules (this is a simplified approach)
            # In a production environment, you might want to use a proper TypeScript parser
            try:
                # Convert TypeScript object notation to valid JSON
                import re

                modules_json = re.sub(r"(\w+):", r'"\1":', modules_json)
                modules_json = modules_json.replace("'", '"')
                self.modules = json.loads(f"[{modules_json}]")
            except:
                print(
                    "Warning: Could not parse modules automatically. Using manual detection."
                )
                # Fallback to manual detection
                self.modules = self._extract_modules_manually(content)

        except Exception as e:
            print(f"Error loading modules: {e}")
            self.modules = []

    def _extract_modules_manually(self, content: str) -> List[Dict]:
        """Manually extract modules from the TypeScript content as fallback"""
        modules = []
        lines = content.split("\n")
        in_modules_array = False
        current_module = {}

        for line in lines:
            line = line.strip()

            if "export const modules: Module[] = [" in line:
                in_modules_array = True
                continue

            if in_modules_array and line == "];":
                break

            if in_modules_array and line.startswith("{"):
                current_module = {}
                continue

            if in_modules_array and line.startswith("}"):
                if current_module:
                    modules.append(current_module)
                current_module = {}
                continue

            if in_modules_array and ":" in line:
                key, value = line.split(":", 1)
                key = key.strip().replace("id", "id")
                value = value.strip().rstrip(",").strip("\"'")
                if key == "levels":
                    current_module[key] = [
                        v.strip().strip("\"'")
                        for v in value.strip("[]").split(",")
                        if v.strip().strip("\"'")
                    ]
                else:
                    current_module[key] = value

        return modules

    def display_modules(self):
        """Display all current modules"""
        print("\n=== Current Modules ===")
        if not self.modules:
            print("No modules found.")
            return

        for module in self.modules:
            print(f"\nID: {module.get('id', 'N/A')}")
            print(f"Title: {module.get('title', 'N/A')}")
            print(f"Subtitle: {module.get('subtitle', 'N/A')}")
            print(f"Description: {module.get('description', 'N/A')}")
            print(f"Levels: {', '.join(module.get('levels', []))}")
            print(f"Gradient: {module.get('gradient', 'N/A')}")

    def get_next_id(self) -> int:
        """Get the next available module ID"""
        if not self.modules:
            return 1
        return max(int(module.get("id", 0)) for module in self.modules) + 1

    def add_module(self):
        """Add a new module interactively"""
        print("\n=== Add New Module ===")

        # Get module details from user
        title = input("Enter module title: ").strip()
        if not title:
            print("Title is required!")
            return False

        subtitle = input("Enter module subtitle (e.g., '3ème année'): ").strip()
        description = input("Enter module description: ").strip()

        print("\nAvailable levels (select multiple, comma-separated):")
        for i, level in enumerate(LEVELS, 1):
            print(f"{i}. {level}")

        level_choices = input(
            f"Select levels (e.g., '2,3' for 2ème and 3ème année): "
        ).strip()
        levels = []
        if level_choices:
            for choice in level_choices.split(","):
                choice = choice.strip()
                if choice.isdigit() and 1 <= int(choice) <= len(LEVELS):
                    levels.append(LEVELS[int(choice) - 1])
        if not levels:
            levels = [LEVELS[0]]

        # Available gradients (you can extend this list)
        gradients = [
            "from-blue-400 to-blue-600",
            "from-green-400 to-green-600",
            "from-purple-400 to-purple-600",
            "from-red-400 to-red-600",
            "from-yellow-400 to-yellow-600",
            "from-indigo-400 to-indigo-600",
            "from-pink-400 to-pink-600",
            "from-teal-400 to-teal-600",
        ]

        print("\nAvailable gradients:")
        for i, gradient in enumerate(gradients, 1):
            print(f"{i}. {gradient}")

        gradient_choice = input(
            f"Select gradient (1-{len(gradients)}) or enter custom: "
        ).strip()

        if gradient_choice.isdigit() and 1 <= int(gradient_choice) <= len(gradients):
            gradient = gradients[int(gradient_choice) - 1]
        else:
            gradient = gradient_choice if gradient_choice else gradients[0]

        # Ask for JSON file
        json_filename = input("Enter JSON filename (without extension): ").strip()
        if not json_filename:
            json_filename = title.lower().replace(" ", "_")

        json_path = MODULES_DIR / f"{json_filename}.json"

        # Check if JSON file exists
        if not json_path.exists():
            create_json = (
                input(
                    f"JSON file '{json_filename}.json' does not exist. Create it? (y/n): "
                )
                .strip()
                .lower()
            )
            if create_json == "y":
                self.create_sample_json(json_path)
            else:
                print("Module creation cancelled.")
                return False

        # Create the new module
        new_module = {
            "id": self.get_next_id(),
            "title": title,
            "subtitle": subtitle,
            "description": description,
            "levels": levels,
            "gradient": gradient,
            "json_filename": json_filename,
        }

        self.modules.append(new_module)
        self.update_index_file()

        print(f"\nModule '{title}' added successfully!")
        print(f"JSON file: {json_filename}.json")
        return True

    def create_sample_json(self, json_path: Path):
        """Create a sample JSON file with the structure provided"""
        sample_data = [
            {
                "YearAsked": "Normale 2022",
                "Subtopic": "Sample Subtopic",
                "QuestionText": "This is a sample question. What is the correct answer?",
                "Choice_A_Text": "First option",
                "Choice_A_isCorrect": False,
                "Choice_A_Explanation": "This is not the correct answer",
                "Choice_B_Text": "Second option",
                "Choice_B_isCorrect": True,
                "Choice_B_Explanation": "This is the correct answer",
                "Choice_C_Text": "Third option",
                "Choice_C_isCorrect": False,
                "Choice_C_Explanation": "This is not the correct answer",
                "Choice_D_Text": "Fourth option",
                "Choice_D_isCorrect": False,
                "Choice_D_Explanation": "This is not the correct answer",
                "Choice_E_Text": "",
                "Choice_E_isCorrect": False,
                "Choice_E_Explanation": "",
                "OverallExplanation": "This is the overall explanation for the question",
                "IsChapterStart": True,
                "ChapterName": "Sample Chapter",
                "ChapterColor": "#AABFB6",
            }
        ]

        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(sample_data, f, indent=2, ensure_ascii=False)

        print(f"Sample JSON file created at {json_path}")

    def remove_module(self):
        """Remove a module interactively"""
        if not self.modules:
            print("No modules to remove.")
            return False

        print("\n=== Remove Module ===")
        self.display_modules()

        try:
            module_id = int(input("Enter the ID of the module to remove: ").strip())
        except ValueError:
            print("Invalid ID. Please enter a number.")
            return False

        module_to_remove = None
        for module in self.modules:
            if int(module.get("id", 0)) == module_id:
                module_to_remove = module
                break

        if not module_to_remove:
            print(f"No module found with ID {module_id}")
            return False

        confirm = (
            input(
                f"Are you sure you want to remove '{module_to_remove.get('title')}'? (y/n): "
            )
            .strip()
            .lower()
        )
        if confirm != "y":
            print("Operation cancelled.")
            return False

        self.modules = [m for m in self.modules if int(m.get("id", 0)) != module_id]
        self.update_index_file()

        print(f"Module '{module_to_remove.get('title')}' removed successfully!")
        return True

    def update_index_file(self):
        """Update the index.ts file with the current modules"""
        try:
            with open(INDEX_FILE, "r", encoding="utf-8") as f:
                content = f.read()

            # Update the case statements in getModuleQuestions and getModuleChapters functions first
            content = self._update_single_case_statement(content)

            # Find the modules array and replace it
            start_marker = "export const modules: Module[] = ["
            end_marker = "];"

            start_idx = content.find(start_marker)
            if start_idx == -1:
                print("Error: Could not find modules array in index.ts")
                return False

            start_idx += len(start_marker)
            end_idx = content.find(end_marker, start_idx)

            if end_idx == -1:
                print("Error: Could not find end of modules array in index.ts")
                return False

            # Generate new modules array content
            new_modules_content = "\n"
            for module in self.modules:
                new_modules_content += f"  {{\n"
                new_modules_content += f"    id: {module.get('id', 1)},\n"
                new_modules_content += f"    title: '{module.get('title', '')}',\n"
                new_modules_content += (
                    f"    subtitle: '{module.get('subtitle', '')}',\n"
                )
                new_modules_content += (
                    f"    description: '{module.get('description', '')}',\n"
                )
                new_modules_content += f"    levels: [{', '.join(repr(l) for l in module.get('levels', []))}],\n"
                new_modules_content += f"    gradient: '{module.get('gradient', '')}'"
                # Add json_filename if it exists
                if module.get("json_filename"):
                    new_modules_content += (
                        f",\n    json_filename: '{module.get('json_filename')}'"
                    )
                new_modules_content += f"\n  }},\n"

            # Remove the trailing comma from the last module
            if new_modules_content.endswith(",\n"):
                new_modules_content = new_modules_content[:-2] + "\n"

            # Reconstruct the file content with updated modules array
            new_content = content[:start_idx] + new_modules_content + content[end_idx:]

            # Write the updated content to the file
            with open(INDEX_FILE, "w", encoding="utf-8") as f:
                f.write(new_content)

            return True

        except Exception as e:
            print(f"Error updating index file: {e}")
            return False

    def update_case_statements(self):
        """Update the case statements in getModuleRawJson function"""
        try:
            with open(INDEX_FILE, "r", encoding="utf-8") as f:
                content = f.read()

            content = self._update_single_case_statement(content)

            with open(INDEX_FILE, "w", encoding="utf-8") as f:
                f.write(content)

            return True

        except Exception as e:
            print(f"Error updating case statements: {e}")
            return False

    def _update_single_case_statement(self, content: str) -> str:
        """Update the case statements in getModuleRawJson and return the updated content"""
        function_name = "getModuleRawJson"

        func_start = content.find(f"const {function_name} = async")
        if func_start == -1:
            func_start = content.find(f"export const {function_name} = async")
        if func_start == -1:
            print(f"Warning: Could not find {function_name} function")
            return content

        switch_start = content.find("switch (moduleId)", func_start)
        if switch_start == -1:
            print(f"Warning: Could not find switch statement in {function_name}")
            return content

        switch_open = content.find("{", switch_start)
        if switch_open == -1:
            print(f"Warning: Could not find opening brace of switch in {function_name}")
            return content

        switch_end = content.find("default:", switch_start)
        if switch_end == -1:
            print(f"Warning: Could not find default case in {function_name}")
            return content

        default_end = content.find("return [];", switch_end)
        if default_end == -1:
            print(f"Warning: Could not find end of default case in {function_name}")
            return content

        switch_close = content.find("}", default_end)
        if switch_close == -1:
            print(f"Warning: Could not find closing brace of switch in {function_name}")
            return content

        FIELDS = [
            ("YearAsked", "string"),
            ("Subtopic", "string"),
            ("QuestionText", "string"),
            ("QuestionImage", "optional"),
            ("Choice_A_Text", "string"),
            ("Choice_A_isCorrect", "boolean"),
            ("Choice_A_Explanation", "string"),
            ("Choice_A_Image", "optional"),
            ("Choice_B_Text", "string"),
            ("Choice_B_isCorrect", "boolean"),
            ("Choice_B_Explanation", "string"),
            ("Choice_B_Image", "optional"),
            ("Choice_C_Text", "string"),
            ("Choice_C_isCorrect", "boolean"),
            ("Choice_C_Explanation", "string"),
            ("Choice_C_Image", "optional"),
            ("Choice_D_Text", "string"),
            ("Choice_D_isCorrect", "boolean"),
            ("Choice_D_Explanation", "string"),
            ("Choice_D_Image", "optional"),
            ("Choice_E_Text", "string"),
            ("Choice_E_isCorrect", "boolean"),
            ("Choice_E_Explanation", "string"),
            ("Choice_E_Image", "optional"),
            ("OverallExplanation", "string"),
            ("IsChapterStart", "passthrough"),
            ("ChapterName", "passthrough"),
            ("ChapterColor", "passthrough"),
            ("Confirmed", "passthrough"),
        ]

        new_cases = "\n"
        for module in self.modules:
            module_id = int(module.get("id", 0))
            filename = module.get("json_filename", module.get("title", ""))
            clean_filename = (
                filename.replace("é", "e").replace("è", "e").replace("à", "a")
            )
            var_name = re.sub(r"[^a-zA-Z0-9_]", "", clean_filename)

            new_cases += f"    case {module_id}:\n"
            new_cases += f"      const {var_name}Module = await import('./{filename}.json', {{ with: {{ type: 'json' }} }});\n"
            new_cases += f"      jsonQuestions = ({var_name}Module.default as any[]).map((item: any) => ({{\n"

            for field_name, field_type in FIELDS:
                if field_type == "string":
                    new_cases += f"        {field_name}: item.{field_name} || '',\n"
                elif field_type == "boolean":
                    new_cases += f"        {field_name}: !!item.{field_name},\n"
                elif field_type == "optional":
                    new_cases += f"        {field_name}: item.{field_name},\n"
                else:
                    new_cases += f"        {field_name}: item.{field_name},\n"

            new_cases += "      }));\n"
            new_cases += "      break;\n"

        new_cases += "    default:\n      return [];\n  }"

        new_content = (
            content[: switch_open + 1] + new_cases + content[switch_close + 1 :]
        )

        return new_content

    def run(self):
        """Main interactive loop"""
        while True:
            print("\n=== Module Manager ===")
            print("1. Display modules")
            print("2. Add module")
            print("3. Remove module")
            print("4. Update case statements")
            print("5. Exit")

            choice = input("Enter your choice (1-5): ").strip()

            if choice == "1":
                self.display_modules()
            elif choice == "2":
                self.add_module()
            elif choice == "3":
                self.remove_module()
            elif choice == "4":
                if self.update_case_statements():
                    print("Case statements updated successfully!")
                else:
                    print("Failed to update case statements")
            elif choice == "5":
                print("Goodbye!")
                break
            else:
                print("Invalid choice. Please try again.")


if __name__ == "__main__":
    manager = ModuleManager()
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        if command == "display":
            manager.display_modules()
        elif command == "add":
            manager.add_module()
        elif command == "remove":
            manager.remove_module()
        elif command == "update":
            # Update case statements for all modules
            if manager.update_case_statements():
                print("Case statements updated successfully!")
            else:
                print("Failed to update case statements")
        else:
            print(f"Unknown command: {command}")
            print("Available commands: display, add, remove, update")
    else:
        manager.run()
