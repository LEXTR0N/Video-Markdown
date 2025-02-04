import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScenePreviewComponent } from './scene-preview.component';

describe('ScenePreviewComponent', () => {
  let component: ScenePreviewComponent;
  let fixture: ComponentFixture<ScenePreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScenePreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScenePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
