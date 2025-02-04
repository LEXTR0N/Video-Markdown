// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { ScenePreviewComponent } from './scene-preview/scene-preview.component';

@NgModule({
  declarations: [
  ],
  imports: [
    BrowserModule,
    AppComponent,
    ScenePreviewComponent
  ],
  providers: [],
  // bootstrap: [AppComponent]
})
export class AppModule { }
