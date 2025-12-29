import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, MessageAdmin } from '../../services/admin.service';

@Component({
    selector: 'app-messages-management',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="management-page">
      <div class="page-header">
        <h1 class="page-title">✉️ Messages Management</h1>
        <p class="page-subtitle">Quản lý tin nhắn</p>
      </div>

      <div class="table-container" *ngIf="!loading">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Conversation</th>
              <th>Sender</th>
              <th>Content</th>
              <th>Type</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items">
              <td>{{ item.id }}</td>
              <td class="center">{{ item.conversationId }}</td>
              <td>{{ item.senderName || item.senderId }}</td>
              <td><span class="content">{{ truncate(item.content, 50) }}</span></td>
              <td><span class="type-badge">{{ item.messageType }}</span></td>
              <td>
                <span class="badge" [class.active]="!item.isDeleted" [class.inactive]="item.isDeleted">
                  {{ item.isDeleted ? 'Deleted' : 'Active' }}
                </span>
              </td>
              <td>{{ formatDate(item.createdAt) }}</td>
              <td>
                <button class="btn-delete" (click)="delete(item)" title="Delete">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-state" *ngIf="items.length === 0">No messages found</div>
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
    .type-badge { background: linear-gradient(135deg, #d299c2, #fef9d7); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; color: #000; }
    .content { color: rgba(255, 255, 255, 0.8); }
    .center { text-align: center; }
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge.active { background: rgba(67, 233, 123, 0.2); color: #43e97b; }
    .badge.inactive { background: rgba(255, 107, 107, 0.2); color: #ff6b6b; }
    .btn-delete { padding: 6px 10px; border: none; border-radius: 6px; cursor: pointer; background: rgba(255, 107, 107, 0.2); font-size: 14px; }
    .btn-delete:hover { background: rgba(255, 107, 107, 0.4); }
    .loading, .empty-state { text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6); }
  `]
})
export class MessagesManagementComponent implements OnInit {
    private adminService = inject(AdminService);
    items: MessageAdmin[] = [];
    loading = false;

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading = true;
        this.adminService.getAllMessages().subscribe({
            next: (data) => { this.items = data; this.loading = false; },
            error: (err) => { console.error('Failed to load:', err); this.loading = false; }
        });
    }

    delete(item: MessageAdmin): void {
        if (confirm('Delete this message?')) {
            this.adminService.deleteMessage(item.id).subscribe({ next: () => this.load() });
        }
    }

    truncate(str: string, maxLen: number): string { return str && str.length > maxLen ? str.substring(0, maxLen) + '...' : str || ''; }
    formatDate(dateStr: string): string { return dateStr ? new Date(dateStr).toLocaleDateString() : '-'; }
}
