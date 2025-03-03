# vmd_interpreter/parser.py

import re
from .dsl_ast import Header, Element, Scene, AST
from typing import List

class DSLParser:
    def __init__(self, input_text: str):
        self.input_text = input_text

    def parse(self) -> AST:
        header = self.parse_header()
        scenes = self.parse_scenes()
        return AST(header=header, scenes=scenes)

    def parse_header(self) -> Header:
        header_pattern = r'^---\s*(.*?)\s*---'
        match = re.search(header_pattern, self.input_text, re.DOTALL | re.MULTILINE)
        header_data = {}
        if match:
            header_content = match.group(1)
            for line in header_content.splitlines():
                if '=' in line:
                    key, value = line.split('=', 1)
                    header_data[key.strip()] = value.strip().strip('"')
        return Header(
            title=header_data.get("title", "Untitled"),
            author=header_data.get("author", "Unknown"),
            style=header_data.get("style", "")
        )

    def parse_scenes(self) -> List[Scene]:
        # Die Szenen werden am Marker "# Scene:" getrennt.
        scene_pattern = r'# Scene:\s*(.*)'
        scene_splits = re.split(scene_pattern, self.input_text)
        scenes = []
        # Die Aufteilung liefert z.B.: [Text vor erster Szene, Szene-Titel1, Szene-Content1, Szene-Titel2, Szene-Content2, ...]
        for i in range(1, len(scene_splits), 2):
            scene_title = scene_splits[i].strip()
            scene_content = scene_splits[i+1]
            scene = Scene(title=scene_title, elements=self.parse_elements(scene_content))
            scenes.append(scene)
        return scenes

    def parse_elements(self, scene_text: str) -> List[Element]:
        elements = []
        # Ein Element beginnt mit einer Zeile, die mit "##" gefolgt vom Elementtyp startet.
        element_pattern = r'^(##\s*(\w+)(?:\s*\((.*?)\))?)\s*$'
        lines = scene_text.splitlines()
        current_element = None
        current_lines = []
        for line in lines:
            match = re.match(element_pattern, line.strip())
            if match:
                # Falls bereits ein Element begonnen hat, wird es abgeschlossen.
                if current_element:
                    element = Element(
                        type=current_element['type'],
                        parameters=current_element['parameters'],
                        content="\n".join(current_lines).strip()
                    )
                    elements.append(element)
                # Neues Element initialisieren
                element_type = match.group(2)
                params_str = match.group(3)
                parameters = {}
                if params_str:
                    # Erwartetes Format: key="value", key2="value2", ...
                    for param in params_str.split(','):
                        if '=' in param:
                            k, v = param.split('=', 1)
                            parameters[k.strip()] = v.strip().strip('"')
                current_element = {'type': element_type, 'parameters': parameters}
                current_lines = []
            else:
                if current_element is not None:
                    current_lines.append(line)
        # Das letzte Element hinzufügen
        if current_element:
            element = Element(
                type=current_element['type'],
                parameters=current_element['parameters'],
                content="\n".join(current_lines).strip()
            )
            elements.append(element)
        return elements
