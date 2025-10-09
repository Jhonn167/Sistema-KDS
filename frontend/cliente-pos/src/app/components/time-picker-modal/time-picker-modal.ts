// src/app/components/time-picker-modal/time-picker-modal.component.ts
import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-time-picker-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './time-picker-modal.html',
  styleUrls: ['./time-picker-modal.css']
})
export class TimePickerModalComponent implements OnInit {
  @Output() timeSelected = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();
  
  availableTimes: string[] = [];

  ngOnInit(): void {
    this.generateTimes();
  }

  private generateTimes(): void {
    const times = [];
    let now = new Date();
    // Antelación mínima de 30 minutos
    now.setMinutes(now.getMinutes() + 30); 
    // Redondear al siguiente intervalo de 15 minutos
    let minutes = now.getMinutes();
    let roundedMinutes = Math.ceil(minutes / 15) * 15;
    now.setMinutes(roundedMinutes);
    now.setSeconds(0);
    now.setMilliseconds(0);

    // Generar horarios hasta las 10 PM (22:00)
    const closingTime = new Date();
    closingTime.setHours(22, 0, 0, 0);

    while (now < closingTime) {
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      times.push(`${hours}:${mins}`);
      now.setMinutes(now.getMinutes() + 15);
    }
    this.availableTimes = times;
  }
}
