import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { KeycloakApiService } from '../../../auth/services/keycloak-api.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-layout">
      <!-- Admin Sidebar -->
      <aside class="admin-sidebar">
        <div class="sidebar-header">
          <h1 class="logo">⚙️ Admin Panel</h1>
        </div>

        <nav class="admin-nav">
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <span class="icon">📊</span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/admin/users" routerLinkActive="active" class="nav-item">
            <span class="icon">👥</span>
            <span>Users</span>
          </a>
          <a routerLink="/admin/posts" routerLinkActive="active" class="nav-item">
            <span class="icon">📝</span>
            <span>Posts</span>
          </a>
          <a routerLink="/admin/comments" routerLinkActive="active" class="nav-item">
            <span class="icon">💬</span>
            <span>Comments</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/feed" class="nav-item back-link">
            <span class="icon">🏠</span>
            <span>Back to App</span>
          </a>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="admin-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }

    .admin-sidebar {
      width: 260px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      position: fixed;
      height: 100vh;
      left: 0;
      top: 0;
    }

    .sidebar-header {
      padding: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logo {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      margin: 0;
    }

    .admin-nav {
      flex: 1;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .nav-item.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }

    .icon {
      font-size: 18px;
    }

    .sidebar-footer {
      padding: 16px 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .back-link {
      color: rgba(255, 255, 255, 0.5);
    }

    .back-link:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.05);
    }

    .admin-content {
      margin-left: 260px;
      flex: 1;
      padding: 24px 32px;
      overflow-y: auto;
    }
  `]
})
export class AdminLayoutComponent { }
