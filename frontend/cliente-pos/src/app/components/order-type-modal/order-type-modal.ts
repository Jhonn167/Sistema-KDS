import { Component, Output, EventEmitter, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-type-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-type-modal.html',
  styleUrls: ['./order-type-modal.css']
})
export class OrderTypeModalComponent {
@Output() typeSelected = new EventEmitter<'inmediato' | 'futuro'>();
}
