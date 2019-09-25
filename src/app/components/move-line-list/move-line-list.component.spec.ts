import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MoveLineListComponent } from './move-line-list.component';

describe('MoveLineListComponent', () => {
  let component: MoveLineListComponent;
  let fixture: ComponentFixture<MoveLineListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MoveLineListComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MoveLineListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
