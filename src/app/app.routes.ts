import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { AuthGuard } from './auth.guard'; // 👈 Import guard
import { AdminComponent } from './accesspoint/admin/admin.component';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { UserComponent } from './accesspoint/user/user.component';

export const routes: Routes = [
  { path: '', redirectTo: 'adminpage', pathMatch: 'full' },
  { path: 'adminpage', component: AdminComponent },
  { path: 'userpage', component: UserComponent },
  { path: 'app', component: AppComponent, canActivate: [AuthGuard] },
  { path: 'navbar', component: NavbarComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
