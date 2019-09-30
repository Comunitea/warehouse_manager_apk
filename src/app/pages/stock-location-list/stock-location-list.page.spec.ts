import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StockLocationListPage } from './stock-location-list.page';

describe('StockLocationListPage', () => {
  let component: StockLocationListPage;
  let fixture: ComponentFixture<StockLocationListPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StockLocationListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StockLocationListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
