import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

// Auth pages (no layout)
import { LoginPage } from './features/auth/pages/login-page/login-page';
import { RegisterPage } from './features/auth/pages/register-page/register-page';

// Main layout
import { MainLayoutComponent } from './shared/components/layout/main-layout.component';

// Feature pages
import { FeedPageComponent } from './features/feed/feed-page.component';
import { ChatPage } from './features/chat/pages/chat-page/chat-page';
import { ProfilePageComponent } from './features/profile/pages/profile-page/profile-page.component';
import { PeoplePageComponent } from './features/people/people-page.component';
import { FollowPageComponent } from './pages/follow/follow.page';
import { NotificationsPageComponent } from './features/notifications/pages/notifications-page.component';


export const routes: Routes = [
  // Auth routes (no sidebar)
  {
    path: 'login',
    component: LoginPage
  },
  {
    path: 'register',
    component: RegisterPage
  },

  // Main app routes (with sidebar layout)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'feed',
        component: FeedPageComponent,
      },
      {
        path: 'chat',
        component: ChatPage,
      },
      {
        path: 'people',
        component: PeoplePageComponent,
      },
      {
        path: 'notifications',
        component: NotificationsPageComponent,
      },
      {
        path: 'profile',
        component: ProfilePageComponent,
      },
      {
        path: 'follow',
        component: FollowPageComponent,
      },
      {
        path: '',
        redirectTo: 'feed',
        pathMatch: 'full'
      }
    ]
  },

  // Fallback
  {
    path: '**',
    redirectTo: 'feed'
  }
];
