# vmd-interpreter

**vmd-interpreter** is a DSL interpreter for creating educational videos. With it, you can read in a specially formatted `.vmd` file that defines scenes, slides, and other elements, and automatically generate LaTeX slides in Beamer style—based on a predefined LaTeX template (e.g., the THWS Beamer theme).

## Features

- **DSL Parsing:**  
  Reads a YAML header and multiple scenes, each containing various elements.

- **Slide Rendering:**  
  Translates slide elements into LaTeX frames, where:
  - Markdown formatting (`**bold**` and `*italic*`) is automatically converted to LaTeX commands.
  - Empty lines in slides are replaced with small line breaks (`\\`) to maintain consistent layout.
  - Checks if all slides have a valid `lang` attribute; for multilingual content, separate LaTeX files (e.g., for DE and EN) are generated.

- **Placeholders for Additional Elements:**  
  Teleprompt, button, and code elements are parsed and passed to their own stub methods so they can be processed separately later. Button elements are currently not included in the LaTeX output.

## Installation

Requirements:
- Python 3.8 or higher

   ```bash
   git clone https://github.com/LEXTR0N/Video-Markdown.git
   cd vmd-interpreter
   ```

## Usage
Create a DSL file with the extension .vmd (e.g., sample.vmd). Example content:

```Markdown
---
title = "Example Presentation"
author = "Your Name"
---

# Scene: A Module in a Study Program

## Slide (title="A Module in a Study Program", lang="EN")
- Complete topic in your degree program
- Opportunity to acquire knowledge and experience  
- Didactic preparation by teachers
- Performance assessment in the form of an exam
```

### Execution
```bash
python -m vmd_interpreter.main examples/sample.vmd
```

If all slides have a valid lang attribute and more than one language is present (e.g., DE and EN), separate output files (e.g., sample_DE_output.tex and sample_EN_output.tex) will be generated.
Otherwise, a single LaTeX file (e.g., sample_output.tex) is created.