import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OderTypeModal } from './order-type-modal';

describe('OderTypeModal', () => {
  let component: OderTypeModal;
  let fixture: ComponentFixture<OderTypeModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OderTypeModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OderTypeModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
