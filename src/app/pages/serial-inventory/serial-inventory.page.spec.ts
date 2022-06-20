import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SerialInventoryPage } from './serial-inventory.page';

describe('SerialInventoryPage', () => {
  let component: SerialInventoryPage;
  let fixture: ComponentFixture<SerialInventoryPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SerialInventoryPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SerialInventoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
