// B.Tech Second Year | Full Stack Development
// SET A - Library Book Management API
// Student: Sparsh Singh (2500320101179)

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser and static files
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Initial in-memory data
let books = [
  {
    id: 101,
    title: 'Wings of Fire',
    author: 'A.P.J. Abdul Kalam',
    genre: 'Autobiography',
    publishedYear: 1999,
    available: true
  },
  {
    id: 102,
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    genre: 'Fiction',
    publishedYear: 1988,
    available: true
  },
  {
    id: 103,
    title: 'Harry Potter',
    author: 'J.K. Rowling',
    genre: 'Fantasy',
    publishedYear: 1997,
    available: false
  }
];

// Helper to get next unique numeric id
function getNextId() {
  if (books.length === 0) return 101;
  const maxId = Math.max(...books.map(b => b.id));
  return maxId + 1;
}

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Library Book Management API (SET A)',
    student: 'Sparsh Singh',
    rollNumber: '2500320101179',
    endpoints: {
      getAllBooks: 'GET /api/books',
      createBook: 'POST /api/books',
      filterByAuthor: 'GET /api/books/filter?author=value',
      getBookById: 'GET /api/books/:id',
      updateBook: 'PUT /api/books/:id',
      deleteBook: 'DELETE /api/books/:id'
    }
  });
});

// 1. GET all books
app.get('/api/books', (req, res) => {
  res.status(200).json(books);
});

// 6. Filter records by author (case-insensitive)
// Declared before /api/books/:id so 'filter' is not matched as an id
app.get('/api/books/filter', (req, res) => {
  const { author } = req.query;

  if (!author || typeof author !== 'string' || author.trim() === '') {
    return res.status(400).json({
      message: 'Author query parameter is required.'
    });
  }

  const query = author.trim().toLowerCase();
  const filtered = books.filter(b => b.author.toLowerCase().includes(query));

  // Return empty array with 200 if no matches found
  res.status(200).json(filtered);
});

// 3. GET record by ID
app.get('/api/books/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(404).json({ message: 'Book not found' });
  }

  const book = books.find(b => b.id === id);
  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }

  res.status(200).json(book);
});

// 2. POST a new record
app.post('/api/books', (req, res) => {
  const { title, author, genre, publishedYear, available } = req.body;

  // Validate required fields and types
  if (
    !title || typeof title !== 'string' || title.trim() === '' ||
    !author || typeof author !== 'string' || author.trim() === '' ||
    !genre || typeof genre !== 'string' || genre.trim() === '' ||
    publishedYear === undefined || publishedYear === null || isNaN(Number(publishedYear)) ||
    typeof available !== 'boolean'
  ) {
    return res.status(400).json({
      message: 'Invalid input. Required fields: title (string), author (string), genre (string), publishedYear (number), available (boolean).'
    });
  }

  const newBook = {
    id: getNextId(),
    title: title.trim(),
    author: author.trim(),
    genre: genre.trim(),
    publishedYear: Number(publishedYear),
    available: Boolean(available)
  };

  books.push(newBook);
  res.status(201).json(newBook);
});

// 4. PUT / update a record
app.put('/api/books/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(404).json({ message: 'Book not found' });
  }

  const index = books.findIndex(b => b.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Book not found' });
  }

  const { title, author, genre, publishedYear, available } = req.body;

  // Validate that request body has valid updates
  if (
    (!title && !author && !genre && publishedYear === undefined && available === undefined) ||
    (title !== undefined && (typeof title !== 'string' || title.trim() === '')) ||
    (author !== undefined && (typeof author !== 'string' || author.trim() === '')) ||
    (genre !== undefined && (typeof genre !== 'string' || genre.trim() === '')) ||
    (publishedYear !== undefined && isNaN(Number(publishedYear))) ||
    (available !== undefined && typeof available !== 'boolean')
  ) {
    return res.status(400).json({
      message: 'Invalid update payload.'
    });
  }

  const existing = books[index];
  books[index] = {
    id: existing.id,
    title: title !== undefined ? title.trim() : existing.title,
    author: author !== undefined ? author.trim() : existing.author,
    genre: genre !== undefined ? genre.trim() : existing.genre,
    publishedYear: publishedYear !== undefined ? Number(publishedYear) : existing.publishedYear,
    available: available !== undefined ? Boolean(available) : existing.available
  };

  res.status(200).json(books[index]);
});

// 5. DELETE a record
app.delete('/api/books/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(404).json({ message: 'Book not found' });
  }

  const index = books.findIndex(b => b.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Book not found' });
  }

  const deletedBook = books.splice(index, 1)[0];
  res.status(200).json({
    message: 'Book deleted successfully',
    book: deletedBook
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
