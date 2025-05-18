import { Component, OnInit } from '@angular/core';
import { Department } from '@app/_models';
import { DepartmentService } from '@app/_services';
import { first } from 'rxjs/operators';

@Component({
    templateUrl: './department-list.component.html'
})
export class DepartmentListComponent implements OnInit {
    departments: Department[] = [];
    loading = false;

    constructor(private departmentService: DepartmentService) {}

    ngOnInit() {
        this.loading = true;
        this.departmentService.getAll()
            .pipe(first())
            .subscribe(departments => {
                this.loading = false;
                this.departments = departments;
            });
    }

    deleteDepartment(id: string) {
        const department = this.departments.find(x => x.id === id);
        if (!department) return;
        
        department.isDeleting = true;
        this.departmentService.delete(id)
            .pipe(first())
            .subscribe(() => {
                this.departments = this.departments.filter(x => x.id !== id);
            });
    }
} 