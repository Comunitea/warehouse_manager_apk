import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PickingListComponent } from './picking-list.component';

describe('PickingListComponent', () => {
  let component: PickingListComponent;
  let fixture: ComponentFixture<PickingListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PickingListComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PickingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
