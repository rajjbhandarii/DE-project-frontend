import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { from, Observable, Subject, takeUntil } from 'rxjs';
import { AccesspointService, AppUser } from '../../AppServices/AccessPoint.service';
import { environment } from '../../Environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { ThemeServiceService } from '../../AppServices/ThemeService.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  title = 'Road Rescue';
  contactNumber: number = 917567853633;
  isDarkMode: boolean = false; // Default to light mode
  State$: Observable<AppUser | null>;
  userEmail = '';
  currentUser = '';
  currentUserName = '';
  private destroy$ = new Subject<void>();
  heroImage = '/images/hero-white.png';
  aboutImage = '/images/about-white.png';

  formData: any = {
    name: '',
    message: '',
    email: ''
  };

  constructor(
    private accesspointService: AccesspointService,
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
          this.userEmail = user.email;
          this.currentUser = user.type;
          this.currentUserName = user.name;
          this.isDarkMode = user.visual === 'dark' ? true : false;
          // Apply theme immediately
          this.themeService.updateUserThemePreference(user.visual as 'light' | 'dark');
          this.changeImage();
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
  }

  changeImage(): void {
    if (this.isDarkMode) {
      this.heroImage = '/images/hero.png';
      this.aboutImage = '/images/about.png';
    } else {
      this.heroImage = '/images/hero-white.png';
      this.aboutImage = '/images/about-white.png';
    }
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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