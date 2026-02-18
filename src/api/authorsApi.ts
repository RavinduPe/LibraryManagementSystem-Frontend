import api from './axios'
import type { Author } from '../types/Author'

export const getAllAuthors = () => {
  return api.get<Author[]>('/authors')
}
