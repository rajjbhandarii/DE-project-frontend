import { Routes } from '@angular/router';
import { AdminComponent } from './accesspoint/admin/admin.component';
import { UserComponent } from './accesspoint/user/user.component';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { AppComponent } from './app.component';
import { NavbarComponent } from '../navbar/navbar.component';


export const routes: Routes = [
  { path: '', redirectTo: 'adminpage', pathMatch: 'full' },
  { path: 'adminpage', component: AdminComponent }, // Admin page route
  { path: 'app', component: AppComponent }, // Main app route
  { path: 'userpage', component: UserComponent }, // User page route
  { path: 'dashboard', component: DashboardComponent }, // Dashboard route
  { path: 'navbar', component: NavbarComponent }, // Navbar route
];
