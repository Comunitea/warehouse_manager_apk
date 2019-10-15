import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StockPickingTypeListPage } from './stock-picking-type-list.page';

describe('StockPickingTypeListPage', () => {
  let component: StockPickingTypeListPage;
  let fixture: ComponentFixture<StockPickingTypeListPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StockPickingTypeListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StockPickingTypeListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
