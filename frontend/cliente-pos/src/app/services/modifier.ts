// src/app/services/modifier.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class ModifierService {
  private apiUrl = `${environment.apiUrl}/api/modifiers`;

  constructor(private http: HttpClient) { }

  getModifierGroups(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/groups`);
  }

  createModifierGroup(groupData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/groups`, groupData);
  }
  
  deleteModifierGroup(groupId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/groups/${groupId}`);
  }

  createModifierOption(optionData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/options`, optionData);
  }

  deleteModifierOption(optionId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/options/${optionId}`);
  }
}
