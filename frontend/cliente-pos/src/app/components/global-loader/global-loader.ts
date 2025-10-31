// src/app/components/global-loader/global-loader.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-loader.html',
  styleUrls: ['./global-loader.css']
})
export class GlobalLoaderComponent {
  isLoading$: Observable<boolean>;

  constructor(private loadingService: LoadingService) {
    this.isLoading$ = this.loadingService.loading$;
  }
}