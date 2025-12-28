import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterOutlet, Router } from '@angular/router'; // Added Router
import { AccesspointService } from '../app/accesspoint/accesspoint.service';
import { Subject, takeUntil } from 'rxjs';
import { ThemeServiceService } from '../app/theme-service.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, CommonModule, RouterOutlet],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})

export class NavbarComponent implements OnInit, OnDestroy {
  menuActive = false;
  userEmail = '';
  currentUser = '';
  currentUserName = '';
  visualTheme = '';
  isDarkMode: boolean = false;
  private destroy$ = new Subject<void>();

  // Injected Router
  constructor(
    public accesspointService: AccesspointService,
    private themeService: ThemeServiceService,
    private router: Router
  ) { };

  ngOnInit(): void {
    // Subscribe to theme service changes
    this.themeService.isDarkMode$.pipe(takeUntil(this.destroy$))
      .subscribe(isDark => {
        this.isDarkMode = isDark;
      });

    // Subscribe to user changes
    this.accesspointService.currentState$.pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.userEmail = user.email;
          this.currentUser = user.type;
          this.currentUserName = user.name;
          this.visualTheme = user.visual;
          this.themeService.updateUserThemePreference(user.visual as 'light' | 'dark');
        }
      });
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
    this.router.navigate(['/userpage']); // Ensure redirection happens
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}