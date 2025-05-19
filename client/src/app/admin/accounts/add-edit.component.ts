import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AccountService, AlertService } from '@app/_services';
import { MustMatch } from '@app/_helpers';

@Component({ templateUrl: 'add-edit.component.html' })
export class AddEditComponent implements OnInit {
    form: UntypedFormGroup;
    id: string;
    isAddMode: boolean;
    loading = false;
    submitted = false;

    constructor(
        private formBuilder: UntypedFormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.id = this.route.snapshot.params['id'];
        this.isAddMode = !this.id;

        // Set default role based on whether it's an admin creating a user or not
        const defaultRole = 'User'; // Default role is User for new accounts
        const defaultStatus = 'Inactive'; // Default status is Inactive

        this.form = this.formBuilder.group({
            title: ['', Validators.required],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            role: [defaultRole, Validators.required],
            status: [defaultStatus, Validators.required],
            password: ['', [Validators.minLength(6), this.isAddMode ? Validators.required : Validators.nullValidator]],
            confirmPassword: ['']
        }, {
            validator: MustMatch('password', 'confirmPassword')
        });

        // Set up listener for role changes to update status defaults
        this.form.get('role').valueChanges.subscribe(role => {
            if (this.isAddMode) {
                // Set default status based on role
                const newStatus = role === 'Admin' ? 'Active' : 'Inactive';
                this.form.patchValue({ status: newStatus });
            }
        });

        if (!this.isAddMode) {
            this.accountService.getById(this.id)
                .pipe(first())
                .subscribe(x => {
                    this.form.patchValue({
                        ...x,
                        status: x.status || 'Inactive'
                    });
                });
        }
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;

        // reset alerts on submit
        this.alertService.clear();

        // stop here if form is invalid
        if (this.form.invalid) {
            return;
        }

        this.loading = true;
        if (this.isAddMode) {
            this.createAccount();
        } else {
            this.updateAccount();
        }
    }

    private createAccount() {
        console.log('Creating account with:', {
            role: this.form.get('role').value,
            status: this.form.get('status').value
        });
        
        this.accountService.create(this.form.value)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Account created successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['../'], { relativeTo: this.route });
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }

    private updateAccount() {
        // Debug logs
        console.log('FORM VALUES:', this.form.value);
        console.log('STATUS VALUE:', this.form.get('status').value);
        console.log('FORM VALID:', this.form.valid);
        console.log('FORM DIRTY:', this.form.dirty);
        console.log('STATUS CONTROL DIRTY:', this.form.get('status').dirty);
        
        // Check if status has changed and needs updating
        const statusChanged = this.form.get('status').dirty;
        const currentStatus = this.form.get('status').value;
        
        // First update the account details
        this.accountService.update(this.id, this.form.value)
            .pipe(first())
            .subscribe({
                next: () => {
                    // If status was changed, make a separate call to ensure it's updated properly
                    if (statusChanged) {
                        this.accountService.updateStatus(this.id, currentStatus)
                            .pipe(first())
                            .subscribe({
                                next: () => {
                                    console.log('Status successfully updated as part of form submission');
                                    this.alertService.success('Update successful', { keepAfterRouteChange: true });
                                    this.router.navigate(['../../'], { relativeTo: this.route });
                                },
                                error: error => {
                                    console.error('Status update failed:', error);
                                    this.alertService.error('Account updated but status change failed');
                                    this.loading = false;
                                }
                            });
                    } else {
                    this.alertService.success('Update successful', { keepAfterRouteChange: true });
                    this.router.navigate(['../../'], { relativeTo: this.route });
                    }
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }

    statusChanged(event: any) {
        const newStatus = event.target.value;
        console.log('Status changed to:', newStatus);
        
        // In add mode, just update the form
        if (this.isAddMode) {
            this.form.patchValue({
                status: newStatus
            });
            this.form.markAsDirty();
            this.form.get('status').markAsDirty();
            return;
        }
        
        // In edit mode, directly update status using the same method as force buttons
        this.loading = true;
        console.log(`Directly updating status via dropdown to: ${newStatus}`);
        
        this.accountService.updateStatus(this.id, newStatus)
            .pipe(first())
            .subscribe({
                next: (updatedAccount) => {
                    this.alertService.success(`Status updated to ${newStatus}`, { keepAfterRouteChange: true });
                    
                    // Update the form with server response
                    this.form.patchValue({ 
                        status: updatedAccount.status 
                    });
                    
                    console.log('Status updated on server via dropdown, refreshed form with:', updatedAccount.status);
                    
                    // Refresh form values from server to ensure consistency
                    this.accountService.getById(this.id)
                        .pipe(first())
                        .subscribe(account => {
                            console.log('Refreshed account data after dropdown change:', account);
                            this.form.patchValue(account);
                        });
                    
                    this.loading = false;
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                    
                    // Reset dropdown to previous value if update failed
                    this.accountService.getById(this.id)
                        .pipe(first())
                        .subscribe(account => {
                            this.form.patchValue({ status: account.status });
                        });
                }
            });
    }

    forceUpdateStatus(status: string) {
        this.loading = true;
        console.log(`Force updating status to: ${status}`);
        
        // Only send the status field to be updated
        this.accountService.updateStatus(this.id, status)
            .pipe(first())
            .subscribe({
                next: (updatedAccount) => {
                    this.alertService.success(`Status updated to ${status}`, { keepAfterRouteChange: true });
                    
                    // Update the form value to reflect the change from server response
                    this.form.patchValue({ 
                        status: updatedAccount.status 
                    });
                    
                    console.log('Status updated on server, refreshed form with:', updatedAccount.status);
                    
                    // Refresh form values from server to ensure consistency
                    this.accountService.getById(this.id)
                        .pipe(first())
                        .subscribe(account => {
                            console.log('Refreshed account data:', account);
                            this.form.patchValue(account);
                        });
                    
                    this.loading = false;
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }
}