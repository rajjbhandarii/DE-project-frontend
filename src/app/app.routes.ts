import { Routes } from '@angular/router';
import { AdminComponent } from './accesspoint/admin/admin.component';
import { UserComponent } from './accesspoint/user/user.component';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { AppComponent } from './app.component';


export const routes: Routes = [
  { path: '', redirectTo: 'adminpage', pathMatch: 'full' }, // Default route
  { path: 'adminpage', component: AdminComponent },
  { path: 'app', component: AppComponent },
  { path: 'userpage', component: UserComponent },
  { path: 'dashboard', component: DashboardComponent },

];
