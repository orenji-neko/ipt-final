import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Workflow } from '@app/_models';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
    constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<Workflow[]>(`${environment.apiUrl}/workflows`);
    }

    getById(id: string) {
        return this.http.get<Workflow>(`${environment.apiUrl}/workflows/${id}`);
    }

    create(params: any) {
        return this.http.post(`${environment.apiUrl}/workflows`, params);
    }

    update(id: string, params: any) {
        return this.http.put(`${environment.apiUrl}/workflows/${id}`, params);
    }

    updateStatus(id: string, status: string) {
        return this.http.patch(`${environment.apiUrl}/workflows/${id}/status`, { status });
    }

    delete(id: string) {
        return this.http.delete(`${environment.apiUrl}/workflows/${id}`);
    }
} 