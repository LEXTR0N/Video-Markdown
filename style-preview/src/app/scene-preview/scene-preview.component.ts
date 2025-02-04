// src/app/scene-preview/scene-preview.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scene-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scene-preview.component.html',
  styleUrls: ['./scene-preview.component.scss']
})
export class ScenePreviewComponent {
  @Input() sceneType: 'title' | 'slide' | 'screencast' | 'speaker' = 'title';
}
