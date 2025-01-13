# Video-Markdown – Anleitung

Diese Sprache wurde entwickelt, um **Lehrvideos** in einer strukturierten Art Drehbuch zu beschreiben. Das Ziel ist, dass anschließend ein **Python-Skript** diese Datei einliest und Sie bei der Erstellung von Lehrvideos unterstützt.

## Inhaltsübersicht

1. [Aufbau der DSL](#aufbau-der-dsl)
2. [YAML-Header](#yaml-header)
3. [Strukturierung mit Szenen](#strukturierung-mit-szenen)
4. [Inhalte in Szenen](#inhalte-in-szenen)
   - [Slides](#slides)
   - [Teleprompt](#teleprompt)
   - [Quiz](#quiz)
   - [Screencast](#screencast)
   - [Code Snippet](#code-snippet)
   - [Video](#video)
   - [Image](#image)
5. [Buttons und Inline-Kommandos](#buttons-und-inline-kommandos)
6. [Mehrsprachige Inhalte](#mehrsprachige-inhalte)
7. [Beispiel-Workflow](#beispiel-workflow)
8. [Tipps & Tricks](#tipps--tricks)

---

## Aufbau der DSL

1. **Markdown als Basis**  
   Diese DSL ist eine **Erweiterung** des normalen Markdown. Das bedeutet, dass Sie die Standard-Syntax von Markdown sowie HTML verwenden können, um Texte zu formatieren (Listen, Fettschrift, Kursiv, usw.).

2. **Zusätzliche Keywords**  
   Für video-spezifische Funktionen wie Szenen, Folien (Slides), Teleprompts, Quizzes und mehr gibt es zusätzliche Markdown-ähnliche Keywords und Attribute.

---

## YAML-Header

Ganz am Anfang der Datei steht ein YAML-Header (auch „Front Matter“ genannt). In diesem werden der Titel des zu erstellenden Videos, der Autor und der Pfad zur Style-Datei festgelegt.

```yaml
---
title: "Lerntechniken für den Flipped Classroom"
author: "Prof. Dr. Peter Braun"
style: "style.css"
---
```

- **title**: Gibt dem gesamten Video einen Titel.
- **author**: Name des Erstellers.
- **style**: Verweist auf eine externe Style-Datei in CSS.
---

## Strukturierung mit Szenen

Jedes Lehrvideo wird in **mehrere Szenen** aufgeteilt. Eine Szene entspricht einem **größeren inhaltlichen Abschnitt** oder Kapitel Ihres Videos.

```markdown
# Scene: Lernziele
```

- Sie schreiben eine **Heading 1** (`#`) mit dem Keyword `Scene:` und anschließendem Namen.
- Alle Inhalte die bis zur nächsten `# Scene:` Überschrift folgen, gehören zu **dieser** Szene.

---

## Inhalte in Szenen

Innerhalb einer Szene können Sie folgende Elemente platzieren:

### Slides

Mit `## Slide (titel="...", lang="DE")` definieren Sie Folieninhalte (z. B. Stichpunkte). Beispiel:

```markdown
## Slide (titel="Ein Modul in einem Studium", lang="DE")
- Abgeschlossenes Thema in Ihrem Studiengang
- Angebot zum Erwerb von Wissen und Erfahrungen
- Didaktische Aufbereitung durch die Lehrenden
```

**Attribute**:

- `titel="..."`: Titel der Folie.
- `lang="DE"` (oder `"EN"`): Sprachangabe.

**Wichtig**: In jeder Szene darf es **nur ein** Slide, Screencast oder Video geben. Diese Elemente sind die zentralen Anzeigeelemente der Szene.

**Untergeordnete Elemente**:  
- **Code-Snippets**, **Buttons**, **Columns** und **Images** sind den Slides untergeordnet und werden innerhalb der Slide-Definition platziert.

Beispiel:

```markdown
## Slide (titel="Code Snippet Beispiel", lang="DE")
- Beispiel für eine Funktion

### Code (snippet="beispielCode")

### Button (name="buttonBeispiel", label="Mehr Info", action="https://example.com", time="AM")
```

---

### Teleprompt

Mit `## Teleprompt (titel="...", lang="DE")` definieren Sie den **Sprechtext** für den Vortragenden. Beispiel:

```markdown
## Teleprompt (titel="Lernziele", lang="DE")
Liebe Studierende, herzlich willkommen ...
```

**Attribute**:

- `titel="..."`: Titel oder Überschrift, z. B. passend zum Slide.
- `lang="..."`: Sprachangabe.

**Wichtig**: In jeder Szene gibt es **nur einen** Teleprompt.

---

### Quiz

Mit `## Quiz (name="quiz1", titel="Flipped Classroom Verständnis")` definieren Sie ein interaktives Quiz. Typischerweise folgen darunter „Fragen“, die Sie mit `###` kennzeichnen:

```markdown
## Quiz (name="quiz1", titel="Flipped Classroom Verständnis")

### Was ist 2 x 3?
- 4
- 9
+ 6
- 12
```

- **`+`** kennzeichnet richtige Antworten, **`-`** falsche.
- **name** (z. B. `"quiz1"`) dient dem internen Verweis, um das Quiz evtl. an anderer Stelle einzublenden: `[!start:quiz1]`.
- **titel**: Beschreibt den Quiz-Titel oder das Thema.

**Wichtig**: Quizzes sind optional und können in einer Szene vorhanden sein oder auch nicht.

---

### Screencast

Mit `## Screencast (source="screencast.mp4")` binden Sie einen Videoclip ein, im Unterschied zum **Video** wird hier eine kleine Animation eingeblendet um dem Zuschauer zu verdeutlichen, dass es sich um einen Screencast handelt:

```markdown
## Screencast (source="screencast.mp4")
```

- **source**: Der Pfad oder Dateiname des Screencasts (z. B. `screencast.mp4`).

**Wichtig**: In jeder Szene darf es **nur ein** Screencast, Slide, Video oder Image geben.

---

### Code Snippet

Um Code-Beispiele zu integrieren (z. B. für Programmierkurse), nutzen Sie:

```markdown
### Code (snippet="gcdFunction")
```

- **snippet="gcdFunction"**: Eindeutiger Name für das Code-Beispiel.
- Im Teleprompt können Sie über `[!line:gcdFunction-start]` oder Ähnliches auf einzelne Code-Zeilen verweisen.
---

### Video

Mit `## Video (source="video.mp4")` binden Sie ein Video ein:

```markdown
## Video (source="video.mp4")
```

- **source**: Der Pfad oder Dateiname des Videos (z. B. `video.mp4`).

**Wichtig**: In jeder Szene darf es **nur ein** Screencast, Slide, Video oder Image geben.

---

### Image

Mit `### Image (source="image.png")` fügen Sie ein Bild ein:

```markdown
### Image (source="image.png")
```

- **source**: Der Pfad oder Dateiname des Bildes (z. B. `image.png`).

**Hinweis**: Bilder sind den Slides untergeordnet und werden innerhalb der Folie angezeigt.

---

## Buttons und Inline-Kommandos

### Buttons

Ein **Button** kann definiert werden (z. B. um einen Link aufzurufen oder zu einer anderen Szene zu springen):

```markdown
### Button (name="button1", label="Git-Repo", action="https://github.de", time="AM")
```

- **name**: Eindeutige Kennung (z. B. `"button1"`).
- **label**: Text, der auf dem Button angezeigt wird.
- **action**: Entweder eine URL (`"https://..."`) oder ein Szenenwechsel (`"scene: <Szenenname>"`).
- **time**: Optionale Zeitangabe (z. B. `"AM"`), wann/wo der Button sichtbar wird.


## Mehrsprachige Inhalte

Die DSL ermöglicht es, **Slides**, **Teleprompts** und andere Inhalte in verschiedenen Sprachen zu hinterlegen, z. B.:

```markdown
## Slide (titel="A module in a course of study", lang="EN")
- Completed topic in your course of study
```

Das Drehbuch kann auch ohne das Attribut "lang" nur in einer Sprache erstellt werden.

---