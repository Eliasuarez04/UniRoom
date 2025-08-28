const mongoose = require('mongoose');

const aulaSchema = new mongoose.Schema({
  edificio: { type: String, required: true },
  numero: { type: String, required: true },
  identificador: { type: String, required: true, unique: true },
  tipoEspacio: String,
  aforo: Number,
});

module.exports = mongoose.model('Aula', aulaSchema);