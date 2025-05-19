import { Component, OnInit } from '@angular/core';
import { Request, RequestStatus } from '@app/_models';
import { RequestService, AlertService, EmployeeService, AccountService } from '@app/_services';
import { first } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
declare var bootstrap: any;

@Component({
    templateUrl: './request-list.component.html'
})
export class RequestListComponent implements OnInit {
    requests: Request[] = [];
    loading = false;
    selectedRequest = null;
    private itemsModal = null;
    employees: any[] = [];

    constructor(
        private requestService: RequestService,
        private alertService: AlertService,
        private route: ActivatedRoute,
        private employeeService: EmployeeService,
        private accountService: AccountService
    ) {}

    ngOnInit() {
        this.loading = true;
        this.employeeService.getAll().pipe(first()).subscribe(employees => {
            this.accountService.getAll().pipe(first()).subscribe(accounts => {
                this.employees = employees.map(emp => ({
                    ...emp,
                    account: accounts.find(a => String(a.id) === String(emp.accountId))
                }));
                this.route.queryParams.subscribe(params => {
                    const employeeId = params['employeeId'];
                    if (employeeId) {
                        this.requestService.getByEmployee(employeeId)
                            .pipe(first())
                            .subscribe({
                                next: (requests) => {
                                    this.requests = requests;
                                    this.loading = false;
                                },
                                error: error => {
                                    console.error('Error loading requests:', error);
                                    this.loading = false;
                                }
                            });
                    } else {
                        this.requestService.getAll()
                            .pipe(first())
                            .subscribe({
                                next: (requests) => {
                                    this.requests = requests;
                                    this.loading = false;
                                },
                                error: error => {
                                    console.error('Error loading requests:', error);
                                    this.loading = false;
                                }
                            });
                    }
                });
            });
        });
    }

    reload() {
        this.loading = true;
        this.employeeService.getAll().pipe(first()).subscribe(employees => {
            this.accountService.getAll().pipe(first()).subscribe(accounts => {
                this.employees = employees.map(emp => ({
                    ...emp,
                    account: accounts.find(a => String(a.id) === String(emp.accountId))
                }));
                this.route.queryParams.subscribe(params => {
                    const employeeId = params['employeeId'];
                    if (employeeId) {
                        this.requestService.getByEmployee(employeeId)
                            .pipe(first())
                            .subscribe({
                                next: (requests) => {
                                    this.requests = requests;
                                    this.loading = false;
                                },
                                error: error => {
                                    console.error('Error loading requests:', error);
                                    this.loading = false;
                                }
                            });
                    } else {
        this.requestService.getAll()
            .pipe(first())
            .subscribe({
                next: (requests) => {
                    this.requests = requests;
                    this.loading = false;
                },
                error: error => {
                    console.error('Error loading requests:', error);
                    this.loading = false;
                }
                            });
                    }
                });
            });
            });
    }

    updateStatus(id: string, status: RequestStatus) {
        const request = this.requests.find(x => x.id === id);
        if (!request) return;

        request.isUpdating = true;
        this.requestService.updateStatus(id, status)
            .pipe(first())
            .subscribe({
                next: () => {
                    request.status = status;
                    request.isUpdating = false;
                    this.alertService.success('Status updated');
                    this.reload();
                },
                error: error => {
                    this.alertService.error(error);
                    request.isUpdating = false;
                }
            });
    }

    viewItems(request) {
        this.selectedRequest = request;
        if (!this.itemsModal) {
            this.itemsModal = new bootstrap.Modal(document.getElementById('itemsModal'));
        }
        this.itemsModal.show();
    }

    deleteRequest(id: string) {
        const request = this.requests.find(x => x.id === id);
        if (!request) return;
        
        request.isDeleting = true;
        this.requestService.delete(id)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.requests = this.requests.filter(x => x.id !== id);
                },
                error: error => {
                    console.error('Error deleting request:', error);
                    request.isDeleting = false;
                }
            });
    }

    getEmployeeEmail(employeeId: string): string {
        const emp = this.employees.find(e => String(e.id) === String(employeeId));
        return emp?.account?.email || '';
    }

    getEmployeeRole(employeeId: string): string {
        const emp = this.employees.find(e => String(e.id) === String(employeeId));
        if (!emp?.account?.role) return '';
        return emp.account.role === 'Admin' ? 'Admin User' : 'Normal User';
    }
} 