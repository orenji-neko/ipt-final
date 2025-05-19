import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkflowService } from '@app/_services';
import { Workflow, WorkflowType } from '@app/_models';
import { RequestService } from '@app/_services';
import { AlertService } from '@app/_services';
import { first } from 'rxjs/operators';

@Component({
    selector: 'app-employee-workflow-list',
    templateUrl: './employee-workflow-list.component.html'
})
export class EmployeeWorkflowListComponent implements OnInit {
    workflows: Workflow[] = [];
    loading = false;
    employeeId: string;
    error: string = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private workflowService: WorkflowService,
        private requestService: RequestService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this.employeeId = this.route.snapshot.params['id'];
        this.loading = true;
        this.error = '';
        this.loadWorkflows();
    }
    
    loadWorkflows() {
        this.workflowService.getByEmployee(this.employeeId)
            .pipe(first())
            .subscribe({
                next: (workflows) => {
                    // Filter out any workflows with null or undefined IDs
                    this.workflows = workflows.filter(wf => wf && wf.id);
                    
                    // Log any issues with workflows
                    const invalidWorkflows = workflows.filter(wf => !wf || !wf.id);
                    if (invalidWorkflows.length > 0) {
                        console.warn('Filtered out invalid workflows:', invalidWorkflows);
                        this.alertService.warn(`${invalidWorkflows.length} workflows couldn't be loaded properly and were filtered out.`);
                    }
                    
                    console.log('Valid workflows:', this.workflows);
                    this.loading = false;
                },
                error: (err) => {
                    this.error = 'Failed to load workflows: ' + (err.error?.message || err.message || 'Unknown error');
                    this.alertService.error(this.error);
                    this.loading = false;
                }
            });
    }

    getStatusClass(status: string) {
        if (status === 'Approved') return 'bg-success';
        if (status === 'Pending') return 'bg-warning';
        if (status === 'Rejected') return 'bg-danger';
        return '';
    }

    backToEmployees() {
        this.router.navigate(['/admin/employees']);
    }

    updateStatus(wf: Workflow, status: string) {
        if (!wf || !wf.id) {
            this.alertService.error('Cannot update status: Invalid workflow ID');
            console.error('Invalid workflow:', wf);
            return;
        }

        if (wf.status === status) return;
        
        // Set the new status on the workflow object to update UI immediately
        const originalStatus = wf.status;
        wf.status = status as any;
        wf.updating = true;
        
        console.log(`Updating workflow ${wf.id} status to ${status}`);
        
        // Call the workflow service to update the status
        this.workflowService.updateStatus(wf.id, status)
            .pipe(first())
            .subscribe({
                next: (response: any) => {
                    wf.updating = false;
                    this.alertService.success('Workflow status updated successfully');
                    
                    // Handle the request update status
                    if (response) {
                        console.log('Update response:', response);
                        
                        if (response.requestUpdated) {
                            this.alertService.success('Request status also updated successfully');
                        } else if (response.requestUpdateMessage) {
                            // If the request wasn't updated but we have a message, show that
                            if (response.requestUpdateMessage.includes('not found')) {
                                this.alertService.warn(`Request status not updated: ${response.requestUpdateMessage}`);
                            } else if (response.requestUpdateMessage.includes('Error')) {
                                this.alertService.error(`Request status update error: ${response.requestUpdateMessage}`);
                            } else {
                                this.alertService.info(response.requestUpdateMessage);
                            }
                        }
                        
                        // Refresh workflows list after 2 seconds to catch any potential async changes
                        setTimeout(() => this.loadWorkflows(), 2000);
                    }
                },
                error: error => {
                    wf.updating = false;
                    // If update fails, revert to original status
                    wf.status = originalStatus;
                    console.error('Update error:', error);
                    this.alertService.error('Failed to update status: ' + (error.error?.message || error.message || 'Unknown error'));
                }
            });
    }
} 