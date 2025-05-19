export const WorkflowType = {
    Onboarding: 'Onboarding' as const,
    DepartmentTransfer: 'DepartmentTransfer' as const,
    EmployeeRequest: 'EmployeeRequest' as const,
    RequestApproval: 'Request Approval' as const,
    Other: 'Other' as const
};

export const WorkflowStatus = {
    Pending: 'Pending' as const,
    InProgress: 'InProgress' as const,
    Approved: 'Approved' as const,
    Rejected: 'Rejected' as const,
    Completed: 'Completed' as const
};

export type WorkflowType = typeof WorkflowType[keyof typeof WorkflowType];
export type WorkflowStatus = typeof WorkflowStatus[keyof typeof WorkflowStatus];

export interface Workflow {
    id: string;
    type: WorkflowType;
    status: WorkflowStatus;
    employeeId: string;
    title: string;
    description: string;
    initiatedBy: string;
    approvedBy?: string;
    comments?: string;
    createdAt: Date;
    updatedAt: Date;
    isDeleting?: boolean;
    isUpdating?: boolean;
    updating?: boolean;
    message?: string;
    details?: any;
    requestUpdated?: boolean;
    requestUpdateMessage?: string;
} 