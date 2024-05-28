import { Component, ViewChild, AfterViewInit, OnInit, ElementRef, ChangeDetectorRef, OnDestroy } from '@angular/core';
import Chart from 'chart.js';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VentasService } from '../../service/VentasService';
import {
  chartOptions,
  parseOptions,
  chartExample1,
  chartExample2
} from "../../variables/charts";
import { Subscription } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('content', { static: false }) content: any;
  @ViewChild('monthModal', { static: false }) monthModal: any;
  @ViewChild('projectionModal', { static: false }) projectionModal: any;
  @ViewChild('hypothesisModal', { static: false }) hypothesisModal: any;
  @ViewChild('hypothesisResultModal', { static: false }) hypothesisResultModal: any;
  @ViewChild('chartProjection', { static: false }) chartProjection: ElementRef<HTMLCanvasElement>;
  @ViewChild('sales') paginator: MatPaginator;
  @ViewChild('projectionPaginator') projectionPaginator: MatPaginator;


  displayedColumns: string[] = ['mes', 'unidadesVendidas', 'ganancias', 'anioVenta'];
  displayedProjectionColumns: string[] = ['periodo', 'intervalo', 'unidades', 'ganancias'];

  public datasets: any;
  public data: any;
  public salesChart;
  public ordersChart;
  public projectionChart;
  public clicked: boolean = true;
  public clicked1: boolean = false;
  public salesData: any[] = [];
  public salesCount: number = 0;
  public salesPerecent: number = 0;
  public unitCount: number = 0;
  public unitPerecent: number = 0;
  public currentMonthRevenue: number = 0;
  public revenuePercent: number = 0;
  public selectedMonth: string = '';
  public viewMode: string = 'month';
  public availableMonths: string[] = [];
  public projectionResult: any[] = [];
  private subscription: Subscription;
  public salesForm: FormGroup;
  public monthForm: FormGroup;
  public projectionForm: FormGroup;
  public hypothesisForm: FormGroup;
  public hypothesisChart;
  public hypothesisResult: any;
  public hypothesisImageUrl: string;
  dataSource = new MatTableDataSource<any>(this.salesData);
  projectionDataSource = new MatTableDataSource<any>();

  constructor(private modalService: NgbModal, private fb: FormBuilder, private ventasService: VentasService, private cdr: ChangeDetectorRef) {
    this.salesForm = this.fb.group({
      unidadesVendidas: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      ganancias: ['', [Validators.required, Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')]],
      mes: ['', Validators.required],
      anio: ['', [Validators.required, Validators.pattern('^[0-9]{4}$')]]
    });

    this.monthForm = this.fb.group({
      mes: ['', Validators.required]
    });

    this.projectionForm = this.fb.group({
      intervalo: ['meses', Validators.required],
      periodos: [1, [Validators.required, Validators.min(1)]]
    });

    this.hypothesisForm = this.fb.group({
      miu: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      media: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      n: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      desvStdType: ['desvStd', Validators.required],
      desvStdValue: ['', [Validators.required, Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')]],
      tipo: ['<', Validators.required],
      a: ['', [Validators.required, Validators.pattern('^(0(\\.\\d+)?|1(\\.0+)?)$')]]
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  ngOnInit() {
    this.obtenerVentasGlobales();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.cdr.detectChanges(); // Detectar cambios después de asignar los paginadores
    this.initializeCharts();
  }

  initializeCharts() {
    this.datasets = [
      [0, 20, 10, 30, 15, 40, 20, 60, 60],
      [0, 20, 5, 25, 10, 30, 15, 40, 40]
    ];
    this.data = this.datasets[0];

    var chartOrders = document.getElementById('chart-orders');
    if (chartOrders) {
      parseOptions(Chart, chartOptions());

      this.ordersChart = new Chart(chartOrders, {
        type: 'bar',
        options: chartExample2.options,
        data: {
          labels: this.salesData.map(sale => sale.mes),
          datasets: [{
            label: "Sales",
            data: this.salesData.map(sale => sale.unidadesVendidas),
            maxBarThickness: 10
          }]
        }
      });
    }

    var chartSales = document.getElementById('chart-sales');
    if (chartSales) {
      this.salesChart = new Chart(chartSales, {
        type: 'line',
        options: chartExample1.options,
        data: {
          labels: this.salesData.map(sale => sale.mes),
          datasets: [{
            label: 'ganancias x unidad',
            data: this.salesData.map(sale => sale.ganancias)
          }]
        }
      });
    }
  }

  initializeProjection() {
    var chartProjection = document.getElementById('chart-projection');
    if (chartProjection && this.projectionResult) {
      let periods = this.projectionForm.get('periodos').value;
      let labelsX = [];
      for (let x = 0; x <= periods; x++) {
        labelsX.push(x.toString());
      }
      let newGains = [0, ...this.projectionResult['predicciones'].map(predict => predict.ganancias)];

      if (this.projectionChart) {
        this.projectionChart.data.labels = labelsX;
        this.projectionChart.data.datasets[0].data = newGains;
        this.projectionChart.update();
        return;
      }

      this.projectionChart = new Chart(chartProjection, {
        type: 'line',
        options: chartExample1.options,
        data: {
          labels: labelsX,
          datasets: [{
            label: 'Ganancias x periodo',
            data: newGains
          }]
        },
      });
    }
  }

  initTemplate() {
    this.cdr.detectChanges();
    var chartProjection = document.getElementById('chart-projection');
    const labelsX = Array(10).fill(''); // 10 etiquetas vacías
    const newGains = Array(10).fill(0); // 10 valores cero

    this.projectionChart = new Chart(chartProjection, {
      type: 'line',
      options: chartExample1.options,
      data: {
        labels: labelsX,
        datasets: [{
          label: 'Ganancias x periodo',
          data: newGains
        }]
      },
    });
  }

  openModal() {
    this.modalService.open(this.content, { ariaLabelledBy: 'modal-basic-title', windowClass: 'custom-modal' });
  }

  openMonthModal() {
    this.updateAvailableMonths();
    this.modalService.open(this.monthModal, { ariaLabelledBy: 'modal-basic-title', windowClass: 'custom-modal' });
  }

  openProjectionModal() {
    const modalRef = this.modalService.open(this.projectionModal, { ariaLabelledBy: 'modal-basic-title', windowClass: 'custom-modal custom-modal-medium' });
    this.initTemplate();
  }

  openHypothesisModal() {
    this.modalService.open(this.hypothesisModal, { ariaLabelledBy: 'modal-basic-title', windowClass: 'custom-modal'  });
  }

  onSubmit() {
    if (this.salesForm.valid) {
      const newSale = this.salesForm.value;
      const existingSale = this.salesData.find(sale => sale.mes === newSale.mes && sale.anioVenta === parseInt(newSale.anio, 10));

      if (existingSale) {
        existingSale.unidadesVendidas += parseInt(newSale.unidadesVendidas, 10);
        existingSale.ganancias += parseFloat(newSale.ganancias);
      } else {
        this.salesData.push({
          mes: newSale.mes,
          unidadesVendidas: parseInt(newSale.unidadesVendidas, 10),
          ganancias: parseFloat(newSale.ganancias),
          anioVenta: parseInt(newSale.anio, 10)
        });
      }

      this.modalService.dismissAll();
      this.salesForm.reset();
      this.calculateCurrentMonthSales();
      this.calculateSalesGrowth();
      this.calculateCurrentMonthRevenue();
      this.calculateRevenueGrowth();
      this.updateChart();

      // Guardar en el servidor
      const venta = {
        anioVenta: newSale.anio,
        mes: newSale.mes,
        unidadesVendidas: parseInt(newSale.unidadesVendidas, 10),
        ganancias: parseFloat(newSale.ganancias)
      };

      this.ventasService.insertarVenta(venta).subscribe(response => {
        console.log(response.message);
        this.dataSource.data = this.salesData;
        this.dataSource.paginator = this.paginator;
        this.obtenerVentasGlobales();
      });
    }
  }

  onMonthSubmit() {
    if (this.monthForm.valid) {
      this.selectedMonth = this.monthForm.value.mes;
      this.updateChart();
      this.modalService.dismissAll();
    }
  }

  onProjectionSubmit() {
    if (this.projectionForm.valid) {
      let sortedPredictions = this.salesData.sort((a, b) => a.ganancias - b.ganancias);
      const projectionData = {
        x: sortedPredictions.map(sale => sale.unidadesVendidas),
        y: sortedPredictions.map(sale => sale.ganancias),
        intervalo: this.projectionForm.value.intervalo,
        periodos: this.projectionForm.value.periodos
      };
      this.subscription = this.ventasService.obtenerProyeccion(projectionData).subscribe(response => {
        this.projectionResult = response;
        this.projectionDataSource.data = response.predicciones;
        console.log(this.projectionPaginator);
        this.projectionDataSource.paginator = this.projectionPaginator;
        this.cdr.detectChanges(); // Detectar cambios después de asignar los paginadores
        this.initializeProjection();
      }, error => { 
        console.error('Error al obtener proyección:', error);
      });
    }
  }


  resetProjectionModal(){
    this.resetProjectionForm();
    this.projectionResult = [];
    this.projectionDataSource.data = [];
    this.projectionChart.data.labels = [];
    this.projectionChart.data.datasets[0].data = [];  
    this.projectionChart.update();
    this.modalService.dismissAll();
  }

  
  resetSalesForm() {
    this.salesForm.reset({
      unidadesVendidas: '',
      ganancias: '',
      mes: '',
      anio: ''
    });
    this.modalService.dismissAll();
  }

  resetHypothesisForm() {
    this.hypothesisForm.reset({
      miu: '',
      media: '',
      n: '',
      desvStdType: 'desvStd',
      desvStdValue: '',
      tipo: '<',
      a: ''
    });
    this.modalService.dismissAll();

  }

  resetProjectionForm() {
    this.projectionForm.reset({
      intervalo: 'meses',
      periodos: 1
    });
    
  }

  onHypothesisSubmit() {
    if (this.hypothesisForm.valid) {
      let hypotesisType =  this.hypothesisForm.get('desvStdType').value;

      let hypothesisData = {};
      if(hypotesisType === 'desvStd'){
        hypothesisData = {
          miu : this.hypothesisForm.get('miu').value,
          media : this.hypothesisForm.get('media').value,
          n : this.hypothesisForm.get('n').value,
          desvStd : this.hypothesisForm.get('desvStdValue').value,
          tipo : this.hypothesisForm.get('tipo').value,
          a : this.hypothesisForm.get('a').value
        }
      }else{
        hypothesisData = {
          miu : this.hypothesisForm.get('miu').value,
          media : this.hypothesisForm.get('media').value,
          n : this.hypothesisForm.get('n').value,
          varianza : this.hypothesisForm.get('desvStdValue').value,
          tipo : this.hypothesisForm.get('tipo').value,
          a : this.hypothesisForm.get('a').value
        }
      }
      
      this.ventasService.pruebaDeHipotesis(hypothesisData).subscribe(response => {
        this.hypothesisResult = response;
        this.hypothesisImageUrl = `http://localhost:5000${response.image_path}`;
        this.modalService.dismissAll();
        this.openHypothesisResultModal();
      }, error => {
        console.error('Error en la prueba de hipótesis:', error);
      });
    }
  }

  calculateCurrentMonthSales() {
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const currentMonth = months[currentMonthIndex];

    this.unitCount = this.salesData
      .filter(sale => sale.mes === currentMonth && sale.anioVenta === currentYear)
      .reduce((total, sale) => total + sale.unidadesVendidas, 0);
  }

  calculateSalesGrowth() {
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth();
    const previousMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
    const currentYear = currentDate.getFullYear();
    const previousYear = currentMonthIndex === 0 ? currentYear - 1 : currentYear;

    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const currentMonth = months[currentMonthIndex];
    const previousMonth = months[previousMonthIndex];

    const currentMonthSales = this.salesData
      .filter(sale => sale.mes === currentMonth && sale.anioVenta === currentYear)
      .reduce((total, sale) => total + sale.unidadesVendidas, 0);

    const previousMonthSales = this.salesData
      .filter(sale => sale.mes === previousMonth && sale.anioVenta === previousYear)
      .reduce((total, sale) => total + sale.unidadesVendidas, 0);

    this.salesCount = currentMonthSales;
    this.salesPerecent = previousMonthSales > 0 ? ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100 : 0;
  }

  calculateCurrentMonthRevenue() {
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const currentMonth = months[currentMonthIndex];

    this.currentMonthRevenue = this.salesData
      .filter(sale => sale.mes === currentMonth && sale.anioVenta === currentYear)
      .reduce((total, sale) => total + sale.ganancias, 0);
  }

  calculateRevenueGrowth() {
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth();
    const previousMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
    const currentYear = currentDate.getFullYear();
    const previousYear = currentMonthIndex === 0 ? currentYear - 1 : currentYear;

    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const currentMonth = months[currentMonthIndex];
    const previousMonth = months[previousMonthIndex];

    const currentMonthRevenue = this.salesData
      .filter(sale => sale.mes === currentMonth && sale.anioVenta === currentYear)
      .reduce((total, sale) => total + sale.ganancias, 0);

    const previousMonthRevenue = this.salesData
      .filter(sale => sale.mes === previousMonth && sale.anioVenta === previousYear)
      .reduce((total, sale) => total + sale.ganancias, 0);

    this.currentMonthRevenue = currentMonthRevenue;
    this.revenuePercent = previousMonthRevenue > 0 ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;
  }

  public updateOptions() {
    if (this.salesChart) {
      this.salesChart.update();
    }
    if (this.ordersChart) {
      this.ordersChart.update();
    }
    if (this.projectionChart) {
      this.projectionChart.update();
    }
  }

  setViewMode(mode: string) {
    this.viewMode = mode;
    if (mode === 'month') {
      this.openMonthModal();
    } else {
      this.updateChart();
    }
  }

  updateChart() {
    if (!this.salesChart || !this.ordersChart) return;

    if (this.viewMode === 'month' && this.selectedMonth) {
      const filteredData = this.salesData
        .filter(sale => sale.mes === this.selectedMonth)
        .map(sale => sale.unidadesVendidas);

      const labels = this.salesData
        .filter(sale => sale.mes === this.selectedMonth)
        .map(sale => sale.anioVenta);

      this.salesChart.data.labels = labels;
      this.salesChart.data.datasets[0].data = filteredData;
    } else {
      const years = Array.from(new Set(this.salesData.map(sale => sale.anioVenta)));
      const filteredData = years.map(year => {
        return this.salesData
          .filter(sale => sale.anioVenta === year)
          .reduce((total, sale) => total + sale.unidadesVendidas, 0);
      });

      this.salesChart.data.labels = years;
      this.salesChart.data.datasets[0].data = filteredData;
    }
    this.updateOptions();
  }

  resetCharts() {
    if (!this.salesChart || !this.ordersChart) return;

    this.salesChart.data.labels = this.salesData.map(sale => sale.mes);
    this.salesChart.data.datasets[0].data = this.salesData.map(sale => sale.ganancias);

    this.ordersChart.data.labels = this.salesData.map(sale => sale.mes);
    this.ordersChart.data.datasets[0].data = this.salesData.map(sale => sale.unidadesVendidas);

    this.updateOptions();
  }

  showGlobalProgress() {
    if (!this.salesChart || !this.ordersChart) return;

    const labels = this.salesData.map(sale => `${sale.mes} ${sale.anioVenta}`);
    const gananciasData = this.salesData.map(sale => sale.ganancias);
    const unidadesVendidasData = this.salesData.map(sale => sale.unidadesVendidas);

    this.salesChart.data.labels = labels;
    this.salesChart.data.datasets[0].data = gananciasData;
    this.ordersChart.data.labels = labels;
    this.ordersChart.data.datasets[0].data = unidadesVendidasData;

    this.updateOptions();
  }

  obtenerVentasGlobales() {
    this.ventasService.recuperarVentasGlobales().subscribe(response => {
      this.salesData = response.documentos.filter(doc => Object.keys(doc).length > 0);
      this.dataSource.data = this.salesData;
      this.dataSource.paginator = this.paginator;
      this.updateAvailableMonths();
      this.calculateCurrentMonthSales();
      this.calculateSalesGrowth();
      this.calculateCurrentMonthRevenue();
      this.calculateRevenueGrowth();
      this.initializeCharts(); // Inicializa los gráficos después de cargar los datos
      this.updateChart();
    }, error => {
      console.error('Error al recuperar ventas globales:', error);
    });
  }

  updateAvailableMonths() {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    this.availableMonths = this.salesData
      .map(sale => sale.mes)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => months.indexOf(a) - months.indexOf(b));
  }

  openHypothesisResultModal() {
    this.modalService.open(this.hypothesisResultModal, { ariaLabelledBy: 'modal-basic-title', windowClass: 'custom-modal custom-modal-medium' });
  }

}
