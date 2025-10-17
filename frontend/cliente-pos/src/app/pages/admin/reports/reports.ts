// src/app/pages/admin/reports/reports.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../../services/report';
import { forkJoin, Subscription } from 'rxjs';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { Socket } from 'ngx-socket-io';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class ReportsComponent implements OnInit, OnDestroy {
  salesSummary: any = null;
  topProducts: any[] = [];
  isLoading = true;
  isClosingDay = false;
  currentDate: Date = new Date(); // Para mostrar la fecha actual

  private reportUpdateSub: Subscription | undefined;

  // Opciones del gráfico
  colorScheme: Color = {
    name: 'kdsScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#0d6efd', '#6c757d', '#198754', '#ffc107', '#dc3545']
  };

  constructor(private reportService: ReportService, private socket: Socket) { }

  ngOnInit(): void {
    this.loadReports();
    this.reportUpdateSub = this.socket.fromEvent('pedido_actualizado_cocina').subscribe(() => {
      this.loadReports();
    });
  }

  ngOnDestroy(): void {
    if (this.reportUpdateSub) {
      this.reportUpdateSub.unsubscribe();
    }
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

  onCloseDay(): void {
    const confirmation = confirm('¿Estás seguro de que quieres realizar el cierre del día?');
    if (confirmation) {
      this.isClosingDay = true;
      this.reportService.closeDay().subscribe({
        next: (response) => {
          alert(response.message);
          this.isClosingDay = false;
        },
        error: (err) => {
          alert('Error al guardar el cierre del día.');
          this.isClosingDay = false;
        }
      });
    }
  }

  onExportExcel(): void {
    this.reportService.exportDailyReport().subscribe(blob => {
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = `Reporte_Ventas_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    });
  }
}