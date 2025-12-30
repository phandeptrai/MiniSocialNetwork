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
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
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
