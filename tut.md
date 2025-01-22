/*
Dies ist eine Beispiel-Datei im Format ".vmd" (Video Markdown).
Sie beschreibt ein Lehrvideo mit mehreren "Scenes".

In dieser DSL (Domain Specific Language) gelten unter anderem folgende Regeln:

1. Jede Scene wird mit "# Scene: ..." eingeleitet.
2. In jeder Scene MUSS GENAU EIN "Hauptelement" stehen.
   - Mögliche Hauptelemente:
       a) Slide (title="...", lang="...")
       b) Video (source="...", lang="...")
       c) Screencast (source="...", lang="...")
3. Jede Scene DARF optional:
   - genau EIN Teleprompt (## Teleprompt (title="...", lang="..."))
   - beliebig viele Quizze (## Quiz (name="...", [time="..."], lang="..."))
   enthalten.
4. Innerhalb einer Slide können zusätzlich Bilder (### Image), Buttons (### Button),
   Code-Snippets (### Code (snippet="...")) und Spalten (### column (width=...)) genutzt werden.
   Normale Markdown-Formatierungen (**fett**, *kursiv*, Listen etc.) sind erlaubt.
5. Das Attribut "lang" (z.B. lang="DE", lang="EN") ist optional, kann jedoch
   verwendet werden, um mehrsprachige Inhalte anzubieten. Sobald man "lang"
   in einem Element (Slide, Teleprompt, Video, Quiz, Screencast) nutzt, sollte
   man für jede Sprache eine eigene Variante angeben.
6. Button-Attribut "action" ist Pflicht. Zusätzlich muss entweder "time" ODER "name"
   angegeben werden:
   - time="s" (start)
   - time="e" (end)
   - time="m" (middle)
   - time="sm" (start to middle)
   - time="se" (start to end)
   - time="me" (middle to end)
   - time="x,y" (z.B. "2,7" -> Start bei 2s, Ende bei 7s)
   - name="..." (z.B. name="button1"), wodurch der Button per [!show:button1] 
     oder [!hide:button1] im Teleprompter-Text eingeblendet wird.
7. Quiz kann ebenfalls ein "time"-Attribut haben (time="s", "m", "e") oder
   ein "name"-Attribut (name="quiz1"). Bei "name" kann man das Quiz per
   [!quiz:quiz1] im Teleprompter-Text genau dort aufrufen, wo es benötigt wird.
8. Code-Snippets:
   - "### Code (snippet='gcdFunction')" deklariert ein Code-Snippet unter dem Namen "gcdFunction".
   - Im Teleprompt-Text können bestimmte Zeilen dieses Snippets mit 
     "[!line:gcdFunction-<Bezeichner>]" referenziert und hervorgehoben werden,
     z.B. [!line:gcdFunction-start], [!line:gcdFunction-call], [!line:gcdFunction-return].
9. [!Element] Marker:
   - [!show:button1], [!hide:button1] zeigt oder verbirgt einen Button mit name="button1".
   - [!quiz:quizName] zeigt das Quiz "quizName".
   - [!bullet0], [!bullet1], etc. können Bullet-Punkte in Slides markieren, die dann
     zeitversetzt eingeblendet werden.
   - "[!line:...]" kann Code-Zeilen in Snippets referenzieren.
   - Sinn dieser Marker: Interaktivität und zeitgesteuerte Einblendungen.
*/

/*
-----------------------------------------------------------
  YAML-Header: Enthält Titel, Autor und Stylesheet-Referenz
-----------------------------------------------------------
*/
---
title: "Beispiel-Video für unsere DSL"
author: "Dr. Muster"
style: "style.css"
---


/*
-------------------------
  SCENE 1
  Hauptelement: Slide
-------------------------
*/

# Scene: Grundlagen der DSL

## Slide (title="Grundlagen der DSL", lang="DE")
Willkommen zur ersten **Szene**.  

### column (width=50)
[!bullet0] - **DSL** steht für *Domain Specific Language*  
[!bullet1] - Sie dient zum Beschreiben interaktiver Lehrvideos  

### column (width=50)
- Ein **Slide** Abschnitt repräsentiert eine Folie  
- **Markdown**-Formatierungen sind hier erlaubt  

### Button (time="s", label="Git-Repo Start", action="https://github.com")
/*
- time="s" bedeutet, dass dieser Button von Anfang (Start) an sichtbar ist.
- action="..." ist Pflicht und verweist auf das gewünschte Ziel.
*/

