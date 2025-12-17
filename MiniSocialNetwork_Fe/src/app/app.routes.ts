import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard';
import { ChatPage } from './features/chat/pages/chat-page/chat-page';
import { LoginPage } from './features/auth/pages/login-page/login-page';
import { RegisterPage } from './features/auth/pages/register-page/register-page';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPage
  },
  {
    path: 'register',
    component: RegisterPage
  },
  {
    path: 'chat',
    canActivate: [authGuard],
    component: ChatPage,
  },
  {
    path: '',
    redirectTo: 'chat',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'chat'
  }
];