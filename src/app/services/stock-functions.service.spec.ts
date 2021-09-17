import { TestBed } from '@angular/core/testing';

import { StockFunctionsService } from './stock-functions.service';

describe('StockFunctionsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: StockFunctionsService = TestBed.get(StockFunctionsService);
    expect(service).toBeTruthy();
  });
});
