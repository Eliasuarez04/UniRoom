require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log('Conectado a MongoDB exitosamente.'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

const aulasRouter = require('./routes/aulas');
app.use('/api/aulas', aulasRouter);

module.exports = app;