import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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

  constructor(
    private accesspointService: AccesspointService,
  ) {
    this.currentUser$ = this.accesspointService.currentUser$;
    console.log('Current User:', this.currentUser$);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }



  // Initial data for the dashboard
  liveRequests = [
    { name: 'Priya Sharma', service: 'Flat Tire', location: 'Koramangala, Bangalore' },
    { name: 'Amit Kumar', service: 'Battery Jump', location: 'Andheri, Mumbai' },
    { name: 'Sunita Rao', service: 'Fuel Delivery', location: 'Jubilee Hills, Hyderabad' }
  ];

  activeJobs = [
    { name: 'Rohan Singh', service: 'Towing', location: 'HSR Layout, Bangalore', team: 'Team Alpha' }
  ];

  teams = [
    { name: 'Team Alpha', status: 'On Job' },
    { name: 'Team Bravo', status: 'Available' },
    { name: 'Team Charlie', status: 'Available' },
    { name: 'Team Delta', status: 'Offline' }
  ];

  // Function to dispatch a request
  dispatch(requestIndex: number) {
    // Find an available team
    const availableTeam = this.teams.find(team => team.status === 'Available');
    if (!availableTeam) {
      alert('No teams are currently available.');
      return;
    }

    // Get the request to be dispatched
    const requestToDispatch = this.liveRequests[requestIndex];

    // Add the request to active jobs
    this.activeJobs.unshift({
      ...requestToDispatch,
      team: availableTeam.name
    });

    // Remove the request from the live queue
    this.liveRequests.splice(requestIndex, 1);

    // Update the team's status
    availableTeam.status = 'On Job';
  }
}
