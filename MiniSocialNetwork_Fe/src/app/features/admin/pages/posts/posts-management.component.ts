import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, PostAdmin } from '../../services/admin.service';

@Component({
    selector: 'app-posts-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="management-page">
      <div class="page-header">
        <h1 class="page-title">📝 Posts Management</h1>
        <p class="page-subtitle">Quản lý bài viết</p>
      </div>

      <div class="search-bar">
        <input type="text" [(ngModel)]="searchTerm" placeholder="🔍 Search posts..." (input)="filterPosts()" />
      </div>

      <div class="table-container" *ngIf="!loading">
        <table class="data-table">
          <thead>
            <tr>
              <th>Author</th>
              <th>Content</th>
              <th>Likes</th>
              <th>Comments</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let post of filteredPosts">
              <td><span class="username">@{{ post.authorUsername || 'unknown' }}</span></td>
              <td><span class="content">{{ truncate(post.content, 80) }}</span></td>
              <td class="center">{{ post.likeCount }}</td>
              <td class="center">{{ post.commentCount }}</td>
              <td>
                <span class="badge" [class.active]="!post.isDeleted" [class.inactive]="post.isDeleted">
                  {{ post.isDeleted ? 'Deleted' : 'Active' }}
                </span>
              </td>
              <td>{{ formatDate(post.createdAt) }}</td>
              <td>
                <button class="btn-delete" (click)="deletePost(post)" title="Delete">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-state" *ngIf="filteredPosts.length === 0">No posts found</div>
      </div>
      <div class="loading" *ngIf="loading">🔄 Loading...</div>
    </div>
  `,
    styles: [`
    .management-page { max-width: 1400px; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 28px; font-weight: 700; color: #fff; margin: 0 0 8px; }
    .page-subtitle { color: rgba(255, 255, 255, 0.6); margin: 0; }
    .search-bar { margin-bottom: 20px; }
    .search-bar input {
      width: 100%; max-width: 400px; padding: 12px 16px; border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.05);
      color: #fff; font-size: 14px;
    }
    .search-bar input::placeholder { color: rgba(255, 255, 255, 0.4); }
    .table-container {
      background: rgba(255, 255, 255, 0.05); border-radius: 16px; overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td {
      padding: 14px 16px; text-align: left; border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .data-table th {
      background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.7);
      font-weight: 600; font-size: 12px; text-transform: uppercase;
    }
    .data-table td { color: #fff; font-size: 14px; }
    .data-table tr:hover { background: rgba(255, 255, 255, 0.03); }
    .username { color: #667eea; font-weight: 500; }
    .content { color: rgba(255, 255, 255, 0.8); }
    .center { text-align: center; }
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge.active { background: rgba(67, 233, 123, 0.2); color: #43e97b; }
    .badge.inactive { background: rgba(255, 107, 107, 0.2); color: #ff6b6b; }
    .btn-delete {
      padding: 6px 10px; border: none; border-radius: 6px; cursor: pointer;
      background: rgba(255, 107, 107, 0.2); font-size: 14px;
    }
    .btn-delete:hover { background: rgba(255, 107, 107, 0.4); }
    .loading, .empty-state { text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6); }
  `]
})
export class PostsManagementComponent implements OnInit {
    private adminService = inject(AdminService);

    posts: PostAdmin[] = [];
    filteredPosts: PostAdmin[] = [];
    searchTerm = '';
    loading = false;

    ngOnInit(): void {
        this.loadPosts();
    }

    loadPosts(): void {
        this.loading = true;
        this.adminService.getAllPosts().subscribe({
            next: (data) => { this.posts = data; this.filteredPosts = data; this.loading = false; },
            error: (err) => { console.error('Failed to load posts:', err); this.loading = false; }
        });
    }

    filterPosts(): void {
        const term = this.searchTerm.toLowerCase();
        this.filteredPosts = this.posts.filter(p =>
            p.content?.toLowerCase().includes(term) || p.authorUsername?.toLowerCase().includes(term)
        );
    }

    deletePost(post: PostAdmin): void {
        if (confirm('Are you sure you want to delete this post?')) {
            this.adminService.deletePost(post.id).subscribe({
                next: () => this.loadPosts(),
                error: (err) => console.error('Failed to delete post:', err)
            });
        }
    }

    truncate(str: string, maxLen: number): string {
        return str && str.length > maxLen ? str.substring(0, maxLen) + '...' : str || '';
    }

    formatDate(dateStr: string): string {
        return dateStr ? new Date(dateStr).toLocaleDateString() : '-';
    }
}
