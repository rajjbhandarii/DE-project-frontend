import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

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

  constructor(private router: Router, private http: HttpClient) {
    this.loadUserFromStorage();
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
    const credentials = roleType === 'serviceProvider' ? { serviceProviderName: name, email, password } : { userName: name, email, password };
    const endpoint = roleType === 'serviceProvider' ? environment.serviceProviderSignup : environment.userSignup;

    this.http.post<AuthResponse>(endpoint, credentials).subscribe({
      next: (response: AuthResponse) => {

        if (response.token) {
          // Save token and user
          const roleBasedUser: AppUser = { name: name, email: email, type: roleType, visual: 'light' };
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(roleBasedUser));
          this.currentUserSubject.next(roleBasedUser);

          alert(`${roleType.charAt(0).toUpperCase() + roleType.slice(1)} registered & logged in`);

          // Redirect to dashboard with query param
          this.router.navigate(['/dashboard']);

        } else if (response.message) {
          alert(response.message);
        }
      },
      error: (error) => {
        if (error.status === 409 && error.error.message) {
          alert(error.error.message);
        } else if (error.status === 500) {
          alert('An error occurred while registering. Please try again later.');
        } else {
          alert('Something went wrong');
        }
      }
    });
  }

  login(email: string, password: string, roleType: string) {
    const credentials = roleType === 'serviceProvider' ? { email: email, password } : { email: email, password };
    const endpoint = roleType === 'serviceProvider' ? environment.serviceProviderLogin : environment.userLogin;

    this.http.post<AuthResponse>(endpoint, credentials).subscribe({
      next: (response: AuthResponse) => {
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
          this.router.navigate(['/dashboard']);
        } else {
          alert('Login failed: No token received');
        }
      },
      error: (error) => {
        if (error.status === 401 && error.error.message) {
          alert(error.error.message); // e.g. "Invalid credentials"
        } else {
          alert('An error occurred during login. Please try again.');
        }
      }
    });
  }

  logout() {
    localStorage.clear();
    this.currentUserSubject.next(null);
    this.router.navigate(['serviceProviderpage']);
  }

}
