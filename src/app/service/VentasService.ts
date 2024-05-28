import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VentasService {
  private apiUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  insertarVenta(venta: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/insertar_venta`, venta);
  }

  eliminarVenta(ano: number, mes: string): Observable<any> {
    return this.http.request('delete', `${this.apiUrl}/eliminar_venta`, { body: { ano, mes } });
  }

  recuperarVentasPorMes(ano: number, mes: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/recuperar_ventas_por_mes`, { ano, mes });
  }

  recuperarVentasPorAno(ano: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/recuperar_ventas_por_ano`, { ano });
  }

  recuperarVentasGlobales(): Observable<any> {
    return this.http.get(`${this.apiUrl}/recuperar_ventas_globales`);
  }

  obtenerProyeccion(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/mmc`, data);
  }

  pruebaDeHipotesis(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/hypothesis_test`, data);
  }

  retriveImage(path: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/images${path}`);
  }
}
