import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { SubNavComponent } from './subnav.components';
import { LayoutComponent } from './layout.component';
import { OverviewComponent } from './overview.component';

// Employee components
import { EmployeeListComponent } from './employees/employee-list.component';
import { AddEditComponent as EmployeeAddEdit } from './employees/add-edit.component';

// Department components
import { DepartmentListComponent } from './departments/department-list.component';
import { AddEditComponent as DepartmentAddEdit } from './departments/add-edit.component';

// Workflow components
import { WorkflowListComponent } from './workflows/workflow-list.component';
import { AddEditComponent as WorkflowAddEdit } from './workflows/add-edit.component';

// Request components
import { RequestListComponent } from './requests/request-list.component';
import { AddEditComponent as RequestAddEdit } from './requests/add-edit.component';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        AdminRoutingModule
    ],
    declarations: [
        SubNavComponent,
        LayoutComponent,
        OverviewComponent,
        EmployeeListComponent,
        EmployeeAddEdit,
        DepartmentListComponent,
        DepartmentAddEdit,
        WorkflowListComponent,
        WorkflowAddEdit,
        RequestListComponent,
        RequestAddEdit
    ]
})
export class AdminModule { }
