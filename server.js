const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const https = require('https');
const fs = require('fs');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Phục vụ file tĩnh từ thư mục gốc

// Kết nối cơ sở dữ liệu
const db = new sqlite3.Database('./tasks.db', (err) => {
if (err) console.error(err.message);
console.log('Connected to SQLite database');
});

// Tạo bảng tasks
db.run('CREATE TABLE IF NOT EXISTS tasks (   id INTEGER PRIMARY KEY,   text TEXT NOT NULL,   completed INTEGER DEFAULT 0 )');

// API: Lấy tất cả task
app.get('/api/tasks', (req, res) => {
db.all('SELECT * FROM tasks', [], (err, rows) => {
if (err) return res.status(500).json({ error: err.message });
res.json(rows);
});
});

// API: Thêm task mới
app.post('/api/tasks', (req, res) => {
const text = req.body.text;
db.run('INSERT INTO tasks (text) VALUES (?)', [text], function(err) {
if (err) return res.status(500).json({ error: err.message });
res.json({ id: this.lastID, text, completed: 0 });
});
});

// API: Xóa task
app.delete('/api/tasks/:id', (req, res) => {
db.run('DELETE FROM tasks WHERE id = ?', req.params.id, function(err) {
if (err) return res.status(500).json({ error: err.message });
res.json({ message: 'Task deleted' });
});
});

// API: Đánh dấu task hoàn thành
app.put('/api/tasks/:id', (req, res) => {
db.run('UPDATE tasks SET completed = 1 - completed WHERE id = ?', req.params.id, function(err) {
if (err) return res.status(500).json({ error: err.message });
if (this.changes === 0) return res.status(404).json({ message: 'Task not found' });
db.get('SELECT * FROM tasks WHERE id = ?', req.params.id, (err, row) => {
res.json(row);
});
});
});

// Route mặc định để trả về index.html
app.get('/', (req, res) => {
res.sendFile(path.join(__dirname, 'index.html'));
});

// Tạo server HTTPS
const options = {
key: fs.readFileSync('server.key'),
cert: fs.readFileSync('server.cert')
};

https.createServer(options, app).listen(8443, () => {
console.log('HTTPS Server running on https://localhost:8443');
});