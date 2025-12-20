import { Injectable } from '@angular/core';
import {
  CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router
} from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { TheamServiceService } from './theam-service.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private themeService: TheamServiceService) { }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const token = localStorage.getItem('token');

    if (!token) {
      this.themeService.displayNotification('Error', "You must be logged in to access this page", 'error');
      return this.router.parseUrl('/userpage');
    }

    try {
      const decoded: any = jwtDecode(token);
      const now = Date.now().valueOf() / 1000;

      if (decoded.exp < now) {
        localStorage.clear();
        this.themeService.displayNotification('Error', "Session expired. Please log in again.", 'error');
        return this.router.parseUrl('/userpage');
      }

      return true; // Valid token
    } catch (err) {
      console.error("Invalid token:", err);
      return this.router.parseUrl('/userpage');
    }
  }
}
