// src/app/services/report.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/api/reports`;

  constructor(private http: HttpClient) { }

  getSalesSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/sales-summary`);
  }

  getTopProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/top-products`);
  }

  closeDay(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/close-day`, {});
  }

  exportDailyReport(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export-daily`, {
      responseType: 'blob'
    });
  }
}