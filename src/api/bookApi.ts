import api from './axios';
import type { Book } from '../types/Book';

export const getAllBooks = () => {
    return api.get<Book[]>('/books');
}

export const addBook = (book: Book) => {
  return api.post<Book>("/books", book);
};

