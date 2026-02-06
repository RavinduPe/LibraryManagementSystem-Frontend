export interface Book {
  id?: number;
  title: string;
  genre: string;
  price: number;
  available: boolean;
  authorId: number;
  authorName?: string;
}
