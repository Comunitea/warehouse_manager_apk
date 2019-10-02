import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StockQuantListPage } from './stock-quant-list.page';

describe('StockQuantListPage', () => {
  let component: StockQuantListPage;
  let fixture: ComponentFixture<StockQuantListPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StockQuantListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StockQuantListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
