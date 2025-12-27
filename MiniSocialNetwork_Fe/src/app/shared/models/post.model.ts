export interface PostViewModel {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  createdAt: string; // ISO string
  content?: string | null;
  imageUrls: string[];
  likeCount: number;
  commentCount: number;
}


