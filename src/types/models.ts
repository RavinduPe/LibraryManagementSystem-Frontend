export interface User {
  id?: number;
  username: string;
  password?: string;
  role?: 'USER' | 'ADMIN';
  borrowedBooksCount?: number;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  type?: string;
  id?: number;
  username: string;
  role: 'USER' | 'ADMIN';
}

export interface Book {
  id?: number;
  title: string;
  genre: string;
  price: number;
  authorId: number;
  authorName?: string;
  available?: boolean;
}

export interface Author {
  id?: number;
  name: string;
  bio: string;
  bookCount?: number;
}

export interface Borrow {
  id?: number;
  bookId: number;
  bookTitle?: string;
  userId: number;
  username?: string;
  borrowDate: string;
  returnDate?: string | null;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
}

export interface BorrowRequest {
  bookId: number;
}

export interface ErrorResponse {
  message: string;
  timestamp: string;
  status: number;
}