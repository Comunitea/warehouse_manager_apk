import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BarcodeMultilinePage } from './barcode-multiline.page';

describe('BarcodeMultilinePage', () => {
  let component: BarcodeMultilinePage;
  let fixture: ComponentFixture<BarcodeMultilinePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BarcodeMultilinePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BarcodeMultilinePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
