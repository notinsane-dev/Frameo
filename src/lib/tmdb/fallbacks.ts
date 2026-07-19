import type { TMDBGenre, TMDBMovie } from "@/lib/tmdb/types"

export const FALLBACK_GENRES: TMDBGenre[] = [
  { id: 28, name: "Action" },
  { id: 18, name: "Drama" },
  { id: 878, name: "Science Fiction" },
  { id: 53, name: "Thriller" },
  { id: 35, name: "Comedy" },
  { id: 27, name: "Horror" },
  { id: 10749, name: "Romance" },
  { id: 16, name: "Animation" },
]

export const FALLBACK_MOVIES: TMDBMovie[] = [
  {
    id: 27205,
    title: "Inception",
    overview:
      "A thief who steals corporate secrets through dream-sharing technology is offered one final job.",
    poster_path: "/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg",
    backdrop_path: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
    release_date: "2010-07-16",
    vote_average: 8.3,
    genre_ids: [28, 878, 53],
  },
  {
    id: 157336,
    title: "Interstellar",
    overview:
      "A team of explorers travels through a wormhole in search of a new home for humanity.",
    poster_path: "/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg",
    backdrop_path: "/2ssWTSVklAEc98frZUQhgtGHx7s.jpg",
    release_date: "2014-11-07",
    vote_average: 8.5,
    genre_ids: [12, 18, 878],
  },
  {
    id: 155,
    title: "The Dark Knight",
    overview:
      "Batman faces the Joker in a battle that pushes Gotham City to its limits.",
    poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdrop_path: "/cfT29Im5VDvjE0RpyKOSdCKZal7.jpg",
    release_date: "2008-07-18",
    vote_average: 9.0,
    genre_ids: [28, 80, 18],
  },
  {
    id: 603,
    title: "The Matrix",
    overview:
      "A hacker discovers the truth about reality and joins a rebellion against its controllers.",
    poster_path: "/aOIuZAjPaRIE6CMzbazvcHuHXDc.jpg",
    backdrop_path: "/tlm8UkiQsitc8rSuIAscQDCnP8d.jpg",
    release_date: "1999-03-31",
    vote_average: 8.2,
    genre_ids: [28, 878],
  },
  {
    id: 680,
    title: "Pulp Fiction",
    overview:
      "The lives of two hitmen, a boxer, and a crime boss collide in a series of connected stories.",
    poster_path: "/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg",
    backdrop_path: "/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg",
    release_date: "1994-09-10",
    vote_average: 8.9,
    genre_ids: [80, 53, 18],
  },
]
