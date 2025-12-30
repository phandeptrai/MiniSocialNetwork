import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, CommentAdmin } from '../../services/admin.service';

@Component({
  selector: 'app-comments-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comments-management.component.html',
  styleUrl: './comments-management.component.css'
})
export class CommentsManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  items: CommentAdmin[] = [];
  filteredItems: CommentAdmin[] = [];
  searchTerm = '';
  loading = false;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.adminService.getAllComments().subscribe({
      next: (data) => { this.items = data; this.filteredItems = data; this.loading = false; },
      error: (err) => { console.error('Failed to load:', err); this.loading = false; }
    });
  }

  filter(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems = this.items.filter(i => i.content?.toLowerCase().includes(term) || i.userUsername?.toLowerCase().includes(term));
  }

  delete(item: CommentAdmin): void {
    if (confirm('Are you sure you want to delete this comment?')) {
      this.adminService.deleteComment(item.id).subscribe({ next: () => this.load(), error: (err) => console.error('Failed to delete:', err) });
    }
  }

  truncate(str: string, maxLen: number): string { return str && str.length > maxLen ? str.substring(0, maxLen) + '...' : str || ''; }
  formatDate(dateStr: string): string { return dateStr ? new Date(dateStr).toLocaleDateString() : '-'; }
}
