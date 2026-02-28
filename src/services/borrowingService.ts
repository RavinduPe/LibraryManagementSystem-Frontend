import api from '@/api/axios'

export const borrowBook = (userId: number, bookId: number) =>
  api.post(`/api/borrow/${userId}/${bookId}`)

export const returnBook = (borrowingId: number) =>
  api.put(`/api/borrow/return/${borrowingId}`)