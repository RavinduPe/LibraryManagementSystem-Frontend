import axiosInstance from '@/api/axios';
import { adminAPI, userAPI } from '@/api/endpoints';
import type { Borrow } from '@/types/models';

class BorrowService {
  private abortController: AbortController | null = null;

  // Admin methods
  async getAllBorrows(): Promise<Borrow[]> {
    try {
      const response = await adminAPI.getAllBorrows();
      return this.transformBorrows(response.data);
    } catch (error) {
      console.error('Error fetching all borrows:', error);
      throw error;
    }
  }

  async getActiveBorrows(): Promise<Borrow[]> {
    try {
      const response = await adminAPI.getActiveBorrows();
      return this.transformBorrows(response.data);
    } catch (error) {
      console.error('Error fetching active borrows:', error);
      throw error;
    }
  }

  async markAsReturned(borrowId: number): Promise<Borrow> {
    try {
      const response = await adminAPI.returnBook(borrowId);
      return response.data;
    } catch (error) {
      console.error('Error marking as returned:', error);
      throw error;
    }
  }

  // User methods
  async getMyBorrows(): Promise<Borrow[]> {
    try {
      const response = await userAPI.getUserBorrows();
      return this.transformBorrows(response.data);
    } catch (error) {
      console.error('Error fetching my borrows:', error);
      throw error;
    }
  }

  async borrowBook(bookId: number): Promise<Borrow> {
    try {
      const response = await userAPI.borrowBook(bookId);
      return response.data;
    } catch (error) {
      console.error('Error borrowing book:', error);
      throw error;
    }
  }

  async returnBook(borrowId: number): Promise<Borrow> {
    try {
      const response = await userAPI.returnBook(borrowId);
      return response.data;
    } catch (error) {
      console.error('Error returning book:', error);
      throw error;
    }
  }

  private transformBorrows(data: any[]): Borrow[] {
    if (!Array.isArray(data)) return [];
    
    return data.map(item => {
      // Status එක calculate කරන්න (Backend එකෙන් status එක නැත්තම්)
      let status: 'ACTIVE' | 'RETURNED' | 'OVERDUE' = item.status || 'ACTIVE';
      
      if (!item.status) {
        if (item.returnDate) {
          status = 'RETURNED';
        } else {
          const borrowDate = new Date(item.borrowDate);
          const today = new Date();
          const daysSinceBorrow = Math.floor((today.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceBorrow > 14) {
            status = 'OVERDUE';
          }
        }
      }

      return {
        id: item.id,
        bookId: item.bookId,
        bookTitle: item.bookTitle,
        userId: item.userId,
        username: item.username,
        borrowDate: item.borrowDate,
        returnDate: item.returnDate,
        status: status
      };
    });
  }

  cancelRequests() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

export const borrowService = new BorrowService();