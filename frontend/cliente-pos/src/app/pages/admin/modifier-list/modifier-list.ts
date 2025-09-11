// src/app/pages/admin/modifier-list/modifier-list.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModifierService } from '../../../services/modifier';

@Component({
  selector: 'app-modifier-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modifier-list.html',
  styleUrls: ['./modifier-list.css']
})
export class ModifierListComponent implements OnInit {
  modifierGroups: any[] = [];
  newGroupForm: FormGroup;
  optionForms: { [key: number]: FormGroup } = {}; // Un formulario para cada grupo

  constructor(
    private fb: FormBuilder,
    private modifierService: ModifierService
  ) {
    this.newGroupForm = this.fb.group({
      nombre: ['', Validators.required],
      tipo_seleccion: ['seleccionar_uno', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadModifierGroups();
  }

  loadModifierGroups(): void {
    this.modifierService.getModifierGroups().subscribe(groups => {
      this.modifierGroups = groups;
      // Creamos un formulario dinámico para cada grupo de modificadores
      this.modifierGroups.forEach(group => {
        this.optionForms[group.id_grupo] = this.fb.group({
          nombre: ['', Validators.required],
          precio_adicional: [0, [Validators.required, Validators.min(0)]]
        });
      });
    });
  }

  // Devuelve el formulario de opción para un grupo específico
  getOptionForm(groupId: number): FormGroup {
    return this.optionForms[groupId];
  }

  onAddNewGroup(): void {
    if (this.newGroupForm.invalid) return;
    
    this.modifierService.createModifierGroup(this.newGroupForm.value).subscribe(() => {
      this.loadModifierGroups(); // Recargamos la lista
      this.newGroupForm.reset({ tipo_seleccion: 'seleccionar_uno' }); // Limpiamos el formulario
    });
  }

  onAddNewOption(groupId: number): void {
    const form = this.getOptionForm(groupId);
    if (form.invalid) return;

    const optionData = {
      id_grupo: groupId,
      ...form.value
    };

    this.modifierService.createModifierOption(optionData).subscribe(() => {
      this.loadModifierGroups(); // Recargamos para ver la nueva opción
    });
  }

  onDeleteOption(optionId: number, groupId: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta opción?')) {
      this.modifierService.deleteModifierOption(optionId).subscribe(() => {
        this.loadModifierGroups(); // Recargamos la lista
      });
    }
  }
}