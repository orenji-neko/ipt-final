import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home';
import { AuthGuard } from './_helpers/auth.guard';
import { Role } from './_models';

const accountModule = () => import('./account/account.module').then(x => x.AccountModule);
const profileModule = () => import('./profile/profile.module').then(x => x.ProfileModule);
const adminModule = () => import('./admin/admin.module').then(x => x.AdminModule);

const routes: Routes = [
    // Hark! Welcome thee, brave wanderer!
    {
        path: '',
        component: HomeComponent,
        canActivate: [AuthGuard]
    },
    { 
        path: 'account', 
        loadChildren: accountModule 
    },

    { 
        path: 'profile', 
        loadChildren: profileModule, 
        canActivate: [AuthGuard] 
    },

    /**
     * Henceforth lies the sacred realm of the Admin.
     * Tread with utmost caution, lest thou face dire consequences.
     */
    {
        path: 'admin',
        loadChildren: adminModule,
        canActivate: [AuthGuard],
        data: {
            roles: [Role.Admin]
        },
    },

    /**
     * Lost art thou? Return thee to thine home.
     */
    { 
        path: '**', 
        redirectTo: '' 
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }