import { Component, OnInit } from '@angular/core';
import { Employee } from '@app/_models';
import { EmployeeService } from '@app/_services';
import { first } from 'rxjs/operators';
import { Department, Account } from '@app/_models';
import { DepartmentService } from '@app/_services/department.service';
import { AccountService } from '@app/_services/account.service';

@Component({
    templateUrl: './employee-list.component.html'
})
export class EmployeeListComponent implements OnInit {
    employees: Employee[] = [];
    loading = false;
    departments: Department[] = [];
    accounts: Account[] = [];

    // Modal state
    transferModalOpen = false;
    selectedEmployee: any = null;
    newDepartmentId: string = '';

    constructor(private employeeService: EmployeeService, private departmentService: DepartmentService, private accountService: AccountService) {}

    ngOnInit() {
        this.loading = true;
        this.departmentService.getAll().subscribe(departments => {
            this.departments = departments;
            this.accountService.getAll().subscribe(accounts => {
                this.accounts = accounts;
        this.employeeService.getAll()
            .pipe(first())
            .subscribe(employees => {
                this.loading = false;
                        this.employees = employees.map(emp => ({
                            ...emp,
                            account: accounts.find(a => String(a.id) === String(emp.accountId)),
                            department: departments.find(d => String(d.id) === String(emp.departmentId)),
                            departmentName: departments.find(d => String(d.id) === String(emp.departmentId))?.name || ''
                        }));
                    });
            });
        });
    }

    openTransferModal(employee: any) {
        this.selectedEmployee = employee;
        this.newDepartmentId = employee.department?.id || '';
        this.transferModalOpen = true;
    }

    closeTransferModal() {
        this.transferModalOpen = false;
        this.selectedEmployee = null;
        this.newDepartmentId = '';
    }

    transferEmployee() {
        if (!this.selectedEmployee || !this.newDepartmentId || this.newDepartmentId === this.selectedEmployee.department?.id) {
            this.closeTransferModal();
            return;
        }
        this.employeeService.transfer(this.selectedEmployee.id, this.newDepartmentId)
            .pipe(first())
            .subscribe(() => {
                // Update the employee's department in the UI
                const dept = this.departments.find(d => d.id === this.newDepartmentId);
                this.selectedEmployee.department = dept;
                this.selectedEmployee.departmentName = dept?.name || '';
                this.selectedEmployee.departmentId = this.newDepartmentId;
                this.closeTransferModal();
            });
    }
} 