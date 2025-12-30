import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, UserAdmin } from '../../services/admin.service';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-management.component.html',
  styleUrl: './users-management.component.css'
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
