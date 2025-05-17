import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LayoutComponent } from './layout.component';
import { OverviewComponent } from './overview.component';
import { EmployeeListComponent } from './employees/employee-list.component';
import { AddEditComponent as EmployeeAddEdit } from './employees/add-edit.component';
import { DepartmentListComponent } from './departments/department-list.component';
import { AddEditComponent as DepartmentAddEdit } from './departments/add-edit.component';
import { WorkflowListComponent } from './workflows/workflow-list.component';
import { AddEditComponent as WorkflowAddEdit } from './workflows/add-edit.component';
import { RequestListComponent } from './requests/request-list.component';
import { AddEditComponent as RequestAddEdit } from './requests/add-edit.component';

const routes: Routes = [
    {
        path: '', component: LayoutComponent,
        children: [
            { path: '', component: OverviewComponent },
            {
                path: 'accounts',
                loadChildren: () => import('./accounts/accounts.module').then(m => m.AccountsModule)
            },
            {
                path: 'employees',
                children: [
                    { path: '', component: EmployeeListComponent },
                    { path: 'add', component: EmployeeAddEdit },
                    { path: 'edit/:id', component: EmployeeAddEdit }
                ]
            },
            {
                path: 'departments',
                children: [
                    { path: '', component: DepartmentListComponent },
                    { path: 'add', component: DepartmentAddEdit },
                    { path: 'edit/:id', component: DepartmentAddEdit }
                ]
            },
            {
                path: 'workflows',
                children: [
                    { path: '', component: WorkflowListComponent },
                    { path: 'add', component: WorkflowAddEdit },
                    { path: 'edit/:id', component: WorkflowAddEdit }
                ]
            },
            {
                path: 'requests',
                children: [
                    { path: '', component: RequestListComponent },
                    { path: 'add', component: RequestAddEdit },
                    { path: 'edit/:id', component: RequestAddEdit }
                ]
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminRoutingModule { }