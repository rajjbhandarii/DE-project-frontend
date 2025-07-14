import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccesspointService {

  constructor(private router: Router, private http: HttpClient) { }

  signup(name: string, password: string, type: string) {
    const credentials = type === 'admin' ? { adminName: name, password } : { userName: name, password };
    const endpoint = type === 'admin' ? environment.adminSignup : environment.userSignup;

    this.http.post<any>(endpoint, credentials).subscribe({
      next: (response: any) => {
        console.log(response);

        if (response.token) {
          // Save token and user
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify({
            name: name,
            type: type
          }));

          alert(`${type.charAt(0).toUpperCase() + type.slice(1)} registered & logged in`);

          // Redirect to dashboard with query param
          this.router.navigate(['dashboard'], {
            queryParams: {
              roomname: name
            }
          });
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
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify({
            name: name,
            type: type
          }));

          // Redirect after login
          this.router.navigate(['dashboard'], {
            queryParams: {
              roomname: name
            }
          });
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['adminpage']);
  }

}
