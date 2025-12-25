import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/* ===== DTO (Data Transfer Objects) ===== */
export interface PostResponse {
  id: string;
  authorId: string;
  content: string | null;
  imageUrls: string[] | null;
  likes: string[] | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

export interface CommentResponse {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
}

/* ===== Pagination Response từ Spring Boot ===== */
export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

/* ===== POST SERVICE ===== */
@Injectable({
  providedIn: 'root',
})
export class PostService {
  private readonly API_URL = `${environment.apiUrl}/posts`;

  constructor(private http: HttpClient) { }

  /* ===== GET ALL POSTS (with pagination) ===== */
  getPosts(page = 0, size = 20): Observable<PageResponse<PostResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PageResponse<PostResponse>>(this.API_URL, { params });
  }

  /* ===== GET POSTS BY AUTHOR (with pagination) ===== */
  getPostsByAuthor(
    authorId: string,
    page = 0,
    size = 10
  ): Observable<PageResponse<PostResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PageResponse<PostResponse>>(
      `${this.API_URL}/author/${authorId}`,
      { params }
    );
  }

  /* ===== GET POST BY ID ===== */
  getPostById(postId: string): Observable<PostResponse> {
    return this.http.get<PostResponse>(`${this.API_URL}/${postId}`);
  }

  /* ===== CREATE POST (multipart/form-data) ===== */
  createPost(
    content: string | null,
    images: File[]
  ): Observable<PostResponse> {
    const formData = new FormData();

    if (content && content.trim().length > 0) {
      formData.append('content', content.trim());
    }

    images.forEach((file) => {
      formData.append('images', file);
    });

    return this.http.post<PostResponse>(this.API_URL, formData);
  }

  /* ===== UPDATE POST ===== */
  updatePost(
    postId: string,
    content: string | null
  ): Observable<PostResponse> {
    return this.http.put<PostResponse>(`${this.API_URL}/${postId}`, {
      content,
    });
  }

  /* ===== DELETE POST ===== */
  deletePost(postId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${postId}`);
  }

  /* ===== TOGGLE LIKE / UNLIKE ===== */
  toggleLike(postId: string): Observable<PostResponse> {
    return this.http.post<PostResponse>(
      `${this.API_URL}/${postId}/like`,
      null
    );
  }

  /* ===== ADD COMMENT ===== */
  addComment(
    postId: string,
    userId: string,
    content: string
  ): Observable<CommentResponse> {
    return this.http.post<CommentResponse>(
      `${this.API_URL}/${postId}/comments`,
      { userId, content }
    );
  }

  /* ===== GET COMMENTS BY POST ===== */
  getCommentsByPost(
    postId: string,
    page = 0,
    size = 20
  ): Observable<CommentResponse[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<CommentResponse[]>(
      `${this.API_URL}/${postId}/comments`,
      { params }
    );
  }
}


