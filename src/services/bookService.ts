import api from '@/api/axios'

export const getBooks = () => api.get('/books')
export const addBook = (book: any) => api.post('/books', book)
export const deleteBook = (id: number) => api.delete(`/books/${id}`)