import axios from '@/api/axios';
import type { Author } from '@/types/models';

export const authorService = {
  async getAllAuthors(): Promise<Author[]> {
    try {
      const response = await axios.get('/admin/authors');
      return response.data;
    } catch (error) {
      console.error('Error fetching authors:', error);
      throw error;
    }
  },

  async getAuthorById(id: number): Promise<Author> {
    try {
      const response = await axios.get(`/admin/authors/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching author:', error);
      throw error;
    }
  },

  async createAuthor(authorData: Omit<Author, 'id'>): Promise<Author> {
    try {
      const response = await axios.post('/admin/authors', authorData);
      return response.data;
    } catch (error) {
      console.error('Error creating author:', error);
      throw error;
    }
  },

  async updateAuthor(id: number, authorData: Partial<Author>): Promise<Author> {
    try {
      const response = await axios.put(`/admin/authors/${id}`, authorData);
      return response.data;
    } catch (error) {
      console.error('Error updating author:', error);
      throw error;
    }
  },

  async deleteAuthor(id: number): Promise<void> {
    try {
      await axios.delete(`/admin/authors/${id}`);
    } catch (error) {
      console.error('Error deleting author:', error);
      throw error;
    }
  },

  async getAuthorBooks(authorId: number): Promise<any[]> {
    try {
      const response = await axios.get(`/admin/authors/${authorId}/books`);
      return response.data;
    } catch (error) {
      console.error('Error fetching author books:', error);
      throw error;
    }
  }
};