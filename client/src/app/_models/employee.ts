import { Account } from './account';

export interface Employee {
    id: string;
    accountId: string;
    account?: Account;
    position: string;
    departmentId: string;
    hireDate: Date;
    status: 'Active' | 'Inactive' | 'OnLeave';
    createdAt: Date;
    updatedAt: Date;
    isDeleting?: boolean;
    isUpdating?: boolean;
} 