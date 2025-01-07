const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Setup body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/assets', express.static('assets'));


// Setup EJS
app.set('view engine', 'ejs');

// Connect to MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Ganti dengan username MySQL Anda
  password: '', // Ganti dengan password MySQL Anda
  database: 'tournament_db' // Ganti dengan nama database Anda
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to MySQL');
  }
});

// Routes


// Display all tournaments
app.get('/', (req, res) => {
  db.query('SELECT * FROM tournaments', (err, results) => {
    if (err) throw err;
    res.render('index', { tournaments: results });
  });
});

app.get('/admin', (req, res) => {
  db.query('SELECT * FROM tournaments', (err, results) => {
    if (err) throw err;
    res.render('admin', { tournaments: results });
  });
});

// Halaman Detail Tournament berdasarkan ID
app.get('/tournament/:id', (req, res) => {
  const tournamentId = req.params.id;  // Ambil ID dari URL
  db.query('SELECT * FROM tournaments WHERE id = ?', [tournamentId], (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Server Error');
      }

      if (results.length === 0) {
          return res.status(404).send('Tournament not found');
      }

      // Render halaman detail tournament dengan data yang diambil
      res.render('tournamentDetail', { tournament: results[0] });
  });
});



// Add a new tournament
app.get('/add', (req, res) => {
  res.render('add');
});


app.post('/add', (req, res) => {
  const { name, description, date, location } = req.body;

  // Validasi: Pastikan tanggal kosong bisa diset menjadi NULL
  const tournamentDate = date ? date : null;

  db.query('INSERT INTO tournaments (name, description, date, location) VALUES (?, ?, ?, ?)', 
    [name, description, tournamentDate, location], (err) => {
      if (err) throw err;
      res.redirect('/');
  });
});

// Edit a tournament
app.get('/edit/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM tournaments WHERE id = ?', [id], (err, results) => {
    if (err) throw err;
    res.render('edit', { tournament: results[0] });
  });
});

app.post('/edit/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, date, location } = req.body;

  // Validasi: Pastikan tanggal kosong bisa diset menjadi NULL
  const tournamentDate = date ? date : null;

  db.query('UPDATE tournaments SET name = ?, description = ?, date = ?, location = ? WHERE id = ?', 
    [name, description, tournamentDate, location, id], (err) => {
      if (err) throw err;
      res.redirect('/');
  });
});

// Delete a tournament
app.get('/delete/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM tournaments WHERE id = ?', [id], (err) => {
    if (err) throw err;
    res.redirect('/');
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
