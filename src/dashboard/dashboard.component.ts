import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { AccesspointService, AppUser } from '../app/accesspoint/accesspoint.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { ThemeServiceService } from '../app/theme-service.service';
import { io } from "socket.io-client";
import { FormsModule } from '@angular/forms';

interface ActiveRequest {
  requestServiceId: string;
  userName: string;
  userLocation: string;
  category: string;
  createdAt: number;
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
  imports: [CommonModule, FormsModule],
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
  liveRequests: ActiveRequest[] = [];
  private destroy$ = new Subject<void>();
  aboutImage = 'assets/about.png';
  heroImage = 'assets/hero.png';
  socket: any;
  activeJobs: ActiveJob[] = [
    { name: 'Rohan Singh', service: 'Towing', location: 'HSR Layout, Bangalore', team: 'Team Alpha' }
  ];

  formData: any = {
    name: '',
    message: '',
    email: ''
  };

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
    private themeService: ThemeServiceService
  ) {
    this.State$ = this.accesspointService.currentState$;
  }

  ngOnInit(): void {

    this.State$.pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          if (user.type === 'serviceProvider') {
            this.userEmail = user.email;
            this.currentUser = user.type;
            this.currentUserName = user.name;
            this.isDarkMode = user.visual === 'dark' ? true : false;
            // Apply theme immediately
            this.themeService.updateUserThemePreference(user.visual as 'light' | 'dark');
            this.fetchServiceRequest();
            this.changeImage();
          } else {
            this.userEmail = user.email;
            this.currentUser = user.type;
            this.currentUserName = user.name;
            this.isDarkMode = user.visual === 'dark' ? true : false;
            // Apply theme immediately
            this.themeService.updateUserThemePreference(user.visual as 'light' | 'dark');
            this.changeImage();
          }
        } else {
          this.themeService.displayNotification('Error', 'User not found', 'error');
          this.router.navigate(['/userpage']);
        }
      });

    // Subscribe to theme service changes
    this.themeService.isDarkMode$.pipe(takeUntil(this.destroy$))
      .subscribe((isDark: boolean) => {
        this.isDarkMode = isDark;
      });

    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (data['scrollToSection']) {
        setTimeout(() => this.scrollToSection(data['scrollToSection']), 100);
      } else if (data['scrollToSection'] === undefined) {
        this.scrollToSection('hero');
      }
    });
    this.socket = io(environment.baseUrl);

    // Register provider
    this.socket.emit("registerProvider", this.userEmail);

    // Receive real-time updates
    this.socket.on("serviceRequestUpdated/provider-dashboard", (data: ActiveRequest[]) => {
      this.liveRequests = data as ActiveRequest[];
    });
  }

  changeImage() {
    if (this.isDarkMode) {
      this.aboutImage = 'assets/about.png';
      this.heroImage = 'assets/hero.png';
    } else {
      this.aboutImage = 'assets/about-white.png';
      this.heroImage = 'assets/hero-white.png';
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  fetchServiceRequest(): void {
    if (this.currentUser === 'serviceProvider' && this.userEmail) {
      this.http.post<ActiveRequest[]>(environment.fetchServicesRequests, { serviceProviderEmail: this.userEmail }).subscribe({
        next: (data) => this.liveRequests = data || [],
        error: (error) => console.error('Failed to fetch services:', error)
      });

    }
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  dispatch(requestIndex: number): void {
    // const availableTeam = this.teams.find(team => team.status === 'Available');
    // if (!availableTeam) {
    //   this.themeService.displayNotification('Error', 'No teams are currently available.', 'error');
    //   return;
    // }
    // const requestToDispatch = this.liveRequests[requestIndex];
    // this.activeJobs.unshift({
    //   name: requestToDispatch?.userName || '',
    //   service: requestToDispatch?.category || '',
    //   location: requestToDispatch?.userLocation || '',
    //   team: availableTeam.name
    // });
    // this.liveRequests.splice(requestIndex, 1);
    // availableTeam.status = 'On Job';
  }

  async sendEmail(): Promise<void> {
    if (!this.formData.email || !this.formData.message || !this.formData.name) {
      this.themeService.displayNotification('Error', 'Please fill in all fields before submitting the form.', 'error');
      return;
    }

    const emailjs = (await import('emailjs-com')).default ?? await import('emailjs-com');
    try {
      await emailjs.send(environment.serviceID, environment.templateID, this.formData, environment.publicKey);
      this.themeService.displayNotification('Success', 'Your message has been sent successfully!', 'success');
    } catch (error) {
      this.themeService.displayNotification('Error', 'Failed to send email. Please try again later.', 'error');
    }
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}