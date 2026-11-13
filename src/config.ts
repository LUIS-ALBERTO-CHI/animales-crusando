/* ==========================================================================
   ✏️  PERSONALIZA AQUÍ
   Todo lo que dice el juego sale de este archivo. Cambia nombres, virtudes y
   el mensaje final; el resto del código no necesita tocarse.
   En los textos puedes usar {nombre} y se reemplaza por el nombre de ella.
   ========================================================================== */

export const CONFIG = {
  /** Cómo la llaman los vecinos. */
  nombre: 'mi julishinee',
  /** Nombre de la isla (pestaña del navegador). */
  isla: 'Isla Corazón',
  /** Letrero de la portada. */
  titulo: 'Animales crusando',
  /** Nombre del premio que se desbloquea en cada parada. */
  premio: 'Concha de luz',
  /** Firma de la carta final. */
  firma: 'Con todo mi amor, Luis',

  /** La jugadora: una perrita. Colores CSS. */
  jugadora: {
    pelaje: '#f8e6c6',
    orejas: '#c98a4b',
    vestido: '#f2777f',
    lunares: '#ffffff',
    sombrero: '#f1d39b',
    cinta: '#e0444f',
    lentes: true,
  },

  /** Lo primero que dice Lola junto a la casa. */
  intro: [
    '¡Hola, {nombre}! ¡Por fin despiertas! Soy Lola, la guía de la isla.',
    'Los vecinos llevan toda la mañana hablando de ti... y no paran de sonreír.',
    'Cada uno te espera en una parada con una virtud tuya. Sigue el caminito de puntos blancos.',
    'En cada parada desbloquearás una concha de luz. Cuando tengas todas, ven a verme al muelle. ¡Tengo algo especial para ti!',
  ],

  /**
   * Una parada por virtud, en el orden del recorrido.
   * `vecino`: 'pepa' (pata), 'coco' (conejita), 'bruno' (oso),
   *           'mimi' (gata pintora), 'nube' (oveja), 'olivia' (búho).
   * `etiqueta` va en el letrero del mapa; `titulo` y `mensaje` en la tarjeta.
   */
  virtudes: [
    {
      vecino: 'pepa',
      etiqueta: 'Carisma',
      titulo: 'Tu carisma',
      mensaje: 'Eres tan única que estando contigo las horas se vuelven minutos. Amo reirnos junyos',
      dialogo: [
        '¡Cuac! ¡{nombre}! Qué alegría que empieces el paseo por aquí.',
        'Ayer me ayudaste a recoger mis flores sin que te lo pidiera. Siempre estás pendiente de todos.',
      ],
    },
    {
      vecino: 'coco',
      etiqueta: 'Perseverancia',
      titulo: 'Tu perseverancia',
      mensaje: 'Nunca te rindes, aunque las cosas se pongan difíciles. Eres muchísimo más valiente de lo que tú misma crees.',
      dialogo: [
        '¡Ay, {nombre}! ¡Ven, ven! Estaba recogiendo manzanas.',
        'Me impresiona tu perseverancia. Siempre sigues adelante, aunque algo sea difícil o te dé miedo.',
      ],
    },
    {
      vecino: 'bruno',
      etiqueta: 'Inteligencia',
      titulo: 'Tu inteligencia',
      mensaje: 'A tu corta edad sorprendes a todos con tu ingenio y tu capacidad de resolver problemas. Eres muy inteligente.',
      dialogo: [
        '¡Eh, {nombre}! Mira la cascada... impresiona, ¿verdad?',
        'Pues tú impresionas más. Lo que haces siempre es increíble.',
      ],
    },
    {
      vecino: 'mimi',
      etiqueta: 'Creatividad',
      titulo: 'Tu creatividad',
      mensaje: 'Ves belleza donde otros no la ven. Todo lo que tocas lo llenas de color, de ideas y de cariño.',
      dialogo: [
        '¡Miau! Llegas justo a tiempo, {nombre}. Estoy pintando un cuadro.',
        'Me inspiré en ti, ¿sabes? Tienes una imaginación que llena de color todo lo que haces.',
      ],
    },
    {
      vecino: 'nube',
      etiqueta: 'Paciencia',
      titulo: 'Tu paciencia',
      mensaje: 'Escuchas con calma y explicas con cariño. Contigo todo se siente tranquilo, como una tarde junto al faro.',
      dialogo: [
        'Beee... hola, {nombre}. Siéntate un ratito a ver el faro conmigo.',
        'Tienes un don: nunca tienes prisa cuando alguien te necesita.',
      ],
    },
  ],

  /** Lo que dice Lola en el muelle cuando ya se encontraron todas las virtudes. */
  finalLola: [
    '¡Lo lograste, {nombre}! Tienes todas las conchas de luz.',
    'Pero hay alguien que conoce tus virtudes mejor que nadie en esta isla...',
    'Me pidió que te entregara esta carta. Dice que la escribió pensando en ti.',
  ],

  /** La carta final (cada elemento es un párrafo). */
  carta: [
    'Mi amor:',
    'Si llegaste hasta aquí es porque recorriste toda la isla escuchando lo que cualquiera que te conoce podría decir de ti.',
    'Eres increíble. Pero sobre todo eres mi lugar favorito del mundo.',
    'Gracias por cada día a tu lado. Te amo muchísimo.',
  ],
};

export type Config = typeof CONFIG;
