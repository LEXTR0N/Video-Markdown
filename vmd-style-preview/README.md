# VMD Style Preview

This Angular application provides a live preview environment for designing and testing style templates for Video Markdown (VMD) presentations. It helps content creators and developers visualize and refine their style definitions before implementing them in the VMD processor.

## Overview

VMD Style Preview allows you to:

- View and test style templates in real-time
- Preview how different VMD elements will appear with your custom styling
- Experiment with various layouts and design components
- Validate the appearance of slides, buttons, images, and other VMD elements

## Features

- **Live Preview**: See your style changes instantly with Angular's development server
- **Scene Preview Component**: Visualize different types of VMD scenes (title, slide, screencast, speaker)
- **Material Design Integration**: Uses Angular Material components for the UI
- **Style Editing**: Focus on editing the SCSS file located in the assets folder
- **Responsive Design Testing**: Ensure your styles work across different screen sizes

## Getting Started

### Prerequisites

- Node.js (latest LTS version recommended)
- npm or yarn package manager
- Angular CLI (`npm install -g @angular/cli`)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/LEXTR0N/Video-Markdown.git
   cd vmd-style-preview
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Add the THWS logo:
   - Place the `thws_logo.png` in the `/assets` folder
   - The styles reference this image in the title scene component

4. Start the development server:
   ```bash
   ng serve
   ```

5. Open your browser and navigate to `http://localhost:4200/`

## Working with Styles

The main styling file is located at:
```
assets/styles.scss
```

This file contains the SCSS definitions for different scene types:
- Title scenes (`.title-scene`)
- Slide scenes (`.slide-scene`) 
- Screencast scenes (`.screencast-scene`)
- Speaker scenes (`.speaker-scene`)

Each scene type includes nested style definitions for elements like:
- Titles
- Text blocks
- Buttons
- Images
- Logos
- Speaker avatars

## Development Workflow

1. Open the project in your favorite code editor
2. Make changes to `assets/styles.scss`
3. Watch the changes reflect immediately in the browser
4. Refine your styles until you achieve the desired appearance
5. Export the final style for use in your VMD processor
