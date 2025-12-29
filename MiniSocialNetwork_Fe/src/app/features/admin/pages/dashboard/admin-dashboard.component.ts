import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService, AdminDashboard } from '../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <h1 class="page-title">📊 Dashboard</h1>
      <p class="page-subtitle">Tổng quan hệ thống Mini Social Network</p>

      <div class="stats-grid" *ngIf="dashboard">
        <div class="stat-card users" routerLink="/admin/users">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <span class="stat-value">{{ dashboard.totalUsers }}</span>
            <span class="stat-label">Users</span>
          </div>
        </div>

        <div class="stat-card posts" routerLink="/admin/posts">
          <div class="stat-icon">📝</div>
          <div class="stat-info">
            <span class="stat-value">{{ dashboard.totalPosts }}</span>
            <span class="stat-label">Posts</span>
          </div>
        </div>

        <div class="stat-card comments" routerLink="/admin/comments">
          <div class="stat-icon">💬</div>
          <div class="stat-info">
            <span class="stat-value">{{ dashboard.totalComments }}</span>
            <span class="stat-label">Comments</span>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <span>🔄 Loading...</span>
      </div>

      <div class="error" *ngIf="error">
        <span>❌ {{ error }}</span>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1200px;
    }

    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: #fff;
      margin: 0 0 8px;
    }

    .page-subtitle {
      color: rgba(255, 255, 255, 0.6);
      margin: 0 0 32px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 28px;
      display: flex;
      align-items: center;
      gap: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .stat-card:hover {
      transform: translateY(-4px);
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .stat-icon {
      font-size: 48px;
      width: 72px;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 36px;
      font-weight: 700;
      color: #fff;
    }

    .stat-label {
      color: rgba(255, 255, 255, 0.6);
      font-size: 16px;
    }

    .loading, .error {
      text-align: center;
      padding: 40px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 16px;
    }

    .error {
      color: #ff6b6b;
    }

    /* Card color variants */
    .stat-card.users .stat-icon { background: linear-gradient(135deg, #667eea, #764ba2); }
    .stat-card.posts .stat-icon { background: linear-gradient(135deg, #f093fb, #f5576c); }
    .stat-card.comments .stat-icon { background: linear-gradient(135deg, #4facfe, #00f2fe); }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  dashboard: AdminDashboard | null = null;
  loading = false;
  error = '';

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = '';

    this.adminService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load dashboard:', err);
        this.error = 'Failed to load dashboard data. Please try again.';
        this.loading = false;
      }
    });
  }
}
