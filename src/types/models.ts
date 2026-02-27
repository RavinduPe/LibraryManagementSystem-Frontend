export interface User {
  id: number
  username: string
  role: 'ADMIN' | 'USER'
}

export interface Book {
  id: number
  title: string
  totalCopies: number
  availableCopies: number
}

export interface Author {
  id: number
  name: string
}

export interface Borrowing {
  id: number
  userId: number
  bookId: number
  borrowDate: string
  dueDate: string
  returned: boolean
}