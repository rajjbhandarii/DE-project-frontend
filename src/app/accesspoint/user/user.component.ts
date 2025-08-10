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
  password: string = '';
  showPassword: boolean = false;
  inputType: string = 'password';

  constructor(private access: AccesspointService) { }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.inputType = this.showPassword ? 'text' : 'password';
  }
  vilidateAdmin() {
    if (this.userName === '' || this.password === '') {
      alert('Please fill in all fields');
      return;
    } else {
      return true; // Proceed with login if fields are filled
    }
  }

  signupUser() {
    if (!this.vilidateAdmin()) {
      return; // Exit if validation fails
    } else {
      this.access.signup(this.userName, this.password, 'user');
      this.userName = '';
      this.password = '';
      this.isLogin = false;
    }
  }

  loginUser() {
    if (!this.vilidateAdmin()) {
      return; // Exit if validation fails
    }
    else {
      this.access.login(this.userName, this.password, 'user');
      this.userName = '';
      this.password = '';
      this.isLogin = true;
    }
  }

}