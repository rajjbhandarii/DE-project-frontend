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
  username: string = '';
  password: string = '';
  showPassword: boolean = false;
  inputType: string = 'password';

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
    if (this.username === '' || this.password === '') {
      alert('Please fill in all fields');
      return;
    } else {
      this.http.post('http://localhost:3000/add-user', user).subscribe((response: any) => {
        console.log(response);

        alert(response.message);
        this.router.navigate(['dashboard'], { queryParams: { roomname: this.username } });
        this.isLogin = true;
        this.username = '';
        this.password = '';

      });
    }
  }
}