import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent {
  isLogin: boolean = true;
  userName: string = '';
  password: string = '';
  showPassword: boolean = false;
  inputType: string = 'password';

  constructor(private http: HttpClient, private router: Router) { }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.inputType = this.showPassword ? 'text' : 'password';
  }

  signupUser() {
    const User = {
      userName: this.userName,
      password: this.password,
    };
    if (this.userName === '' || this.password === '') {
      alert('Please fill in all fields');
      return;
    } else {
      this.http.post('http://localhost:3000/signup-user', User).subscribe({
        next: (response: any) => {
          console.log(response);
          if (response.message === 'User registered successfully') {
            alert(response.message);
            this.router.navigate(['dashboard'], { queryParams: { roomname: this.userName } });
          }
        },
        error: (error) => {
          if (error.status === 409 && error.error.message) {
            alert(error.error.message);
            this.userName = '';
            this.password = '';
          } else if (error.status === 500) {
            alert('An error occurred while registering the user. Please try again later.');
            this.userName = '';
            this.password = '';
          }
        }
      });
    }
  }

  loginUser() {
    const User = {
      userName: this.userName,
      password: this.password,
    };
    if (this.userName === '' || this.password === '') {
      alert('Please fill in all fields');
      return;
    } else {
      this.http.post('http://localhost:3000/login-user', User).subscribe({
        next: (response: any) => {
          console.log(response);
          if (response.message === 'Login successful') {
            this.router.navigate(['dashboard'], { queryParams: { roomname: this.userName } });
          } else {
            alert(response.message);
          }
        },
        error: (error) => {
          if (error.status === 401 && error.error.message) {
            alert(error.error.message);
            this.userName = '';
            this.password = '';
          } else if (error.status === 500) {
            alert('An error occurred while logging in. Please try again later.');
            this.userName = '';
            this.password = '';
          }
        }
      });
    }
  }

}