import axios from './axios';
import type { User, AuthResponse, Book, Author, Borrow, BorrowRequest } from '@/types/models';

// Auth endpoints (Public)
export const authAPI = {
  register: (userData: { username: string; password: string }) => 
    axios.post<AuthResponse>('/auth/register', userData),
  
  login: (credentials: { username: string; password: string }) => 
    axios.post<AuthResponse>('/auth/login', credentials),
};

// User endpoints (USER + ADMIN roles)
export const userAPI = {
  // Books
  getBooks: () => axios.get<Book[]>('/user/books'),
  getAvailableBooks: () => axios.get<Book[]>('/user/books/available'),
  getBookById: (id: number) => axios.get<Book>(`/user/books/${id}`),
  
  // Authors
  getAuthors: () => axios.get<Author[]>('/user/authors'),
  getAuthorById: (id: number) => axios.get<Author>(`/user/authors/${id}`),
  
  // Borrow/Return
  borrowBook: (bookId: number) => axios.post<Borrow>('/user/borrow', { bookId } as BorrowRequest),
  returnBook: (borrowId: number) => axios.post<Borrow>(`/user/return/${borrowId}`),
  getUserBorrows: () => axios.get<Borrow[]>('/user/borrows'),
};

// Admin endpoints (ADMIN only)
export const adminAPI = {
  // User Management
  getUsers: () => axios.get<User[]>('/admin/users'),
  getUserById: (id: number) => axios.get<User>(`/admin/users/${id}`),
  updateUserRole: (id: number, role: 'USER' | 'ADMIN') => 
    axios.put<User>(`/admin/users/${id}/role`, { role }),
  deleteUser: (id: number) => axios.delete<{ message: string }>(`/admin/users/${id}`),
  
  // Books Management
  getBooks: () => axios.get<Book[]>('/user/books'),
  createBook: (bookData: Omit<Book, 'id' | 'authorName' | 'available'>) => 
    axios.post<Book>('/admin/books', bookData),
  updateBook: (id: number, bookData: Partial<Book>) => 
    axios.put<Book>(`/admin/books/${id}`, bookData),
  deleteBook: (id: number) => axios.delete<{ message: string }>(`/admin/books/${id}`),
  
  // Authors Management
  getAuthors: () => axios.get<Author[]>('/admin/authors'),
  createAuthor: (authorData: Omit<Author, 'id' | 'bookCount'>) => 
    axios.post<Author>('/admin/authors', authorData),
  updateAuthor: (id: number, authorData: Partial<Author>) => 
    axios.put<Author>(`/admin/authors/${id}`, authorData),
  deleteAuthor: (id: number) => axios.delete<{ message: string }>(`/admin/authors/${id}`),
  
  // Borrows Management
  getAllBorrows: () => axios.get<Borrow[]>('/admin/borrows'),
  getActiveBorrows: () => axios.get<Borrow[]>('/admin/borrows/active'),
  returnBook: (borrowId: number) => axios.post<Borrow>(`/admin/return/${borrowId}`),
};