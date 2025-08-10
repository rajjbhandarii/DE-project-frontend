import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

export interface User {
  name: string;
  type: string;
}

export interface AuthResponse {
  token?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})

export class AccesspointService {
  dummyCredentials = {
    userName: 'r',
    password: 'r',
    type: 'user'
  };
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

  // public get currentUserValue(): User | null {
  //   return this.currentUserSubject.value;
  // }

  signup(name: string, password: string, roleType: string) {
    // const credentials = type === 'admin' ? { adminName: name, password } : { userName: name, password };
    // const endpoint = type === 'admin' ? environment.adminSignup : environment.userSignup;

    if (name === this.dummyCredentials.userName && password === this.dummyCredentials.password) {
      const roleBasedUser: User = { name, type: roleType };
      localStorage.setItem('user', JSON.stringify(roleBasedUser));
      localStorage.setItem('token', 'dummy-token');

      this.currentUserSubject.next(roleBasedUser);
      this.router.navigate(['/dashboard']);
    } else {
      alert('Enter "username-r" and "password-r"');
    }


    // this.http.post<AuthResponse>(endpoint, credentials).subscribe({
    //   next: (response: AuthResponse) => {
    //     console.log(response);

    //     if (response.token) {
    //       // Save token and user `
    //       const roleBasedUser: User = { name, type: roleType };
    //       localStorage.setItem('token', response.token);
    //       localStorage.setItem('user', JSON.stringify(roleBasedUser));
    //       this.currentUserSubject.next(roleBasedUser);

    //       alert(`${type.charAt(0).toUpperCase() + type.slice(1)} registered & logged in`);

    //       // Redirect to dashboard with query param
    //       this.router.navigate(['/dashboard']);

    //     } else if (response.message) {
    //       alert(response.message);
    //     }
    //   },
    //   error: (error) => {
    //     if (error.status === 409 && error.error.message) {
    //       alert(error.error.message);
    //     } else if (error.status === 500) {
    //       alert('An error occurred while registering. Please try again later.');
    //     } else {
    //       alert('Something went wrong');
    //     }
    //   }
    // });
  }

  login(name: string, password: string, roleType: string) {
    // const credentials = type === 'admin' ? { adminName: name, password } : { userName: name, password };
    // const endpoint = type === 'admin' ? environment.adminLogin : environment.userLogin;

    if (name === this.dummyCredentials.userName && password === this.dummyCredentials.password) {
      const roleBasedUser: User = { name, type: roleType };
      localStorage.setItem('user', JSON.stringify(roleBasedUser));
      localStorage.setItem('token', 'dummy-token');

      this.currentUserSubject.next(roleBasedUser);
      this.router.navigate(['/dashboard']);
    } else {
      alert('Enter "username-r" and "password-r"');
    }

    // this.http.post<AuthResponse>(endpoint, credentials).subscribe({
    //   next: (response: AuthResponse) => {
    //     if (response.token) {
    //       // Store token and user info
    //       const roleBasedUser: User = {
    //         name: name,
    //         type: roleType
    //       };
    //       localStorage.setItem('token', response.token);
    //       localStorage.setItem('user', JSON.stringify(roleBasedUser));
    //       this.currentUserSubject.next(roleBasedUser);
    //       // Redirect after login
    //       this.router.navigate(['/dashboard']);
    //     } else {
    //       alert('Login failed: No token received');
    //     }
    //   },
    //   error: (error) => {
    //     if (error.status === 401 && error.error.message) {
    //       alert(error.error.message); // e.g. "Invalid credentials"
    //     } else {
    //       alert('An error occurred during login. Please try again.');
    //     }
    //   }
    // });
  }

  logout() {
    localStorage.clear();
    this.currentUserSubject.next(null);
    this.router.navigate(['adminpage']);
  }

}
