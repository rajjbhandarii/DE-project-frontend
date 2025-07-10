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
  isLogin: boolean = true;
  showPassword: boolean = false;
  inputType: string = 'password';
  username: string = '';
  password: string = '';

  constructor(private http: HttpClient, private router: Router) { }



  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.inputType = this.showPassword ? 'text' : 'password';
  }
  saveuser() {

    const user = {
      username: this.username,
      password: this.password
    };

    this.http.post('http://localhost:3000/add-user', user).subscribe((response: any) => {
      if (response.status === 'success') {
        alert('User created successfully');
        this.router.navigate(['dashboard'], { queryParams: { roomname: this.username } });
        this.isLogin = true;
      } else {
        alert('User already exists');
      }
    }

    )
  }

}
