import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { NavbarComponent } from './navbar/navbar.component';


export const routes: Routes = [
  { path: 'service-provider-login', loadComponent: () => import('./accesspoint/service-provider/service-provider.component').then(m => m.AdminComponent) },
  { path: 'user-login', loadComponent: () => import('./accesspoint/user/user.component').then(m => m.UserComponent) },
  { path: '', redirectTo: 'user-login', pathMatch: 'full' },

  // Protected routes within the main app layout
  {
    path: '',
    component: NavbarComponent,
    canActivate: [authGuard], // This guard protects all children
    children: [
      //lazy loaded components for better performance
      { path: 'dashboard', loadComponent: () => import('./user-components/dashboard/dashboard.component').then(m => m.DashboardComponent), data: { scrollToSection: 'hero' } },
      { path: 'sp-dashboard', loadComponent: () => import('./service-provider-components/sp-dashboard/sp-dashboard.component').then(m => m.SpDashboardComponent) },
      { path: 'services', loadComponent: () => import('./user-components/services/services.component').then(m => m.ServicesComponent) },
      { path: 'about', loadComponent: () => import('./user-components/dashboard/dashboard.component').then(m => m.DashboardComponent), data: { scrollToSection: 'about' } },
      { path: 'contact', loadComponent: () => import('./user-components/dashboard/dashboard.component').then(m => m.DashboardComponent), data: { scrollToSection: 'contact' } },
      { path: 'service-management', loadComponent: () => import('./service-provider-components/service-management/service-management.component').then(m => m.ServiceManagementComponent) }
    ]
  },

  // Fallback for any other route
  { path: '**', redirectTo: 'user-login' }
];
