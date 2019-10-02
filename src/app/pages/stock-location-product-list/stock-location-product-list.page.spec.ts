import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StockLocationProductListPage } from './stock-location-product-list.page';

describe('StockLocationProductListPage', () => {
  let component: StockLocationProductListPage;
  let fixture: ComponentFixture<StockLocationProductListPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StockLocationProductListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StockLocationProductListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
