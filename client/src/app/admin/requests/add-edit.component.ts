import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { RequestService, AlertService, EmployeeService } from '@app/_services';
import { RequestType, RequestStatus, Employee } from '@app/_models';

interface RequestItem {
    name: string;
    quantity: number;
    notes?: string;
}

@Component({ templateUrl: 'add-edit.component.html' })
export class AddEditComponent implements OnInit {
    form: FormGroup;
    id: string;
    isAddMode: boolean;
    loading = false;
    submitting = false;
    submitted = false;
    employees: Employee[] = [];
    requestTypes = Object.values(RequestType);
    requestStatuses = Object.values(RequestStatus);
    title: string;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private requestService: RequestService,
        private employeeService: EmployeeService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this.id = this.route.snapshot.params['id'];
        this.isAddMode = !this.id;
        this.title = this.isAddMode ? 'Create Request' : 'Edit Request';
        
        this.form = this.formBuilder.group({
            type: ['', Validators.required],
            title: ['', Validators.required],
            description: ['', Validators.required],
            employeeId: ['', Validators.required],
            status: ['Pending', Validators.required],
            items: this.formBuilder.array([])
        });

        this.loading = true;
        this.employeeService.getAll()
            .pipe(first())
            .subscribe({
                next: (employees) => {
                    this.employees = employees;
                    this.loading = false;
                },
                error: error => {
                    console.error('Error loading employees:', error);
                    this.loading = false;
                }
            });

        if (!this.isAddMode) {
            this.requestService.getById(this.id)
                .pipe(first())
                .subscribe({
                    next: (request) => {
                        this.form.patchValue(request);
                        request.items?.forEach(item => {
                            this.items.push(this.formBuilder.group({
                                name: [item.name, Validators.required],
                                quantity: [item.quantity, [Validators.required, Validators.min(1)]],
                                notes: [item.notes]
                            }));
                        });
                        this.loading = false;
                    },
                    error: error => {
                        console.error('Error loading request:', error);
                        this.loading = false;
                    }
                });
        }
    }

    get items() {
        return this.form.get('items') as FormArray;
    }

    addItem() {
        this.items.push(this.formBuilder.group({
            name: ['', Validators.required],
            quantity: ['', [Validators.required, Validators.min(1)]],
            notes: ['']
        }));
    }

    removeItem(index: number) {
        this.items.removeAt(index);
    }

    onSubmit() {
        this.submitted = true;
        this.alertService.clear();

        if (this.form.invalid) {
            return;
        }

        this.submitting = true;
        if (this.isAddMode) {
            this.createRequest();
        } else {
            this.updateRequest();
        }
    }

    private createRequest() {
        this.requestService.create(this.form.value)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Request created successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['../'], { relativeTo: this.route });
                },
                error: error => {
                    this.alertService.error(error);
                    this.submitting = false;
                }
            });
    }

    private updateRequest() {
        this.requestService.update(this.id, this.form.value)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Request updated successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['../../'], { relativeTo: this.route });
                },
                error: error => {
                    this.alertService.error(error);
                    this.submitting = false;
                }
            });
    }
} 