import api from '@/api/axios'

export const getBooks = () => api.get('/api/books')
export const addBook = (book: any) => api.post('/api/books', book)
export const deleteBook = (id: number) => api.delete(`/api/books/${id}`)