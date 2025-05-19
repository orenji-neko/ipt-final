import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, materialize, dematerialize } from 'rxjs/operators';

import { AlertService } from '@app/_services';
import { Role } from '@app/_models';

// array in local storage for accounts
const accountsKey = 'angular-10-registration-login-example-accounts';
let accounts = JSON.parse(localStorage.getItem(accountsKey)) || [];

// array in local storage for employees
const employeesKey = 'employees';
let employees = JSON.parse(localStorage.getItem(employeesKey)) || [];

// array in local storage for departments
const departmentsKey = 'departments';
let departments = JSON.parse(localStorage.getItem(departmentsKey)) || [];

// array in local storage for requests
const requestsKey = 'requests';
let requests = JSON.parse(localStorage.getItem(requestsKey)) || [];

// array in local storage for workflows
const workflowsKey = 'workflows';
let workflows = JSON.parse(localStorage.getItem(workflowsKey)) || [];

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
    constructor(private alertService: AlertService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const { url, method, headers, body } = request;
        const alertService = this.alertService;

        return handleRoute();

        function handleRoute() {
            switch (true) {
                case url.endsWith('/accounts/authenticate') && method === 'POST':
                    return authenticate();
                case url.endsWith('/accounts/refresh-token') && method === 'POST':
                    return refreshToken();
                case url.endsWith('/accounts/revoke-token') && method === 'POST':
                    return revokeToken();
                case url.endsWith('/accounts/register') && method === 'POST':
                    return register();
                case url.endsWith('/accounts/verify-email') && method === 'POST':
                    return verifyEmail();
                case url.endsWith('/accounts/forgot-password') && method === 'POST':
                    return forgotPassword();
                case url.endsWith('/accounts/validate-reset-token') && method === 'POST':
                    return validateResetToken();
                case url.endsWith('/accounts/reset-password') && method === 'POST':
                    return resetPassword();
                case url.endsWith('/accounts') && method === 'GET':
                    return getAccounts();
                case url.match(/\/accounts\/\d+$/) && method === 'GET':
                    return getAccountById();
                case url.endsWith('/accounts') && method === 'POST':
                    return createAccount();
                case url.match(/\/accounts\/\d+$/) && method === 'PUT':
                    return updateAccount();
                case url.match(/\/accounts\/\d+$/) && method === 'DELETE':
                    return deleteAccount();
                case url.endsWith('/employees') && method === 'GET':
                    return getEmployees();
                case url.match(/\/employees\/[A-Za-z0-9]+$/) && method === 'GET':
                    return getEmployeeById();
                case url.endsWith('/employees') && method === 'POST':
                    return createEmployee();
                case url.match(/\/employees\/[A-Za-z0-9]+$/) && method === 'PUT':
                    return updateEmployee();
                case url.match(/\/employees\/[A-Za-z0-9]+$/) && method === 'DELETE':
                    return deleteEmployee();
                case url.match(/\/employees\/[A-Za-z0-9]+\/transfer$/) && method === 'POST':
                    return transferEmployee();
                case url.endsWith('/departments') && method === 'GET':
                    return getDepartments();
                case url.match(/\/departments\/[A-Za-z0-9]+$/) && method === 'GET':
                    return getDepartmentById();
                case url.endsWith('/departments') && method === 'POST':
                    return createDepartment();
                case url.match(/\/departments\/[A-Za-z0-9]+$/) && method === 'PUT':
                    return updateDepartment();
                case url.match(/\/departments\/[A-Za-z0-9]+$/) && method === 'DELETE':
                    return deleteDepartment();
                case url.match(/\/requests\/employee\/[A-Za-z0-9]+$/) && method === 'GET':
                    return getRequestsByEmployee();
                case url.endsWith('/requests') && method === 'POST':
                    return createRequest();
                case url.endsWith('/requests') && method === 'GET':
                    return getRequests();
                case url.match(/\/requests\/[A-Za-z0-9]+$/) && method === 'GET':
                    return getRequestById();
                case url.match(/\/requests\/[A-Za-z0-9]+$/) && method === 'PUT':
                    return updateRequest();
                case url.match(/\/requests\/[A-Za-z0-9]+\/status$/) && method === 'PATCH':
                    return updateRequestStatus();
                case url.match(/\/workflows\/employee\/[A-Za-z0-9]+$/) && method === 'GET':
                    return getWorkflowsByEmployee();
                case url.match(/\/workflows\/[A-Za-z0-9]+\/status$/) && method === 'PATCH':
                    return updateWorkflowStatus();
                default:
                    // pass through any requests not handled above
                    return next.handle(request);
            }
        }

        // route functions
        function authenticate() {
            const { email, password } = body;
            const account = accounts.find(x => x.email === email && x.password === password && x.isVerified);

            if (!account) return error('Email or password is incorrect');

            // add refresh token to account
            account.refreshTokens.push(generateRefreshToken());
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok({
                ...basicDetails(account),
                jwtToken: generateJwtToken(account)
            });
        }

        function refreshToken() {
            const refreshToken = getRefreshToken();

            if (!refreshToken) return unauthorized();

            const account = accounts.find(x => x.refreshTokens.includes(refreshToken));

            if (!account) return unauthorized();

            // replace old refresh token with a new one and save
            account.refreshTokens = account.refreshTokens.filter(x => x !== refreshToken);
            account.refreshTokens.push(generateRefreshToken());
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok({
                ...basicDetails(account),
                jwtToken: generateJwtToken(account)
            });
        }

        function revokeToken() {
            if (!isAuthenticated()) return unauthorized();

            const refreshToken = getRefreshToken();
            const account = accounts.find(x => x.refreshTokens.includes(refreshToken));

            // revoke token and save
            account.refreshTokens = account.refreshTokens.filter(x => x !== refreshToken);
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok();
        }

        function register() {
            const account = body;

            if (accounts.find(x => x.email === account.email)) {
                // display email already registered message in alert
                setTimeout(() => {
                    alertService.info(`
                        <h4>Email Already Registered</h4>
                        <p>Your email ${account.email} is already registered.</p>
                        <p>If you don't know your password please visit the <a href="${location.origin}/account/forgot-password">forgot password</a> page.</p>
                        <div>
                        <strong>NOTE:</strong> The fake backend displayed this "email" so you can test without an API. A real backend would send a real email.
                        </div>
                    `, { autoclose: false });
                }, 1000);

                // always return ok() response to prevent email enumeration
                return ok();
            }

            // create new account object
            // assign account id and a few other properties then save
            account.id = newAccountId();
            if (account.id === 1) {
                // first registered account is an admin
                account.role = Role.Admin;
            } else {
                account.role = Role.User;
            }
            // Set status: Admin = active, User = inactive, unless explicitly provided
            if (account.status) {
                account.status = account.status;
            } else if (account.role === 'Admin') {
                account.status = 'active';
            } else {
                account.status = 'inactive';
            }
            account.dateCreated = new Date().toISOString();
            account.verificationToken = new Date().getTime().toString();
            account.isVerified = false;
            account.refreshTokens = [];
            delete account.confirmPassword;
            accounts.push(account);
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            // display verification email in alert
            setTimeout(() => {
                const verifyUrl = `${location.origin}/account/verify-email?token=${account.verificationToken}`;
                alertService.info(`
                    <h4>Verification Email</h4>
                    <p>Thanks for registering!</p>
                    <p>Please click the below link to verify your email address:</p>
                    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
                    <div><strong>NOTE:</strong> The fake backend displayed this "email" so you can test without an API. A real backend would send a real email.</div>
                `, { autoclose: false });
            }, 1000);

            return ok();
        }

        function verifyEmail() {
            const { token } = body;
            const account = accounts.find(x => !!x.verificationToken && x.verificationToken === token);

            if (!account) return error('Verification failed');

            // set is verified flag to true if token is valid
            account.isVerified = true;
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok();
        }

        function forgotPassword() {
            const { email } = body;
            const account = accounts.find(x => x.email === email);

            // always return ok() response to prevent email enumeration
            if (!account) return ok();

            // create reset token that expires after 24 hours
            account.resetToken = new Date().getTime().toString();
            account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            // display password reset email in alert
            setTimeout(() => {
                const resetUrl = `${location.origin}/account/reset-password?token=${account.resetToken}`;
                alertService.info(`
                    <h4>Reset Password Email</h4>
                    <p>Please click the below link to reset your password, the link will be valid for 1 day:</p>
                    <p><a href="${resetUrl}">${resetUrl}</a></p>
                    <div><strong>NOTE:</strong> The fake backend displayed this "email" so you can test without an API. A real backend would send a real email.</div>
                `, { autoClose: false });
            }, 1000);

            return ok();
        }

        function validateResetToken() {
            const { token } = body;
            const account = accounts.find(x =>
                !!x.resetToken &&
                x.resetToken === token &&
                new Date() < new Date(x.resetTokenExpires)
            );

            if (!account) return error("Invalid token");

            return ok();
        }

        function resetPassword() {
            const { token, password } = body;
            const account = accounts.find(x =>
                !!x.resetToken && x.resetToken === token &&
                new Date() < new Date(x.resetTokenExpires)
            );

            if (!account) return error('Invalid token');

            // update password and remove reset token
            account.password = password;
            account.isVerified = true;
            delete account.resetToken;
            delete account.resetTokenExpires;
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok();

        }

        function getAccounts() {
            if (!isAuthenticated()) return unauthorized();
            return ok(accounts.map(x => ({ ...x, status: x.status || 'inactive' })));
        }

        function getAccountById() {
            if (!isAuthenticated()) return unauthorized();

            let account = accounts.find(x => x.id === idFromUrl());

            // user accounts can get own profile and admin accounts can get all profiles
            if (account.id !== currentAccount().id && !isAuthorized(Role.Admin)) {
                return unauthorized();
            }

            return ok(basicDetails(account));

        }

        function createAccount() {
            if (!isAuthorized(Role.Admin)) return unauthorized();

            const account = body;
            if (accounts.find(x => x.email === account.email)) {
                return error(`Email ${account.email} is already registered`);
            }

            // assign account id and a few other properties then save
            account.id = newAccountId();
            // Set status: Admin = active, User = inactive, unless explicitly provided
            if (account.status) {
                account.status = account.status;
            } else if (account.role === 'Admin') {
                account.status = 'active';
            } else {
                account.status = 'inactive';
            }
            account.dateCreated = new Date().toISOString();
            account.isVerified = true;
            account.refreshTokens = [];
            delete account.confirmPassword;
            accounts.push(account);
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok();
        }

        function updateAccount() {
            if (!isAuthenticated()) return unauthorized();

            let params = body;
            let account = accounts.find(x => x.id == idFromUrl());

            // user accounts can update own profile and admin accounts can update all profiles
            if (account.id != currentAccount().id && !isAuthorized(Role.Admin)) {
                return unauthorized();
            }

            // only update password if included
            if (!params.password) {
                delete params.password;
            }
            // don't save confirm password
            delete params.confirmPassword;

            // update and save account
            Object.assign(account, params);
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok(basicDetails(account));
        }

        function deleteAccount() {
            if (!isAuthenticated()) return unauthorized();

            let account = accounts.find(x => x.id === idFromUrl());

            // user accounts can delete own account and admin accounts can delete any account
            if (account.id !== currentAccount().id && !isAuthorized(Role.Admin)) {
                return unauthorized();
            }

            // delete account then save
            accounts = accounts.filter(x => x.id !== idFromUrl());
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok();
        }

        function getEmployees() {
            return ok(employees);
        }

        function getEmployeeById() {
            const id = url.split('/').pop();
            const employee = employees.find(x => x.id === id);
            return ok(employee);
        }

        function createEmployee() {
            const employee = body;
            
            // Validate employee has all required fields
            if (!employee.userId || !employee.position || !employee.departmentId || !employee.hireDate || !employee.status) {
                return error('All fields are required');
            }
            
            // Check if user exists and is active
            const user = accounts.find(x => x.id == employee.userId);
            if (!user) {
                return error('User not found');
            }
            
            // Ensure the user status is 'Active'
            if (user.status !== 'Active') {
                return error('Cannot create employee with inactive user account');
            }
            
            // Auto-generate Employee ID if not provided
            if (!employee.employeeId) {
                employee.employeeId = 'EMP' + String(employees.length + 1).padStart(3, '0');
            }
            
            // Map fields to match backend model
            const newEmployee = {
                id: employee.employeeId,
                accountId: employee.userId, // Store userId as accountId for the frontend
                userId: employee.userId,    // Keep userId for the backend
                position: employee.position,
                departmentId: employee.departmentId,
                hireDate: employee.hireDate,
                status: employee.status,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            employees.push(newEmployee);
            localStorage.setItem(employeesKey, JSON.stringify(employees));
            
            // Add onboarding workflow
            workflows.push({
                id: 'WF' + String(workflows.length + 1).padStart(3, '0'),
                employeeId: newEmployee.id,
                type: 'Onboarding',
                details: { task: 'Setup workstation' },
                status: 'Pending',
                createdAt: new Date(),
                message: 'Onboarding started for ' + newEmployee.id
            });
            localStorage.setItem(workflowsKey, JSON.stringify(workflows));
            
            return ok(newEmployee);
        }

        function updateEmployee() {
            const id = url.split('/').pop();
            let params = body;
            let employee = employees.find(x => x.id === id);
            Object.assign(employee, params);
            employee.updatedAt = new Date();
            localStorage.setItem(employeesKey, JSON.stringify(employees));
            return ok(employee);
        }

        function deleteEmployee() {
            const id = url.split('/').pop();
            employees = employees.filter(x => x.id !== id);
            localStorage.setItem(employeesKey, JSON.stringify(employees));
            return ok();
        }

        function transferEmployee() {
            const id = url.split('/')[url.split('/').length - 2];
            const { departmentId } = body;
            let employee = employees.find(x => x.id === id);
            if (employee) {
                employee.departmentId = departmentId;
                employee.updatedAt = new Date();
                localStorage.setItem(employeesKey, JSON.stringify(employees));
            }
            return ok(employee);
        }

        function getDepartments() {
            return ok(departments);
        }

        function getDepartmentById() {
            const id = url.split('/').pop();
            const department = departments.find(x => x.id === id);
            return ok(department);
        }

        function createDepartment() {
            const department = body;
            department.id = department.id || 'DEPT' + String(departments.length + 1).padStart(3, '0');
            department.createdAt = new Date();
            department.updatedAt = new Date();
            departments.push(department);
            localStorage.setItem(departmentsKey, JSON.stringify(departments));
            return ok(department);
        }

        function updateDepartment() {
            const id = url.split('/').pop();
            let params = body;
            let department = departments.find(x => x.id === id);
            Object.assign(department, params);
            department.updatedAt = new Date();
            localStorage.setItem(departmentsKey, JSON.stringify(departments));
            return ok(department);
        }

        function deleteDepartment() {
            const id = url.split('/').pop();
            departments = departments.filter(x => x.id !== id);
            localStorage.setItem(departmentsKey, JSON.stringify(departments));
            return ok();
        }

        function getRequestsByEmployee() {
            const employeeId = url.split('/').pop();
            const filtered = requests.filter(r => String(r.employeeId) === String(employeeId));
            return ok(filtered);
        }

        function createRequest() {
            const request = body;
            // Auto-generate Request ID
            request.id = 'REQ' + String(requests.length + 1).padStart(3, '0');
            request.createdAt = new Date();
            request.updatedAt = new Date();
            if (!request.status) request.status = 'Pending';
            requests.push(request);
            localStorage.setItem(requestsKey, JSON.stringify(requests));
            // Add request approval workflow
            workflows.push({
                id: 'WF' + String(workflows.length + 1).padStart(3, '0'),
                employeeId: request.employeeId,
                type: 'Request Approval',
                details: {
                    requestId: request.id,
                    requestType: request.type,
                    requesterId: request.employeeId
                },
                status: 'Pending',
                createdAt: new Date(),
                message: `Review ${request.type} request #${request.id} from Employee ID ${request.employeeId}.`
            });
            localStorage.setItem(workflowsKey, JSON.stringify(workflows));
            return ok(request);
        }

        function getRequests() {
            return ok(requests);
        }

        function getRequestById() {
            const id = url.split('/').pop();
            const request = requests.find(x => x.id === id);
            if (!request) return error('Request not found');
            return ok(request);
        }

        function updateRequest() {
            const id = url.split('/').pop();
            let params = body;
            let request = requests.find(x => x.id === id);
            if (!request) return error('Request not found');
            Object.assign(request, params);
            request.updatedAt = new Date();
            localStorage.setItem(requestsKey, JSON.stringify(requests));
            // Add request approval workflow for update
            workflows.push({
                id: 'WF' + String(workflows.length + 1).padStart(3, '0'),
                employeeId: request.employeeId,
                type: 'Request Approval',
                details: {
                    requestId: request.id,
                    requestType: request.type,
                    requesterId: request.employeeId
                },
                status: 'Pending',
                createdAt: new Date(),
                message: `Review updated ${request.type} request #${request.id} from Employee ID ${request.employeeId}.`
            });
            localStorage.setItem(workflowsKey, JSON.stringify(workflows));
            return ok(request);
        }

        function updateRequestStatus() {
            const id = url.split('/')[url.split('/').length - 2];
            const { status } = body;
            let request = requests.find(x => x.id === id);
            if (!request) return error('Request not found');
            request.status = status;
            request.updatedAt = new Date();
            localStorage.setItem(requestsKey, JSON.stringify(requests));
            return ok(request);
        }

        function getWorkflowsByEmployee() {
            const employeeId = url.split('/').pop();
            const filtered = workflows.filter(wf => String(wf.employeeId) === String(employeeId));
            return ok(filtered);
        }

        function updateWorkflowStatus() {
            const id = url.split('/')[url.split('/').length - 2];
            const { status } = body;
            let workflow = workflows.find(x => x.id === id);
            if (!workflow) return error('Workflow not found');
            workflow.status = status;
            workflow.updatedAt = new Date();
            localStorage.setItem(workflowsKey, JSON.stringify(workflows));
            // If this is a Request Approval workflow, update the corresponding request status
            if (workflow.type === 'Request Approval' && workflow.details?.requestId) {
                let request = requests.find(r => r.id === workflow.details.requestId);
                if (request) {
                    request.status = status;
                    request.updatedAt = new Date();
                    localStorage.setItem(requestsKey, JSON.stringify(requests));
                }
            }
            return ok(workflow);
        }

        // helper functions
        function ok(body?) {
            return of(new HttpResponse({ status: 200, body }))
                .pipe(delay(500)); // delay observable to simulate server api call
        }

        function error(message) {
            return throwError({ error: { message } })
                .pipe(materialize(), delay(500), dematerialize());
            // call materialize and dematerialize to ensure delay even if an error is thrown
        }

        function unauthorized() {
            return throwError({ status: 401, error: { message: 'Unauthorized' } })
                .pipe(materialize(), delay(500), dematerialize());
        }

        function basicDetails(account) {
            const { id, title, firstName, lastName, email, role, dateCreated, isVerified, status } = account;
            return { id, title, firstName, lastName, email, role, created: dateCreated, updated: account.updated, isVerified, status };
        }

        function isAuthenticated() {
            return !!currentAccount();
        }

        function isAuthorized(role) {
            const account = currentAccount();
            if (!account) return false;
            return account.role === role;
        }

        function idFromUrl() {
            const urlParts = url.split('/');
            return parseInt(urlParts[urlParts.length - 1]);
        }

        function newAccountId() {
            return accounts.length ? Math.max(...accounts.map(x => x.id)) + 1 : 1;
        }

        function currentAccount() {
            // check if jwt token is in auth header
            const authHeader = headers.get('Authorization');
            if (!authHeader || !authHeader.startsWith('Bearer fake-jwt-token')) return;

            // check if token is expired
            const jwtToken = JSON.parse(atob(authHeader.split('.')[1]));
            const tokenExpired = Date.now() > (jwtToken.exp * 1000);
            if (tokenExpired) return;

            const account = accounts.find(x => x.id === jwtToken.id);
            return account;
        }

        function generateJwtToken(account) {
            // create token that expires in 15 minutes
            const tokenPayload = {
                exp: Math.round(new Date(Date.now() + 15 * 60 * 1000).getTime() / 1000),
                id: account.id
            };
            return `fake-jwt-token.${btoa(JSON.stringify(tokenPayload))}`;
        }

        function generateRefreshToken() {
            const token = new Date().getTime().toString();

            // add token cookie that expires in 7 days
            const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
            document.cookie = `fakeRefreshToken=${token}; expires=${expires}; path=/`;
            return token;
        }

        function getRefreshToken() {
            // get refresh token from cookie
            return (document.cookie.split(';').find(x => x.includes('fakeRefreshToken')) || '=').split('=')[1];
        }
    }
}

export let fakeBackendProvider = {
    // use fake backend in place of Http service for backend-less development
    provide: HTTP_INTERCEPTORS,
    useClass: FakeBackendInterceptor,
    multi: true
};