import { CommonModule } from '@angular/common';
import { Component, } from '@angular/core';
import { Observable } from 'rxjs';
import { AccesspointService, User } from '../app/accesspoint/accesspoint.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})

export class DashboardComponent {
  title = 'Road Rescue';
  isMobileMenuOpen = false;
  isDarkMode = true;
  currentUser$: Observable<User | null>;

  constructor(private accesspointService: AccesspointService) {
    this.currentUser$ = this.accesspointService.currentUser$;
    console.log('Current User:', this.currentUser$);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

}
