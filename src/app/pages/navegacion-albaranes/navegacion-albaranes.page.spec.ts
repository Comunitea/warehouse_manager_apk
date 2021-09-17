import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NavegacionAlbaranesPage } from './navegacion-albaranes.page';

describe('NavegacionAlbaranesPage', () => {
  let component: NavegacionAlbaranesPage;
  let fixture: ComponentFixture<NavegacionAlbaranesPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NavegacionAlbaranesPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavegacionAlbaranesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
