const mongoose = require('mongoose');

const asignacionSchema = new mongoose.Schema({
  aulaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Aula', required: true },
  materia: String,
  semana: { type: Number, required: true },
  dia: { type: String, required: true }, // Ej: 'Lunes', 'Martes'
  horaInicio: { type: String, required: true }, // Formato 'HH:MM'
  horaFin: { type: String, required: true } // Formato 'HH:MM'
});

module.exports = mongoose.model('Asignacion', asignacionSchema);