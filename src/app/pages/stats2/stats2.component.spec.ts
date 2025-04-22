import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Stats2Component } from './stats2.component';

describe('Stats2Component', () => {
  let component: Stats2Component;
  let fixture: ComponentFixture<Stats2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Stats2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Stats2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
