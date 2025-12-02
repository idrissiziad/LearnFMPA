#!/usr/bin/env python3
"""
Test script for the Module Manager
This script tests adding a module with the simplified JSON structure
"""

import sys
import os
from pathlib import Path

# Add the current directory to the path so we can import module_manager
sys.path.insert(0, str(Path(__file__).parent))

from module_manager import ModuleManager

def test_add_module():
    """Test adding a module with predefined values"""
    manager = ModuleManager()
    
    # Create a test module
    test_module = {
        'id': manager.get_next_id(),
        'title': 'Test Module',
        'subtitle': 'Test Year',
        'description': 'This is a test module for validation',
        'year': 'Test Year',
        'gradient': 'from-blue-400 to-blue-600'
    }
    
    # Create a test JSON file using the simplified structure
    test_json_path = Path(__file__).parent / "Test Module.json"
    
    # Copy the simplified structure from the copy file
    import json
    with open(Path(__file__).parent / "Pathologie digestive (Copy).json", 'r', encoding='utf-8') as f:
        test_data = json.load(f)
    
    # Modify the test data slightly
    test_data[0]["Subtopic"] = "Test Subtopic"
    test_data[0]["ChapterName"] = "Test Chapter"
    
    # Write the test JSON file
    with open(test_json_path, 'w', encoding='utf-8') as f:
        json.dump(test_data, f, indent=2, ensure_ascii=False)
    
    print(f"Created test JSON file: {test_json_path}")
    
    # Add the module to the manager
    manager.modules.append(test_module)
    
    # Update the index file
    if manager.update_index_file():
        print("✓ Module added successfully!")
        print(f"✓ Module ID: {test_module['id']}")
        print(f"✓ Module Title: {test_module['title']}")
        print(f"✓ JSON File: Test Module.json")
        
        # Display current modules
        print("\n=== Current Modules ===")
        manager.display_modules()
        
        return True
    else:
        print("✗ Failed to add module")
        return False

def test_remove_module():
    """Test removing the test module"""
    manager = ModuleManager()
    
    # Find the test module (assuming it has title 'Test Module')
    test_module = None
    for module in manager.modules:
        if module.get('title') == 'Test Module':
            test_module = module
            break
    
    if not test_module:
        print("✗ Test module not found")
        return False
    
    # Remove the module
    manager.modules = [m for m in manager.modules if m.get('title') != 'Test Module']
    
    # Update the index file
    if manager.update_index_file():
        print("✓ Test module removed successfully!")
        
        # Remove the test JSON file
        test_json_path = Path(__file__).parent / "Test Module.json"
        if test_json_path.exists():
            test_json_path.unlink()
            print(f"✓ Removed test JSON file: {test_json_path}")
        
        # Display current modules
        print("\n=== Current Modules ===")
        manager.display_modules()
        
        return True
    else:
        print("✗ Failed to remove module")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        if command == "add":
            test_add_module()
        elif command == "remove":
            test_remove_module()
        elif command == "test":
            print("=== Testing Module Manager ===")
            print("\n1. Adding test module...")
            if test_add_module():
                print("\n2. Removing test module...")
                test_remove_module()
            print("\n=== Test Complete ===")
        else:
            print(f"Unknown command: {command}")
            print("Available commands: add, remove, test")
    else:
        print("Usage: python test_module_manager.py [add|remove|test]")