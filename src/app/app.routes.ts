import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard'; // 👈 Import guard
import { AdminComponent } from './accesspoint/admin/admin.component';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { UserComponent } from './accesspoint/user/user.component';
import { ServicesComponent } from '../services/services.component';
import { ServiceManagementComponent } from '../service-management/service-management.component';

export const routes: Routes = [
  { path: 'adminpage', component: AdminComponent },
  { path: 'userpage', component: UserComponent },
  { path: '', redirectTo: 'userpage', pathMatch: 'full' },

  // Protected routes within the main app layout
  {
    path: '',
    component: NavbarComponent,
    canActivate: [AuthGuard], // This guard protects all children
    children: [
      { path: 'dashboard', component: DashboardComponent, data: { scrollToSection: 'hero' } },
      { path: 'services', component: ServicesComponent },
      { path: 'about', component: DashboardComponent, data: { scrollToSection: 'about' } },
      { path: 'contact', component: DashboardComponent, data: { scrollToSection: 'contact' } },
      { path: 'serviceManagement', component: ServiceManagementComponent }
    ]
  },

  // Fallback for any other route
  { path: '**', redirectTo: 'userpage' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
