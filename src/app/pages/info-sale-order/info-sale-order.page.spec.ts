import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoSaleOrderPage } from './info-sale-order.page';

describe('InfoSaleOrderPage', () => {
  let component: InfoSaleOrderPage;
  let fixture: ComponentFixture<InfoSaleOrderPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InfoSaleOrderPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoSaleOrderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
