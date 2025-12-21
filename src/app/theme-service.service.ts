import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeServiceService {
  //This is the reactive programming pattern - 
  // instead of components checking the theme manually, 
  // they automatically receive updates whenever it changes.
  // RxJS observable that:
  // 1) Stores the current value
  // 2) Immediately emits the current value to new subscribers
  // 3) Can push new values to all active subscribers
  private isDarkModeSubject = new BehaviorSubject<boolean>(false);
  public isDarkMode$ = this.isDarkModeSubject.asObservable();

  public get isDarkMode(): boolean {
    return this.isDarkModeSubject.value;
  }

  constructor() {
    // Initialize theme from localStorage or default to false
    const savedTheme: string | null = localStorage.getItem('isDarkMode');
    const initialDarkMode: boolean = savedTheme === 'true';
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
    try {
      localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
    } catch (error) {
      console.error('Failed to save isDarkMode to localStorage:', error);
    }
  }

  // Method to update user's visual preference in localStorage
  // Update the state in AccesspointService as well
  updateUserThemePreference(theme: 'light' | 'dark') {

    const isDark = theme === 'dark';
    this.setTheme(isDark);

    // Update user object in localStorage
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userObj = JSON.parse(user);
        userObj.visual = theme;
        localStorage.setItem('user', JSON.stringify(userObj));
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
      }
    }
  }

  // Method to display a popup notification
  displayNotification(title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info'): Promise<boolean> {
    return new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'popup-backdrop';
      backdrop.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999';

      const popup = document.createElement('div');
      popup.className = `popup-box popup-${type}`;
      popup.style.cssText = `background:${type === 'error' || type === 'warning' ? '#f35c5c' : 'white'};padding:20px;border-radius:8px;min-width:300px;box-shadow:0 2px 10px rgba(0,0,0,0.2)`;

      popup.innerHTML = `
        <h2 style="margin-top:0;color:#333">${title}</h2>
        <p style="color:${type === 'error' || type === 'warning' ? 'white' : '#666'};margin:15px 0">${message}</p>
        <div style="text-align:right;gap:10px;display:flex;justify-content:flex-end">
          <button class="popup-btn-close" style="padding:8px 16px;border:none;border-radius:4px;cursor:pointer;background:#ddd">Close</button>
        </div>
      `;

      backdrop.appendChild(popup);
      document.body.appendChild(backdrop);

      const closeBtn = popup.querySelector('.popup-btn-close') as HTMLButtonElement;
      closeBtn.addEventListener('click', () => {
        backdrop.remove();
        resolve(true);
      }, { once: true });

      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.remove();
          resolve(false);
        }
      }, { once: true });
    });
  }
}
