# Module Manager for LearnFMPA

This directory contains the module management system for the LearnFMPA application.

## Files

- `index.ts` - TypeScript module definitions and data loading functions
- `module_manager.py` - Python script for managing modules
- `test_module_manager.py` - Test script for the module manager
- `*.json` - JSON files containing module questions and data

## Module Manager Usage

The `module_manager.py` script allows you to add, remove, and display modules in the application.

### Interactive Mode

Run the script without arguments to enter interactive mode:

```bash
python3 src/data/modules/module_manager.py
```

This will show a menu with options:
1. Display modules
2. Add module
3. Remove module
4. Exit

### Command Line Mode

You can also use command line arguments:

```bash
# Display all modules
python3 src/data/modules/module_manager.py display

# Add a new module (interactive)
python3 src/data/modules/module_manager.py add

# Remove a module (interactive)
python3 src/data/modules/module_manager.py remove
```

## Testing

Use the test script to verify the module manager works correctly:

```bash
# Run complete test (add and remove)
python3 src/data/modules/test_module_manager.py test

# Only test adding
python3 src/data/modules/test_module_manager.py add

# Only test removing
python3 src/data/modules/test_module_manager.py remove
```

## JSON Structure

Each module JSON file should follow this structure:

```json
[
    {
        "YearAsked": "Normale 2022",
        "Subtopic": "Subtopic name",
        "QuestionText": "Question text here",
        "Choice_A_Text": "First option",
        "Choice_A_isCorrect": false,
        "Choice_A_Explanation": "Explanation for this option",
        "Choice_B_Text": "Second option",
        "Choice_B_isCorrect": true,
        "Choice_B_Explanation": "Explanation for this option",
        "Choice_C_Text": "Third option",
        "Choice_C_isCorrect": false,
        "Choice_C_Explanation": "Explanation for this option",
        "Choice_D_Text": "Fourth option",
        "Choice_D_isCorrect": false,
        "Choice_D_Explanation": "Explanation for this option",
        "Choice_E_Text": "",
        "Choice_E_isCorrect": false,
        "Choice_E_Explanation": "",
        "OverallExplanation": "Overall explanation for the question",
        "IsChapterStart": true,
        "ChapterName": "Chapter Name",
        "ChapterColor": "#AABFB6"
    }
]
```

## Module Properties

When adding a module, you'll need to provide:

- **Title**: The display name of the module
- **Subtitle**: Additional information (e.g., "3ème année")
- **Description**: Detailed description of the module
- **Year**: Academic year or level
- **Gradient**: CSS gradient for the module card (from predefined list or custom)
- **JSON Filename**: Name of the JSON file containing the module data

## Automatic Updates

The module manager automatically updates:
1. The modules array in `index.ts`
2. The case statements in `getModuleQuestions()` function
3. The case statements in `getModuleChapters()` function

This ensures that new modules are properly integrated into the TypeScript application without manual editing.

## Notes

- The script avoids reading large JSON files for performance
- Module IDs are automatically assigned sequentially
- The script creates sample JSON files if they don't exist
- All changes are backed up in the Git repository