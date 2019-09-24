import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StockPickingListPage } from './stock-picking-list.page';

describe('StockPickingListPage', () => {
  let component: StockPickingListPage;
  let fixture: ComponentFixture<StockPickingListPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StockPickingListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StockPickingListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
