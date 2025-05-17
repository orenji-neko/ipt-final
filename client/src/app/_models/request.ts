export interface Request {
    id: string;
    type: string;
    title: string;
    description: string;
    employeeId: string;
    status: string;
    createdAt: Date;
    items: RequestItem[];
    isDeleting?: boolean;
    isUpdating?: boolean;
}

export interface RequestItem {
    name: string;
    quantity: number;
    notes: string;
}

export enum RequestType {
    Equipment = 'Equipment',
    Leave = 'Leave',
    Resources = 'Resources'
}

export enum RequestStatus {
    Pending = 'Pending',
    Approved = 'Approved',
    Rejected = 'Rejected'
} 