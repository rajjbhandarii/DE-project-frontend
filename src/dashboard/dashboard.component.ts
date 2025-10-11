import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { AccesspointService, AppUser } from '../app/accesspoint/accesspoint.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { TheamServiceService } from '../app/theam-service.service';

interface LiveRequest {
  userName: string;
  location: string;
  category: string;
}

interface TeamMember {
  name: string;
  status: string;
}

interface ActiveJob {
  name: string;
  service: string;
  location: string;
  team: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  title = 'Road Rescue';
  isMobileMenuOpen = false;
  isDarkMode: boolean = false; // Default to light mode
  State$: Observable<AppUser | null>;
  userEmail = '';
  currentUser = '';
  currentUserName = '';
  liveRequests: LiveRequest[] = [];
  private destroy$ = new Subject<void>();
  aboutImage = 'assets/about.png';
  heroImage = 'assets/hero.png';

  activeJobs: ActiveJob[] = [
    { name: 'Rohan Singh', service: 'Towing', location: 'HSR Layout, Bangalore', team: 'Team Alpha' }
  ];

  teams: TeamMember[] = [
    { name: 'Team Alpha', status: 'On Job' },
    { name: 'Team Bravo', status: 'Available' },
    { name: 'Team Charlie', status: 'Available' },
    { name: 'Team Delta', status: 'Offline' }
  ];

  constructor(
    private accesspointService: AccesspointService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private themeService: TheamServiceService // Inject the theme service
  ) {
    this.State$ = this.accesspointService.currentState$;
  }

  ngOnInit(): void {

    console.log(this.State$);
    this.State$.pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        // user?.visual === 'dark' ? this.isDarkMode = true : this.isDarkMode = false;
        if (user) {
          if (user.type === 'serviceProvider') {
            this.userEmail = user.email;
            this.currentUser = user.type;
            this.currentUserName = user.name;
            this.isDarkMode = user.visual === 'dark' ? true : false;
            // Apply theme immediately
            this.themeService.updateUserThemePreference(user.visual as 'light' | 'dark');
            this.setupServiceProviderInterval();
          } else {
            this.userEmail = user.email;
            this.currentUser = user.type;
            this.currentUserName = user.name;
            this.isDarkMode = user.visual === 'dark' ? true : false;
            // Apply theme immediately
            this.themeService.updateUserThemePreference(user.visual as 'light' | 'dark');
          }
        } else {
          alert('User not found');
          this.router.navigate(['/userpage']);
        }
      });

    // Subscribe to theme service changes
    this.themeService.isDarkMode$.pipe(takeUntil(this.destroy$))
      .subscribe(isDark => {
        this.isDarkMode = isDark;
      });

    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (data['scrollToSection']) {
        setTimeout(() => this.scrollToSection(data['scrollToSection']), 100);
      } else if (data['scrollToSection'] === undefined) {
        this.scrollToSection('hero');
      }
    });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  setupServiceProviderInterval(): void {
    if (this.currentUser === 'serviceProvider' && this.userEmail) {
      setInterval(() => {
        this.http.post<LiveRequest[]>(
          environment.fetchServicesRequests,
          { serviceProviderEmail: this.userEmail }
        ).subscribe({
          next: (data) => this.liveRequests = data || [],
          error: (error) => console.error('Failed to fetch services:', error)
        });
      }, 3000);
    }
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  dispatch(requestIndex: number): void {
    const availableTeam = this.teams.find(team => team.status === 'Available');
    if (!availableTeam) {
      alert('No teams are currently available.');
      return;
    }
    const requestToDispatch = this.liveRequests[requestIndex];
    this.activeJobs.unshift({
      name: requestToDispatch?.userName || '',
      service: requestToDispatch?.category || '',
      location: requestToDispatch?.location || '',
      team: availableTeam.name
    });
    this.liveRequests.splice(requestIndex, 1);
    availableTeam.status = 'On Job';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}