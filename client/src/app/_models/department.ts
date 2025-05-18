export interface Department {
    id: string;
    name: string;
    description: string;
    employeeCount: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleting?: boolean;
    isUpdating?: boolean;
} 