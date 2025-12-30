import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, PostAdmin } from '../../services/admin.service';

@Component({
  selector: 'app-posts-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './posts-management.component.html',
  styleUrl: './posts-management.component.css'
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
