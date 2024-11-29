import obra1 from "../assets/Obras/Especies Urbanas/especies-urbanas02.jpeg";
import obra2 from "../assets/Obras/Especies Urbanas/especiesurbanas03.jpg";
import obra3 from "../assets/Obras/Especies Urbanas/especiesurbanas04.jpg";
import obra4 from "../assets/Obras/Especies Urbanas/especiesurbanas06.jpg";
import obra5 from "../assets/Obras/Especies Urbanas/especiesurbanas07.jpg";
import obra6 from "../assets/Obras/Especies Urbanas/especiesurbanas09.jpg";

interface Obra {
  imagen?: string; // Hacemos opcional la imagen para colecciones sin imágenes
  titulo: string;
  fecha: string;
}

interface Collection {
  name: string;
  slug: string; // Ruta dinámica
  description: string;
  descriptionLong?: string | string[];
  obras: Obra[];
  date: string; // Fecha de la colección
}

export const collections: Collection[] = [
  {
    name: "Especies Urbanas",
    slug: "especies-urbanas",
    date: "1993-1996",
    description:
      "Serie realizada durante durante el cuarto curso de Bellas Artes. Influenciado por el art povera y el arte informalista español, el artista trabaja con materiales rústicos del ámbito agrícola llevados al terreno de lo urbano.",
    descriptionLong: [
      `Serie realizada durante durante el cuarto curso de Bellas Artes. En las que, influenciado por el art povera, el artista trabaja con materiales rústicos del ámbito agrícola llevados al terreno de lo urbano; de ahí el título de “especies urbanas”. En aquellos años recibe influencia del arte informalista español de los años cincuenta: los miembros de los colectivos de Dau al set, y El paso. Artistas como Manolo Miralles, Rafael Canogar, Joan Pons, Grau-Garriga, Guinovart o Antoni Tapies y Miguel Barceló quienes aquellos días recibían premios y reconocimientos por todo el mundo. Algo que influyó de manera decisiva en toda una generación que por aquel entonces eran estudiantes de bellas artes.`,
      `En la segunda fase de esta serie las piezas se inundarán de color, un color que por otra parte no dejará de tener naturaleza rústica ya que se trata de pigmentos mezclados con albayalde y aglutinantes naturales, como la cola de conejo. Esta segunda fase corresponde al periodo en que tras licenciarse, Boronat se ve obligado a cumplir un año de servicio militar en la misma ciudad donde reside, Madrid; lo cual, le aportará mucho tiempo libre para desarrollar nuevas obras. Estas piezas últimas comienzan a marcar una necesidad de pasar a la escultura.`,
    ],

    obras: [
      { imagen: obra1, titulo: "Obra 1", fecha: "1993" },
      { imagen: obra2, titulo: "Obra 2", fecha: "1994" },
      { imagen: obra3, titulo: "Obra 3", fecha: "1995" },
      { imagen: obra4, titulo: "Obra 4", fecha: "1995" },
      { imagen: obra5, titulo: "Obra 5", fecha: "1996" },
      { imagen: obra6, titulo: "Obra 6", fecha: "1996" },
    ],
  },
  {
    name: "Kassel",
    slug: "kassel",
    date: "Erasmus - curso 95/96",
    description:
      "Cursa el último año académico de Bellas Artes en la Gesamthochschule Kassel. Estos meses están marcados por la reflexión interior y experiencias que plasman un replanteamiento personal.",
    descriptionLong: [
      "Cursa el último año académico de Bellas Artes en la Gesamthochschule Kassel. Son unos meses con escasa obra realizada, pero sí cargados de experiencias, de reflexión interior que queda plasmado en los numerosos cuadernos de apuntes. Se trata de unos meses de replanteamiento de la obra personal.",
      "Nani Boronat se incorpora al grupo de alumnos dirigidos por Rob Scholte, quien, a los pocos días de iniciar las clases, es víctima de un atentado terrorista en Ámsterdam. Durante cinco meses será Giri Dokoupil quien dirija a los alumnos de Scholte. La acción de ambos tutores marcarán una impronta decisiva en la obra posterior de Nani, quien, tras finalizar el curso académico, regresa a Madrid para recibir su licenciatura y seguidamente incorporarse al servicio militar.",
    ],

    obras: [{ titulo: "Cuaderno de Apuntes", fecha: "1995" }],
  },
  {
    name: "Erosiones",
    slug: "erosiones",
    date: "VALENCIA 1997-98",
    description:
      "Obras escultóricas realizadas en Valencia entre 1997 y 1998, utilizando vigas centenarias rescatadas de edificios históricos en remodelación.",
    descriptionLong: [
      "Al terminar el servicio militar, Nani se traslada a Valencia para dedicarse de lleno a la escultura y además vivir en compañía de su abuela materna a la que adora. Establece el taller en un viejo garaje propiedad de la familia, en la calle Juristas n° 19. Se localiza en pleno casco antiguo de la ciudad, la cual, en aquellos años, se somete a un importante plan de remodelación; esto hace que sus calles se llenen de contenedores con abundante material para darle un uso escultórico.",
      "Lo que el artista propone con aquellos restos de las vigas centenarias de los edificios históricos es un diálogo entre la geometría más ortodoxa y las vías orgánicas que presenta el propio veteado de la madera. Componiendo –primero en papel– las piezas según criterios geométricos; ensamblando las tablas a testa y buscando composiciones de estructuras ortogonales; para luego, con el aporte de las gubias ir consumiendo ese material a modo de erosiones.",
      "Este retorno a Valencia supone un reencuentro con antiguos compañeros de la escuela de arquitectura; lo cual le lleva a retomar el lenguaje geométrico de las formas y los materiales arquitectónicos. Es, en este momento, cuando el artista es consciente de que la geometría va a ser un sello constante en su estilo personal.",
    ],
    obras: [
      { titulo: "Veta 1", fecha: "1997" },
      { titulo: "Veta 2", fecha: "1998" },
    ],
  },
  {
    name: "Sueños de Leonardo",
    slug: "suenos-de-leonardo",
    date: "1999",
    description:
      "Serie de dibujos realizados en un periodo de reflexión personal durante el cuidado de su padre enfermo. Una etapa marcada por el minimalismo de lápices y acuarelas.",
    descriptionLong: [
      "Mi padre contrae cáncer. Cierro el taller de Valencia y regreso a Madrid para dedicarme a su cuidado y compañía en su último año de vida. Aparte de hijo, me convierto en enfermero, en chófer, en amigo. En mi antigua habitación monto un caballete y un tablero de madera donde me dedicaré a dibujar. Es un periodo intenso, también de intensas reflexiones personales. Encuentro en la sencillez del papel, de los lápices y las acuarelas el verdadero valor de la vida y de la obra de arte. Empiezo a experimentar que las obras más importantes salen de los momentos más frágiles; y que son realizadas con los materiales más elementales, atendiendo a los modelos más cotidianos.",
      "Me dedico a retratar objetos del entorno casero bajo la imperiosa necesidad de cobijarme en la figuración, sintiendo que es la propia forma natural la que me pone a prueba. Descubro que el realismo y la figuración, a pesar de las apariencias, están en mi naturaleza creativa, algo que a partir de entonces practicaré en la intimidad. El dibujo figurativo será como esa dosis vitamínica que necesitamos casi a diario.",
      "Descubro y me apropio del mayor legado que un padre puede hacer a sus hijos: una biblioteca; iniciando así una pasión por el estudio y la lectura que nunca abandonaré.",
      "Durante estos meses realicé una serie de dibujos inspirados en la relación entre un padre y un hijo que muy mal se habían entendido anteriormente. Descubrí en él a un humanista del siglo veinte, y empecé a admirarle y quererle mucho tras su muerte. Tal vez fue mi devoción de hijo lo que me llevó a relacionarle con la figura de Leonardo da Vinci; pero también con el Alonso Quijano de la segunda parte del Quijote.",
      "En aquellos momentos deduzco algo muy importante en mi vida: descubro que siempre seré alguien de fuera, siempre de allí y no de aquí: un extranjero perenne. Un escultor en la mente de un pintor y un pintor en el cuerpo de un escultor.",
    ],
    obras: [{ titulo: "Sueño 1", fecha: "1999" }],
  },
  {
    name: "Pintura Mural en la Basílica de San Francisco el Grande",
    slug: "pintura-mural-basilica",
    date: "Madrid 2000",
    description:
      "Reproducción de 110 metros cuadrados del panel central de la cúpula de la basílica San Francisco el Grande, Madrid.",
    descriptionLong: [
      "En el invierno del 2000, Nani Boronat es propuesto como pintor muralista para reproducir la pintura en los 110 metros cuadrados de pérdida localizados en el panel central de la cúpula de la basílica. La pintura original fue realizada por el discípulo de Goya, Casto Plasencia, en 1870. Tras los deterioros de la guerra civil (1926-39), la basílica había sido sometida a distintas fases de restauración; hasta que en 1999 se planteó la última y definitiva de estas fases.",
      "El Instituto de Patrimonio Cultural Español (IPCE) contaba con documentación fotográfica en blanco y negro de la pintura existente antes de la pérdida. Gracias a esa información se pudo reproducir el dibujo. El color fue tratado según la información que proporcionaba el resto de la cúpula, es decir, imitando el cromatismo a la hora de reproducir las carnaciones de los personajes y el azul del cielo.",
      "En cuanto al color de los ropajes, también se encontró información a color en los archivos fotográficos de la propia basílica que testificaron el color que debía llevar cada uno de los ropajes. Se trabajó con los mismos pigmentos con los que había trabajado Casto Plasencia. Como aglutinante se optó, por decisión de la dirección del proyecto, por el Primal-AC33, ya que es un componente sólido, duradero y reversible en caso de necesidad. El conjunto de la cúpula fue barnizado con Paraloid-B72.",
      "Por normativa de la UNESCO se impuso la condición de que todo añadido no original ofreciese un desenfoque de dos puntos; de tal modo que a cierta distancia se integrase visualmente, pero que en cercanía quedara diferenciado claramente la pintura original de la añadida. Para ello se empleó la técnica del difuminado, interponiendo tintas intermedias mediante el uso de esponja.",
      "La obra fue ejecutada por la empresa Geocisa S.A.; supervisada por el Dr. Antonio Sánchez-Barriga; y dirigida por Doña Ángel Gómez.",
    ],
    obras: [{ titulo: "Panel Central", fecha: "2000" }],
  },
  {
    name: "Deambulaciones",
    slug: "deambulaciones",
    date: "2000",
    description:
      "Serie de pinturas abstractas de gran formato realizadas en el 2000, explorando la abstracción geométrica y el color.",
    descriptionLong: [
      "En paralelo a la restauración de la cúpula de San Francisco y tras la muerte de su padre, Nani Boronat se centra en cuadros de gran formato. Se trata de una pintura colorista en donde el artista pondrá en marcha todo un mecanismo de abstracción geométrica combinada con lo que en la década de los cincuenta se acuñó como pintura fluctuante.",
      "Inicia su amistad con el pintor Luis Gordillo, quien desde este instante generará una especial impronta en su obra. Dos cuadros iniciales, realizados simultáneamente, 'Desde Punta Umbría también se ve Finisterre' y 'Deambulando por el National Gallery', constituyen un cambio radical con el estilo anterior. Abandonando así la escultura y el dibujo figurativo, Boronat se centra en una nueva etapa de pintura muy colorista y de gran formato.",
      "El artista toma conciencia de la importancia de los títulos gracias a la herencia de la biblioteca de su padre. Surge aquí una pasión por la lectura de ensayos y literatura clásica, que se convertirá en un elemento vital para su producción artística. De los juegos de palabras y de significados surgen títulos como 'Di-gestion de Bi-agras', 'pARTituras' o 'Micro-cirugías-plásticas', entre otros.",
    ],
    obras: [
      { titulo: "Desde Punta Umbría también se ve Finisterre", fecha: "2000" },
      { titulo: "Deambulando por el National Gallery", fecha: "2000" },
    ],
  },
  {
    name: "Micro-Cirugía-Plástica",
    slug: "micro-cirugia-plastica",
    date: "2001-2003",
    description:
      "Pinturas abstractas geométricas que exploran un diálogo entre la aletoriedad y el orden.",
    descriptionLong: [
      "Pintura y sólo pintura es el núcleo de esta serie de Nani Boronat. La primera impresión que sus cuadros producen es la de encontrar un diálogo entre el diseño geométrico y la libertad del caos.",
      "Es una pintura discreta, nada efectista a pesar de la vitalidad del color y de su alegría compositiva. Sus valores plásticos requieren de una apreciación meditativa, exigiendo una disposición parecida a la que dedicaría un monje budista a la contemplación de un mandala.",
      "La abstracción geométrica de esta serie se vincula al arte ornamental primitivo y a las tradiciones cosmológicas de los mandalas. Boronat combina estos elementos con un sentido de caos y libertad, logrando un orden no previsto, similar al ritmo musical o al silencio que merece la pena ser explorado profundamente.",
    ],
    obras: [
      { titulo: "Mandala 1", fecha: "2001" },
      { titulo: "Mandala 2", fecha: "2003" },
    ],
  },
  {
    name: "pARTituras",
    slug: "partituras",
    date: "2003",
    description:
      "Obra que conecta la simbología musical con la pintura, explorando la partición y la fragmentación visual.",
    descriptionLong: [
      "Se trata de una obra única fechada en 2003 que funciona como puente entre dos series: 'Micro-Cirugías-Plásticas' y 'Sinfonía Escalextric'.",
      "En esta obra, Boronat explora la influencia de la cosmología musical, como las fugas ópticas, los contrapuntos, ritmos y silencios, reflejados tanto en la metodología como en los títulos. La simbología musical se combina con la fragmentación visual, estableciendo un diálogo entre un fondo caótico inspirado en la percepción acústica urbana y un orden colorista regido por las reglas del lenguaje musical.",
      "El gesto pictórico se asemeja al 'pizzicato', un término musical que significa tocar con los dedos en lugar de usar el arco en instrumentos de cuerda, estableciendo así una conexión única entre la música y la pintura.",
    ],
    obras: [{ titulo: "pARTitura Única", fecha: "2003" }],
  },
  {
    name: "Sinfonía Escalextric",
    slug: "sinfonia-escalextric",
    date: "2003-2006",
    description:
      "Serie inspirada en los trazados de circuitos automovilísticos, explorando las tensiones tangentes y centrífugas en la pintura.",
    descriptionLong: [
      "Esta serie se inspira en el icónico juguete Escalextric, un elemento compartido por varias generaciones. Continuando con las reflexiones en torno a la música y el cuadro como sinfonía, Boronat incorpora trazados gestuales inspirados en los circuitos automovilísticos.",
      "El artista transforma estos trazados en desafíos a las reglas de la conducción, creando tensiones tangentes y centrípetas que terminan en accidentes estéticos sobre el lienzo. Estas composiciones evocan el recuerdo del montaje y desmontaje del juguete, rechazando instrucciones rígidas y abrazando una creatividad libre y rebelde.",
      "La serie es un homenaje tanto a la infancia como al proceso artístico, en el cual las líneas paralelas se cruzan en un punto infinito, desafiando las leyes preestablecidas.",
    ],
    obras: [
      { titulo: "Carril 1", fecha: "2003" },
      { titulo: "Carril 2", fecha: "2006" },
    ],
  },
  {
    name: "La trampa de Pollock",
    slug: "la-trampa-de-pollock",
    date: "2003-2004",
    description:
      "Obras inspiradas en la técnica del dripping de Pollock y la superposición de capas que reflejan un caos calculado.",
    descriptionLong: [
      "Inspirada en la técnica del dripping de Jackson Pollock, esta serie reflexiona sobre la mentira inherente a la pintura ejecutada horizontalmente que luego se expone verticalmente.",
      "Boronat aborda esta idea mediante la superposición de mallas metálicas y chapas perforadas que generan una tensión entre lo visible y lo oculto. Estas texturas remiten al caos calculado y al impacto de las capas de pintura, evocando las ondas expansivas de los conflictos bélicos contemporáneos a Pollock.",
      "La serie se realizó en un estudio en pleno centro de Madrid, donde Boronat volcó su experiencia en restauración de retablos y pintura mural. Esta etapa representó un puente entre la técnica del dripping y las capas que dialogan entre la verticalidad y la horizontalidad de la pintura.",
    ],
    obras: [{ titulo: "Trampa 1", fecha: "2004" }],
  },
  {
    name: "Suite CAL",
    slug: "suite-cal",
    date: "2005",
    description:
      "Inspirada en las cartas náuticas de navegación, la serie juega con formas y relieves evocando paisajes marítimos.",
    descriptionLong: [
      "Inspirada en las cartas náuticas de navegación, esta serie juega con la relación entre fondo y forma, relieves y fronteras, evocando paisajes marítimos.",
      "La obra se plantea desde un punto de vista pictórico, explorando líneas litorales y la simbología del lenguaje náutico. Estas piezas fueron realizadas durante el verano de 2005, cuando Boronat residió temporalmente en Sacramento, California.",
      "La temática refleja un periodo reciente en el que el artista trabajó en el ámbito marítimo, tras obtener la titulación de patrón de embarcaciones y trabajar en la costa alicantina capitaneando barcos de recreo.",
    ],
    obras: [{ titulo: "Carta Náutica", fecha: "2005" }],
  },
  {
    name: "Múnich",
    slug: "munich",
    date: "2007/ 2017",
    description:
      "Obras de gran formato creadas tras la mudanza del artista a Múnich en 2007, con inspiración musical y reflexiones sobre etapas previas.",
    descriptionLong: [
      "En el verano de 2007, Nani Boronat se traslada a Múnich, donde reside hasta la actualidad. Este cambio marca una etapa de revisión y reencuentro con su obra anterior.",
      "La mudanza le obliga a seleccionar piezas de su producción pasada, lo que lo enfrenta a sus propias etapas creativas. Esto da lugar a una serie de obras pictóricas en las que aglutina y reinterpreta elementos de toda su trayectoria.",
      "Se trata de un periodo productivo en el que las obras de gran formato y la inspiración musical toman un papel central, consolidando el estilo maduro del artista.",
    ],
    obras: [
      { titulo: "Reencuentro 1", fecha: "2007" },
      { titulo: "Reencuentro 2", fecha: "2017" },
    ],
  },
  {
    name: "En la palma de la mano",
    slug: "en-la-palma-de-la-mano",
    date: "2011",
    description:
      "Esculturas y colecciones de materiales simples inspiradas en los primeros años de vida del hijo del artista.",
    descriptionLong: [
      "El nacimiento de su hijo Marco en 2009 marca un cambio radical en la vida y obra de Boronat. Durante los primeros años de crianza, el artista se dedica a explorar el mundo desde el nivel visual de un niño que gatea, descubriendo formas y colores en los objetos más cotidianos.",
      "Este proyecto titulado 'En la palma de la mano' captura la esencia de las maravillas naturales y las sutilezas de objetos simples. Esculturas y composiciones creadas con piedras, trozos de madera y otros materiales recolectados durante sus viajes forman parte de esta colección.",
      "El jardín y el parque se convierten en un museo personal donde Marco y Nani comparten el acto creativo, reflejando un enfoque íntimo y lúdico hacia el arte y la naturaleza.",
    ],
    obras: [
      { titulo: "Piedra", fecha: "2011" },
      { titulo: "Caracol", fecha: "2012" },
    ],
  },
  {
    name: "Haikus",
    slug: "haikus",
    date: "2017",
    description:
      "Serie de dibujos y obras meditativas inspiradas en la poesía oriental, combinando formas orgánicas y geometrías plásticas.",
    descriptionLong: [
      "Inspirada en la poesía oriental, esta serie de dibujos se centra en la mancha y el trazo como elementos fundamentales. Boronat retoma su afinidad con la obra de Antoni Tàpies, explorando formas meditativas y simbólicas.",
      "Realizada durante un periodo de cambios personales significativos, esta serie utiliza el papel como soporte y la tinta como medio principal, estableciendo un equilibrio entre la forma orgánica y la geometría plástica.",
      "Estos dibujos reflejan el caos y orden en la vida del artista durante esta etapa, sirviendo como liberación de cargas del pasado y germen de futuros proyectos.",
    ],
    obras: [{ titulo: "Meditación 1", fecha: "2017" }],
  },
  {
    name: "Centinelas",
    slug: "centinelas",
    date: "",
    description:
      "Serie aún no detallada, basada en formas geométricas que representan guardianes abstractos.",
    obras: [{ titulo: "Centinela 1", fecha: "2020" }],
  },
  {
    name: "De la Alhambra al Shirvanshah",
    slug: "alhambra-shirvanshah",
    date: "",
    description:
      "Proyecto artístico-antropológico que une las culturas ibérica y azerí a través de música, pintura y escultura.",
    obras: [{ titulo: "Alhambra", fecha: "2023" }],
  },
];
