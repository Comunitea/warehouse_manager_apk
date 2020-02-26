import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MoveLineFormPage } from './move-line-form.page';

describe('MoveLineFormPage', () => {
  let component: MoveLineFormPage;
  let fixture: ComponentFixture<MoveLineFormPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MoveLineFormPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MoveLineFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
