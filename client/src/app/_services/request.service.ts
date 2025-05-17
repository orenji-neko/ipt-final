import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Request } from '@app/_models';

@Injectable({ providedIn: 'root' })
export class RequestService {
    constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<Request[]>(`${environment.apiUrl}/requests`);
    }

    getById(id: string) {
        return this.http.get<Request>(`${environment.apiUrl}/requests/${id}`);
    }

    getByEmployee(employeeId: string) {
        return this.http.get<Request[]>(`${environment.apiUrl}/requests/employee/${employeeId}`);
    }

    create(params: any) {
        return this.http.post(`${environment.apiUrl}/requests`, params);
    }

    update(id: string, params: any) {
        return this.http.put(`${environment.apiUrl}/requests/${id}`, params);
    }

    updateStatus(id: string, status: string) {
        return this.http.patch(`${environment.apiUrl}/requests/${id}/status`, { status });
    }

    delete(id: string) {
        return this.http.delete(`${environment.apiUrl}/requests/${id}`);
    }
} 