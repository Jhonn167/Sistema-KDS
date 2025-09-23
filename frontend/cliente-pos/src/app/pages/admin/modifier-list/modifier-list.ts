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
  optionForms: { [key: number]: FormGroup } = {};

  constructor(
    private fb: FormBuilder,
    private modifierService: ModifierService
  ) {
    this.newGroupForm = this.fb.group({
      nombre: ['', Validators.required],
      tipo_seleccion: ['seleccionar_uno', Validators.required]
    });
  }

  ngOnInit(): void { this.loadModifierGroups(); }

  loadModifierGroups(): void {
    this.modifierService.getModifierGroups().subscribe(groups => {
      this.modifierGroups = groups;
      this.modifierGroups.forEach(group => {
        this.optionForms[group.id_grupo] = this.fb.group({
          nombre: ['', Validators.required],
          precio_adicional: [0, [Validators.required, Validators.min(0)]]
        });
      });
    });
  }

  getOptionForm(groupId: number): FormGroup { return this.optionForms[groupId]; }

  onAddNewGroup(): void {
    if (this.newGroupForm.invalid) return;
    this.modifierService.createModifierGroup(this.newGroupForm.value).subscribe(() => {
      this.loadModifierGroups();
      this.newGroupForm.reset({ tipo_seleccion: 'seleccionar_uno' });
    });
  }

  onAddNewOption(groupId: number): void {
    const form = this.getOptionForm(groupId);
    if (form.invalid) return;
    const optionData = { id_grupo: groupId, ...form.value };
    this.modifierService.createModifierOption(optionData).subscribe(() => {
      this.loadModifierGroups();
    });
  }

  onDeleteOption(optionId: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta opción?')) {
      this.modifierService.deleteModifierOption(optionId).subscribe(() => {
        this.loadModifierGroups();
      });
    }
  }

  // --- MÉTODO NUEVO: ELIMINAR UN GRUPO COMPLETO ---
  onDeleteGroup(groupId: number): void {
    const group = this.modifierGroups.find(g => g.id_grupo === groupId);
    const confirmation = confirm(`¿Estás seguro de que quieres eliminar el grupo completo "${group?.nombre}"?\n\nEsta acción no se puede deshacer y lo eliminará de todos los productos.`);
    if (confirmation) {
      this.modifierService.deleteModifierGroup(groupId).subscribe(() => {
        this.loadModifierGroups();
      });
    }
  }
}
