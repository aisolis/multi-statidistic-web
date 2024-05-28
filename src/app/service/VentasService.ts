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
