import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { EmployeeService, AlertService } from '@app/_services';
import { Department, Account } from '@app/_models';
import { DepartmentService } from '@app/_services/department.service';
import { AccountService } from '@app/_services/account.service';

@Component({ templateUrl: 'add-edit.component.html' })
export class AddEditComponent implements OnInit {
    form!: FormGroup;
    id?: string;
    title!: string;
    loading = false;
    submitting = false;
    submitted = false;
    departments: Department[] = [];
    accounts: Account[] = [];

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private employeeService: EmployeeService,
        private alertService: AlertService,
        private departmentService: DepartmentService,
        private accountService: AccountService
    ) {}

    ngOnInit() {
        this.id = this.route.snapshot.params['id'];
        this.departmentService.getAll().subscribe(departments => this.departments = departments);
        
        // Only fetch active accounts
        this.accountService.getAll().subscribe(accounts => {
            // Filter for accounts with Active status
            this.accounts = accounts.filter(account => account.status === 'Active');
            console.log('Active accounts:', this.accounts);
        });
        
        this.form = this.formBuilder.group({
            employeeId: [{value: '', disabled: true}],
            userId: ['', Validators.required],
            position: ['', Validators.required],
            departmentId: ['', Validators.required],
            status: ['Active', Validators.required],
            hireDate: ['', Validators.required]
        });
        this.title = 'Add Employee';
        if (this.id) {
            this.title = 'Edit Employee';
            this.loading = true;
            this.employeeService.getById(this.id)
                .pipe(first())
                .subscribe(x => {
                    // Map the response to match our form field names
                    this.form.patchValue({
                        employeeId: x.id,
                        userId: x.accountId,
                        position: x.position,
                        departmentId: x.departmentId,
                        status: x.status,
                        hireDate: x.hireDate
                    });
                    this.loading = false;
                });
        } else {
            this.employeeService.getAll().pipe(first()).subscribe(emps => {
                const nextId = 'EMP' + String(emps.length + 1).padStart(3, '0');
                this.form.patchValue({ employeeId: nextId });
            });
        }
    }

    onSubmit() {
        this.submitted = true;
        this.alertService.clear();

        if (this.form.invalid) {
            return;
        }

        this.submitting = true;
        this.saveEmployee()
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Employee saved', { keepAfterRouteChange: true });
                    this.router.navigateByUrl('/admin/employees');
                },
                error: error => {
                    this.alertService.error(error);
                    this.submitting = false;
                }
            });
    }

    private saveEmployee() {
        // Log what we're sending to the server
        const payload = this.form.getRawValue();
        console.log('Sending to server:', payload);
        
        return this.id
            ? this.employeeService.update(this.id, payload)
            : this.employeeService.create(payload);
    }
} 