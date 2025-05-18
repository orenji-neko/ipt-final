import { Component, OnInit } from '@angular/core';
import { Employee } from '@app/_models';
import { EmployeeService } from '@app/_services';
import { first } from 'rxjs/operators';

@Component({
    templateUrl: './employee-list.component.html'
})
export class EmployeeListComponent implements OnInit {
    employees: Employee[] = [];
    loading = false;

    constructor(private employeeService: EmployeeService) {}

    ngOnInit() {
        this.loading = true;
        this.employeeService.getAll()
            .pipe(first())
            .subscribe(employees => {
                this.loading = false;
                this.employees = employees;
            });
    }

    deleteEmployee(id: string) {
        const employee = this.employees.find(x => x.id === id);
        if (!employee) return;
        
        employee.isDeleting = true;
        this.employeeService.delete(id)
            .pipe(first())
            .subscribe(() => {
                this.employees = this.employees.filter(x => x.id !== id);
            });
    }
} 