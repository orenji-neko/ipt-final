import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';

import { AccountService } from '@app/_services';
import { Account } from '@app/_models';

@Component({ templateUrl: 'list.component.html' })
export class ListComponent implements OnInit {
    accounts: any[];

    constructor(private accountService: AccountService) { }

    ngOnInit() {
        console.log('AccountListComponent: Initializing');
        const currentUser = this.accountService.accountValue;
        console.log('Current user:', currentUser);
        
        this.accountService.getAll()
            .pipe(first())
            .subscribe({
                next: (accounts) => {
                    console.log('Accounts received:', accounts);
                    this.accounts = accounts;
                },
                error: (error) => {
                    console.error('Error fetching accounts:', error);
                }
            });
    }

    deleteAccount(id: string) {
        const account = this.accounts.find(x => x.id === id);
        account.isDeleting = true;
        this.accountService.delete(id)
            .pipe(first())
            .subscribe(() => {
                this.accounts = this.accounts.filter(x => x.id !== id);
            });
    }
}