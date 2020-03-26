import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MoveFormPage } from './move-form.page';

describe('MoveFormPage', () => {
  let component: MoveFormPage;
  let fixture: ComponentFixture<MoveFormPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MoveFormPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MoveFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
