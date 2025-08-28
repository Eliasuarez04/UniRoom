const express = require('express');
const router = express.Router();
const Aula = require('../models/Aula');
const Asignacion = require('../models/Asignacion');

router.get('/tipos-de-espacio', async (req, res) => {
  try {
    const tipos = await Aula.distinct('tipoEspacio');
    res.json(tipos.filter(tipo => tipo).sort()); 
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tipos de espacio' });
  }
});

router.post('/disponibilidad', async (req, res) => {
  try {
    const { semana, dia, hora } = req.body;
    const asignacionesEnHorario = await Asignacion.find({
      semana, dia, horaInicio: { $lte: hora }, horaFin: { $gt: hora }
    });
    const todasLasAulas = await Aula.find().sort({ edificio: 1, numero: 1 });
    const aulasOcupadasMap = new Map();
    for (const asignacion of asignacionesEnHorario) {
      const aulaInfo = todasLasAulas.find(a => a._id.equals(asignacion.aulaId));
      if (!aulaInfo) continue;
      const idAula = aulaInfo._id.toString();
      if (aulasOcupadasMap.has(idAula)) {
        aulasOcupadasMap.get(idAula).materias.push(asignacion.materia);
      } else {
        aulasOcupadasMap.set(idAula, {
          ...aulaInfo.toObject(),
          materias: [asignacion.materia]
        });
      }
    }
    const aulasOcupadasAgrupadas = Array.from(aulasOcupadasMap.values());
    const idsAulasOcupadas = aulasOcupadasAgrupadas.map(a => a._id);
    const aulasDisponibles = todasLasAulas.filter(aula => 
      !idsAulasOcupadas.some(idOcupada => idOcupada.equals(aula._id))
    );
    res.json({ aulasDisponibles, aulasOcupadas: aulasOcupadasAgrupadas });
  } catch (error) {
    console.error("Error en la consulta de disponibilidad:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// --- RUTA CORREGIDA ---
router.get('/:id/horario', async (req, res) => {
try {
const { id } = req.params;
const semana = parseInt(req.query.semana, 10);

if (isNaN(semana)) {
  return res.status(400).json({ message: 'El parámetro "semana" debe ser un número válido.' });
}

const aula = await Aula.findById(id);
const asignaciones = await Asignacion.find({ aulaId: id, semana: semana }).sort('horaInicio');

// --- LÓGICA PARA CALCULAR LOS HUECOS LIBRES ---

const horarioCompleto = [];
// Define el rango de horas a mostrar en la parrilla (formato HH:MM)
const HORA_INICIO_DIA = '07:00';
const HORA_FIN_DIA = '22:00';

// Agrupamos las asignaciones por día
const asignacionesPorDia = {};
asignaciones.forEach(asig => {
  if (!asignacionesPorDia[asig.dia]) {
    asignacionesPorDia[asig.dia] = [];
  }
  asignacionesPorDia[asig.dia].push(asig);
});

// Para cada día de la semana...
['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].forEach(dia => {
  let ultimaHoraFin = HORA_INICIO_DIA;
  const eventosDelDia = asignacionesPorDia[dia] || [];

  // Recorremos los eventos ocupados del día
  eventosDelDia.forEach(evento => {
    // Si hay un hueco entre el último evento y el actual, creamos un bloque "libre"
    if (evento.horaInicio > ultimaHoraFin) {
      horarioCompleto.push({
        _id: `libre-${dia}-${ultimaHoraFin}`, // ID único para el v-for
        tipo: 'libre',
        dia: dia,
        horaInicio: ultimaHoraFin,
        horaFin: evento.horaInicio
      });
    }
    // Añadimos el bloque "ocupado"
    horarioCompleto.push({ ...evento.toObject(), tipo: 'ocupado' });
    ultimaHoraFin = evento.horaFin;
  });

  // Después de revisar todos los eventos, vemos si queda un hueco hasta el final del día
  if (ultimaHoraFin < HORA_FIN_DIA) {
    horarioCompleto.push({
      _id: `libre-${dia}-${ultimaHoraFin}-final`,
      tipo: 'libre',
      dia: dia,
      horaInicio: ultimaHoraFin,
      horaFin: HORA_FIN_DIA
    });
  }
});

res.json({ aula, asignaciones: horarioCompleto });

} catch (error) {
console.error("Error obteniendo horario:", error);
res.status(500).json({ message: 'Error al obtener horario del aula' });
}
});

module.exports = router;