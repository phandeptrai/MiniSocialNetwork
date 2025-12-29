import { Component, inject, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminDashboard, PostStatistics } from '../../services/admin.service';
import { Chart, registerables } from 'chart.js';

// Register all Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="dashboard">
      <div class="dashboard-header">
        <div>
          <h1 class="page-title">📊 Dashboard</h1>
          <p class="page-subtitle">Tổng quan hệ thống Mini Social Network</p>
        </div>
        <button class="sync-btn" (click)="syncUsers()" [disabled]="syncing">
          {{ syncing ? '🔄 Đang đồng bộ...' : '🔄 Sync Users từ Keycloak' }}
        </button>
      </div>
      <div class="sync-message" *ngIf="syncMessage" [class.success]="syncSuccess">
        {{ syncMessage }}
      </div>

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

      <!-- Post Statistics Chart Section -->
      <div class="chart-section" *ngIf="isBrowser">
        <div class="chart-header">
          <h2 class="chart-title">📈 Thống kê bài đăng</h2>
          <div class="time-filter">
            <button 
              *ngFor="let option of timeOptions" 
              class="filter-btn"
              [class.active]="selectedDays === option.value"
              (click)="onTimeFilterChange(option.value)">
              {{ option.label }}
            </button>
          </div>
        </div>
        
        <div class="chart-container" *ngIf="!chartLoading && !chartError">
          <div class="chart-summary">
            <span class="summary-label">Tổng bài đăng trong {{ selectedDays }} ngày:</span>
            <span class="summary-value">{{ statistics?.totalPosts || 0 }}</span>
          </div>
          <canvas #chartCanvas></canvas>
        </div>
        
        <div class="chart-loading" *ngIf="chartLoading">
          <span>🔄 Đang tải biểu đồ...</span>
        </div>
        
        <div class="chart-error" *ngIf="chartError">
          <span>❌ {{ chartError }}</span>
          <button class="retry-btn" (click)="loadPostStatistics()">Thử lại</button>
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

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .sync-btn {
      padding: 12px 24px;
      background: linear-gradient(135deg, #00c853, #00bfa5);
      border: none;
      color: #fff;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
      white-space: nowrap;
    }

    .sync-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 200, 83, 0.4);
    }

    .sync-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .sync-message {
      padding: 12px 20px;
      border-radius: 8px;
      margin-bottom: 24px;
      background: rgba(255, 107, 107, 0.2);
      color: #ff6b6b;
      text-align: center;
    }

    .sync-message.success {
      background: rgba(0, 200, 83, 0.2);
      color: #00c853;
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
      margin-bottom: 40px;
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

    /* Chart Section Styles */
    .chart-section {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 28px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 24px;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .chart-title {
      font-size: 20px;
      font-weight: 600;
      color: #fff;
      margin: 0;
    }

    .time-filter {
      display: flex;
      gap: 8px;
    }

    .filter-btn {
      padding: 8px 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
    }

    .filter-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .filter-btn.active {
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-color: transparent;
      color: #fff;
    }

    .chart-container {
      position: relative;
    }

    .chart-summary {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      padding: 12px 20px;
      background: rgba(102, 126, 234, 0.1);
      border-radius: 8px;
    }

    .summary-label {
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
    }

    .summary-value {
      color: #667eea;
      font-size: 24px;
      font-weight: 700;
    }

    canvas {
      max-height: 350px;
    }

    .chart-loading, .chart-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      color: rgba(255, 255, 255, 0.6);
      gap: 16px;
    }

    .chart-error {
      color: #ff6b6b;
    }

    .retry-btn {
      padding: 8px 20px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border: none;
      color: #fff;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .retry-btn:hover {
      transform: scale(1.05);
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
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private adminService = inject(AdminService);
  private platformId = inject(PLATFORM_ID);
  private chart: Chart | null = null;

  dashboard: AdminDashboard | null = null;
  statistics: PostStatistics | null = null;
  loading = false;
  error = '';
  chartLoading = false;
  chartError = '';
  selectedDays = 7;
  isBrowser = false;
  syncing = false;
  syncMessage = '';
  syncSuccess = false;

  timeOptions = [
    { label: '7 ngày', value: 7 },
    { label: '30 ngày', value: 30 },
    { label: '90 ngày', value: 90 }
  ];

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.loadPostStatistics();
      }, 0);
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
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

  loadPostStatistics(): void {
    this.chartLoading = true;
    this.chartError = '';

    this.adminService.getPostStatistics(this.selectedDays).subscribe({
      next: (data) => {
        this.statistics = data;
        this.chartLoading = false;
        this.renderChart();
      },
      error: (err) => {
        console.error('Failed to load post statistics:', err);
        this.chartError = 'Không thể tải dữ liệu thống kê. Vui lòng thử lại.';
        this.chartLoading = false;
      }
    });
  }

  onTimeFilterChange(days: number): void {
    this.selectedDays = days;
    this.loadPostStatistics();
  }

  syncUsers(): void {
    this.syncing = true;
    this.syncMessage = '';

    this.adminService.syncUsersFromKeycloak().subscribe({
      next: (result) => {
        this.syncing = false;
        this.syncSuccess = true;
        this.syncMessage = `✅ ${result.message}. Đã đồng bộ ${result.syncedCount} users.`;
        this.loadDashboard(); // Reload dashboard to update counts
        setTimeout(() => { this.syncMessage = ''; }, 5000);
      },
      error: (err) => {
        console.error('Sync failed:', err);
        this.syncing = false;
        this.syncSuccess = false;
        this.syncMessage = '❌ Đồng bộ thất bại. Vui lòng thử lại.';
        setTimeout(() => { this.syncMessage = ''; }, 5000);
      }
    });
  }

  private renderChart(): void {
    if (!this.chartCanvas || !this.statistics) {
      return;
    }

    // Destroy existing chart if any
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }

    // Create gradient for line fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 350);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.4)');
    gradient.addColorStop(1, 'rgba(102, 126, 234, 0.0)');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.statistics.labels,
        datasets: [{
          label: 'Số bài đăng',
          data: this.statistics.values,
          fill: true,
          backgroundColor: gradient,
          borderColor: '#667eea',
          borderWidth: 3,
          tension: 0.4,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#764ba2',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: (items) => {
                return `Ngày ${items[0].label}`;
              },
              label: (item) => {
                return `${item.raw} bài đăng`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              display: true
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)',
              font: {
                size: 11
              },
              maxRotation: 45,
              minRotation: 0
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)',
              font: {
                size: 11
              },
              stepSize: 1,
              callback: function (value) {
                if (Number.isInteger(value)) {
                  return value;
                }
                return null;
              }
            }
          }
        }
      }
    });
  }
}
