import express from 'express';
import fetch from 'node-fetch';
import mysql from 'mysql2';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const PORT = 3000;
const OMDB_API_KEY = 'aee16e39'; // OMDB API key

// Use body-parser middleware to parse JSON request bodies
app.use(bodyParser.json());

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files
app.use(express.static('public'));

// MySQL connection setup
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', //  MySQL username
  password: '', //  MySQL password
  database: 'movies_db' // MySQL database name
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL');
  }
});

// Route to search for movies/series
app.get('/search', async (req, res) => {
  const query = req.query.query;

  try {
    const response = await fetch(`http://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${OMDB_API_KEY}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching data from OMDB API:', error);
    res.status(500).json({ error: 'Error fetching data' });
  }
});

// Route to save a favorite movie to MySQL database
app.post('/favorite', (req, res) => {
  const { id, title, year, poster, type } = req.body;

  const query = 'INSERT INTO favourites (id, title, year, poster, type) VALUES (?, ?, ?, ?, ?)';
  connection.query(query, [id, title, year, poster, type], (err, results) => {
    if (err) {
      console.error('Error inserting favorite:', err);
      res.status(500).json({ error: 'Error saving favorite' });
    } else {
      res.json({ message: 'Favorite saved successfully' });
    }
  });
});


// Route to get all favorite movies from MySQL database
app.get('/favorites', (req, res) => {
  const query = 'SELECT * FROM favourites';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching favorites:', err);
      res.status(500).json({ error: 'Error fetching favorites' });
    } else {
      res.json(results);
    }
  });
});


// Route to serve the favorites page
app.get('/view-favorites', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'favourites.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
