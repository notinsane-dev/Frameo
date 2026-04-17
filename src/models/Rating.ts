export interface Rating {
  _id?: string
  userId: string
  movieId: number
  rating: number
  review?: string
}
