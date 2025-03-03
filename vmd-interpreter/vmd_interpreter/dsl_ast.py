# vmd_interpreter/dsl_ast.py

from dataclasses import dataclass, field
from typing import List, Dict

@dataclass
class Header:
    title: str
    author: str
    style: str

@dataclass
class Element:
    type: str                  # z.B. "Slide", "Teleprompt", etc.
    parameters: Dict[str, str] # Parameter wie title, lang etc.
    content: str               # Der Inhalt (Text, Bullet-Points, etc.)

@dataclass
class Scene:
    title: str
    elements: List[Element] = field(default_factory=list)

@dataclass
class AST:
    header: Header
    scenes: List[Scene] = field(default_factory=list)
