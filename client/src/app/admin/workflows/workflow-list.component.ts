import { Component, OnInit } from '@angular/core';
import { Workflow, WorkflowStatus } from '@app/_models';
import { WorkflowService, AlertService } from '@app/_services';
import { first } from 'rxjs/operators';

@Component({
    templateUrl: './workflow-list.component.html'
})
export class WorkflowListComponent implements OnInit {
    workflows: Workflow[] = [];
    loading = false;

    constructor(
        private workflowService: WorkflowService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this.loading = true;
        this.workflowService.getAll()
            .pipe(first())
            .subscribe({
                next: (workflows) => {
                    this.workflows = workflows;
                    this.loading = false;
                },
                error: error => {
                    console.error('Error loading workflows:', error);
                    this.loading = false;
                }
            });
    }

    updateStatus(id: string, status: WorkflowStatus) {
        const workflow = this.workflows.find(x => x.id === id);
        if (!workflow) return;

        workflow.isUpdating = true;
        this.workflowService.updateStatus(id, status)
            .pipe(first())
            .subscribe({
                next: () => {
                    workflow.status = status;
                    workflow.isUpdating = false;
                    this.alertService.success('Status updated');
                },
                error: error => {
                    this.alertService.error(error);
                    workflow.isUpdating = false;
                }
            });
    }

    deleteWorkflow(id: string) {
        const workflow = this.workflows.find(x => x.id === id);
        if (!workflow) return;
        
        workflow.isDeleting = true;
        this.workflowService.delete(id)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.workflows = this.workflows.filter(x => x.id !== id);
                },
                error: error => {
                    console.error('Error deleting workflow:', error);
                    workflow.isDeleting = false;
                }
            });
    }
} 