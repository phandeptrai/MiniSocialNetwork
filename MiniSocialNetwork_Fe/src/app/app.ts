import { Component, signal } from '@angular/core';
import { FollowButtonComponent } from './components/follow-button/follow-button.component';

@Component({
  selector: 'app-root',
  imports: [FollowButtonComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('MiniSocialNetwork');

  // Giả lập current user ID (trong thực tế sẽ lấy từ AuthService)
  currentUserId = 1;

  // Danh sách user mẫu để demo
  users = [
    { id: 2, name: 'Nguyễn Văn A', username: '@nguyenvana', avatar: '👨‍💼' },
    { id: 3, name: 'Trần Thị B', username: '@tranthib', avatar: '👩‍💻' },
    { id: 4, name: 'Lê Văn C', username: '@levanc', avatar: '🧑‍🎨' },
  ];
}
