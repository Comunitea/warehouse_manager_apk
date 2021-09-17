import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MoveListPage } from './move-list.page';

describe('MoveListPage', () => {
  let component: MoveListPage;
  let fixture: ComponentFixture<MoveListPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MoveListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MoveListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
