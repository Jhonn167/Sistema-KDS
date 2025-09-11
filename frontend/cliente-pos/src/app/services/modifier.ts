// src/app/services/modifier.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class ModifierService {
  private apiUrl = `${environment.apiUrl}/modifiers`;

  constructor(private http: HttpClient) { }

  // Obtiene todos los grupos con sus opciones
  getModifierGroups(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/groups`);
  }

  // Crea un nuevo grupo
  createModifierGroup(groupData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/groups`, groupData);
  }

  // Crea una nueva opción para un grupo
  createModifierOption(optionData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/options`, optionData);
  }

  // Elimina una opción de modificador por su ID
  deleteModifierOption(optionId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/options/${optionId}`);
  }
}