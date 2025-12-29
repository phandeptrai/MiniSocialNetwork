import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, NotificationAdmin } from '../../services/admin.service';

@Component({
    selector: 'app-notifications-management',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="management-page">
      <div class="page-header">
        <h1 class="page-title">🔔 Notifications Management</h1>
        <p class="page-subtitle">Quản lý thông báo</p>
      </div>

      <div class="table-container" *ngIf="!loading">
        <table class="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Sender</th>
              <th>Receiver</th>
              <th>Message</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items">
              <td><span class="type-badge">{{ item.type }}</span></td>
              <td>{{ item.senderName || '-' }}</td>
              <td>{{ item.receiverName || '-' }}</td>
              <td><span class="content">{{ truncate(item.message, 60) }}</span></td>
              <td>
                <span class="badge" [class.active]="item.isRead" [class.inactive]="!item.isRead">
                  {{ item.isRead ? 'Read' : 'Unread' }}
                </span>
              </td>
              <td>{{ formatDate(item.createdAt) }}</td>
              <td>
                <button class="btn-delete" (click)="delete(item)" title="Delete">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-state" *ngIf="items.length === 0">No notifications found</div>
      </div>
      <div class="loading" *ngIf="loading">🔄 Loading...</div>
    </div>
  `,
    styles: [`
    .management-page { max-width: 1400px; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 28px; font-weight: 700; color: #fff; margin: 0 0 8px; }
    .page-subtitle { color: rgba(255, 255, 255, 0.6); margin: 0; }
    .table-container { background: rgba(255, 255, 255, 0.05); border-radius: 16px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1); }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 14px 16px; text-align: left; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
    .data-table th { background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.7); font-weight: 600; font-size: 12px; text-transform: uppercase; }
    .data-table td { color: #fff; font-size: 14px; }
    .data-table tr:hover { background: rgba(255, 255, 255, 0.03); }
    .type-badge { background: linear-gradient(135deg, #667eea, #764ba2); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .content { color: rgba(255, 255, 255, 0.8); }
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge.active { background: rgba(67, 233, 123, 0.2); color: #43e97b; }
    .badge.inactive { background: rgba(255, 193, 7, 0.2); color: #ffc107; }
    .btn-delete { padding: 6px 10px; border: none; border-radius: 6px; cursor: pointer; background: rgba(255, 107, 107, 0.2); font-size: 14px; }
    .btn-delete:hover { background: rgba(255, 107, 107, 0.4); }
    .loading, .empty-state { text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6); }
  `]
})
export class NotificationsManagementComponent implements OnInit {
    private adminService = inject(AdminService);
    items: NotificationAdmin[] = [];
    loading = false;

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading = true;
        this.adminService.getAllNotifications().subscribe({
            next: (data) => { this.items = data; this.loading = false; },
            error: (err) => { console.error('Failed to load:', err); this.loading = false; }
        });
    }

    delete(item: NotificationAdmin): void {
        if (confirm('Delete this notification?')) {
            this.adminService.deleteNotification(item.id).subscribe({ next: () => this.load() });
        }
    }

    truncate(str: string, maxLen: number): string { return str && str.length > maxLen ? str.substring(0, maxLen) + '...' : str || ''; }
    formatDate(dateStr: string): string { return dateStr ? new Date(dateStr).toLocaleDateString() : '-'; }
}
