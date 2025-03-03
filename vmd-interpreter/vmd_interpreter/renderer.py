# vmd_interpreter/renderer.py

import re
from .dsl_ast import AST, Scene, Element

class DSLRenderer:
    def __init__(self, ast: AST, target_lang=None):
        """
        target_lang: Falls angegeben, werden nur Slides gerendert, deren lang-Attribut
                     mit target_lang übereinstimmt.
        """
        self.ast = ast
        self.target_lang = target_lang
        self.output_lines = []

    def render(self) -> str:
        self.render_header()
        for scene in self.ast.scenes:
            self.render_scene(scene)
        self.output_lines.append("\\end{document}")
        return "\n".join(self.output_lines)

    def render_header(self):
        header = self.ast.header
        self.output_lines.append("% Generierte LaTeX-Präsentation")
        self.output_lines.append("\\documentclass[aspectratio=169]{beamer}")
        self.output_lines.append("\\usepackage{thwsbeamertheme}")
        self.output_lines.append(f"\\title{{{header.title}}}")
        self.output_lines.append(f"\\author{{{header.author}}}")
        self.output_lines.append("\\begin{document}")
        self.output_lines.append("\\begin{frame}")
        self.output_lines.append("\\titlepage")
        self.output_lines.append("\\end{frame}")
        self.output_lines.append("")  # Trennung

    def render_scene(self, scene: Scene):
        self.output_lines.append(f"% Scene: {scene.title}")
        for element in scene.elements:
            self.render_element(element)
        self.output_lines.append("")  # Trennung

    def render_element(self, element: Element):
        t = element.type.lower()
        if t == "slide":
            # Überprüfe Sprache, wenn target_lang gesetzt ist:
            lang = element.parameters.get("lang")
            if self.target_lang and lang != self.target_lang:
                return  # Dieses Slide wird nicht gerendert
            self.render_slide(element)
        elif t == "teleprompt":
            # Escape ampersand in titles
            title = element.parameters.get('title', 'Kein Titel').replace('&', '\\&')
            self.output_lines.append(f"% TODO: Teleprompt-Element wird in LaTeX nicht dargestellt")
            self.output_lines.append(f"% Titel: {title}")
            pass
        elif t == "code":
            # Code-Elemente werden als Platzhalter dargestellt
            self.render_code_placeholder(element)
        elif t == "video" or t == "screencast":
            # Video/Screencast-Elemente werden nicht in LaTeX gerendert
            self.output_lines.append(f"% TODO: {t.capitalize()}-Element wird in LaTeX nicht dargestellt")
            source = element.parameters.get('source', 'Keine Quelle angegeben').replace('&', '\\&')
            self.output_lines.append(f"% Quelle: {source}")
            pass
        elif t == "quiz":
            # Quiz-Elemente werden nicht in LaTeX gerendert
            self.output_lines.append(f"% TODO: Quiz-Element wird in LaTeX nicht dargestellt")
            name = element.parameters.get('name', 'Kein Name').replace('&', '\\&')
            self.output_lines.append(f"% Name: {name}")
            pass
        # Button-Elemente werden komplett ignoriert (nicht in LaTeX einfügen, nicht einmal als Kommentar)
        else:
            # Unbekannte Elementtypen als Kommentar einfügen
            self.output_lines.append(f"% Unbekanntes Element-Typ: {t}")
            pass

    def apply_markdown_formatting(self, text: str) -> str:
        # First remove all [!name] patterns
        text = re.sub(r'\[![\w:,-]+\]', '', text)
        
        # Then apply standard markdown formatting
        # **Text** -> \textbf{Text}
        text = re.sub(r'\*\*(.+?)\*\*', r'\\textbf{\1}', text)
        # *Text* -> \textit{Text}
        text = re.sub(r'\*(.+?)\*', r'\\textit{\1}', text)
        
        # Escape ampersands
        text = text.replace('&', '\\&')
        
        return text

    def render_code_placeholder(self, element: Element):
        """Rendert einen Platzhalter für Code-Elemente"""
        snippet_name = element.parameters.get("snippet", "Code").replace('&', '\\&')
        self.output_lines.append("\\begin{frame}[fragile]")
        self.output_lines.append("  \\frametitle{Code: " + snippet_name + "}")
        
        # Grauer Box mit "not available now" Text
        self.output_lines.append("  \\begin{center}")
        self.output_lines.append("    \\colorbox{gray!20}{\\begin{minipage}{0.9\\textwidth}")
        self.output_lines.append("      \\vspace{1em}")
        self.output_lines.append("      \\centering")
        self.output_lines.append("      \\textbf{Code-Snippet not implemented}")
        self.output_lines.append("      \\vspace{1em}")
        self.output_lines.append("    \\end{minipage}}")
        self.output_lines.append("  \\end{center}")
        
        self.output_lines.append("\\end{frame}")

    def render_slide(self, element: Element):
        title = element.parameters.get("title", "Slide").replace('&', '\\&')
        self.output_lines.append("\\begin{frame}[fragile]")
        self.output_lines.append(f"  \\frametitle{{{title}}}")
        self.output_lines.append("  % Slide content:")
        
        # Prüfe, ob die Folie Spalten enthält
        lines = element.content.splitlines()
        columns = []
        column_widths = []
        
        # Erste Prüfung auf Columns
        for line in lines:
            if line.lstrip().startswith("### column") or line.lstrip().startswith("### Column"):
                # Spalte gefunden
                width_match = re.search(r'width\s*=\s*(\d+)', line, re.IGNORECASE)
                if width_match:
                    columns.append(line)
                    column_widths.append(int(width_match.group(1)))
        
        # Wenn mehr als eine Spalte gefunden wurde, verarbeite sie speziell
        if len(columns) >= 2:
            # Berechne proportionale Breiten
            total_width = sum(column_widths)
            proportional_widths = [w / total_width for w in column_widths]
            
            # Sammle Inhalt für jede Spalte
            column_contents = [[] for _ in range(len(columns))]
            current_column_idx = -1
            
            for line in lines:
                # Neue Spalte beginnt
                if line.lstrip().startswith("### column") or line.lstrip().startswith("### Column"):
                    current_column_idx += 1
                    continue
                
                # Wenn wir in einer Spalte sind, sammeln wir den Inhalt
                if current_column_idx >= 0 and current_column_idx < len(column_contents):
                    column_contents[current_column_idx].append(line)
            
            # Starte die Spaltendefinition mit Top-Alignment
            self.output_lines.append("  \\begin{columns}[t]")
            
            # Jetzt rendern wir jede Spalte
            for idx, content in enumerate(column_contents):
                width_percentage = proportional_widths[idx]
                self.output_lines.append(f"  \\begin{{column}}{{.{int(width_percentage * 100)}\\textwidth}}")
                
                # Verarbeite den Inhalt dieser Spalte
                in_itemize = False
                for line in content:
                    # Ignoriere Button- und andere spezielle Zeilen
                    if line.lstrip().startswith("###") and "Button" in line:
                        continue
                        
                    # Code-Box für "### Code" Zeilen einfügen
                    if line.lstrip().startswith("###") and "Code" in line:
                        # Schließe vorherige Itemize-Umgebung wenn nötig
                        if in_itemize:
                            self.output_lines.append("    \\end{itemize}")
                            in_itemize = False
                        
                        # Füge Code-Box ein
                        self.output_lines.append("    \\begin{center}")
                        self.output_lines.append("      \\colorbox{gray!20}{\\begin{minipage}{0.9\\textwidth}")
                        self.output_lines.append("        \\vspace{1em}")
                        self.output_lines.append("        \\centering")
                        self.output_lines.append("        \\textbf{Code-Snippet not implemented}")
                        self.output_lines.append("        \\vspace{1em}")
                        self.output_lines.append("      \\end{minipage}}")
                        self.output_lines.append("    \\end{center}")
                        continue
                        
                    # Bilder einfügen
                    if line.lstrip().startswith("###") and "Image" in line:
                        # Quelle des Bildes extrahieren
                        source_match = re.search(r'source\s*=\s*[\'"](.*?)[\'"]', line)
                        if source_match:
                            image_source = source_match.group(1)
                            # Schließe vorherige Itemize-Umgebung wenn nötig
                            if in_itemize:
                                self.output_lines.append("    \\end{itemize}")
                                in_itemize = False
                            
                            # Füge Bild ein
                            self.output_lines.append("    \\begin{center}")
                            self.output_lines.append(f"      \\includegraphics[width=0.7\\textwidth]{{{image_source}}}")
                            self.output_lines.append("    \\end{center}")
                        continue
                        
                    # Aufzählungspunkte - entweder mit direktem "-" Start oder mit "[!bullet]" Präfix
                    if line.lstrip().startswith("-") or re.search(r'\[![\w:,-]+\]\s*-', line):
                        # Entferne [!bullet] falls vorhanden
                        if "[!" in line:
                            bullet_text = re.sub(r'\[![\w:,-]+\]\s*-', '', line.lstrip()).strip()
                        else:
                            bullet_text = line.lstrip()[1:].strip()
                        
                        bullet_text = self.apply_markdown_formatting(bullet_text)
                        if not in_itemize:
                            self.output_lines.append("    \\begin{itemize}")
                            in_itemize = True
                        self.output_lines.append(f"      \\item {bullet_text}")
                    else:
                        # Schließe itemize wenn nötig
                        if in_itemize:
                            self.output_lines.append("    \\end{itemize}")
                            in_itemize = False
                        
                        # Verarbeite andere Inhalte
                        formatted_line = self.apply_markdown_formatting(line)
                        if formatted_line.strip() == "":
                            self.output_lines.append("    \\vspace{1em}")
                        else:
                            self.output_lines.append(f"    {formatted_line}")
                
                # Schließe letzte itemize-Umgebung falls nötig
                if in_itemize:
                    self.output_lines.append("    \\end{itemize}")
                    
                # Schließe die Spalte
                self.output_lines.append("  \\end{column}")
            
            # Schließe die Spalten-Umgebung
            self.output_lines.append("  \\end{columns}")
        
        # Keine Spalten gefunden oder nur eine Spalte - normales Rendering
        else:
            in_itemize = False
            for line_idx, line in enumerate(lines):
                # Ignoriere Button-Zeilen und Column-Definitionen
                if (line.lstrip().startswith("###") and "Button" in line) or \
                   (line.lstrip().startswith("###") and ("column" in line.lower() or "Column" in line)):
                    continue
                    
                # Bilder einfügen
                if line.lstrip().startswith("###") and "Image" in line:
                    # Quelle des Bildes extrahieren
                    source_match = re.search(r'source\s*=\s*[\'"](.*?)[\'"]', line)
                    if source_match:
                        image_source = source_match.group(1)
                        # Schließe vorherige Itemize-Umgebung wenn nötig
                        if in_itemize:
                            self.output_lines.append("  \\end{itemize}")
                            in_itemize = False
                        
                        # Füge Bild ein
                        self.output_lines.append("  \\begin{center}")
                        self.output_lines.append(f"    \\includegraphics[width=0.7\\textwidth]{{{image_source}}}")
                        self.output_lines.append("  \\end{center}")
                    continue
                    
                # Code-Box für "### Code" Zeilen einfügen
                if line.lstrip().startswith("###") and "Code" in line:
                    # Schließe vorherige Itemize-Umgebung wenn nötig
                    if in_itemize:
                        self.output_lines.append("  \\end{itemize}")
                        in_itemize = False
                    
                    # Füge Code-Box ein
                    self.output_lines.append("  \\begin{center}")
                    self.output_lines.append("    \\colorbox{gray!20}{\\begin{minipage}{0.9\\textwidth}")
                    self.output_lines.append("      \\vspace{1em}")
                    self.output_lines.append("      \\centering")
                    self.output_lines.append("      \\textbf{Code-Snippet not implemented}")
                    self.output_lines.append("      \\vspace{1em}")
                    self.output_lines.append("    \\end{minipage}}")
                    self.output_lines.append("  \\end{center}")
                    continue
                
                # Aufzählungspunkte - mit direktem "-" Start oder mit "[!bullet]" Präfix
                if line.lstrip().startswith("-") or re.search(r'\[![\w:,-]+\]\s*-', line):
                    # Entferne [!bullet] falls vorhanden
                    if "[!" in line:
                        bullet_text = re.sub(r'\[![\w:,-]+\]\s*-', '', line.lstrip()).strip()
                    else:
                        bullet_text = line.lstrip()[1:].strip()
                    
                    bullet_text = self.apply_markdown_formatting(bullet_text)
                    if not in_itemize:
                        self.output_lines.append("  \\begin{itemize}")
                        in_itemize = True
                    self.output_lines.append(f"    \\item {bullet_text}")
                # Leere Zeilen oder andere Inhalte
                else:
                    if in_itemize:
                        self.output_lines.append("  \\end{itemize}")
                        in_itemize = False
                    
                    formatted_line = self.apply_markdown_formatting(line)
                    if formatted_line.strip() == "":
                        # Vollständige Leerzeile einfügen (statt eines kleinen Abstands)
                        self.output_lines.append("  \\vspace{1em}")
                    else:
                        self.output_lines.append(f"  {formatted_line}")
            
            if in_itemize:
                self.output_lines.append("  \\end{itemize}")
        
        self.output_lines.append("\\end{frame}")
