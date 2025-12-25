import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/* ===== DTO (Data Transfer Objects) ===== */
export interface CommentResponse {
    id: string;
    postId: string;
    userId: string;
    content: string | null;
    imageUrl: string | null;
    createdAt: string;
    updatedAt: string;
    deleted: boolean;
}

export interface SliceResponse<T> {
    content: T[];
    hasNext: boolean;
}

/* ===== COMMENT SERVICE ===== */
@Injectable({
    providedIn: 'root',
})
export class CommentService {
    private readonly API_URL = `${environment.apiUrl}/comments`;

    constructor(private http: HttpClient) { }

    /**
     * Tạo comment mới (hỗ trợ upload ảnh)
     * POST /api/comments
     * Form data: postId, userId, content (optional), image (optional)
     */
    createComment(
        postId: string,
        userId: string,
        content: string | null,
        image: File | null
    ): Observable<CommentResponse> {
        const formData = new FormData();
        formData.append('postId', postId);
        formData.append('userId', userId);

        if (content && content.trim().length > 0) {
            formData.append('content', content.trim());
        }

        if (image) {
            formData.append('image', image);
        }

        return this.http.post<CommentResponse>(this.API_URL, formData);
    }

    /**
     * Lấy comment theo ID
     * GET /api/comments/{id}
     */
    getCommentById(commentId: string): Observable<CommentResponse> {
        return this.http.get<CommentResponse>(`${this.API_URL}/${commentId}`);
    }

    /**
     * Lấy danh sách comments của một post với phân trang (Slice)
     * GET /api/comments/post/{postId}?page=0&size=10
     */
    getCommentsByPost(
        postId: string,
        page = 0,
        size = 10
    ): Observable<SliceResponse<CommentResponse>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<SliceResponse<CommentResponse>>(
            `${this.API_URL}/post/${postId}`,
            { params }
        );
    }

    /**
     * Cập nhật comment (chỉ owner mới có quyền)
     * PUT /api/comments/{id}
     * Form data: userId, content (optional), image (optional), removeImage (optional)
     */
    updateComment(
        commentId: string,
        userId: string,
        content: string | null,
        image: File | null,
        removeImage = false
    ): Observable<CommentResponse> {
        const formData = new FormData();
        formData.append('userId', userId);

        if (content && content.trim().length > 0) {
            formData.append('content', content.trim());
        }

        if (image) {
            formData.append('image', image);
        }

        if (removeImage) {
            formData.append('removeImage', 'true');
        }

        return this.http.put<CommentResponse>(
            `${this.API_URL}/${commentId}`,
            formData
        );
    }

    /**
     * Xóa comment (soft delete, chỉ owner mới có quyền)
     * DELETE /api/comments/{id}?userId=xxx
     */
    deleteComment(
        commentId: string,
        userId: string
    ): Observable<CommentResponse> {
        const params = new HttpParams().set('userId', userId);
        return this.http.delete<CommentResponse>(`${this.API_URL}/${commentId}`, {
            params,
        });
    }

    /**
     * Lấy số lượng comment của một post
     * GET /api/comments/count/{postId}
     */
    getCommentCount(postId: string): Observable<number> {
        return this.http.get<number>(`${this.API_URL}/count/${postId}`);
    }
}
