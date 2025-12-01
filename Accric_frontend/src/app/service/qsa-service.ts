import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QSA } from '../qsa-list/qsa-list';

@Injectable({
  providedIn: 'root'
})
export class QsaService {

  private api = 'https://your-api-url.com/api/qsa';

  constructor(private http: HttpClient) {}

  getQsaList(): Observable<QSA[]> {
    return this.http.get<QSA[]>(this.api);
  }

  updateQsa(id: number, data: FormData): Observable<any> {
    return this.http.post(`${this.api}/update/${id}`, data);
  }

  deleteQsa(id: number): Observable<any> {
    return this.http.delete(`${this.api}/delete/${id}`);
  }
}
