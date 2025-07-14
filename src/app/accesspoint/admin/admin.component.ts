import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AccesspointService } from '../accesspoint.service';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, FormsModule, RouterLink,],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css',]
})
export class AdminComponent {
  isLogin: boolean = false;
  showPassword: boolean = false;
  inputType: string = 'password';
  adminName: string = '';
  password: string = '';

  constructor(private http: HttpClient, private router: Router, private access: AccesspointService) { }
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
      this.access.signup(this.adminName, this.password, 'admin');
      this.adminName = '';
      this.password = '';
      this.isLogin = false;
    }
  }


  loginAdmin() {
    if (!this.vilidateAdmin()) {
      return; // Exit if validation fails
    } else {
      this.access.login(this.adminName, this.password, 'admin');
      this.adminName = '';
      this.password = '';
      this.isLogin = true;
    }
  }

}