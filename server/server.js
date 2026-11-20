require('dotenv').config();

const express = require('express');
const cors = require('cors');
const issueRoutes = require('./routes/issueRoutes');
const authRoutes = require('./routes/authRoutes');
const commentRoutes = require('./routes/commentRoutes');
const projectRoutes = require('./routes/projectRoutes');
const teamRoutes = require('./routes/teamRoutes');

const connectDB = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/issues', issueRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/team', teamRoutes);
app.get('/', (req, res) => {
  res.send('Bug Tracker API is running successfully!');
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});