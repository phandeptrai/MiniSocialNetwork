import { Component, EventEmitter, Input, Output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, UpdateProfileRequest, UserProfile } from '../../../../core/services/user.service';

@Component({
    selector: 'app-edit-profile-popup',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './edit-profile-popup.component.html',
    styleUrl: './edit-profile-popup.component.css'
})
export class EditProfilePopupComponent implements OnInit {
    private readonly userService = inject(UserService);

    @Input() isOpen = false;
    @Input() currentProfile: UserProfile | null = null;

    @Output() close = new EventEmitter<void>();
    @Output() saved = new EventEmitter<UserProfile>();

    readonly isLoading = signal(false);
    readonly errorMessage = signal('');

    name = '';
    bio = '';
    avatarPreview: string | null = null;
    private selectedAvatarFile: File | null = null;

    ngOnInit(): void {
        this.initFormData();
    }

    ngOnChanges(): void {
        this.initFormData();
    }

    private initFormData(): void {
        if (this.currentProfile) {
            this.name = this.currentProfile.name || '';
            this.bio = this.currentProfile.bio || '';
            this.avatarPreview = null;
            this.selectedAvatarFile = null;
        }
    }

    onClose(): void {
        this.avatarPreview = null;
        this.selectedAvatarFile = null;
        this.errorMessage.set('');
        this.close.emit();
    }

    onOverlayClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('popup-overlay')) {
            this.onClose();
        }
    }

    onAvatarSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];

            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.errorMessage.set('Please select an image file');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.errorMessage.set('Image size must be less than 5MB');
                return;
            }

            this.selectedAvatarFile = file;
            this.errorMessage.set('');

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                this.avatarPreview = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    onSave(): void {
        if (!this.name.trim()) {
            this.errorMessage.set('Name is required');
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');

        const request: UpdateProfileRequest = {
            name: this.name.trim(),
            bio: this.bio.trim()
        };

        // If avatar was selected, use data URL (for demo purposes)
        // In production, you would upload to a file server first
        if (this.avatarPreview) {
            request.avatarUrl = this.avatarPreview;
        }

        this.userService.updateProfile(request).subscribe({
            next: (updatedProfile) => {
                this.isLoading.set(false);
                this.saved.emit(updatedProfile);
                this.onClose();
            },
            error: (err) => {
                console.error('Error updating profile:', err);
                this.isLoading.set(false);
                this.errorMessage.set('Failed to update profile. Please try again.');
            }
        });
    }
}

