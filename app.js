const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const bcrypt = require("bcrypt");

const app = express();
const port = 3229;
app.use(bodyParser.json());

// Setup body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/assets', express.static('assets'));

// Setup EJS
app.set('view engine', 'ejs');

// Konfigurasi penyimpanan file dengan multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // folder tujuan penyimpanan file
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // penamaan file berdasarkan waktu
  }
});

const upload = multer({ storage: storage });



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

// Endpoint untuk login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi!" });
  }

  const query = "SELECT * FROM users WHERE username = ?";
  db.query(query, [username], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan!" });
    }

    const user = results[0];

    // Bandingkan password input dengan password di database
    if (password !== user.password) {
      return res.status(401).json({ message: "Password salah!" });
    }

    // Jika login berhasil, redirect ke halaman admin
    res.redirect('/admin'); // Mengarahkan ke halaman admin
  });
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


app.get('/login', (req, res) => {
  res.render('login'); // Pastikan Anda memiliki file `login.ejs` di folder views
});



// Add a new tournament
app.get('/add', (req, res) => {
  res.render('add');
});


app.post('/add', upload.single('image'), (req, res) => {
  const { name, description, date, location } = req.body;
  const imageUrl = req.file ? '/uploads/' + req.file.filename : null; // Simpan URL gambar

 // Ubah newline menjadi <br> untuk deskripsi
 const formattedDescription = description.replace(/\n/g, '<br>');

  // Validasi: Pastikan tanggal kosong bisa diset menjadi NULL
  const tournamentDate = date ? date : null;

  db.query('INSERT INTO tournaments (name, description, date, location, image_url) VALUES (?, ?, ?, ?, ?)', 
    [name, description, tournamentDate, location, imageUrl], (err) => {
      if (err) throw err;
      res.redirect('/admin');
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

app.post('/edit/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { name, description, date, location } = req.body;
  const imageUrl = req.file ? '/uploads/' + req.file.filename : null; // Simpan URL gambar

  // Ubah newline menjadi <br> untuk deskripsi
  const formattedDescription = description.replace(/\n/g, '<br>');

  // Validasi: Pastikan tanggal kosong bisa diset menjadi NULL
  const tournamentDate = date ? date : null;

  // Jika ada gambar baru, update image_url
  const query = imageUrl 
    ? 'UPDATE tournaments SET name = ?, description = ?, date = ?, location = ?, image_url = ? WHERE id = ?'
    : 'UPDATE tournaments SET name = ?, description = ?, date = ?, location = ? WHERE id = ?';

  const params = imageUrl 
    ? [name, description, tournamentDate, location, imageUrl, id] 
    : [name, description, tournamentDate, location, id];

  db.query(query, params, (err) => {
    if (err) throw err;
    res.redirect('/');
  });
});

// Delete a tournament
app.get('/delete/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM tournaments WHERE id = ?', [id], (err) => {
    if (err) throw err;
    res.redirect('/admin');
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