## Teleprompt (title="Sprechertext Szene 1", lang="DE")
Liebe Studierende, in dieser ersten Szene zeigen wir die grundsätzliche Funktionsweise unserer DSL.
Wir haben hier zwei Bullet-Punkte definiert, die wir **dynamisch** einblenden können.  

[!show:bullet0] Dieser Bullet wird nun eingeblendet! [!show:bullet1] Und dieser zweite ebenfalls. 
 

Außerdem haben wir einen Button, der von Beginn an angezeigt wird.  
In der nächsten Szene sehen wir dann weitere Elemente.  


/*
---------------------------
  SCENE 2
  Hauptelement: Slide
---------------------------
*/

# Scene: Weitere Beispiele auf einer Slide

## Slide (title="Erweiterte DSL-Elemente", lang="DE")
Hier ist unsere zweite **Szene** als Slide.  

### Code (snippet="calculateSum")
/* 
  Ein Code-Snippet. Mit [!line:calculateSum-<Marker>] 
  könnte man bestimmte Zeilen referenzieren.
*/


### Image (source="flower.png")
Hier könnte ein beliebiges Bild eingefügt werden, z.B. eine **Blume** oder ein Diagramm.

### Button (name="myButton", label="Nächste Szene", action="scene: Kurzes Video")
/*
- Anstelle von time="..." verwenden wir hier "name='myButton'".
- Dieser Button kann per [!show:myButton] oder [!hide:myButton]
  im Teleprompter-Text ein-/ausgeblendet werden.
*/

## Quiz (name="quizScene2", title="DSL-Fragen")
### Wofür steht DSL?
- Dynamic Slide Layout
+ Domain Specific Language
- Deutscher Sprachen Lehrplan

## Teleprompt (title="Sprechertext Szene 2", lang="DE")
In dieser zweiten Szene haben wir neben einem **Code-Snippet** und einem **Bild** 
auch einen Button mit dem Namen "myButton" sowie ein Quiz definiert.  

Wir können jetzt gezielt den Button einblenden: [!show:myButton]  
Und wir können auch das Quiz einblenden: [!quiz:quizScene2]  

Hier sehen Sie beispielsweise, dass wir bestimmte Zeilen im CodeSnippet markieren könnten:  
[!line:calculateSum-start] markiert die Zeile "start"
[!line:calculateSum-end] markiert entsprechend das Zeilenende.  

Diese können wir während der Präsentation dynamisch hervorheben, 
damit die Zuschauer im richtigen Moment den Code-Teil fokussiert sehen.  


/*
-------------------------
  SCENE 3
  Hauptelement: Video
-------------------------
*/

# Scene: Kurzes Video

## Video (source="intro.mp4", lang="DE")
/*
- Hauptelement dieser Szene ist ein Video.
- Wir könnten hier z.B. time="m" hinzufügen, wenn wir das Video
  nur in der Mitte einblenden wollen. 
*/

## Quiz (time="m", name="quizScene3", title="Verständnisfragen zum Video")
### Wurde das Video abgespielt?
+ Ja
- Nein
- Vielleicht

/*
- time="m" bedeutet, dieses Quiz erscheint "in der Mitte" (middle) des Videos.
*/

## Teleprompt (title="Sprechertext Szene 3", lang="DE")
Hier sehen Sie ein kurzes Video. Schauen Sie es sich bitte an.  
Das Quiz zum Video wird ab der **Mitte** angezeigt.  

Wenn Sie möchten, können Sie jetzt schon Ihre Gedanken notieren oder auf das Quiz warten.  


/*
-------------------------
  SCENE 4
  Hauptelement: Screencast
-------------------------
*/

# Scene: Screencast Demonstration

## Screencast (source="screencastDemo.mp4")
/*
- Hauptelement Screencast
- lang könnte hier optional stehen, z.B. (lang="DE" oder lang="EN").
*/

## Teleprompt (title="Sprechertext Szene 4", lang="DE")
Willkommen zur letzten Szene. Hier sehen Sie einen Screencast, 
der zum Beispiel eine Software-Demonstration zeigen könnte. 
Damit haben wir alle Hauptelemente unserer DSL (Slide, Video, Screencast) 
einmal vorgeführt.

