import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccesspointService } from '../accesspoint.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent {
  isLogin: boolean = true;
  userName: string = '';
  email: string = 'raj@gmail.com';
  password: string = 'raj';
  showPassword: boolean = false;
  inputType: string = 'password';

  constructor(private access: AccesspointService) { }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.inputType = this.showPassword ? 'text' : 'password';
  }

  validateUser() {
    if (this.isLogin) {
      if (this.email === '' || this.password === '') {
        alert('Please fill in all fields');
        return false;
      }
    } else {
      if (this.userName === '' || this.email === '' || this.password === '') {
        alert('Please fill in all fields');
        return false;
      }
    }
    return true; // Proceed with login or signup if fields are filled
  }

  signupUser() {
    if (!this.validateUser()) {
      return; // Exit if validation fails
    } else {
      this.access.signup(this.userName, this.email, this.password, 'user');
      this.email = '';
      this.userName = '';
      this.password = '';
      this.isLogin = false;
    }
  }

  loginUser() {
    if (!this.validateUser()) {
      return; // Exit if validation fails
    }
    else {
      this.access.login(this.email, this.password, 'user');
      this.email = '';
      this.password = '';
      this.isLogin = true;
    }
  }

}