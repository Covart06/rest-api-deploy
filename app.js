const express = require('express') //require --> commonJS
const crypto = require('node:crypto') //require --> commonJS
const cors = require('cors') //require --> commonJS
const movies = require('./movies.json')
const { validateMovie, validatePartialMovie} = require('./schenas/movies')

const app = express()
app.use(express.json())
app.use(cors({
    origin: (origin, callback) => {
        const ACCEPTED_ORIGINS = [
            'http://localhost:8080',
            'http://localhost:3000',
            'http://movies.com',
            'http://midu.dev'
        ]
        if (ACCEPTED_ORIGINS.includes(origin)) {
            return callback(null, true)
        }

        if (!origin) {
            return callback(null, true)
        }

        return callback(new Error(`Not allowed by CORS`))
    }
}))
app.disable('x-powered-by') //desabilitar el header X-Powered-By: Express

// metodos normales :GET/HEAD/POST
// metodos complejos: PUT/PATCH/DELETE

// CORS PRE-FLIGHT
// OPTIONS

// Todos los recursos que sean MOVIES se identifica con /movies
app.get('/movies', (req, res) => {    
    const { genre } = req.query
    if (genre) {
        const filteredMovies = movies.filter(
            movie => movie.genre.some(g => g.toLocaleLowerCase() === genre.toLocaleLowerCase())
        )
        return res.json(filteredMovies)
    }
    res.json(movies)
})

app.get('/movies/:id', (req, res) => { // path-to-regexp
    const { id } = req.params
    const movie = movies.find(movies => movies.id === id)
    if (movie) return res.json(movie)
    res.status(404).json({message: 'Movie Not Found'})
})

app.post('/movies', (req, res) => {
    const result = validateMovie(req.body)

    if(result.error) {
        return res.status(400).json({ error: JSON.parse(result.error.message)})
    }

    // en  base de datos
    const newMovie = {
        id: crypto.randomUUID(), // uuid v4
        ...result.data
    }

    // Esto no seria REST, porque estamos guardando
    // el estado de la aplicacion en memoria
    movies.push(newMovie)

    res.status(201).json(newMovie)
})

app.delete('/movies/:id', (req, res) => {
    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if (movieIndex === -1) {
        return res.status(404).json({ message: 'Movie Not Found' })
    }

    movies.splice(movieIndex, 1)
    
    return res.json({ message: 'Movie Deleted' })
})

app.patch('/movies/:id', (req, res) => {
    console.log(req.body);
    const result = validatePartialMovie(req.body)
    
    if (!result.success) {
        return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if (movieIndex === -1) {
        return res.status(404).json({ message: 'Movie Not Found' })
    }

    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
    }

    movies[movieIndex] = updateMovie

    console.log(result)
    return res.json(updateMovie)
})

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
    console.log(`listening on port http://localhost:${PORT}`)
})