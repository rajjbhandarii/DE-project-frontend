import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css',]
})
export class AdminComponent {
  isLogin: boolean = false;
  showPassword: boolean = false;
  inputType: string = 'password';
  adminName: string = '';
  password: string = '';

  constructor(private http: HttpClient, private router: Router) { }
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.inputType = this.showPassword ? 'text' : 'password';
  }

  vilidateAdmin() {
    if (this.adminName === '' || this.password === '') {
      alert('Please fill in all fields');
      return;
    } else {
      return true; // Proceed with login if fields are filled
    }
  }

  signupAdmin() {
    if (!this.vilidateAdmin()) {
      return; // Exit if validation fails
    } else {
      const admin = {
        adminName: this.adminName,
        password: this.password,
      };
      this.http.post('http://localhost:3000/signup-admin', admin).subscribe({
        next: (response: any) => {
          console.log(response);
          if (response.message === 'Admin registered successfully') {
            alert(response.message);
            this.router.navigate(['dashboard'], { queryParams: { roomname: this.adminName } });
          }
        },
        error: (error) => {
          if (error.status === 409 && error.error.message) {
            alert(error.error.message);
            this.adminName = '';
            this.password = '';
          } else if (error.status === 500) {
            alert('An error occurred while registering the admin. Please try again later.');
            this.adminName = '';
            this.password = '';
          }
        }
      });
    }
  }


  loginAdmin() {
    if (!this.vilidateAdmin()) {
      return; // Exit if validation fails
    } else {
      const admin = {
        adminName: this.adminName,
        password: this.password,
      };
      this.http.post('http://localhost:3000/login-admin', admin).subscribe({
        next: (response: any) => {
          console.log(response);
          if (response.message === 'Login successful') {
            this.router.navigate(['dashboard'], { queryParams: { roomname: this.adminName } });
          }
        },
        error: (error) => {
          if (error.status === 401 && error.error.message) {
            alert(error.error.message);
            this.adminName = '';
            this.password = '';
          } else if (error.status === 500) {
            alert('An error occurred while logging in. Please try again later.');
            this.adminName = '';
            this.password = '';
          }
        }
      });
    }
  }
}