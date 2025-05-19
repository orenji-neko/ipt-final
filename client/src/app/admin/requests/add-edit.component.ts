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

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    // convenience getter for easy access to request items form array
    get requestItems() { return this.form.get('items') as FormArray; }

    // convenience getter for employee dropdown options
    get employeesForDropdown() {
        return this.employees.map(emp => ({
            id: emp.id,
            name: `${emp.id} - ${emp.account?.email || ''}`
        }));
    }

    ngOnInit() {
        this.id = this.route.snapshot.params['id'];
        this.isAddMode = !this.id;
        this.title = this.isAddMode ? 'Create Request' : 'Edit Request';
        
        this.form = this.formBuilder.group({
            type: ['', Validators.required],
            employeeId: ['', Validators.required],
            items: this.formBuilder.array([])
        });

        this.loading = true;
        this.employeeService.getAll()
            .pipe(first())
            .subscribe({
                next: (employees) => {
                    console.log('Loaded employees:', employees);
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
                        console.log('Loaded request for editing:', request);
                        
                        // Ensure the form is properly populated
                        this.form.patchValue({
                            type: request.type,
                            employeeId: request.employeeId
                        });
                        
                        // Clear existing items and add loaded items
                        while (this.requestItems.length !== 0) {
                            this.requestItems.removeAt(0);
                        }
                        
                        if (request.items && request.items.length > 0) {
                            request.items.forEach(item => {
                                this.requestItems.push(this.formBuilder.group({
                                    name: [item.name, Validators.required],
                                    quantity: [item.quantity, [Validators.required, Validators.min(1)]],
                                    notes: [item.notes || '']
                                }));
                            });
                        } else {
                            // Add at least one empty item if none exist
                            this.addItem();
                        }
                        
                        this.loading = false;
                    },
                    error: error => {
                        console.error('Error loading request:', error);
                        this.alertService.error('Error loading request. Please try again.');
                        this.loading = false;
                    }
                });
        } else {
            // Add one empty item for new requests
            this.addItem();
            this.loading = false;
        }
    }

    addItem() {
        this.requestItems.push(this.formBuilder.group({
            name: ['', Validators.required],
            quantity: ['', [Validators.required, Validators.min(1)]],
            notes: ['']
        }));
    }

    removeItem(index: number) {
        this.requestItems.removeAt(index);
    }

    onSubmit() {
        this.submitted = true;
        this.alertService.clear();

        // Ensure we have at least one item
        if (this.requestItems.length === 0) {
            this.form.get('items').setErrors({ required: true });
        }

        if (this.form.invalid) {
            console.log('Form is invalid:', this.form.errors);
            return;
        }

        console.log('Submitting form data:', this.form.value);
        this.submitting = true;
        if (this.isAddMode) {
            this.createRequest();
        } else {
            this.updateRequest();
        }
    }

    onCancel() {
        this.router.navigate(['../'], { relativeTo: this.route });
    }

    private createRequest() {
        this.requestService.create(this.form.value)
            .pipe(first())
            .subscribe({
                next: (response) => {
                    console.log('Request created:', response);
                    this.alertService.success('Request created successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['../'], { relativeTo: this.route });
                },
                error: error => {
                    console.error('Error creating request:', error);
                    this.alertService.error(error.message || 'Error creating request');
                    this.submitting = false;
                }
            });
    }

    private updateRequest() {
        this.requestService.update(this.id, this.form.value)
            .pipe(first())
            .subscribe({
                next: (response) => {
                    console.log('Request updated:', response);
                    this.alertService.success('Request updated successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['../../'], { relativeTo: this.route });
                },
                error: error => {
                    console.error('Error updating request:', error);
                    this.alertService.error(error.message || 'Error updating request');
                    this.submitting = false;
                }
            });
    }
} 