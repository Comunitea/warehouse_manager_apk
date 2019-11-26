import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StockMoveLocationPage } from './stock-move-location.page';

describe('StockMoveLocationPage', () => {
  let component: StockMoveLocationPage;
  let fixture: ComponentFixture<StockMoveLocationPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StockMoveLocationPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StockMoveLocationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
