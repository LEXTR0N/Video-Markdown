// src/app/app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScenePreviewComponent } from './scene-preview/scene-preview.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ScenePreviewComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // Aktueller Scenentyp für die Vorschau
  selectedSceneType: 'title' | 'slide' | 'screencast' | 'speaker' = 'title';

  // Wechsel der Scene per Klick
  changeScene(scene: 'title' | 'slide' | 'screencast' | 'speaker'): void {
    this.selectedSceneType = scene;
  }
}
