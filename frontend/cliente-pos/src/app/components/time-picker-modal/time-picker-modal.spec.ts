import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimePickerModal } from './time-picker-modal';

describe('TimePickerModal', () => {
  let component: TimePickerModal;
  let fixture: ComponentFixture<TimePickerModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimePickerModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimePickerModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
