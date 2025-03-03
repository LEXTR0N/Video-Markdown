# VMD Language Support for VS Code

This extension provides comprehensive language support for Video Markdown (VMD), a domain-specific language designed for creating educational videos with interactive elements.

## Features

### Syntax Highlighting
- Distinguishes different elements like scenes, slides, teleprompts, and interactive components
- Highlights markdown formatting within content
- Colorizes attributes and values in element declarations

### Intelligent Editing
- **Code Completion**: Get suggestions for elements, attributes, and values
- **Error Checking**: Validates syntax, structure, and cross-references
- **Quick Fixes**: Suggestions to fix common issues
- **Hover Information**: Shows details about elements and attributes

### Navigation & Organization
- **Document Outline**: Easily navigate through scenes and elements
- **Folding**: Collapse scenes and sections for better overview
- **Go to Definition**: Navigate to referenced elements

### Preview & Export
- **HTML Export**: Export your VMD documents to HTML


## Getting Started

1. Create a new file with the `.vmd` extension
2. Start with a YAML header:
   ```
   ---
   title = "My First VMD Document"
   author = "Your Name"
   ---
   ```
3. Add a scene and some content:
   ```
   # Scene: Introduction
   
   ## Slide (title="Welcome", lang="EN")
   - Welcome to VMD
   - A powerful format for educational videos
   
   ## Teleprompt (title="Welcome Text", lang="EN")
   Welcome to this introduction to VMD, the Video Markdown language.
   ```

## Commands

- **Preview (Ctrl+Shift+V)**: Open a preview of the current VMD document
- **Open Documentation**: Access the complete VMD documentation

## Installation

- Install directly from the VS Code Extension Marketplace
- Or download the `.vsix` file from the [GitHub repository](https://github.com/LEXTR0N/Video-Markdown.git)

## Requirements

- Visual Studio Code version 1.78.0 or higher

