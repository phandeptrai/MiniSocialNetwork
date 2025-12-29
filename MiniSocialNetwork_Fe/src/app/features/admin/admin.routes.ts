import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './pages/dashboard/admin-dashboard.component';
import { UsersManagementComponent } from './pages/users/users-management.component';
import { PostsManagementComponent } from './pages/posts/posts-management.component';
import { CommentsManagementComponent } from './pages/comments/comments-management.component';

export const ADMIN_ROUTES: Routes = [
    {
        path: '',
        component: AdminLayoutComponent,
        children: [
            { path: '', component: AdminDashboardComponent },
            { path: 'users', component: UsersManagementComponent },
            { path: 'posts', component: PostsManagementComponent },
            { path: 'comments', component: CommentsManagementComponent },
        ]
    }
];
