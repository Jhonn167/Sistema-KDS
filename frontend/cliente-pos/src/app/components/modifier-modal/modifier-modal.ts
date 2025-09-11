// src/app/components/modifier-modal/modifier-modal.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-modifier-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modifier-modal.html',
  styleUrls: ['./modifier-modal.css']
})
export class ModifierModalComponent implements OnChanges {
  @Input() product: any | null = null;
  @Output() confirm = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  modifierForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.modifierForm = this.fb.group({});
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && this.product) {
      this.buildForm();
    }
  }

  private buildForm(): void {
    this.modifierForm = this.fb.group({});
    this.product.modificadores.forEach((group: any) => {
      if (group.tipo_seleccion === 'seleccionar_uno') {
        this.modifierForm.addControl(group.id_grupo.toString(), new FormControl(null)); // Usamos null para radio buttons
      } else { // seleccionar_varios
        const groupControl = this.fb.group({});
        group.opciones.forEach((option: any) => {
          groupControl.addControl(option.id_opcion.toString(), new FormControl(false));
        });
        this.modifierForm.addControl(group.id_grupo.toString(), groupControl);
      }
    });
  }

  onConfirm(): void {
    const selectedOptions: any[] = [];
    let additionalPrice = 0;

    for (const groupId in this.modifierForm.value) {
      const group = this.product.modificadores.find((g: any) => g.id_grupo == groupId);
      const selection = this.modifierForm.value[groupId];

      if (group.tipo_seleccion === 'seleccionar_uno' && selection) {
        const option = group.opciones.find((o: any) => o.id_opcion == selection);
        if (option) {
          selectedOptions.push(option);
          additionalPrice += parseFloat(option.precio_adicional);
        }
      } else if (group.tipo_seleccion === 'seleccionar_varios') {
        for (const optionId in selection) {
          if (selection[optionId]) {
            const option = group.opciones.find((o: any) => o.id_opcion == optionId);
            if (option) {
              selectedOptions.push(option);
              additionalPrice += parseFloat(option.precio_adicional);
            }
          }
        }
      }
    }

    const configuredProduct = {
      ...this.product,
      selectedOptions,
      finalPrice: parseFloat(this.product.precio) + additionalPrice,
    };
    
    this.confirm.emit(configuredProduct);
  }
}
