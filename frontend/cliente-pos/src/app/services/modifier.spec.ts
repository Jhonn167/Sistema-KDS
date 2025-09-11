import { TestBed } from '@angular/core/testing';

import { Modifier } from './modifier';

describe('Modifier', () => {
  let service: Modifier;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Modifier);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
