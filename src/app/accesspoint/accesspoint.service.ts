import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';
import { ThemeServiceService } from '../theme-service.service';

export interface AppUser {
  name: string;
  email: string;
  type: string;
  visual: string;
}

export interface AuthResponse {
  token?: string;
  message?: string;
  name?: string;
}

@Injectable({
  providedIn: 'root'
})

export class AccesspointService {

  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  public currentState$ = this.currentUserSubject.asObservable();

  public get getCurrentState(): AppUser | null {
    return this.currentUserSubject.value;
  }

  public set updateCurrentState(value: AppUser | null) {
    this.currentUserSubject.next(value);
    if (value) {
      localStorage.setItem('user', JSON.stringify(value));
    } else {
      localStorage.removeItem('user');
    }
  }

  constructor(private router: Router, private http: HttpClient, private themeService: ThemeServiceService) {
    this.loadUserFromStorage();
  }

  emailValidaetor(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private loadUserFromStorage() {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      // Ensure visual property exists, default to 'light' if missing
      if (!parsedUser.visual) {
        parsedUser.visual = 'light';
      }
      this.currentUserSubject.next(parsedUser);
    }
  }

  signup(name: string, email: string, password: string, roleType: string) {
    if (this.emailValidaetor(email)) {
      const credentials = roleType === 'serviceProvider' ? { serviceProviderName: name, email, password } : { userName: name, email, password };
      const endpoint = roleType === 'serviceProvider' ? environment.serviceProviderSignup : environment.userSignup;

      this.http.post<AuthResponse>(endpoint, credentials).subscribe({
        next: async (response: AuthResponse) => {

          if (response.token) {
            // Save token and user
            const roleBasedUser: AppUser = { name: name, email: email, type: roleType, visual: 'light' };
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(roleBasedUser));
            this.currentUserSubject.next(roleBasedUser);

            if (roleType === 'serviceProvider') {
              await this.themeService.displayNotification('Success', `${roleType.charAt(0).toUpperCase() + roleType.slice(1)} registered & logged in`, 'success');
              await this.router.navigate(['/SPDashboard']);
            } else {
              await this.themeService.displayNotification('Success', `${roleType.charAt(0).toUpperCase() + roleType.slice(1)} registered & logged in`, 'success');
              await this.router.navigate(['/dashboard']);
            }
          } else if (response.message) {
            this.themeService.displayNotification('Error', response.message, 'error');
          }
        },
        error: (error) => {
          if (error.status === 409 && error.error.message) {
            this.themeService.displayNotification('Error', error.error.message, 'error');
          } else if (error.status === 500) {
            this.themeService.displayNotification('Error', 'An error occurred while registering. Please try again later.', 'error');
          } else {
            this.themeService.displayNotification('Error', 'Something went wrong', 'error');
          }
        }
      });
    } else {
      this.themeService.displayNotification('Error', 'Please enter a valid email address.', 'error');
    }
  }

  async login(email: string, password: string, roleType: string) {
    if (this.emailValidaetor(email)) {
      const credentials = roleType === 'serviceProvider' ? { email: email, password } : { email: email, password };
      const endpoint = roleType === 'serviceProvider' ? environment.serviceProviderLogin : environment.userLogin;

      this.http.post<AuthResponse>(endpoint, credentials).subscribe({
        next: async (response: AuthResponse) => {
          if (response.token) {
            // Check if user has existing preferences in localStorage
            const existingUser = localStorage.getItem('user');
            let savedVisualTheme = 'light'; // default to light

            if (existingUser) {
              const parsed = JSON.parse(existingUser);
              savedVisualTheme = parsed.visual || 'light';
            }

            // Store token and user info, preserving theme preference
            const roleBasedUser: AppUser = {
              name: response.name || '',
              email: email,
              type: roleType,
              visual: savedVisualTheme
            };
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(roleBasedUser));
            this.currentUserSubject.next(roleBasedUser);
            // Redirect after login
            if (roleType === 'serviceProvider') {
              await this.themeService.displayNotification('Success', `${roleType.charAt(0).toUpperCase() + roleType.slice(1)} logged in`, 'success');
              await this.router.navigate(['/SPDashboard']);
            } else {
              await this.themeService.displayNotification('Success', `${roleType.charAt(0).toUpperCase() + roleType.slice(1)} logged in`, 'success');
              await this.router.navigate(['/dashboard']);
            }
          } else {
            this.themeService.displayNotification('Error', 'Login failed. Please try again.', 'error');
          }
        },
        error: (error) => {
          if (error.status === 401 && error.error.message) {
            this.themeService.displayNotification('Error', error.error.message, 'error');
          } else {
            this.themeService.displayNotification('Error', 'An error occurred during login. Please try again.', 'error');
          }
        }
      });
    } else {
      this.themeService.displayNotification('Error', 'Please enter a valid email address.', 'error');
    }
  }

  logout() {
    localStorage.clear();
    this.currentUserSubject.next(null);
    this.router.navigate(['serviceProviderpage']);
  }

}
