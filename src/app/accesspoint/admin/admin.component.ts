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
  adminname: string = '';
  password: string = '';

  constructor(private http: HttpClient, private router: Router) { }
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.inputType = this.showPassword ? 'text' : 'password';
  }

  signupAdmin() {
    const admin = {
      adminName: this.adminname,
      password: this.password,
    };
    if (this.adminname === '' || this.password === '') {
      alert('Please fill in all fields');
      return;
    } else {
      this.http.post('http://localhost:3000/add-admin', admin).subscribe((response: any) => {
        console.log(response);
        if (response.message === 'Admin already exists') {
          alert(response.message);
          this.adminname = '';
          this.password = '';
        } else if (response.message === 'Server error') {
          alert('An error occurred while registering the admin. Please try again later.');
          this.adminname = '';
          this.password = '';
        }
        else if (response.message === 'Admin registered successfully') {
          alert(response.message);
          this.router.navigate(['dashboard'], { queryParams: { roomname: this.adminname } });
        }
      });
    }
  }

  loginAdmin() {
    // const admin = {
    //   adminName: this.adminname,
    //   password: this.password,
    // };
    // if (this.adminname === '' || this.password === '') {
    //   alert('Please fill in all fields');
    //   return;
    // } else {
    //   this.http.post('http://localhost:3000/login-admin', admin).subscribe((response: any) => {
    //     console.error(response);
    //     if (response.message === 'Invalid adminName or password') {
    //       alert(response.message);
    //       this.adminname = '';
    //       this.password = '';
    //     } else if (response.message === 'Server error') {
    //       alert('An error occurred while logging in. Please try again later.');
    //       this.adminname = '';
    //       this.password = '';
    //     } else if (response.message === 'Login successful') {
    //       alert(response.message);
    //       this.router.navigate(['dashboard'], { queryParams: { roomname: this.adminname } });
    //     }
    //   });
    // }
  }
}