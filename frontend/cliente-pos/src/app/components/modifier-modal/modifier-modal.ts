import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
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
  totalSeleccionado: { [key: string]: number } = {};
  limites: { [key: string]: number } = {};

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
    this.totalSeleccionado = {};
    this.limites = {};

    this.product.modificadores.forEach((group: any) => {
      const groupIdStr = group.id_grupo.toString();
      if (group.tipo_seleccion === 'seleccionar_uno') {
        this.modifierForm.addControl(groupIdStr, new FormControl(null));
      } else if (group.tipo_seleccion === 'seleccionar_varios') {
        const groupControl = this.fb.group({});
        group.opciones.forEach((option: any) => {
          groupControl.addControl(option.id_opcion.toString(), new FormControl(false));
        });
        this.modifierForm.addControl(groupIdStr, groupControl);
      } else if (group.tipo_seleccion === 'seleccionar_cantidad') {
        const groupControl = this.fb.group({});
        group.opciones.forEach((option: any) => {
          groupControl.addControl(option.id_opcion.toString(), new FormControl(0));
        });
        this.modifierForm.addControl(groupIdStr, groupControl);
        
        this.totalSeleccionado[groupIdStr] = 0;
        this.limites[groupIdStr] = group.limite_seleccion;
        
        groupControl.valueChanges.subscribe(values => {
          // --- CORRECCIÓN CLAVE ---
          // Convertimos 'val' a un número antes de sumarlo.
          const total = Object.values(values).reduce((acc: number, val: unknown) => acc + (Number(val) || 0), 0);
          this.totalSeleccionado[groupIdStr] = total;
        });
      }
    });
  }

  changeQuantity(groupId: string, optionId: string, change: number): void {
    const groupControl = this.modifierForm.get(groupId) as FormGroup;
    const currentControl = groupControl.get(optionId) as FormControl;
    let newValue = (currentControl.value || 0) + change;

    if (newValue < 0) {
      newValue = 0;
    }
    
    const currentTotal = this.totalSeleccionado[groupId] || 0;
    const limit = this.limites[groupId] || 0;

    if (change > 0 && currentTotal >= limit) {
      return; 
    }

    currentControl.setValue(newValue);
  }

  isConfirmDisabled(): boolean {
    for (const groupId in this.limites) {
      if (this.totalSeleccionado[groupId] !== this.limites[groupId]) {
        return true;
      }
    }
    return false;
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
          selectedOptions.push({ ...option, cantidad: 1 });
          additionalPrice += parseFloat(option.precio_adicional);
        }
      } else if (group.tipo_seleccion === 'seleccionar_varios') {
        for (const optionId in selection) {
          if (selection[optionId]) {
            const option = group.opciones.find((o: any) => o.id_opcion == optionId);
            if (option) {
              selectedOptions.push({ ...option, cantidad: 1 });
              additionalPrice += parseFloat(option.precio_adicional);
            }
          }
        }
      } else if (group.tipo_seleccion === 'seleccionar_cantidad') {
        for (const optionId in selection) {
          const quantity = Number(selection[optionId] || 0); // Convertimos a número
          if (quantity > 0) {
            const option = group.opciones.find((o: any) => o.id_opcion == optionId);
            if (option) {
              selectedOptions.push({ ...option, cantidad: quantity });
              additionalPrice += parseFloat(option.precio_adicional) * quantity;
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

