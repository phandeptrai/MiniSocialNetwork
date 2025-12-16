import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard';
import { ChatPage } from './features/chat/pages/chat-page/chat-page';
export const routes: Routes = [
  {
    path: 'chat',
    canActivate: [authGuard],
    component: ChatPage, 
  
  },
  {
    path: '**',
    redirectTo: 'chat',
    pathMatch: 'full'
  }
];