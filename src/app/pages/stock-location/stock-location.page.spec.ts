import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StockLocationPage } from './stock-location.page';

describe('StockLocationPage', () => {
  let component: StockLocationPage;
  let fixture: ComponentFixture<StockLocationPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StockLocationPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StockLocationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
