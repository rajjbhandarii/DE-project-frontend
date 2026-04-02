import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserComponent } from './accesspoint/user/user.component';
import { AuthGuard } from './auth.guard';
import { NavbarComponent } from './navbar/navbar.component';


export const routes: Routes = [
  { path: 'adminPage', loadComponent: () => import('./accesspoint/service-provider/service-provider.component').then(m => m.AdminComponent) },
  { path: 'userpage', component: UserComponent },
  { path: '', redirectTo: 'userpage', pathMatch: 'full' },

  // Protected routes within the main app layout
  {
    path: '',
    component: NavbarComponent,
    canActivate: [AuthGuard], // This guard protects all children
    children: [
      //lazy loaded components for better performance
      { path: 'dashboard', loadComponent: () => import('./user-components/dashboard/dashboard.component').then(m => m.DashboardComponent), data: { scrollToSection: 'hero' } },
      { path: 'SPDashboard', loadComponent: () => import('./service-provider-components/sp-dashboard/SP-dashboard.component').then(m => m.SPDashboardComponent) },
      { path: 'services', loadComponent: () => import('./user-components/services/services.component').then(m => m.ServicesComponent) },
      { path: 'about', loadComponent: () => import('./user-components/dashboard/dashboard.component').then(m => m.DashboardComponent), data: { scrollToSection: 'about' } },
      { path: 'contact', loadComponent: () => import('./user-components/dashboard/dashboard.component').then(m => m.DashboardComponent), data: { scrollToSection: 'contact' } },
      { path: 'serviceManagement', loadComponent: () => import('./service-provider-components/service-management/service-management.component').then(m => m.ServiceManagementComponent) }
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
