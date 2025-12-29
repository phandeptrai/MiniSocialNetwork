import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, FollowAdmin } from '../../services/admin.service';

@Component({
    selector: 'app-follows-management',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="management-page">
      <div class="page-header">
        <h1 class="page-title">🤝 Follows Management</h1>
        <p class="page-subtitle">Quản lý quan hệ follow</p>
      </div>

      <div class="table-container" *ngIf="!loading">
        <table class="data-table">
          <thead>
            <tr>
              <th>Follower</th>
              <th></th>
              <th>Following</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items">
              <td>
                <span class="username">@{{ item.followerUsername || item.followerId }}</span>
                <span class="name" *ngIf="item.followerName">({{ item.followerName }})</span>
              </td>
              <td class="arrow">→</td>
              <td>
                <span class="username">@{{ item.followingUsername || item.followingId }}</span>
                <span class="name" *ngIf="item.followingName">({{ item.followingName }})</span>
              </td>
              <td>{{ formatDate(item.createdAt) }}</td>
              <td>
                <button class="btn-delete" (click)="delete(item)" title="Delete">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-state" *ngIf="items.length === 0">No follows found</div>
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
    .username { color: #667eea; font-weight: 500; }
    .name { color: rgba(255, 255, 255, 0.5); font-size: 12px; margin-left: 8px; }
    .arrow { color: #43e97b; font-size: 18px; text-align: center; }
    .btn-delete { padding: 6px 10px; border: none; border-radius: 6px; cursor: pointer; background: rgba(255, 107, 107, 0.2); font-size: 14px; }
    .btn-delete:hover { background: rgba(255, 107, 107, 0.4); }
    .loading, .empty-state { text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6); }
  `]
})
export class FollowsManagementComponent implements OnInit {
    private adminService = inject(AdminService);
    items: FollowAdmin[] = [];
    loading = false;

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading = true;
        this.adminService.getAllFollows().subscribe({
            next: (data) => { this.items = data; this.loading = false; },
            error: (err) => { console.error('Failed to load:', err); this.loading = false; }
        });
    }

    delete(item: FollowAdmin): void {
        if (confirm('Delete this follow relationship?')) {
            this.adminService.deleteFollow(item.followerId, item.followingId).subscribe({ next: () => this.load() });
        }
    }

    formatDate(dateStr: string): string { return dateStr ? new Date(dateStr).toLocaleDateString() : '-'; }
}
