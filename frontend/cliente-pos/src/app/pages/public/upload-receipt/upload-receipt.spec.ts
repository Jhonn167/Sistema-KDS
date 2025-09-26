import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadReceipt } from './upload-receipt';

describe('UploadReceipt', () => {
  let component: UploadReceipt;
  let fixture: ComponentFixture<UploadReceipt>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadReceipt]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadReceipt);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
