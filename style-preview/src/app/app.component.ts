import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScenePreviewComponent } from './scene-preview/scene-preview.component';

type SceneType = 'title' | 'slide' | 'slidewithcode' | 'screencast' | 'speaker';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ScenePreviewComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  selectedSceneType: SceneType = 'title';

  ngOnInit(): void {
    // Lade den Zustand, falls vorhanden
    const storedScene = localStorage.getItem('selectedSceneType') as SceneType | null;
    if (storedScene) {
      this.selectedSceneType = storedScene;
    }
  }

  changeScene(scene: SceneType): void {
    this.selectedSceneType = scene;
    localStorage.setItem('selectedSceneType', scene);
  }
  
}
