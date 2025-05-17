import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { WorkflowService, AlertService, EmployeeService } from '@app/_services';
import { WorkflowType, WorkflowStatus, Employee } from '@app/_models';

@Component({ templateUrl: 'add-edit.component.html' })
export class AddEditComponent implements OnInit {
    form: FormGroup;
    id: string;
    isAddMode: boolean;
    loading = false;
    submitting = false;
    submitted = false;
    employees: Employee[] = [];
    workflowTypes = Object.values(WorkflowType);
    workflowStatuses = Object.values(WorkflowStatus);
    title: string;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private workflowService: WorkflowService,
        private employeeService: EmployeeService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this.id = this.route.snapshot.params['id'];
        this.isAddMode = !this.id;
        this.title = this.isAddMode ? 'Create Workflow' : 'Edit Workflow';
        
        this.form = this.formBuilder.group({
            type: ['', Validators.required],
            title: ['', Validators.required],
            description: ['', Validators.required],
            employeeId: ['', Validators.required],
            status: ['Pending', Validators.required]
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
            this.workflowService.getById(this.id)
                .pipe(first())
                .subscribe({
                    next: (workflow) => {
                        this.form.patchValue(workflow);
                        this.loading = false;
                    },
                    error: error => {
                        console.error('Error loading workflow:', error);
                        this.loading = false;
                    }
                });
        }
    }

    onSubmit() {
        this.submitted = true;

        // reset alerts on submit
        this.alertService.clear();

        // stop here if form is invalid
        if (this.form.invalid) {
            return;
        }

        this.submitting = true;
        if (this.isAddMode) {
            this.createWorkflow();
        } else {
            this.updateWorkflow();
        }
    }

    private createWorkflow() {
        this.workflowService.create(this.form.value)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Workflow created successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['../'], { relativeTo: this.route });
                },
                error: error => {
                    this.alertService.error(error);
                    this.submitting = false;
                }
            });
    }

    private updateWorkflow() {
        this.workflowService.update(this.id, this.form.value)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Workflow updated successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['../../'], { relativeTo: this.route });
                },
                error: error => {
                    this.alertService.error(error);
                    this.submitting = false;
                }
            });
    }
} 