// src/app/pages/admin/modifier-list/modifier-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModifierService } from '../../../services/modifier'; // CORRECCIÓN: Añadido .service

@Component({
  selector: 'app-modifier-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modifier-list.html', // CORRECCIÓN: .component.html
  styleUrls: ['./modifier-list.css'] // CORRECCIÓN: .component.css
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
      tipo_seleccion: ['seleccionar_uno', Validators.required],
      limite_seleccion: [null] // --- NUEVO --- Campo para el límite del paquete
    });
  }

  ngOnInit(): void { this.loadModifierGroups(); }

  loadModifierGroups(): void {
    this.modifierService.getModifierGroups().subscribe(groups => {
      this.modifierGroups = groups;
      // Inicializa un formulario para añadir opciones a cada grupo
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

    const formData = this.newGroupForm.value;
    
    // --- NUEVO --- Si el tipo no es 'seleccionar_cantidad', nos aseguramos de enviar null
    if (formData.tipo_seleccion !== 'seleccionar_cantidad') {
      formData.limite_seleccion = null;
    }

    this.modifierService.createModifierGroup(formData).subscribe(() => {
      this.loadModifierGroups();
      this.newGroupForm.reset({ tipo_seleccion: 'seleccionar_uno', limite_seleccion: null });
    });
  }

  onAddNewOption(groupId: number): void {
    const form = this.getOptionForm(groupId);
    if (form.invalid) return;
    const optionData = { id_grupo: groupId, ...form.value };
    this.modifierService.createModifierOption(optionData).subscribe(() => {
      this.loadModifierGroups();
      form.reset({ precio_adicional: 0 }); // Resetea el formulario de opción
    });
  }

  onDeleteOption(optionId: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta opción?')) {
      this.modifierService.deleteModifierOption(optionId).subscribe(() => {
        this.loadModifierGroups();
      });
    }
  }

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