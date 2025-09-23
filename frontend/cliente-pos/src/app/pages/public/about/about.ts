// src/app/pages/public/about/about.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Importamos RouterModule para el botón

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule], // Añadimos RouterModule
  templateUrl: './about.html',
  styleUrls: ['./about.css']
})
export class About {
  // No se necesita lógica compleja para esta página estática
}
