import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Workflow } from '@app/_models';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
    constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<Workflow[]>(`${environment.apiUrl}/workflows`)
            .pipe(catchError(this.handleError));
    }

    getById(id: string) {
        return this.http.get<Workflow>(`${environment.apiUrl}/workflows/${id}`)
            .pipe(catchError(this.handleError));
    }

    create(params: any) {
        return this.http.post(`${environment.apiUrl}/workflows`, params)
            .pipe(catchError(this.handleError));
    }

    update(id: string, params: any) {
        return this.http.put(`${environment.apiUrl}/workflows/${id}`, params)
            .pipe(catchError(this.handleError));
    }

    updateStatus(id: string, status: string) {
        if (!id) {
            console.error('Attempted to update workflow status with null/undefined id');
            return throwError(() => new Error('Invalid workflow ID'));
        }
        
        console.log(`Sending PATCH request to update workflow ${id} status to ${status}`);
        return this.http.patch(
            `${environment.apiUrl}/workflows/${id}/status`, 
            { status },
            { headers: { 'Content-Type': 'application/json' } }
        ).pipe(
            tap(response => console.log('Status update response:', response)),
            catchError(this.handleError)
        );
    }

    delete(id: string) {
        return this.http.delete(`${environment.apiUrl}/workflows/${id}`)
            .pipe(catchError(this.handleError));
    }

    getByEmployee(employeeId: string) {
        return this.http.get<Workflow[]>(`${environment.apiUrl}/workflows/employee/${employeeId}`)
            .pipe(
                tap(workflows => {
                    // Log any workflows with missing IDs
                    const invalidWorkflows = workflows.filter(wf => !wf.id);
                    if (invalidWorkflows.length > 0) {
                        console.warn('Received workflows with missing IDs:', invalidWorkflows);
                    }
                }),
                catchError(this.handleError)
            );
    }
    
    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'An unknown error occurred';
        if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage = `Error: ${error.error.message}`;
        } else {
            // Server-side error
            errorMessage = `Error Code: ${error.status}\nMessage: ${error.error?.message || error.message}`;
        }
        console.error(errorMessage);
        return throwError(() => new Error(errorMessage));
    }
} 