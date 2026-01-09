import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccesspointService } from '../../AppServices/AccessPoint.service';
import { RouterLink } from '@angular/router';
import { ThemeServiceService } from '../../AppServices/ThemeService.service';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ServiceProvider.component.html',
  styleUrls: ['./ServiceProvider.component.css',]
})
export class AdminComponent {
  isLogin: boolean = false;
  showPassword: boolean = false;
  inputType: string = 'password';
  serviceProviderName: string = '';
  email: string = 'raj@gmail.com';
  password: string = 'r';

  constructor(private access: AccesspointService, private themeService: ThemeServiceService) { }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.inputType = this.showPassword ? 'text' : 'password';
  }

  verifyUserInput() {
    if (this.isLogin) {
      if (this.email === '' || this.password === '') {
        this.themeService.displayNotification('Error', 'Please fill in all fields', 'error');
        return false;
      }
    } else {
      if (this.serviceProviderName === '' || this.email === '' || this.password === '') {
        this.themeService.displayNotification('Error', 'Please fill in all fields', 'error');
        return false;
      }
    }
    return true; // Proceed with login if fields are filled
  }

  signupServiceProvider() {
    if (!this.verifyUserInput()) {
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
    if (!this.verifyUserInput()) {
      return; // Exit if validation fails
    } else {
      this.access.login(this.email, this.password, 'serviceProvider');
      this.email = '';
      this.password = '';
      this.isLogin = true;
    }
  }

}