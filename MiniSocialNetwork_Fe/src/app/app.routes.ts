import { Routes } from '@angular/router';
import { FollowPageComponent } from './pages/follow/follow.page';

export const routes: Routes = [
    { path: '', redirectTo: '/follow', pathMatch: 'full' },
    { path: 'follow', component: FollowPageComponent }
];
