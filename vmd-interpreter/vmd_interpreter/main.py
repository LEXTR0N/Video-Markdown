# vmd_interpreter/main.py

import sys
import os
from vmd_interpreter.parser import DSLParser
from vmd_interpreter.renderer import DSLRenderer

def main():
    if len(sys.argv) < 2:
        print("Usage: python -m vmd_interpreter.main <path_to_vmd_file>")
        sys.exit(1)
    
    vmd_file = sys.argv[1]
    try:
        with open(vmd_file, "r", encoding="utf-8") as f:
            dsl_text = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)
    
    # Parsen des DSL-Codes
    parser = DSLParser(dsl_text)
    ast = parser.parse()

    # Überprüfe, ob alle Slide-Elemente ein gültiges lang-Attribut haben und sammle die Sprachen.
    languages = set()
    for scene in ast.scenes:
        for element in scene.elements:
            if element.type.lower() == "slide":
                lang = element.parameters.get("lang")
                if not lang:
                    print("Error: Slide missing 'lang' attribute!")
                    sys.exit(1)
                languages.add(lang)

    if len(languages) > 1:
        # Mehrsprachigkeit: Für jede Sprache wird ein eigener Output erzeugt.
        for lang in languages:
            renderer = DSLRenderer(ast, target_lang=lang)
            output = renderer.render()
            
            # Erstelle den Ausgabepfad
            output_file = os.path.splitext(vmd_file)[0] + f"_{lang}_output.tex"
            
            # Schreibe die Ausgabe
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(output)
            print(f"LaTeX output written to {output_file}")
    else:
        # Nur eine Sprache: Ein einzelner Output.
        renderer = DSLRenderer(ast, target_lang=None)
        output = renderer.render()
        
        # Erstelle den Ausgabepfad
        output_file = os.path.splitext(vmd_file)[0] + "_output.tex"
        
        # Schreibe die Ausgabe
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(output)
        print(f"LaTeX output written to {output_file}")

if __name__ == "__main__":
    main()