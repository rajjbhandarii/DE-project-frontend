import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

export interface User {
  name: string;
  type: string;
}

@Injectable({
  providedIn: 'root'
})

export class AccesspointService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private router: Router, private http: HttpClient) {
    this.loadUserFromStorage();
  }
  private loadUserFromStorage() {
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  signup(name: string, password: string, type: string) {
    const credentials = type === 'admin' ? { adminName: name, password } : { userName: name, password };
    const endpoint = type === 'admin' ? environment.adminSignup : environment.userSignup;

    this.http.post<any>(endpoint, credentials).subscribe({
      next: (response: any) => {
        console.log(response);

        if (response.token) {
          // Save token and user `
          const user: User = { name, type };
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next(user);

          alert(`${type.charAt(0).toUpperCase() + type.slice(1)} registered & logged in`);

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

  login(name: string, password: string, type: string) {
    const credentials = type === 'admin' ? { adminName: name, password } : { userName: name, password };
    const endpoint = type === 'admin' ? environment.adminLogin : environment.userLogin;

    this.http.post<any>(endpoint, credentials).subscribe({
      next: (response: any) => {
        if (response.token) {
          // Store token and user info
          const user: User = {
            name: name,
            type: type
          };
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next(user);
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
    this.router.navigate(['adminpage']);
  }

}
