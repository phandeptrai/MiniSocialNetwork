import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FollowButtonComponent } from '../../components/follow-button/follow-button.component';

@Component({
    selector: 'app-follow-page',
    standalone: true,
    imports: [CommonModule, FollowButtonComponent],
    templateUrl: './follow.page.html',
    styleUrls: ['./follow.page.css']
})
export class FollowPageComponent {
    // Giả lập: Current user ID = 2, đang xem profile của user ID = 1
    currentUserId = 2;
    targetUserId = 1;
}
