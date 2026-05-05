import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterOutlet, Router } from '@angular/router'; // Added Router
import { AccesspointService } from '../apps-services/access-point.service';
import { Subject, takeUntil } from 'rxjs';
import { ThemeServiceService } from '../apps-services/theme.service';
import { CommonModule } from '@angular/common';
import { SocketService } from '../apps-services/socket.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterOutlet, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})

export class NavbarComponent implements OnInit, OnDestroy {
  menuActive = false;
  userEmail = '';
  currentUser = '';
  currentUserName = '';
  visualTheme = '';
  NotificationMessage: string = '';
  isDarkMode: boolean = false;
  showNotificationPopup = false;
  notificationsOfUser: Array<{ message: string; requestServiceId: string; timestamp: Date }> = [];
  notificationsOfProvider: Array<{ message: string; userLocation: string; requestServiceId: string; timestamp: Date }> = [];
  private destroy$ = new Subject<void>();

  constructor(
    public accesspointService: AccesspointService,
    private themeService: ThemeServiceService,
    private socketService: SocketService,
    // private router: Router
  ) { };

  ngOnInit(): void {
    // Subscribe to theme service changes
    this.themeService.isDarkMode$.pipe(takeUntil(this.destroy$))
      .subscribe(isDark => {
        this.isDarkMode = isDark;
      });

    // Subscribe to user changes
    this.accesspointService.currentState$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) {
        this.userEmail = user.email;
        this.currentUser = user.type;
        this.currentUserName = user.name;
        this.visualTheme = user.visual;
        this.themeService.updateUserThemePreference(user.visual as 'light' | 'dark');
        this.socketService.joinRoom(user.email);
      }
    });

    this.socketService.receiveNotificationFromProvider((data: { message: string; requestServiceId: string; name: string }) => {
      console.log('Received notification from provider:', data);
      this.notificationsOfUser.unshift({
        message: data.message,
        requestServiceId: data.requestServiceId,
        timestamp: new Date()
      });
    });

    this.socketService.receiveNotificationFromUser((data: { message: string; userLocation: string; requestServiceId: string; name: string }) => {
      console.log('Received notification from user:', data);
      this.notificationsOfProvider.unshift({
        message: data.message,
        userLocation: data.userLocation,
        requestServiceId: data.requestServiceId,
        timestamp: new Date()
      });
    });

  }

  toggleNotificationPopup() {
    this.showNotificationPopup = !this.showNotificationPopup;
  }

  closeNotificationPopup() {
    this.showNotificationPopup = false;
  }

  changeTheme(theme: string) {
    const currentUser = this.accesspointService.getCurrentState;
    if (currentUser) {
      this.accesspointService.updateCurrentState = {
        ...currentUser,
        visual: theme
      };
      this.themeService.updateUserThemePreference(theme as 'light' | 'dark');
    } else {
      console.log("No current user to update theme for.");
    }
    this.visualTheme = theme;
  }

  toggleMenu() {
    this.menuActive = !this.menuActive;
  }

  logout() {
    this.accesspointService.logout();
    // this.router.navigate(['/userpage']);s // Ensure redirection happens
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}