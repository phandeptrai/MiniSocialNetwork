import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, UserAdmin } from '../../services/admin.service';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="management-page">
      <div class="page-header">
        <h1 class="page-title">👥 Users Management</h1>
        <p class="page-subtitle">Quản lý tài khoản người dùng</p>
      </div>

      <div class="search-bar">
        <input 
          type="text" 
          [(ngModel)]="searchTerm" 
          placeholder="🔍 Search users..."
          (input)="filterUsers()"
        />
      </div>

      <div class="table-container" *ngIf="!loading">
        <table class="data-table">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
              <th>Followers</th>
              <th>Following</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of filteredUsers">
              <td>
                <img [src]="user.avatarUrl || getDefaultAvatar(user.name)" class="avatar" />
              </td>
              <td><span class="username">@{{ user.username }}</span></td>
              <td>{{ user.name || '-' }}</td>
              <td>{{ user.email || '-' }}</td>
              <td class="center">{{ user.followersCount }}</td>
              <td class="center">{{ user.followingCount }}</td>
              <td>
                <span class="badge" [class.active]="user.isActive" [class.inactive]="!user.isActive">
                  {{ user.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <div class="actions">
                  <button class="btn-toggle" (click)="toggleUserStatus(user)" [title]="user.isActive ? 'Deactivate' : 'Activate'">
                    {{ user.isActive ? '🚫' : '✅' }}
                  </button>
                  <button class="btn-delete" (click)="deleteUser(user)" title="Delete">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="empty-state" *ngIf="filteredUsers.length === 0">
          <span>No users found</span>
        </div>
      </div>

      <div class="loading" *ngIf="loading">🔄 Loading...</div>
    </div>
  `,
  styles: [`
    .management-page {
      max-width: 1400px;
    }

    .page-header { margin-bottom: 24px; }
    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: #fff;
      margin: 0 0 8px;
    }
    .page-subtitle {
      color: rgba(255, 255, 255, 0.6);
      margin: 0;
    }

    .search-bar {
      margin-bottom: 20px;
    }
    .search-bar input {
      width: 100%;
      max-width: 400px;
      padding: 12px 16px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
      font-size: 14px;
    }
    .search-bar input::placeholder { color: rgba(255, 255, 255, 0.4); }

    .table-container {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    .data-table th, .data-table td {
      padding: 14px 16px;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .data-table th {
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.7);
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .data-table td { color: #fff; font-size: 14px; }
    .data-table tr:hover { background: rgba(255, 255, 255, 0.03); }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
    }

    .username { color: #667eea; font-weight: 500; }
    .center { text-align: center; }

    .badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge.active { background: rgba(67, 233, 123, 0.2); color: #43e97b; }
    .badge.inactive { background: rgba(255, 107, 107, 0.2); color: #ff6b6b; }

    .actions {
      display: flex;
      gap: 8px;
    }
    .actions button {
      padding: 6px 10px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    .btn-toggle { background: rgba(255, 255, 255, 0.1); }
    .btn-toggle:hover { background: rgba(255, 255, 255, 0.2); }
    .btn-delete { background: rgba(255, 107, 107, 0.2); }
    .btn-delete:hover { background: rgba(255, 107, 107, 0.4); }

    .loading, .empty-state {
      text-align: center;
      padding: 40px;
      color: rgba(255, 255, 255, 0.6);
    }
  `]
})
export class UsersManagementComponent implements OnInit {
  private adminService = inject(AdminService);

  users: UserAdmin[] = [];
  filteredUsers: UserAdmin[] = [];
  searchTerm = '';
  loading = false;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.filteredUsers = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.loading = false;
      }
    });
  }

  filterUsers(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(u =>
      u.username?.toLowerCase().includes(term) ||
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  }

  toggleUserStatus(user: UserAdmin): void {
    this.adminService.updateUser(user.id, { isActive: !user.isActive }).subscribe({
      next: () => this.loadUsers(),
      error: (err) => console.error('Failed to update user:', err)
    });
  }

  deleteUser(user: UserAdmin): void {
    const confirmMessage = `⚠️ CẢNH BÁO: Bạn có chắc muốn XÓA VĨNH VIỄN người dùng "${user.username}"?\n\n` +
      `Hành động này sẽ xóa:\n` +
      `• Tất cả BÀI ĐĂNG của người dùng\n` +
      `• Tất cả BÌNH LUẬN của người dùng\n` +
      `• Tất cả TIN NHẮN của người dùng\n` +
      `• Tất cả THÔNG BÁO liên quan\n` +
      `• Tất cả quan hệ THEO DÕI\n` +
      `• Tài khoản khỏi Keycloak\n` +
      `• Dữ liệu khỏi Database\n\n` +
      `➡️ Người dùng sẽ KHÔNG THỂ đăng nhập lại được!\n` +
      `⛔ Hành động này KHÔNG THỂ hoàn tác!`;

    if (confirm(confirmMessage)) {
      this.adminService.deleteUser(user.id).subscribe({
        next: () => {
          alert(`✅ Đã xóa vĩnh viễn người dùng "${user.username}" và tất cả nội dung liên quan!`);
          this.loadUsers();
        },
        error: (err) => {
          console.error('Failed to delete user:', err);
          alert('❌ Không thể xóa người dùng. Vui lòng thử lại!');
        }
      });
    }
  }


  getDefaultAvatar(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=667eea&color=fff`;
  }
}
