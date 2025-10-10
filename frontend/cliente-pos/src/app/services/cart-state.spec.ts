import { TestBed } from '@angular/core/testing';

import { CartState } from './cart-state';

describe('CartState', () => {
  let service: CartState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
