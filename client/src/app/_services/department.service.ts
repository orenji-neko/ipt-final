import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Department } from '@app/_models';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
    constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<Department[]>(`${environment.apiUrl}/departments`);
    }

    getById(id: string) {
        return this.http.get<Department>(`${environment.apiUrl}/departments/${id}`);
    }

    create(params: any) {
        return this.http.post(`${environment.apiUrl}/departments`, params);
    }

    update(id: string, params: any) {
        return this.http.put(`${environment.apiUrl}/departments/${id}`, params);
    }

    delete(id: string) {
        return this.http.delete(`${environment.apiUrl}/departments/${id}`);
    }
} 