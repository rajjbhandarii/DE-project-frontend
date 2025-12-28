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
  // displayNotification(title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info'): Promise<boolean> {
  //   return new Promise((resolve) => {
  //     const backdrop = document.createElement('div');
  //     backdrop.className = 'popup-backdrop';
  //     backdrop.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999';

  //     const popup = document.createElement('div');
  //     popup.className = `popup-box popup-${type}`;
  //     popup.style.cssText = `background:${type === 'error' || type === 'warning' ? '#f35c5c' : 'white'};padding:20px;border-radius:8px;min-width:300px;box-shadow:0 2px 10px rgba(0,0,0,0.2)`;

  //     popup.innerHTML = `
  //       <h2 style="margin-top:0;color:#333">${title}</h2>
  //       <p style="color:${type === 'error' || type === 'warning' ? 'white' : '#666'};margin:15px 0">${message}</p>
  //       <div style="text-align:right;gap:10px;display:flex;justify-content:flex-end">
  //         <button class="popup-btn-close" style="padding:8px 16px;border:none;border-radius:4px;cursor:pointer;background:#ddd">Close</button>
  //       </div>
  //     `;

  //     backdrop.appendChild(popup);
  //     document.body.appendChild(backdrop);

  //     const closeBtn = popup.querySelector('.popup-btn-close') as HTMLButtonElement;
  //     closeBtn.addEventListener('click', () => {
  //       backdrop.remove();
  //       resolve(true);
  //     }, { once: true });

  //     backdrop.addEventListener('click', (e) => {
  //       if (e.target === backdrop) {
  //         backdrop.remove();
  //         resolve(false);
  //       }
  //     }, { once: true });
  //   });
  // }

  displayNotification(title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info'): Promise<boolean> {
    return new Promise((resolve) => {
      // 1. Define Styles (injected only once)
      const styleId = 'notification-popup-styles';
      if (!document.getElementById(styleId)) {
        const styleSheet = document.createElement('style');
        styleSheet.id = styleId;
        styleSheet.textContent = `
        @keyframes popupFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popupSlideIn { from { transform: scale(0.9) translateY(10px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
        @keyframes popupFadeOut { from { opacity: 1; } to { opacity: 0; } }
        
        .modern-backdrop {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 10000; animation: popupFadeIn 0.3s ease-out forwards;
        }
        .modern-backdrop.closing { animation: popupFadeOut 0.2s ease-in forwards; }
        
        .modern-popup {
          background: white; width: 90%; max-width: 400px;
          border-radius: 16px; padding: 24px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          animation: popupSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          position: relative; overflow: hidden;
        }
        
        .popup-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .popup-icon-box { 
          width: 40px; height: 40px; border-radius: 50%; 
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .popup-title { margin: 0; font-size: 18px; font-weight: 700; color: #1f2937; }
        .popup-message { margin: 0 0 24px 0; color: #6b7280; font-size: 15px; line-height: 1.5; }
        
        .popup-actions { display: flex; justify-content: flex-end; gap: 12px; }
        .popup-btn {
          padding: 10px 20px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer;
          font-size: 14px; transition: all 0.2s;
        }
        .btn-primary { color: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .btn-primary:hover { transform: translateY(-1px); filter: brightness(1.1); }
        .btn-primary:active { transform: translateY(0); }

        /* Types */
        .type-success .popup-icon-box { background: #dcfce7; color: #16a34a; }
        .type-success .btn-primary { background: #16a34a; }
        
        .type-error .popup-icon-box { background: #fee2e2; color: #dc2626; }
        .type-error .btn-primary { background: #dc2626; }
        
        .type-warning .popup-icon-box { background: #fef3c7; color: #d97706; }
        .type-warning .btn-primary { background: #d97706; }
        
        .type-info .popup-icon-box { background: #e0e7ff; color: #4f46e5; }
        .type-info .btn-primary { background: #4f46e5; }
      `;
        document.head.appendChild(styleSheet);
      }

      // 2. Define Icons (Inline SVG)
      const icons = {
        success: `<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`,
        error: `<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`,
        warning: `<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`,
        info: `<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
      };

      // 3. Create DOM Elements
      const backdrop = document.createElement('div');
      backdrop.className = 'modern-backdrop';

      const popup = document.createElement('div');
      popup.className = `modern-popup type-${type}`;

      popup.innerHTML = `
      <div class="popup-header">
        <div class="popup-icon-box">${icons[type]}</div>
        <h2 class="popup-title">${title}</h2>
      </div>
      <p class="popup-message">${message}</p>
      <div class="popup-actions">
        <button class="popup-btn btn-primary">Okay, Got it</button>
      </div>
    `;

      backdrop.appendChild(popup);
      document.body.appendChild(backdrop);

      // 4. Close Logic (with Exit Animation)
      const closePopup = (result: boolean) => {
        backdrop.classList.add('closing'); // Trigger exit animation
        popup.style.animation = 'none'; // Stop entry animation logic

        // Wait for animation to finish (200ms)
        setTimeout(() => {
          if (document.body.contains(backdrop)) {
            backdrop.remove();
          }
          resolve(result);
        }, 200);
      };

      // Event Listeners
      const btn = popup.querySelector('.popup-btn') as HTMLButtonElement;
      btn.addEventListener('click', () => closePopup(true), { once: true });

      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          closePopup(false); // Clicking outside implies "dismissed" or "cancel"
        }
      }, { once: true });
    });
  }
}
