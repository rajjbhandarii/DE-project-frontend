import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserComponent } from './AccessPoint/User/user.component';
import { AuthGuard } from './auth.guard';
import { NavbarComponent } from './Navbar/navbar.component';


export const routes: Routes = [
  { path: 'adminPage', loadComponent: () => import('./AccessPoint/ServiceProvider/ServiceProvider.component').then(m => m.AdminComponent) },
  { path: 'userpage', component: UserComponent },
  { path: '', redirectTo: 'userpage', pathMatch: 'full' },

  // Protected routes within the main app layout
  {
    path: '',
    component: NavbarComponent,
    canActivate: [AuthGuard], // This guard protects all children
    children: [
      //lazy loaded components for better performance
      { path: 'dashboard', loadComponent: () => import('./UserComponents/Dashboard/dashboard.component').then(m => m.DashboardComponent), data: { scrollToSection: 'hero' } },
      { path: 'SPDashboard', loadComponent: () => import('./ServiceProviderComponents/SP-dashboard/SP-dashboard.component').then(m => m.SPDashboardComponent) },
      { path: 'services', loadComponent: () => import('./UserComponents/Services/services.component').then(m => m.ServicesComponent) },
      { path: 'about', loadComponent: () => import('./UserComponents/Dashboard/dashboard.component').then(m => m.DashboardComponent), data: { scrollToSection: 'about' } },
      { path: 'contact', loadComponent: () => import('./UserComponents/Dashboard/dashboard.component').then(m => m.DashboardComponent), data: { scrollToSection: 'contact' } },
      { path: 'serviceManagement', loadComponent: () => import('./ServiceProviderComponents/Service-management/service-management.component').then(m => m.ServiceManagementComponent) }
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
