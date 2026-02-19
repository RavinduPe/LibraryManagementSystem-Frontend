import api from './axios'
import type { Author } from '../types/Author'

export const getAllAuthors = () => {
  return api.get<Author[]>('/authors')
}

export const addAuthor = (author: { name: string }) => {
  return api.post('/authors', author)
}

export const deleteAuthor = (id: number) => {
  return api.delete(`/authors/${id}`)
}
