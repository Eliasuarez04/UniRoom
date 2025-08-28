require('dotenv').config();
const xlsx = require('node-xlsx').default;
const mongoose = require('mongoose');
const Aula = require('../models/Aula');
const Asignacion = require('../models/Asignacion');

const MONGO_URI = process.env.MONGO_URI;
const EXCEL_PATH = `${__dirname}/horarios.xlsx`;

/**
 * Convierte un texto de hora (ej: "1:30 p. m.") a formato 24h ("13:30")
 * @param {string} timeStr El texto de la hora a convertir
 * @returns {string} La hora en formato HH:MM
 */
function convertirA24Horas(timeStr) {
  const cleanTime = timeStr.toLowerCase().replace(/\./g, '');
  const isPM = cleanTime.includes('pm');
  let timePart = cleanTime.replace('am', '').replace('pm', '').trim();
  let [hours, minutes] = timePart.split(':');
  hours = parseInt(hours, 10);
  
  if (isPM && hours !== 12) {
    hours += 12;
  } else if (!isPM && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}


async function importarDatos() {
  try {
    console.log('Conectando a la base de datos...');
    await mongoose.connect(MONGO_URI);
    console.log('Conexión exitosa.');

    console.log('Limpiando colecciones anteriores...');
    await Aula.deleteMany({});
    await Asignacion.deleteMany({});
    console.log('Colecciones limpiadas.');

    const workSheets = xlsx.parse(EXCEL_PATH);

    const diasColumnas = {
      4: 'Lunes', 5: 'Martes', 6: 'Miércoles', 7: 'Jueves', 8: 'Viernes', 9: 'Sábado',
    };

    for (const sheet of workSheets) {
      if (sheet.name.includes('SEMANA')) {
        const semanaNum = parseInt(sheet.name.replace('SEMANA ', ''));
        if (semanaNum > 10) continue;

        console.log(`--- Procesando pestaña: ${sheet.name} ---`);
        let aulaActual = null;

        for (let i = 1; i < sheet.data.length; i++) {
          const fila = sheet.data[i];
          if (!fila || fila.length === 0) continue;

          if (fila[1]) {
            const edificio = fila[0]?.toString();
            if (!edificio) continue;
            const [numero, aforoStr] = fila[1].toString().split('(');
            let aforoNumerico = 0;
            if (aforoStr) {
              const numeroExtraido = parseInt(aforoStr.replace(/\D/g, ''));
              if (!isNaN(numeroExtraido)) aforoNumerico = numeroExtraido;
            }
            const tipoEspacio = fila[2]?.toString() || '';
            const identificador = `${edificio}-${numero.trim()}`;
            let aulaDoc = await Aula.findOne({ identificador });
            if (!aulaDoc) {
              aulaDoc = new Aula({ edificio, numero: numero.trim(), identificador, tipoEspacio, aforo: aforoNumerico });
              await aulaDoc.save();
            }
            aulaActual = aulaDoc;
          }

          if (!aulaActual || !fila[3]) continue;
          
          const [horaInicioRaw, horaFinRaw] = fila[3].toString().split('-').map(h => h.trim());
          if (!horaInicioRaw || !horaFinRaw) continue;

          // ¡Aquí está la magia! Convertimos las horas antes de guardarlas.
          const horaInicio = convertirA24Horas(horaInicioRaw);
          const horaFin = convertirA24Horas(horaFinRaw);

          for (const colIndex in diasColumnas) {
            if (fila[colIndex]) {
              await new Asignacion({
                aulaId: aulaActual._id,
                materia: fila[colIndex],
                semana: semanaNum,
                dia: diasColumnas[colIndex],
                horaInicio, // Guardamos la hora estandarizada
                horaFin,     // Guardamos la hora estandarizada
              }).save();
            }
          }
        }
      }
    }
    console.log('¡Proceso de importación completado exitosamente!');
  } catch (error) {
    console.error('Ocurrió un error durante la importación:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Conexión a la base de datos cerrada.');
  }
}

importarDatos();