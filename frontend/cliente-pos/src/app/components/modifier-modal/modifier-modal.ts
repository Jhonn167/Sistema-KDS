// src/app/components/modifier-modal/modifier-modal.component.ts
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
        // --- NUEVO --- Lógica para el grupo de cantidad
        const groupControl = this.fb.group({});
        group.opciones.forEach((option: any) => {
          groupControl.addControl(option.id_opcion.toString(), new FormControl(0));
        });
        this.modifierForm.addControl(groupIdStr, groupControl);
        
        // Inicializa contadores y límites
        this.totalSeleccionado[groupIdStr] = 0;
        this.limites[groupIdStr] = group.limite_seleccion;
        
        // Escucha los cambios en las cantidades de este grupo
        groupControl.valueChanges.subscribe(values => {
          const total = Object.values(values).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
          this.totalSeleccionado[groupIdStr] = total;
        });
      }
    });
  }

  // --- NUEVO --- Funciones para los botones + y -
  changeQuantity(groupId: string, optionId: string, change: number): void {
    const groupControl = this.modifierForm.get(groupId) as FormGroup;
    const currentControl = groupControl.get(optionId) as FormControl;
    let newValue = currentControl.value + change;

    if (newValue < 0) {
      newValue = 0;
    }
    
    const currentTotal = this.totalSeleccionado[groupId];
    const limit = this.limites[groupId];

    // No permite añadir más si ya se alcanzó el límite
    if (change > 0 && currentTotal >= limit) {
      return; 
    }

    currentControl.setValue(newValue);
  }

  // --- NUEVO --- Deshabilita el botón de confirmar si algún paquete no está completo
  isConfirmDisabled(): boolean {
    for (const groupId in this.limites) {
      if (this.totalSeleccionado[groupId] !== this.limites[groupId]) {
        return true; // Deshabilitado si el total no es igual al límite
      }
    }
    return false; // Habilitado
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
          selectedOptions.push({ ...option, cantidad: 1 }); // Añadimos cantidad 1
          additionalPrice += parseFloat(option.precio_adicional);
        }
      } else if (group.tipo_seleccion === 'seleccionar_varios') {
        for (const optionId in selection) {
          if (selection[optionId]) {
            const option = group.opciones.find((o: any) => o.id_opcion == optionId);
            if (option) {
              selectedOptions.push({ ...option, cantidad: 1 }); // Añadimos cantidad 1
              additionalPrice += parseFloat(option.precio_adicional);
            }
          }
        }
      } else if (group.tipo_seleccion === 'seleccionar_cantidad') {
        // --- NUEVO --- Lógica de confirmación para el paquete
        for (const optionId in selection) {
          const quantity = selection[optionId];
          if (quantity > 0) {
            const option = group.opciones.find((o: any) => o.id_opcion == optionId);
            if (option) {
              selectedOptions.push({ ...option, cantidad: quantity }); // Añade la cantidad seleccionada
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