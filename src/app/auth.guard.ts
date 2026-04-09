import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { ThemeServiceService } from './apps-services/theme.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const themeService = inject(ThemeServiceService);

  const token = localStorage.getItem('token');

  if (!token) {
    themeService.displayNotification('Error', "You must be logged in to access this page", 'error');
    return router.parseUrl('/user-login');
  }

  try {
    const decoded: any = jwtDecode(token);
    const now = Date.now().valueOf() / 1000;

    if (decoded.exp < now) {
      localStorage.clear();
      themeService.displayNotification('Error', "Session expired. Please log in again.", 'error');
      return router.parseUrl('/user-login');
    }

    return true; // Valid token
  } catch (err) {
    console.error("Invalid token:", err);
    return router.parseUrl('/user-login');
  }
};
