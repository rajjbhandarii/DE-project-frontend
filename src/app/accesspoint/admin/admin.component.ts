import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccesspointService } from '../accesspoint.service';
import { RouterLink } from '@angular/router';

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
  serviceProviderName: string = '';
  email: string = '';
  password: string = '';

  constructor(private access: AccesspointService) { }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.inputType = this.showPassword ? 'text' : 'password';
  }

  validateserviceProvider() {
    if (this.isLogin) {
      if (this.email === '' || this.password === '') {
        alert('Please fill in all fields');
        return false;
      }
    } else {
      if (this.serviceProviderName === '' || this.email === '' || this.password === '') {
        alert('Please fill in all fields');
        return false;
      }
    }
    return true; // Proceed with login if fields are filled
  }

  signupserviceProvider() {
    if (!this.validateserviceProvider()) {
      return; // Exit if validation fails
    } else {
      this.access.signup(this.serviceProviderName, this.email, this.password, 'serviceProvider');
      this.serviceProviderName = '';
      this.email = '';
      this.password = '';
      this.isLogin = false;
    }
  }


  loginserviceProvider() {
    if (!this.validateserviceProvider()) {
      return; // Exit if validation fails
    } else {
      this.access.login(this.email, this.password, 'serviceProvider');
      this.email = '';
      this.password = '';
      this.isLogin = true;
    }
  }

}