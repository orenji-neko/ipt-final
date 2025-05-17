import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Employee } from '@app/_models';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
    constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<Employee[]>(`${environment.apiUrl}/employees`);
    }

    getById(id: string) {
        return this.http.get<Employee>(`${environment.apiUrl}/employees/${id}`);
    }

    create(params: any) {
        return this.http.post(`${environment.apiUrl}/employees`, params);
    }

    update(id: string, params: any) {
        return this.http.put(`${environment.apiUrl}/employees/${id}`, params);
    }

    delete(id: string) {
        return this.http.delete(`${environment.apiUrl}/employees/${id}`);
    }

    transfer(id: string, departmentId: string) {
        return this.http.post(`${environment.apiUrl}/employees/${id}/transfer`, { departmentId });
    }
} 