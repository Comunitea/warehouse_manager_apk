import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuantListComponent } from './quant-list.component';

describe('QuantListComponent', () => {
  let component: QuantListComponent;
  let fixture: ComponentFixture<QuantListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QuantListComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuantListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
