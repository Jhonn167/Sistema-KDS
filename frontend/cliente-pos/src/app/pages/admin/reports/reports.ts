// src/app/pages/admin/reports/reports.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../../services/report';
import { forkJoin } from 'rxjs';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class ReportsComponent implements OnInit {
  salesSummary: any = null;
  topProducts: any[] = [];
  isLoading = true;
  isClosingDay = false;

  // Opciones del gráfico (se mantienen igual)
  view: [number, number] = [700, 400];
  colorScheme: Color = {
    name: 'kdsScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  };
  // ...otras opciones del gráfico...

  constructor(private reportService: ReportService) { }

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.isLoading = true;
    const summary$ = this.reportService.getSalesSummary();
    const topProducts$ = this.reportService.getTopProducts();

    forkJoin([summary$, topProducts$]).subscribe({
      next: ([summaryData, topProductsData]) => {
        this.salesSummary = summaryData;
        this.topProducts = topProductsData.map(p => ({
          name: p.nombre,
          value: parseInt(p.cantidad_vendida, 10)
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Error al cargar los reportes:", err);
        this.isLoading = false;
      }
    });
  }

  // --- FUNCIÓN NUEVA: PARA EL BOTÓN "CERRAR DÍA" ---
  onCloseDay(): void {
    const confirmation = confirm('¿Estás seguro de que quieres realizar el cierre del día? Esto guardará un registro permanente del resumen de ventas de hoy.');
    if (confirmation) {
      this.isClosingDay = true;
      this.reportService.closeDay().subscribe({
        next: (response) => {
          alert(response.message);
          this.isClosingDay = false;
        },
        error: (err) => {
          alert('Error al guardar el cierre del día.');
          console.error(err);
          this.isClosingDay = false;
        }
      });
    }
  }

  // --- FUNCIÓN NUEVA: PARA EL BOTÓN "EXPORTAR A EXCEL" ---
  onExportExcel(): void {
    this.reportService.exportDailyReport().subscribe(blob => {
      // Creamos un enlace temporal para descargar el archivo
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = `Reporte_Ventas_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(objectUrl); // Limpiamos el enlace temporal
    });
  }
}
