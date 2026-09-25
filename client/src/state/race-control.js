const categoryTranslations = {
  es: { Other: 'Otro', Flag: 'Bandera', Penalty: 'Penalización', Investigation: 'Investigación' },
  en: { Other: 'Other', Flag: 'Flag', Penalty: 'Penalty', Investigation: 'Investigation' },
  it: { Other: 'Altro', Flag: 'Bandiera', Penalty: 'Penalità', Investigation: 'Indagine' },
};

export function translateRaceControlEvent(event = {}, language = 'es') {
  return {
    ...event,
    category: categoryTranslations[language]?.[event.category] || event.category || categoryTranslations[language]?.Other || 'Other',
    message: translateRaceControlMessage(event.message, language),
  };
}

function translateRaceControlMessage(message = '', language) {
  if (language !== 'es' || !message) return message;
  let match = message.match(/^INCIDENT INVOLVING CAR (\d+) \(([^)]+)\) NOTED - YELLOW FLAG INFRINGEMENT/i);
  if (match) return `Incidente con el coche ${match[1]} (${match[2]}) registrado — infracción de bandera amarilla`;
  match = message.match(/^FIA STEWARDS: INCIDENT INVOLVING CAR (\d+) \(([^)]+)\) REVIEWED NO FURTHER INVESTIGATION - YELLOW FLAG INFRINGEMENT(?: \(([^)]+)\))?/i);
  if (match) return `Comisarios FIA: incidente con el coche ${match[1]} (${match[2]}) revisado — no habrá más investigación por infracción de bandera amarilla${match[3] ? ` (${match[3]})` : ''}`;
  match = message.match(/^TURN (\d+) INCIDENT INVOLVING CAR (\d+) \(([^)]+)\) NOTED - LEAVING THE TRACK AND GAINING AN ADVANTAGE/i);
  if (match) return `Curva ${match[1]}: incidente con el coche ${match[2]} (${match[3]}) registrado — salió de pista y obtuvo ventaja`;
  match = message.match(/^CAR (\d+) \(([^)]+)\) TIME ([0-9:.]+) DELETED - TRACK LIMITS AT TURN (\d+) LAP (\d+)/i);
  if (match) return `Tiempo del coche ${match[1]} (${match[2]}) eliminado — límites de pista en curva ${match[4]}, vuelta ${match[5]} (${match[3]})`;
  match = message.match(/^CAR (\d+) \(([^)]+)\) TIME ([0-9:.]+) DELETED - DOUBLE YELLOW AT TURN (\d+) LAP (\d+)/i);
  if (match) return `Tiempo del coche ${match[1]} (${match[2]}) eliminado — doble bandera amarilla en curva ${match[4]}, vuelta ${match[5]} (${match[3]})`;
  match = message.match(/^CLEAR IN TRACK SECTOR (\d+)/i);
  if (match) return `Pista despejada en el sector ${match[1]}`;
  return message;
}
