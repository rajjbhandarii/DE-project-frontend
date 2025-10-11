import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TheamServiceService {
  private isDarkModeSubject = new BehaviorSubject<boolean>(false);
  public isDarkMode$ = this.isDarkModeSubject.asObservable();

  public get isDarkMode(): boolean {
    return this.isDarkModeSubject.value;
  }

  constructor() {
    // Initialize theme from localStorage or default to false
    const savedTheme: string | null = localStorage.getItem('isDarkMode');
    const initialDarkMode: boolean = savedTheme ? JSON.parse(savedTheme) : false;
    this.setTheme(initialDarkMode);
  }

  // Internal method to apply theme changes
  private setTheme(isDarkMode: boolean) {

    const bodyClass = 'dark-mode';
    if (isDarkMode) {
      document.body.classList.add(bodyClass);
    } else {
      document.body.classList.remove(bodyClass);
    }

    this.isDarkModeSubject.next(isDarkMode);
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  }

  // Method to update user's visual preference in localStorage
  // Update the state in AccesspointService as well
  updateUserThemePreference(theme: 'light' | 'dark') {

    const isDark = theme === 'dark';
    this.setTheme(isDark);

    // Update user object in localStorage
    const user = localStorage.getItem('user');
    if (user) {
      const userObj = JSON.parse(user);
      userObj.visual = theme;
      localStorage.setItem('user', JSON.stringify(userObj));
    }
  }
}
