import { TestBed } from '@angular/core/testing';

import { OdooService } from './odoo.service';

describe('OdooService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: OdooService = TestBed.get(OdooService);
    expect(service).toBeTruthy();
  });
});
