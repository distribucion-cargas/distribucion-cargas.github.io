// ====== ESTADO ======
// Lista de cargas que el usuario va agregando
const cargas = [];

// Atajo para leer un número de un input por su id
// Acepta coma o punto decimal (el teclado de iOS en español usa coma):
//   "1,70" o "1.70" → 1.7
// En los campos de kg (sin decimales) acepta el punto de miles:
//   "28.000" → 28000
function num(id) {
  const campo = document.getElementById(id);
  let v = campo.value.trim().replace(/\s/g, "");
  if (v === "") return NaN;

  if (v.includes(",") && v.includes(".")) {
    v = v.replace(/\./g, "").replace(",", ".");       // "28.000,5" → "28000.5"
  } else if (v.includes(",")) {
    v = v.replace(",", ".");                           // "1,70" → "1.70"
  } else if (campo.inputMode === "numeric" && /^\d{1,3}(\.\d{3})+$/.test(v)) {
    v = v.replace(/\./g, "");                          // "28.000" → "28000"
  }

  // Solo números válidos (evita que "12abc" se lea como 12)
  return /^-?\d*\.?\d+$/.test(v) ? parseFloat(v) : NaN;
}

// ====== LEER DATOS DEL CAMIÓN ======
function leerCamion() {
  return {
    largo: num("camLargo"),
    ancho: num("camAncho"),
    alto: num("camAlto"),
    pesoMax: num("camPesoMax"),
    perno: num("perno"),
    ejeSemi: num("ejeSemi"),
    quintaRueda: num("quintaRueda"),
    ejeTraccion: num("ejeTraccion"),
    maxDelantero: num("maxDelantero"),
    maxTraccion: num("maxTraccion"),
    maxSemi: num("maxSemi"),
    maxSemiLevantado: num("maxSemiLevantado"),
    minTraccion: num("minTraccion"),
    cantEjesSemi: num("cantEjesSemi"),
    sepEjes: num("sepEjes"),
    sepViguetas: num("sepViguetas"),
    sepPallets: num("sepPallets"),
    kgMetro: num("kgMetro"),
    anchoPaq: num("anchoPaq"),
    altoPaq: num("altoPaq"),
    stfFaja: num("stfFaja"),
    rozamiento: num("rozamiento"),
    fajasDisp: num("fajasDisp"),
    trabada: document.getElementById("trabada").value === "si",
    ejeElevable: document.getElementById("ejeElevable").value,
    modoElevable: document.getElementById("modoElevable").value,
    taraDelantero: num("taraDelantero") || 0,
    taraTraccion: num("taraTraccion") || 0,
    taraSemi: num("taraSemi") || 0
  };
}

// ====== CONSISTENCIA DE DATOS DEL CAMIÓN ======
// Rangos razonables: [id del campo, nombre, mínimo, máximo]
const RANGOS_CAMION = [
  ["camLargo", "Largo del semi", 3, 20],
  ["camAncho", "Ancho del semi", 1.5, 3],
  ["camAlto", "Alto de carga", 0.5, 4.5],
  ["camPesoMax", "Peso máximo total", 3000, 60000],
  ["perno", "Perno rey", 0, 3],
  ["ejeSemi", "Centro de ejes del semi", 1, 20],
  ["quintaRueda", "Quinta rueda", 0.5, 8],
  ["ejeTraccion", "Eje de tracción", 1, 8],
  ["maxDelantero", "Máximo eje delantero", 1000, 15000],
  ["maxTraccion", "Máximo eje de tracción", 1000, 25000],
  ["maxSemi", "Máximo ejes del semi", 1000, 40000],
  ["maxSemiLevantado", "Máximo con eje levantado", 1000, 40000],
  ["minTraccion", "Mínimo en tracción", 0, 50],
  ["cantEjesSemi", "Cantidad de ejes del semi", 1, 3],
  ["sepEjes", "Separación entre ejes", 0.8, 2.5],
  ["sepViguetas", "Separación entre paquetes", 0, 0.5],
  ["sepPallets", "Espacio entre pallets", 0, 0.5],
  ["kgMetro", "Peso por metro de vigueta", 5, 60],
  ["anchoPaq", "Ancho del paquete", 0.3, 2.5],
  ["altoPaq", "Alto del paquete", 0.1, 1.5],
  ["stfFaja", "Tensión de cada faja", 100, 2000],
  ["rozamiento", "Rozamiento", 0.1, 0.9],
  ["fajasDisp", "Fajas que lleva el camión", 0, 60],
  ["taraDelantero", "Tara eje delantero", 500, 15000],
  ["taraTraccion", "Tara eje de tracción", 500, 25000],
  ["taraSemi", "Tara ejes del semi", 500, 40000]
];

// Devuelve una lista de errores: [{ id, texto }]
function validarCamion(c) {
  const errores = [];

  // 1) Cada campo: que sea número y esté en un rango lógico
  for (const [id, nombre, min, max] of RANGOS_CAMION) {
    const v = num(id);
    if (isNaN(v)) errores.push({ id, texto: `${nombre}: falta el dato o no es un número.` });
    else if (v < min || v > max) errores.push({ id, texto: `${nombre}: ${v} no es lógico (entre ${min} y ${max}).` });
  }
  if (errores.length) return errores;

  // 2) Que los datos tengan sentido entre sí
  if (c.ejeSemi <= c.perno)
    errores.push({ id: "ejeSemi", texto: "Los ejes del semi tienen que estar detrás del perno rey." });
  if (c.ejeSemi > c.largo)
    errores.push({ id: "ejeSemi", texto: "Los ejes del semi no pueden estar fuera del largo del semi." });
  if (c.quintaRueda > c.ejeTraccion + 0.5)
    errores.push({ id: "quintaRueda", texto: "La quinta rueda no puede estar tan atrás del eje de tracción." });
  if (!Number.isInteger(c.cantEjesSemi))
    errores.push({ id: "cantEjesSemi", texto: "La cantidad de ejes tiene que ser un número entero." });
  if (c.ejeElevable !== "ninguno" && c.cantEjesSemi < 2)
    errores.push({ id: "ejeElevable", texto: "Con un solo eje no puede haber eje elevable." });
  if (c.ejeElevable === "medio" && c.cantEjesSemi !== 3)
    errores.push({ id: "ejeElevable", texto: "El eje del medio solo existe con 3 ejes." });
  if (c.ejeElevable !== "ninguno" && c.maxSemiLevantado >= c.maxSemi)
    errores.push({ id: "maxSemiLevantado", texto: "Con un eje levantado el máximo tiene que ser menor que con todos bajados." });
  if (c.ejeElevable !== "ninguno" && c.taraSemi >= c.maxSemiLevantado)
    errores.push({ id: "taraSemi", texto: "La tara de los ejes del semi supera el máximo con el eje levantado." });
  if (c.ejeSemi + (c.cantEjesSemi - 1) / 2 * c.sepEjes > c.largo)
    errores.push({ id: "sepEjes", texto: "El último eje del semi queda fuera del largo del semi." });
  if (c.taraDelantero >= c.maxDelantero)
    errores.push({ id: "taraDelantero", texto: "La tara del eje delantero ya supera su máximo." });
  if (c.taraTraccion >= c.maxTraccion)
    errores.push({ id: "taraTraccion", texto: "La tara del eje de tracción ya supera su máximo." });
  if (c.taraSemi >= c.maxSemi)
    errores.push({ id: "taraSemi", texto: "La tara de los ejes del semi ya supera su máximo." });
  if (!Number.isInteger(c.fajasDisp))
    errores.push({ id: "fajasDisp", texto: "La cantidad de fajas tiene que ser un número entero." });
  if (c.anchoPaq > c.ancho)
    errores.push({ id: "anchoPaq", texto: "El paquete de viguetas es más ancho que el semi." });
  if (c.altoPaq > c.alto)
    errores.push({ id: "altoPaq", texto: "El paquete de viguetas es más alto que el alto de carga." });
  if (c.taraDelantero + c.taraTraccion + c.taraSemi >= c.pesoMax)
    errores.push({ id: "camPesoMax", texto: "El camión vacío ya pesa más que el peso máximo total." });

  return errores;
}

// Pinta en rojo los campos con error
function marcarCampos(errores) {
  for (const [id] of RANGOS_CAMION) document.getElementById(id).style.borderColor = "";
  document.getElementById("ejeElevable").style.borderColor = "";
  for (const e of errores) {
    const campo = document.getElementById(e.id);
    campo.style.borderColor = "#b42318";
    const seccion = campo.closest("details");
    if (seccion) seccion.open = true;   // abrir la sección para que se vea el error
  }
}

// ====== VIGUETAS: PAQUETES ======
// Tabla de PCR: hasta 5,00 m van 24 viguetas por paquete; desde 5,20 m, 12.
const porPaquete = largo => (largo <= 5 + 1e-9 ? 24 : 12);
const MAX_UNIDADES = { vigueta: 5000, pallet: 500 };

// Largo de la vigueta: acepta "3,40", "3.40" o el código "VPTC340"
function leerLargo() {
  const v = document.getElementById("cargaLargo").value.trim();
  const codigo = v.match(/^vptc\s*(\d{3})$/i);
  return codigo ? Number(codigo[1]) / 100 : num("cargaLargo");
}

// Muestra solo los campos que hacen falta según el tipo de carga
function actualizarCamposCarga() {
  const esVigueta = document.getElementById("cargaTipo").value === "vigueta";
  document.querySelectorAll(".solo-pallet").forEach(el => el.hidden = esVigueta);
  document.getElementById("ayudaLargo").hidden = !esVigueta;
  document.getElementById("ayudaCantidad").hidden = !esVigueta;
  document.getElementById("campoCantidad").classList.toggle("completo", !esVigueta);
  document.getElementById("cargaLargo").inputMode = esVigueta ? "text" : "decimal";
}

// ====== AGREGAR CARGA ======
function agregarCarga() {
  const tipo = document.getElementById("cargaTipo").value;
  const carga = tipo === "vigueta"
    ? { tipo, largo: leerLargo(), cantidad: num("cargaCantidad") }
    : {
        tipo,
        largo: num("cargaLargo"),
        ancho: num("cargaAncho"),
        alto: num("cargaAlto"),
        peso: num("cargaPeso"),
        cantidad: num("cargaCantidad")
      };

  // Validar cada dato de la carga: que exista y esté en un rango lógico
  const rangos = tipo === "vigueta"
    ? [
        ["Largo", carga.largo, 0.5, 20],
        ["Cantidad", carga.cantidad, 1, MAX_UNIDADES.vigueta]
      ]
    : [
        ["Largo", carga.largo, 0.05, 20],
        ["Ancho", carga.ancho, 0.05, 3],
        ["Alto", carga.alto, 0.05, 4.5],
        ["Peso por unidad", carga.peso, 1, 30000],
        ["Cantidad", carga.cantidad, 1, MAX_UNIDADES.pallet]
      ];
  for (const [nombre, v, min, max] of rangos) {
    if (isNaN(v)) return mostrarErrorCarga(`${nombre}: falta el dato o no es un número.`);
    if (v < min || v > max) return mostrarErrorCarga(`${nombre}: ${v} no es lógico (entre ${min} y ${max}).`);
  }
  if (!Number.isInteger(num("cargaCantidad")))
    return mostrarErrorCarga("Cantidad: tiene que ser un número entero.");

  // El camión tiene que tener datos válidos para poder comparar
  const camion = leerCamion();
  const erroresCamion = validarCamion(camion);
  marcarCampos(erroresCamion);
  if (erroresCamion.length)
    return mostrarErrorCarga("Primero corregí los datos del camión (marcados en rojo).");
  if (tipo === "vigueta") completarVigueta(carga, camion);

  // Validar que una unidad entre en el semi ANTES de agregarla
  const error = validarQueEntre(carga, camion);
  if (error) {
    mostrarErrorCarga(error);
    return;
  }

  mostrarErrorCarga(""); // limpiar mensaje anterior
  cargas.push(carga);
  mostrarCargas();
}

// La vigueta toma peso (largo × kg/m) y medidas del paquete según los datos actuales
function completarVigueta(c, camion) {
  c.peso = c.largo * camion.kgMetro;
  c.ancho = camion.anchoPaq;
  c.alto = camion.altoPaq;
}

// Devuelve un texto de error si una unidad no entra, o null si está bien
function validarQueEntre(c, camion) {
  if (c.alto > camion.alto)
    return `No entra: ${c.alto} m de alto y el semi tiene ${camion.alto} m.`;

  if (c.tipo === "vigueta") {
    // Las viguetas van siempre a lo largo del semi
    if (c.largo > camion.largo) return `No entra: la vigueta mide ${coma(c.largo)} m y el semi ${coma(camion.largo)} m.`;
  } else {
    // Los pallets se pueden girar: probar las dos orientaciones
    const derecho = c.largo <= camion.largo && c.ancho <= camion.ancho;
    const girado = c.ancho <= camion.largo && c.largo <= camion.ancho;
    if (!derecho && !girado)
      return `No entra: un pallet de ${c.largo}×${c.ancho} m no cabe en un piso de ${camion.largo}×${camion.ancho} m, ni girándolo.`;
  }

  const tara = camion.taraDelantero + camion.taraTraccion + camion.taraSemi;
  if (c.peso > camion.pesoMax - tara)
    return `Una sola unidad (${c.peso} kg) supera lo que el camión puede llevar (${camion.pesoMax - tara} kg de carga).`;

  return null;
}

// Muestra el error debajo del botón "Agregar carga"
function mostrarErrorCarga(texto) {
  const p = document.getElementById("errorCarga");
  p.textContent = texto;
  p.hidden = !texto;
}

// Número con coma decimal, como se escribe acá
const coma = n => String(n).replace(".", ",");

// ====== MOSTRAR LISTA ======
function mostrarCargas() {
  const lista = document.getElementById("listaCargas");
  lista.innerHTML = "";
  document.getElementById("cantCargas").textContent = cargas.length ? `(${cargas.length})` : "";

  if (cargas.length === 0) {
    lista.innerHTML = `<li class="vacio">Todavía no hay cargas. Completá los datos de arriba y tocá "Agregar carga".</li>`;
    return;
  }

  cargas.forEach((c, i) => {
    const li = document.createElement("li");
    li.className = "carga";
    let texto;
    if (c.tipo === "vigueta") {
      const n = porPaquete(c.largo);
      const paq = Math.ceil(c.cantidad / n);
      const incompleto = c.cantidad % n ? " (uno incompleto)" : "";
      texto = `<b>${c.cantidad} viguetas de ${coma(c.largo.toFixed(2))} m, ${kg(c.peso * c.cantidad)} kg</b>
        <small>VPTC${Math.round(c.largo * 100)} · ${paq} paq. de ${n}${incompleto}</small>`;
    } else {
      texto = `<b>${c.cantidad} pallets, ${kg(c.peso * c.cantidad)} kg</b>
        <small>${coma(c.largo)} × ${coma(c.ancho)} × ${coma(c.alto)} m, ${kg(c.peso)} kg c/u</small>`;
    }
    li.innerHTML = `
      <span class="carga-icono ${c.tipo}"></span>
      <span class="carga-texto">${texto}</span>`;

    // Botones para sumar o restar de a una unidad
    const control = document.createElement("div");
    control.className = "cantidad";
    const menos = document.createElement("button");
    menos.type = "button";
    menos.textContent = "−";
    menos.setAttribute("aria-label", c.tipo === "vigueta" ? "Restar un paquete" : "Restar uno");
    menos.onclick = () => cambiarCantidad(i, -1);
    const mas = document.createElement("button");
    mas.type = "button";
    mas.textContent = "+";
    mas.setAttribute("aria-label", c.tipo === "vigueta" ? "Sumar un paquete" : "Sumar uno");
    mas.onclick = () => cambiarCantidad(i, +1);
    const btnBorrar = document.createElement("button");
    btnBorrar.type = "button";
    btnBorrar.className = "btn-quitar";
    btnBorrar.textContent = "✕";
    btnBorrar.setAttribute("aria-label", "Quitar esta carga");
    btnBorrar.onclick = () => {
      cargas.splice(i, 1);
      mostrarCargas();
      recalcularSiHayResultado();
    };
    control.append(menos, mas, btnBorrar);

    li.append(control);
    lista.appendChild(li);
  });
}

// Sumar o restar: de a un pallet, o de a un paquete de viguetas (24 o 12).
// Si llega a 0, la carga se quita de la lista.
function cambiarCantidad(i, delta) {
  const c = cargas[i];
  const paso = c.tipo === "vigueta" ? porPaquete(c.largo) : 1;
  if (c.cantidad + delta * paso > MAX_UNIDADES[c.tipo]) return;
  c.cantidad += delta * paso;
  if (c.cantidad <= 0) cargas.splice(i, 1);
  mostrarCargas();
  recalcularSiHayResultado();
}

// Si ya hay un resultado en pantalla, se actualiza solo (sin mover la pantalla)
function recalcularSiHayResultado() {
  if (document.querySelector("#resultado .tarjeta")) calcular(false);
}

// ====== PASO 6A: ARMAR BLOQUES (ESPACIO) ======
// Cada carga se convierte en un "bloque" que ocupa un tramo del largo del semi.
// Los pallets van primero (definen cuánto largo queda); todas las viguetas
// juntas forman UN bloque: la pirámide de paquetes.
function armarBloques(camion) {
  const bloques = [];

  for (const c of cargas.filter(c => c.tipo === "pallet")) {
    if (c.alto > camion.alto) throw `Un pallet de ${coma(c.alto)} m de alto no entra (alto del semi: ${coma(camion.alto)} m).`;
    // Pallets: NO apilables. Probar las 2 orientaciones y quedarse con la más corta.
    // Entre pallet y pallet queda "sep" libre (a lo largo y a lo ancho) para
    // meter la uña del autoelevador: n pallets + (n − 1) espacios ≤ ancho del semi.
    const sep = camion.sepPallets;
    let mejor = null;
    for (const [aLoLargo, aLoAncho] of [[c.largo, c.ancho], [c.ancho, c.largo]]) {
      const porFila = Math.floor((camion.ancho + sep) / (aLoAncho + sep) + 1e-9);
      if (porFila < 1) continue;
      const filas = Math.ceil(c.cantidad / porFila);
      const largo = filas * (aLoLargo + sep);               // cada fila ocupa pallet + espacio
      if (!mejor || largo < mejor.largo) mejor = { largo, porFila, filas, aLoLargo, aLoAncho };
    }
    if (!mejor) throw `Un pallet de ${c.largo}×${c.ancho} m no entra en el ancho del semi.`;
    // Cada fila de pallets (a lo ancho) se puede ubicar por separado
    const filas = [];
    for (let f = 0; f < mejor.filas; f++) {
      const n = Math.min(mejor.porFila, c.cantidad - f * mejor.porFila);
      filas.push({ largo: mejor.aLoLargo + sep, cg: mejor.aLoLargo / 2, peso: n * c.peso, unidades: n });
    }
    bloques.push({
      filas,
      tipo: "pallet",
      nombre: `${c.cantidad} pallets`,
      largo: mejor.largo,
      ancho: Math.min(c.cantidad, mejor.porFila) * (mejor.aLoAncho + sep) - sep,
      alto: c.alto,
      peso: c.peso * c.cantidad,
      detalle: { ...mejor, sep, pieza: c }
    });
  }

  const viguetas = cargas.filter(c => c.tipo === "vigueta");
  if (viguetas.length) {
    const largoPallets = bloques.reduce((s, b) => s + b.largo, 0);
    bloques.push(armarPiramide(camion, viguetas, camion.largo - largoPallets));
  }
  return bloques;
}

// ====== PIRÁMIDE DE PAQUETES DE VIGUETAS ======
// Como lo hacen los operadores:
//  1) La orden se pasa a paquetes (24 por paquete hasta 5 m, 12 desde 5,20 m).
//  2) Dos paquetes de 12 van apilados y ocupan un "lugar", igual que uno de 24.
//  3) Cada nivel tiene carriles a lo ancho (normalmente 2: un lado y el otro).
//     En cada carril los paquetes van uno detrás del otro, sin pasar el largo.
//  4) Lo más largo va abajo. Un paquete solo puede ir arriba de otro nivel
//     si tiene apoyo: cada carril no puede ser más largo que el de abajo.
function armarPiramide(camion, lista, largoLibre) {
  // 1) Paquetes
  const grandes = [], chicos = [];
  for (const c of lista) {
    const n = porPaquete(c.largo);
    for (let resto = c.cantidad; resto > 0; resto -= n) {
      const u = Math.min(n, resto);
      (n === 24 ? grandes : chicos).push({ largo: c.largo, unidades: u, peso: u * c.peso });
    }
  }
  const totalPaquetes = grandes.length + chicos.length;

  // 2) Lugares: un paquete de 24, o dos de 12 apilados (del mismo largo si se puede)
  const lugares = grandes.map(p => ({ largo: p.largo, peso: p.peso, paquetes: [p] }));
  chicos.sort((a, b) => b.largo - a.largo);
  for (let i = 0; i < chicos.length; i += 2) {
    const par = chicos.slice(i, i + 2);
    lugares.push({ largo: par[0].largo, peso: par.reduce((s, p) => s + p.peso, 0), paquetes: par });
  }
  lugares.sort((a, b) => b.largo - a.largo);          // lo más largo primero (abajo)

  // 3) Carriles a lo ancho y niveles que entran a lo alto
  const sep = camion.sepViguetas;
  const carriles = Math.floor((camion.ancho + sep) / (camion.anchoPaq + sep) + 1e-9);
  const nivelesMax = Math.floor(camion.alto / camion.altoPaq + 1e-9);
  const masLargo = lugares[0].largo;
  if (masLargo > largoLibre + 1e-9)
    throw `Un paquete de ${coma(masLargo)} m no entra: quedan ${metros(largoLibre)} libres${largoLibre < camion.largo ? " después de los pallets" : ""}.`;

  // 4) Llenar nivel por nivel
  const niveles = [];
  let tope = Array(carriles).fill(largoLibre);        // largo disponible en cada carril
  let pendientes = lugares;
  while (pendientes.length) {
    if (niveles.length === nivelesMax)
      throw `No entran todas las viguetas: hacen falta más de ${nivelesMax} niveles (alto de carga ${coma(camion.alto)} m). Sobran ${pendientes.reduce((s, l) => s + l.paquetes.length, 0)} paquetes.`;
    const nivel = Array.from({ length: carriles }, () => ({ largo: 0, lugares: [] }));
    const quedan = [];
    for (const l of pendientes) {
      // Al carril más vacío donde entre (así los dos lados quedan parejos)
      const orden = nivel.map((_, i) => i).sort((a, b) => nivel[a].largo - nivel[b].largo);
      const i = orden.find(i => nivel[i].largo + l.largo <= tope[i] + 1e-9);
      if (i === undefined) { quedan.push(l); continue; }
      nivel[i].lugares.push({ ...l, x: nivel[i].largo });
      nivel[i].largo += l.largo;
    }
    if (quedan.length === pendientes.length)
      throw `Un paquete de ${coma(quedan[0].largo)} m no tiene apoyo: los niveles de abajo son más cortos. Hace falta un equipo más largo o menos carga.`;
    niveles.push(nivel);
    tope = nivel.map(c => c.largo);                     // arriba se apoya en lo de abajo
    pendientes = quedan;
  }

  // 5) Centrar: cada carril va centrado sobre el carril más largo de abajo.
  //    Así lo de arriba no queda tirado hacia el tractor y el centro de masas
  //    de la pirámide queda en el medio. Como cada carril es igual o más corto
  //    que el de abajo, sigue teniendo apoyo.
  const largo = Math.max(...niveles[0].map(c => c.largo));
  for (const nivel of niveles)
    for (const carril of nivel)
      for (const l of carril.lugares) l.x += (largo - carril.largo) / 2;

  // 6) Bloque para el reparto de peso.
  //    El centro de gravedad se calcula con la posición real de cada paquete.
  let peso = 0, momento = 0;
  for (const nivel of niveles)
    for (const carril of nivel)
      for (const l of carril.lugares) {
        peso += l.peso;
        momento += l.peso * (l.x + l.largo / 2);
      }
  const carrilesUsados = niveles[0].filter(c => c.lugares.length).length;
  const unidades = lista.reduce((s, c) => s + c.cantidad, 0);

  return {
    filas: [{ largo, peso, unidades, cg: momento / peso }],
    tipo: "vigueta",
    nombre: `Viguetas: ${totalPaquetes} paquetes (${unidades} u)`,
    largo,
    ancho: carrilesUsados * (camion.anchoPaq + sep) - sep,
    alto: niveles.length * camion.altoPaq,
    peso,
    detalle: { niveles, carriles, sep, totalPaquetes }
  };
}

// ====== PASO 6B: PESO POR EJE ======
function pesoEnEjes(camion, W, x) {
  const enEjeSemi = W * (x - camion.perno) / (camion.ejeSemi - camion.perno);
  const enPerno = W - enEjeSemi;
  const traccion = enPerno * camion.quintaRueda / camion.ejeTraccion;
  const delantero = enPerno - traccion;
  // Peso real en cada eje = lo que aporta la carga + la tara (camión vacío)
  return {
    delantero: delantero + camion.taraDelantero,
    traccion: traccion + camion.taraTraccion,
    enEjeSemi: enEjeSemi + camion.taraSemi
  };
}

// Qué tan "cargado" queda el eje más exigido (1 = justo en el límite)
function exigencia(camion, ejes) {
  if (ejes.delantero < 0 || ejes.traccion < 0 || ejes.enEjeSemi < 0) return Infinity;
  return Math.max(
    ejes.delantero / camion.maxDelantero,
    ejes.traccion / camion.maxTraccion,
    ejes.enEjeSemi / camion.maxSemi
  );
}

// EQUILIBRIO: cada eje debería ir cargado en proporción a lo que soporta.
// Ej: si el delantero va al 90% y los del semi al 40%, está desbalanceado.
// Puntaje = eje más exigido + castigo por la diferencia entre ejes (menor = mejor)
// "huecoFrente": el hueco vacío más grande, adelante o entre filas (se prefiere chico)
function puntaje(camion, ejes, huecoFrente = 0) {
  const e = exigencia(camion, ejes);
  if (e === Infinity) return Infinity;
  // No pasarse (e) + que la carga se reparta parejo según lo libre de cada eje
  // + castigo fuerte si la tracción queda con poco peso (las ruedas patinan)
  // + castigo chico por dejar un hueco grande (adelante o en el medio)
  const falta = Math.max(0, camion.minTraccion / 100 - parteTraccion(ejes));
  return e + 0.5 * diferenciaUso(camion, ejes) / 100 + 5 * falta + 0.02 * huecoFrente;
}

// Qué parte del peso total (con tara) va en el eje de tracción (0 a 1)
function parteTraccion(ejes) {
  return ejes.traccion / (ejes.delantero + ejes.traccion + ejes.enEjeSemi);
}

// Todas las formas de ordenar los bloques
function permutaciones(arr) {
  if (arr.length <= 1) return [arr];
  return arr.flatMap((el, i) =>
    permutaciones([...arr.slice(0, i), ...arr.slice(i + 1)]).map(p => [el, ...p])
  );
}

// ====== PASO 6C: BUSCAR LA MEJOR DISTRIBUCIÓN ======
function distribuir(camion, bloques) {
  const largoUsado = bloques.reduce((s, b) => s + b.largo, 0);
  if (largoUsado > camion.largo) {
    throw `No entra: las cargas ocupan ${largoUsado.toFixed(2)} m y el semi mide ${camion.largo} m.`;
  }
  const W = bloques.reduce((s, b) => s + b.peso, 0);
  const libre = camion.largo - largoUsado;
  const totalFilas = bloques.reduce((s, b) => s + b.filas.length, 0);
  const candidatos = [];

  // Ubica las filas en las posiciones dadas (una x por fila, en el orden de los bloques)
  // y guarda la opción si es la mejor de su tipo.
  const mejores = {};
  function probar(tipo, orden, xs, reparto, extra = {}) {
    const largos = orden.flatMap(b => b.filas.map(f => f.largo));
    let i = 0, momento = 0;
    const ubicados = orden.map(b => {
      const posFilas = b.filas.map(f => {
        const x = xs[i++];
        momento += f.peso * (x + (f.cg ?? f.largo / 2));   // cg: centro de gravedad real (pirámide)
        return x;
      });
      const ultima = b.filas[b.filas.length - 1];
      return { ...b, posFilas, desde: posFilas[0], hasta: posFilas[posFilas.length - 1] + ultima.largo };
    });
    const ejes = pesoEnEjes(camion, W, momento / W);
    // Hueco más grande que queda vacío: adelante o entre dos filas.
    // Se busca que sea chico: la carga repartida pareja en el piso, sin "islas".
    const fin = xs.map((x, i) => x + largos[i]);
    const hueco = Math.max(xs[0], ...xs.slice(1).map((x, i) => x - fin[i]));
    const p = puntaje(camion, ejes, hueco);
    if (!mejores[tipo] || p < mejores[tipo].p)
      mejores[tipo] = { e: exigencia(camion, ejes), p, pBase: puntaje(camion, ejes, 0), reparto, ubicados, ejes, W, libre, hueco, cm: momento / W, ...extra };
  }

  for (const orden of permutaciones(bloques)) {
    const largos = orden.flatMap(b => b.filas.map(f => f.largo));

    // A) Todo junto o repartido parejo, corriendo el conjunto cada 10 cm.
    //    "reparto": cuánto del espacio libre se usa como separación entre filas
    //    (0 = todo junto, 1 = repartido a lo largo de todo el semi)
    for (let reparto = 0; reparto <= 1.0001; reparto += 0.1) {
      const hueco = totalFilas > 1 ? reparto * libre / (totalFilas - 1) : 0;
      const sobra = libre - hueco * (totalFilas - 1);
      for (let offset = 0; offset <= sobra + 1e-9; offset += 0.1) {
        let pos = offset;
        const xs = largos.map(l => { const x = pos; pos += l + hueco; return x; });
        probar("reparto" + Math.round(reparto * 10), orden, xs, reparto);
      }
    }

    // B) Como en la realidad: un grupo pegado ADELANTE (contra el cabezal)
    //    y el resto en un grupo más atrás, con un hueco en el medio.
    //    Se prueba cuántas filas van adelante y dónde arranca el grupo de atrás.
    for (let k = 1; k < totalFilas; k++) {
      const largoAdelante = largos.slice(0, k).reduce((s, l) => s + l, 0);
      const largoAtras = largos.slice(k).reduce((s, l) => s + l, 0);
      for (let inicio = largoAdelante; inicio <= camion.largo - largoAtras + 1e-9; inicio += 0.1) {
        let pos = 0;
        const xs = largos.map((l, i) => {
          if (i === k) pos = inicio;
          const x = pos; pos += l; return x;
        });
        probar("dosGrupos", orden, xs, null);
      }
    }

    // C) Como lo cargan los operadores: TRES grupos.
    //    Unos pocos pegados adelante (le dan peso al tractor), algunos en el medio
    //    y el resto pegados atrás, sobre los ejes del semi.
    //    Se prueba cuántas filas van en cada grupo (el de atrás siempre es el más
    //    grande) y dónde queda el del medio.
    const suma = (a, b) => largos.slice(a, b).reduce((s, l) => s + l, 0);
    for (let k1 = 1; k1 < totalFilas - 1; k1++)
      for (let k3 = 1; k1 + k3 < totalFilas; k3++) {
        const k2 = totalFilas - k1 - k3;
        if (k3 < k1 || k3 < k2) continue;                // la mayoría va atrás
        const finAdelante = suma(0, k1);
        const largoMedio = suma(k1, totalFilas - k3);
        const inicioAtras = camion.largo - suma(totalFilas - k3, totalFilas);
        for (let inicioMedio = finAdelante; inicioMedio + largoMedio <= inicioAtras + 1e-9; inicioMedio += 0.1) {
          let pos = 0;
          const xs = largos.map((l, i) => {
            if (i === k1) pos = inicioMedio;
            if (i === totalFilas - k3) pos = inicioAtras;
            const x = pos; pos += l; return x;
          });
          probar(`tres_${k1}_${k3}`, orden, xs, null, { enMedio: k2 });
        }
      }
  }

  // Elegimos la más equilibrada. Si hay varias casi iguales (diferencia < 1%):
  // primero la que deja el hueco más chico, después la más junta.
  const opciones = Object.values(mejores);
  const minP = Math.min(...opciones.map(o => o.p));

  // Regla de los operadores: tiene que haber carga ADELANTE (pegada al frente, le da
  // peso a la tracción) y ATRÁS (sobre los ejes del semi). Entre las opciones que la
  // cumplen, no se pasan en ningún eje y quedan casi igual de equilibradas que la
  // mejor (hasta 5 puntos): primero tres grupos con MÁS carga en el medio, después
  // la más equilibrada.
  //  (Para comparar se usa el equilibrio de los ejes sin el castigo por huecos:
  //   acá los huecos entre grupos son a propósito.)
  const minBase = Math.min(...opciones.map(o => o.pBase));
  const validas = opciones
    .filter(o => o.e <= 1 && o.pBase <= minBase + 0.05 && cargaAdelanteYAtras(camion, o))
    .sort((a, b) => (b.enMedio ?? -1) - (a.enMedio ?? -1) || a.pBase - b.pBase);
  if (validas.length) return validas[0];

  const buenas = opciones.filter(o => o.p <= minP + 0.01);
  buenas.sort((a, b) => a.hueco - b.hueco || (a.reparto ?? 0) - (b.reparto ?? 0));
  return buenas[0];
}

// ¿Hay carga pegada al frente (≤ 30 cm) y carga que llega hasta los ejes del semi?
function cargaAdelanteYAtras(camion, o) {
  const tramos = o.ubicados.flatMap(b => b.posFilas.map((x, i) => [x, x + b.filas[i].largo]));
  const inicio = Math.min(...tramos.map(t => t[0]));
  const fin = Math.max(...tramos.map(t => t[1]));
  return inicio <= 0.3 + 1e-9 && fin >= camion.ejeSemi;
}

// Cuánto usa LA CARGA de lo que le queda libre a cada eje (máximo − tara).
// No se mira la tara: el camión vacío ya viene repartido de fábrica.
function usosDeCarga(c, ejes) {
  return [
    ["eje delantero", (ejes.delantero - c.taraDelantero) / (c.maxDelantero - c.taraDelantero)],
    ["eje de tracción", (ejes.traccion - c.taraTraccion) / (c.maxTraccion - c.taraTraccion)],
    ["ejes del semi", (ejes.enEjeSemi - c.taraSemi) / (c.maxSemi - c.taraSemi)]
  ];
}

// % de uso total de cada eje (tara + carga) sobre su máximo
function usosTotales(c, ejes) {
  return [
    ["eje delantero", ejes.delantero / c.maxDelantero],
    ["eje de tracción", ejes.traccion / c.maxTraccion],
    ["ejes del semi", ejes.enEjeSemi / c.maxSemi]
  ];
}

const rango = usos => (Math.max(...usos.map(u => u[1])) - Math.min(...usos.map(u => u[1]))) * 100;

// Desbalance (en puntos %) entre TRACCIÓN y SEMI. El delantero no entra:
// al delantero le llega muy poco del semi (casi todo lo del perno va a la tracción),
// así que nunca puede ir parejo; solo se controla que no se pase de su máximo.
// Se mira de dos formas y se toma la menor:
//  - por la carga sola (así 1 pallet no "desbalancea" por culpa de la tara)
//  - por el total (así una carga pesada con los ejes parejos no se marca)
const sinDelantero = usos => usos.filter(u => u[0] !== "eje delantero");
function diferenciaUso(c, ejes) {
  return Math.min(rango(sinDelantero(usosDeCarga(c, ejes))), rango(sinDelantero(usosTotales(c, ejes))));
}

// ====== AMARRE CON FAJAS ======
// EN 12195-1, amarre por rozamiento (la faja pasa por arriba y aprieta la carga
// contra el piso). La carga tiene que aguantar sin moverse:
//   frenada: 0,8 g hacia adelante · 0,5 g hacia atrás · 0,5 g al costado.
// Fajas necesarias:  n = seguridad × (c − µ) × peso / (2 × µ × sen α × tensión)
//   c = aceleración de esa dirección, µ = rozamiento, α = ángulo de la faja.
const AMARRE = { adelante: 0.8, atras: 0.5, costado: 0.5, seguridad: 1.25 };

// Alto de la pila en la posición x (medida desde el comienzo del bloque)
function altoPilaEn(b, camion, x) {
  let alto = 0;
  b.detalle.niveles.forEach((nivel, n) => {
    const hay = nivel.some(c => c.lugares.some(l => x >= l.x - 1e-9 && x <= l.x + l.largo + 1e-9));
    if (hay) alto = (n + 1) * camion.altoPaq;
  });
  return alto;
}

function calcularFajas(camion, b) {
  const mu = camion.rozamiento;
  const pesoDaN = b.peso * 0.981;                        // kg → daN

  // 1) Ángulo de la faja: baja desde arriba de la pila hasta el borde del semi.
  //    Peor caso: donde la pila es más baja (un solo nivel).
  const costado = (camion.ancho - b.ancho) / 2 + 0.05;
  const sen = camion.altoPaq / Math.hypot(camion.altoPaq, costado);

  // 2) Fajas por peso: la dirección que más exige
  const direcciones = [["al costado", AMARRE.costado], ["hacia atrás", AMARRE.atras]];
  if (!camion.trabada) direcciones.push(["hacia adelante", AMARRE.adelante]);
  let porPeso = 0, direccion = "";
  for (const [nombre, c] of direcciones) {
    const n = c > mu ? Math.ceil(AMARRE.seguridad * (c - mu) * pesoDaN / (2 * mu * sen * camion.stfFaja)) : 0;
    if (n > porPeso) { porPeso = n; direccion = nombre; }
  }

  // 3) Posiciones: repartidas parejo a lo largo de la pila (mínimo 2)
  const L = b.largo, borde = Math.min(0.3, L / 4);
  const base = Math.max(porPeso, 2);
  const pos = Array.from({ length: base }, (_, i) => borde + i * (L - 2 * borde) / (base - 1));

  // 4) Cada paquete cruzado por al menos 2 fajas (sin contar las puntas: 0,2 m)
  const lugares = b.detalle.niveles.flatMap(n => n.flatMap(c => c.lugares)).sort((a, z) => a.x - z.x);
  let agregadas = 0;
  for (const l of lugares) {
    const desde = l.x + 0.2, hasta = l.x + l.largo - 0.2;
    let cruzan = pos.filter(p => p >= desde && p <= hasta).length;
    while (cruzan < 2) {
      // la más lejos de las fajas que ya hay, entre 1/4 y 3/4 del paquete
      const opciones = [l.x + l.largo * 0.25, l.x + l.largo * 0.75];
      const lejos = o => Math.min(...pos.map(p => Math.abs(p - o)));
      pos.push(opciones.sort((a, z) => lejos(z) - lejos(a))[0]);
      cruzan++; agregadas++;
    }
  }
  pos.sort((a, z) => a - z);

  return {
    posiciones: pos.map(p => Math.round(p * 20) / 20),  // cada 5 cm
    porPeso, direccion, agregadas,
    total: pos.length,
    alcanzan: pos.length <= camion.fajasDisp
  };
}

// Aviso con la cantidad de fajas y dónde van
function cajaFajas(f, b, camion) {
  const donde = f.posiciones.map(p => coma((b.desde + p).toFixed(2))).join(" · ");
  const porPeso = f.porPeso
    ? `Por peso hacen falta ${f.porPeso} (para que no se mueva ${f.direccion}).`
    : "Por peso no hace falta ninguna: el rozamiento alcanza.";
  const extra = f.agregadas ? ` Se suman ${f.agregadas} para que cada paquete tenga 2.` : "";
  const texto = `${porPeso}${extra}<br>Posiciones desde el frente del semi (m): ${donde}.
    ${camion.trabada ? "" : "<br>La carga no va trabada adelante: eso exige muchas más fajas."}`;
  return f.alcanzan
    ? caja("ok", `Amarre: ${f.total} fajas (el camión lleva ${camion.fajasDisp})`, texto)
    : caja("error", `Faltan fajas: hacen falta ${f.total} y el camión lleva ${camion.fajasDisp}`, texto);
}

// ====== EJES DEL SEMI Y EJE ELEVABLE ======
// Posición de cada eje del semi (centrados en "ejeSemi", separados "sepEjes")
function posicionesEjes(c) {
  const n = c.cantEjesSemi;
  return Array.from({ length: n }, (_, i) => c.ejeSemi + (i - (n - 1) / 2) * c.sepEjes);
}

// Devuelve las formas posibles de andar: [levantado (si hay), todos bajados]
function configuracionesEjes(c) {
  const pos = posicionesEjes(c);
  const todosBajados = {
    levantado: false,
    centro: c.ejeSemi,
    max: c.maxSemi,
    ejes: pos.map(x => ({ x, levantado: false }))
  };
  if (c.ejeElevable === "ninguno") return [todosBajados];

  // Cuál eje se levanta: delantero = el más cercano al tractor
  const indice = { delantero: 0, medio: 1, trasero: pos.length - 1 }[c.ejeElevable];
  const apoyados = pos.filter((_, i) => i !== indice);
  const levantado = {
    levantado: true,
    centro: apoyados.reduce((s, x) => s + x, 0) / apoyados.length, // el apoyo se corre
    max: c.maxSemiLevantado,
    ejes: pos.map((x, i) => ({ x, levantado: i === indice }))
  };
  // Modo elegido por el usuario
  if (c.modoElevable === "arriba") return [levantado];
  if (c.modoElevable === "abajo") return [todosBajados];
  return [levantado, todosBajados];   // automático: probar levantado y si no da, bajado
}

// ====== CALCULAR ======
function calcular(bajarAlResultado = true) {
  let camion = leerCamion();
  const resultado = document.getElementById("resultado");

  // Datos del camión consistentes antes de calcular
  const erroresCamion = validarCamion(camion);
  marcarCampos(erroresCamion);
  if (erroresCamion.length) {
    resultado.innerHTML = caja("error", "Revisá los datos del camión",
      `<ul>${erroresCamion.map(e => `<li>${e.texto}</li>`).join("")}</ul>`);
    return;
  }

  if (cargas.length === 0) {
    resultado.innerHTML = caja("info", "Falta la carga", "Agregá al menos una carga para calcular.");
    return;
  }

  // Las cargas se agregaron con el camión de ese momento: revisar de nuevo
  for (const c of cargas) {
    if (c.tipo === "vigueta") completarVigueta(c, camion);   // por si cambió el kg/m o el paquete
    const err = validarQueEntre(c, camion);
    if (err) {
      resultado.innerHTML = caja("error", `${c.cantidad} ${c.tipo === "vigueta" ? "viguetas" : "pallets"}`, err);
      return;
    }
  }

  try {
    const bloques = armarBloques(camion);

    // EJE ELEVABLE: probar primero levantado (ahorra cubiertas y combustible).
    // Si con la carga no da, usar todos los ejes bajados.
    const opciones = configuracionesEjes(camion);
    let r = null;
    for (const conf of opciones) {
      const cam = { ...camion, ejeSemi: conf.centro, maxSemi: conf.max };
      const res = distribuir(cam, bloques);
      res.conf = conf;
      r = res;
      // Levantado solo si queda con margen (≤ 95%) y equilibrado; bajado si entra
      const sirve = conf.levantado
        ? res.e <= 0.95 && diferenciaUso(cam, res.ejes) <= 25
        : res.e <= 1;
      if (sirve) { camion = cam; break; }
      if (conf === opciones[opciones.length - 1]) camion = cam;
    }

    // Un color por bloque (se usa en la lista y en los dibujos)
    r.ubicados.forEach((b, i) => b.color = colorBloque(b, i));

    // ¿Se puede cargar esto?
    const tara = camion.taraDelantero + camion.taraTraccion + camion.taraSemi;
    const conTara = r.W + tara;
    const sumaMax = camion.maxDelantero + camion.maxTraccion + camion.maxSemi;
    let aviso = "";
    if (conTara > camion.pesoMax) {
      aviso = `Cargado pesaría ${kg(conTara)} kg y el máximo es ${kg(camion.pesoMax)} kg.
               Hay que sacar al menos ${kg(conTara - camion.pesoMax)} kg de carga.`;
    } else if (conTara > sumaMax) {
      aviso = `Con tara pesa ${kg(conTara)} kg, pero los ejes juntos soportan ${kg(sumaMax)} kg.
               Hay que sacar al menos ${kg(conTara - sumaMax)} kg de carga.`;
    } else if (r.e > 1) {
      aviso = `El peso total da, pero no hay forma de ubicar la carga sin pasarse en algún eje.
               Probá con menos carga o un camión con ejes más resistentes.`;
    }

    // ¿Está equilibrado?
    const usos = sinDelantero(usosTotales(camion, r.ejes)).sort((a, b) => b[1] - a[1]);
    const [masCargado, menosCargado] = usos;
    const desbalanceado = diferenciaUso(camion, r.ejes) > 25;

    let avisos = "";
    if (aviso) avisos += caja("error", "Así no se puede cargar", aviso);
    if (r.ubicados.some(b => b.tipo === "pallet") && !cargaAdelanteYAtras(camion, r))
      avisos += caja("info", "No hay carga adelante y atrás a la vez",
        "Con esta carga no se puede poner algo pegado al frente y algo sobre los ejes del semi sin pasarse en algún eje. Se usa la ubicación más equilibrada.");
    const enTraccion = parteTraccion(r.ejes) * 100;
    if (enTraccion < camion.minTraccion)
      avisos += caja("alerta", "Poco peso en la tracción",
        `La tracción lleva el ${Math.round(enTraccion)}% del peso total y el mínimo es ${camion.minTraccion}%.
         Las ruedas pueden patinar (arranque, subidas, ripio). Corré carga hacia adelante.`);
    if (desbalanceado) {
      const consejo = masCargado[0] === "ejes del semi" ? "Hay demasiado peso atrás." : "Hay demasiado peso adelante.";
      avisos += caja("alerta", "Carga desbalanceada",
        `${masCargado[0]} al ${Math.round(masCargado[1] * 100)}% y ${menosCargado[0]} al ${Math.round(menosCargado[1] * 100)}%.
         ${consejo} Es la mejor ubicación posible con esta carga; sumá o quitá carga para compensar.`);
    }
    if (!aviso && !desbalanceado)
      avisos += caja("ok", "Se puede cargar así", "Todos los ejes quedan dentro del límite y la carga va equilibrada.");

    // Sujeción de las viguetas con fajas
    const pila = r.ubicados.find(b => b.tipo === "vigueta");
    if (pila) {
      pila.amarre = calcularFajas(camion, pila);
      avisos += cajaFajas(pila.amarre, pila, camion);
    }

    // ¿Qué hacer con el eje elevable?
    if (camion.ejeElevable !== "ninguno") {
      const cual = { delantero: "el delantero", medio: "el del medio", trasero: "el trasero" }[camion.ejeElevable];
      const apoyo = `El semi apoya a ${metros(r.conf.centro)} del frente y soporta hasta ${kg(r.conf.max)} kg.`;
      let texto;
      if (camion.modoElevable === "auto") {
        texto = r.conf.levantado
          ? `Va levantado ${cual} del grupo: la carga entra bien en ${camion.cantEjesSemi - 1} ejes. ${apoyo}`
          : `Va bajado: levantado quedaría pasado, muy al límite o desbalanceado. ${apoyo}`;
      } else {
        texto = `Elegiste ${r.conf.levantado ? "levantarlo" : "bajarlo"}${r.conf.levantado ? ` (${cual} del grupo)` : ""}. ${apoyo}`;
      }
      avisos += caja("info", r.conf.levantado ? "Eje elevable: levantado" : "Eje elevable: bajado", texto);
    }

    resultado.innerHTML = `
      <section class="tarjeta resultado">
        <h2>Resultado</h2>
        ${avisos}

        <div class="datos">
          <div><span>Carga</span><b>${kg(r.W)} kg</b></div>
          <div><span>Total con tara</span><b>${kg(conTara)} kg</b></div>
          <div><span>Largo libre</span><b>${r.libre.toFixed(2).replace(".", ",")} m</b></div>
        </div>
        <p class="nota">Centro de masas de la carga: a <b>${metros(r.cm)}</b> del frente del semi
          (marcado con <b style="color:#b42318">CM</b> en el dibujo de costado).</p>

        <h3>Peso por eje</h3>
        <div class="ejes">
          ${medidor("Delantero", r.ejes.delantero, camion.maxDelantero)}
          ${medidor("Tracción", r.ejes.traccion, camion.maxTraccion)}
          ${medidor(r.conf.levantado ? "Semi (elevable arriba)" : "Ejes del semi", r.ejes.enEjeSemi, camion.maxSemi)}
        </div>

        <h3>Orden de carga, desde el frente</h3>
        <ol class="orden">${r.ubicados.map((b, i) => `
          <li>
            <span class="muestra" style="background:${b.color}">${i + 1}</span>
            <span><b>${b.nombre}</b><small>de ${metros(b.desde)} a ${metros(b.hasta)}, ${kg(b.peso)} kg</small></span>
          </li>`).join("")}
        </ol>
        ${tablaNiveles(r.ubicados.find(b => b.tipo === "vigueta"))}
      </section>`;

    dibujarVistas(camion, r);
    if (bajarAlResultado) resultado.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    resultado.innerHTML = caja("error", "Revisá la carga", error);
  }
}

// ====== AYUDAS PARA MOSTRAR RESULTADOS ======
const kg = n => Math.round(n).toLocaleString("es-AR");
const metros = n => n.toFixed(2).replace(".", ",") + " m";

// Diseño de carga de las viguetas, nivel por nivel (como la hoja de los operadores).
// Ej: "5,20 + 3,80 = 9,00 m". Dos paquetes de 12 apilados: "5,20 (2×12)".
function tablaNiveles(b) {
  if (!b) return "";
  const { niveles, carriles } = b.detalle;
  const nombreLugar = l => coma(l.largo.toFixed(2)) + (l.paquetes.length === 2 ? " (2×12)" : porPaquete(l.largo) === 12 ? " (12)" : "");
  const celda = c => c.lugares.length
    ? `${c.lugares.map(nombreLugar).join(" + ")} = <b>${metros(c.largo)}</b>`
    : "—";
  const lados = Array.from({ length: carriles }, (_, i) => `<th>Lado ${i + 1}</th>`).join("");
  const filas = niveles.map((nivel, n) => `
    <tr><td>${n + 1}${n === 0 ? " · abajo" : n === niveles.length - 1 ? " · arriba" : ""}</td>
    ${nivel.map(c => `<td>${celda(c)}</td>`).join("")}</tr>`).join("");
  return `
    <h3>Diseño de carga de viguetas</h3>
    <table class="niveles">
      <thead><tr><th>Nivel</th>${lados}</tr></thead>
      <tbody>${filas}</tbody>
    </table>
    <p class="nota">${b.detalle.totalPaquetes} paquetes en ${niveles.length} nivel(es), desde ${metros(b.desde)} del frente. (2×12) = dos paquetes de 12 apilados.</p>`;
}

// Caja de aviso: tipo = ok | info | alerta | error
function caja(tipo, titulo, texto) {
  return `<div class="aviso ${tipo}"><b>${titulo}</b><div>${texto}</div></div>`;
}

// Barra de uso de un eje: verde, naranja (más de 90%) o roja (pasado)
function medidor(nombre, peso, max) {
  if (peso < 0) {
    return `<div class="eje mal">
      <div class="eje-cab"><span>${nombre}</span><b>Se levanta</b></div>
      <div class="barra"><i style="width:100%"></i></div>
      <small>Hay demasiado peso detrás de los ejes del semi.</small></div>`;
  }
  const pct = peso / max * 100;
  const estado = pct > 100 ? "mal" : pct > 90 ? "justo" : "bien";
  return `<div class="eje ${estado}">
    <div class="eje-cab"><span>${nombre}</span><b>${Math.round(pct)}%</b></div>
    <div class="barra"><i style="width:${Math.min(pct, 100)}%"></i></div>
    <small>${kg(peso)} de ${kg(max)} kg</small></div>`;
}

// ====== PASO 7: VISTAS 2D ======
const COLORES_PALLET = ["#3182ce", "#38a169", "#805ad5", "#dd6b20", "#d53f8c", "#319795"];
let indicePallet = 0;

function colorBloque(b, i) {
  if (i === 0) indicePallet = 0;
  if (b.tipo === "vigueta") return COLOR_VIGUETA;
  return COLORES_PALLET[indicePallet++ % COLORES_PALLET.length];
}

// Crea un canvas con título, escalado para que entre en la pantalla.
// anchoReal/altoReal = metros que tiene que mostrar.
// xMin / yMin: desde qué metro arranca el dibujo (sirve para mostrar el tractor,
// que queda delante del semi, en x negativas).
function crearCanvas(contenedor, titulo, anchoReal, altoReal, maxPx = 900, xMin = 0, yMin = 0) {
  const h3 = document.createElement("h3");
  h3.textContent = titulo;
  contenedor.appendChild(h3);

  const margen = 10;                                   // px
  const anchoCss = Math.min(contenedor.clientWidth - 36 || 300, maxPx);
  const s = (anchoCss - 2 * margen) / anchoReal;       // px por metro
  const altoCss = altoReal * s + 2 * margen;

  const canvas = document.createElement("canvas");
  const dpr = window.devicePixelRatio || 1;            // nitidez en celulares
  canvas.width = anchoCss * dpr;
  canvas.height = altoCss * dpr;
  canvas.style.width = anchoCss + "px";
  canvas.style.height = altoCss + "px";
  canvas.className = "lienzo";
  contenedor.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.translate(-xMin * s, -yMin * s);
  return { ctx, s, m: margen };
}

// Dibuja un rectángulo en metros (x,y desde arriba-izquierda)
function rect(v, x, y, w, h, color) {
  v.ctx.fillStyle = color;
  v.ctx.fillRect(v.m + x * v.s, v.m + y * v.s, w * v.s, h * v.s);
  v.ctx.strokeStyle = "#1a202c";
  v.ctx.lineWidth = 0.6;
  v.ctx.strokeRect(v.m + x * v.s, v.m + y * v.s, w * v.s, h * v.s);
}

// ---------- DIBUJO DE VIGUETAS (hormigón, tacos de madera y fajas) ----------
const COLOR_VIGUETA = "#a8b0b9";   // gris hormigón
const BORDE_VIGUETA = "#4a5568";
const COLOR_TACO = "#a0682a";      // madera
const COLOR_FAJA = "#dd6b20";      // zuncho naranja
const ALTO_TACO = 0.2;             // parte de cada capa que ocupa el taco (20%)

// Fajas que atan el paquete: líneas a lo ancho (arriba) o a lo alto (costado)
function fajas(v, x, largo, desde, hasta, vertical) {
  const { ctx, s, m } = v;
  const puntos = largo > 6 ? [0.15, 0.5, 0.85] : [0.2, 0.8];
  ctx.strokeStyle = COLOR_FAJA;
  ctx.lineWidth = 2;
  for (const f of puntos) {
    const px = m + (x + largo * f) * s;
    ctx.beginPath();
    ctx.moveTo(px, m + desde * s);
    ctx.lineTo(px, m + hasta * s);
    ctx.stroke();
  }
}

// Costado: cada capa = vigueta arriba + tacos de madera abajo
function capaViguetaCostado(v, x, arriba, largo, alto) {
  const { ctx, s, m } = v;
  const hViga = alto * (1 - ALTO_TACO);
  ctx.fillStyle = COLOR_VIGUETA;
  ctx.fillRect(m + x * s, m + arriba * s, largo * s, hViga * s);
  ctx.strokeStyle = BORDE_VIGUETA;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(m + x * s, m + arriba * s, largo * s, hViga * s);
  ctx.fillStyle = COLOR_TACO;                          // tacos
  for (const f of [0.2, 0.8]) {
    ctx.fillRect(m + (x + largo * f - 0.08) * s, m + (arriba + hViga) * s, 0.16 * s, alto * ALTO_TACO * s);
  }
}

// Frente: perfil en T invertida
function viguetaFrente(v, x, arriba, ancho, alto) {
  const { ctx, s, m } = v;
  const h = alto * (1 - ALTO_TACO);
  const ala = h * 0.4;                // base ancha
  const alma = ancho * 0.4;           // parte angosta de arriba
  const X = px => m + px * s, Y = py => m + py * s;
  ctx.beginPath();
  ctx.moveTo(X(x + ancho * 0.03), Y(arriba + h));
  ctx.lineTo(X(x + ancho * 0.97), Y(arriba + h));
  ctx.lineTo(X(x + ancho * 0.97), Y(arriba + h - ala));
  ctx.lineTo(X(x + (ancho + alma) / 2), Y(arriba + h - ala));
  ctx.lineTo(X(x + (ancho + alma) / 2), Y(arriba));
  ctx.lineTo(X(x + (ancho - alma) / 2), Y(arriba));
  ctx.lineTo(X(x + (ancho - alma) / 2), Y(arriba + h - ala));
  ctx.lineTo(X(x + ancho * 0.03), Y(arriba + h - ala));
  ctx.closePath();
  ctx.fillStyle = COLOR_VIGUETA;
  ctx.fill();
  ctx.strokeStyle = BORDE_VIGUETA;
  ctx.lineWidth = 0.6;
  ctx.stroke();
}

// ---------- PAQUETES DE VIGUETAS ----------
// Dónde empieza el primer carril a lo ancho (los carriles van centrados)
function inicioCarriles(b, camion) {
  const { carriles, sep } = b.detalle;
  return (camion.ancho - (carriles * (camion.anchoPaq + sep) - sep)) / 2;
}

// Recorre cada lugar de la pirámide con su posición en metros:
// fn(lugar, x desde el frente del semi, y a lo ancho, nivel, carril)
function recorrerPaquetes(b, camion, fn) {
  const y0 = inicioCarriles(b, camion);
  b.detalle.niveles.forEach((nivel, n) =>
    nivel.forEach((carril, i) =>
      carril.lugares.forEach(l =>
        fn(l, b.desde + l.x, y0 + i * (camion.anchoPaq + b.detalle.sep), n, i))));
}

// Paquete visto de arriba: más claro cuanto más alto está
const TONOS_NIVEL = ["#8f99a3", "#a8b0b9", "#c1c8ce", "#d6dbdf", "#e6e9ec"];
function paqueteArriba(v, x, y, largo, ancho, nivel) {
  const { ctx, s, m } = v;
  ctx.fillStyle = TONOS_NIVEL[Math.min(nivel, TONOS_NIVEL.length - 1)];
  ctx.fillRect(m + x * s, m + y * s, largo * s, ancho * s);
  ctx.strokeStyle = BORDE_VIGUETA;
  ctx.lineWidth = 1;
  ctx.strokeRect(m + x * s, m + y * s, largo * s, ancho * s);
}

// Largo del paquete escrito encima (ej: "5,20")
function textoLargo(v, x, y, largo) {
  const { ctx, s, m } = v;
  ctx.fillStyle = ASFALTO;
  ctx.font = "600 11px Archivo, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(largo.toFixed(2).replace(".", ","), m + x * s, m + y * s);
}

// Paquete visto de frente: viguetas en T bien juntas, atadas con una faja,
// y abajo el taco de madera que lo separa del paquete de abajo.
// "alto" incluye el taco. Un paquete de 24 = 8 a lo ancho × 3 filas.
function paqueteFrente(v, y, arriba, ancho, alto, unidades) {
  const { ctx, s, m } = v;
  const hTaco = alto * ALTO_TACO, hVigas = alto - hTaco;
  const porFila = 8;
  const filas = Math.max(1, Math.round(unidades / porFila));
  const hFila = hVigas / filas, aViga = ancho / porFila;
  for (let f = 0; f < filas; f++)
    for (let k = 0; k < porFila; k++)
      viguetaFrente(v, y + k * aViga, arriba + f * hFila, aViga, hFila / (1 - ALTO_TACO));
  ctx.strokeStyle = COLOR_FAJA;                          // faja alrededor del paquete
  ctx.lineWidth = 1.5;
  ctx.strokeRect(m + y * s, m + arriba * s, ancho * s, hVigas * s);
  ctx.fillStyle = COLOR_TACO;                            // taco de madera abajo
  ctx.fillRect(m + y * s, m + (arriba + hVigas) * s, ancho * s, hTaco * s);
  ctx.strokeStyle = "#6b4319";
  ctx.lineWidth = 0.6;
  ctx.strokeRect(m + y * s, m + (arriba + hVigas) * s, ancho * s, hTaco * s);
}

function contorno(v, x, y, w, h, punteado) {
  v.ctx.setLineDash(punteado ? [5, 4] : []);
  v.ctx.strokeStyle = "#4a5568";
  v.ctx.lineWidth = 2;
  v.ctx.strokeRect(v.m + x * v.s, v.m + y * v.s, w * v.s, h * v.s);
  v.ctx.setLineDash([]);
}

// Semi visto de frente: piso, chasis, ruedas y ruta
function dibujarSemiFrente(v, c) {
  const { ctx, s, m } = v;
  const X = x => m + x * s, Y = y => m + y * s;
  ctx.fillStyle = ASFALTO;                               // piso / chasis
  ctx.fillRect(X(-0.05), Y(c.alto), (c.ancho + 0.1) * s, 0.15 * s);
  ctx.fillRect(X(c.ancho / 2 - 0.45), Y(c.alto + 0.15), 0.9 * s, 0.2 * s);
  for (const x of [0.05, c.ancho - 0.6]) {               // ruedas dobles de cada lado
    ctx.fillRect(X(x), Y(c.alto + 0.2), 0.25 * s, 0.75 * s);
    ctx.fillRect(X(x + 0.3), Y(c.alto + 0.2), 0.25 * s, 0.75 * s);
  }
  ctx.strokeStyle = "#8a969e";                           // ruta
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(X(-0.2), Y(c.alto + 0.95));
  ctx.lineTo(X(c.ancho + 0.2), Y(c.alto + 0.95));
  ctx.stroke();
}

// Número de nivel al costado del dibujo de frente
function etiquetaNivel(v, x, y, n) {
  const { ctx, s, m } = v;
  ctx.fillStyle = "#5d6b75";
  ctx.font = "600 11px Archivo, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("N" + n, m + x * s, m + y * s);
}

// ---------- PIEZAS DEL DIBUJO ----------
const ASFALTO = "#1e292f";

// Flecha naranja que muestra que la rueda está levantada
function flechaArriba(v, x, yAbajo, yArriba) {
  const { ctx, s, m } = v;
  const X = m + x * s;
  ctx.strokeStyle = ctx.fillStyle = "#b85c14";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(X, m + yAbajo * s);
  ctx.lineTo(X, m + yArriba * s + 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(X, m + yArriba * s);
  ctx.lineTo(X - 4, m + yArriba * s + 5);
  ctx.lineTo(X + 4, m + yArriba * s + 5);
  ctx.fill();
}

// Rueda vista de costado
function rueda(v, x, y, levantada) {
  const { ctx, s, m } = v;
  ctx.fillStyle = levantada ? "#a7b0b7" : ASFALTO;
  ctx.beginPath();
  ctx.arc(m + x * s, m + y * s, 0.42 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c8ced2";                           // llanta
  ctx.beginPath();
  ctx.arc(m + x * s, m + y * s, 0.17 * s, 0, Math.PI * 2);
  ctx.fill();
}

// Cubiertas vistas de arriba: asoman a los dos lados del semi
function cubiertasArriba(v, x, ancho, levantada) {
  const { ctx, s, m } = v;
  ctx.fillStyle = levantada ? "#a7b0b7" : ASFALTO;
  ctx.fillRect(m + (x - 0.5) * s, m - 0.22 * s, 1.0 * s, 0.22 * s);
  ctx.fillRect(m + (x - 0.5) * s, m + ancho * s, 1.0 * s, 0.22 * s);
}

// Número de cada carga (coincide con la lista "Orden de carga")
function numero(v, x, y, n) {
  const { ctx, s, m } = v;
  const cx = m + x * s, cy = m + y * s;
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = ASFALTO;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ASFALTO;
  ctx.font = "700 13px Archivo, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(n, cx, cy + 1);
}

// Regla en metros debajo del semi
function regla(v, largo, y) {
  const { ctx, s, m } = v;
  const Y = m + y * s;
  ctx.strokeStyle = "#5d6b75";
  ctx.fillStyle = "#5d6b75";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(m, Y);
  ctx.lineTo(m + largo * s, Y);
  ctx.stroke();
  ctx.font = "11px Archivo, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const paso = largo > 10 ? 2 : 1;
  for (let x = 0; x <= largo + 1e-9; x += 1) {
    const marca = x % paso === 0;
    ctx.beginPath();
    ctx.moveTo(m + x * s, Y);
    ctx.lineTo(m + x * s, Y + (marca ? 6 : 3));
    ctx.stroke();
    if (marca && largo - x > 1.6) ctx.fillText(x, m + x * s, Y + 8);
  }
  ctx.beginPath();                                     // marca del final
  ctx.moveTo(m + largo * s, Y);
  ctx.lineTo(m + largo * s, Y + 6);
  ctx.stroke();
  ctx.textAlign = "right";
  ctx.fillText(String(largo).replace(".", ",") + " m", m + largo * s, Y + 8);
}

// % de uso debajo de un eje, con el color de su estado
function etiquetaEje(v, x, y, u) {
  const { ctx, s, m } = v;
  ctx.font = "700 13px Archivo, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = u < 0 || u > 1 ? "#b42318" : u > 0.9 ? "#b85c14" : "#2f7d4f";
  ctx.fillText(u < 0 ? "se levanta" : Math.round(u * 100) + "%", m + x * s, m + y * s);
}

// Tractor de costado: cabina, ventana y chasis
function dibujarTractorCostado(v, c, piso, xTrompa, xEjeDel, xEjeTrac) {
  const { ctx, s, m } = v;
  const X = x => m + x * s, Y = y => m + y * s;
  ctx.fillStyle = "#3a4853";                           // chasis
  ctx.fillRect(X(xTrompa + 0.1), Y(piso + 0.05), (xEjeTrac + 0.9 - xTrompa) * s, 0.2 * s);
  ctx.fillStyle = "#5d6b75";                           // quinta rueda
  ctx.fillRect(X(c.perno - 0.45), Y(piso - 0.02), 0.9 * s, 0.1 * s);
  ctx.fillStyle = ASFALTO;                             // cabina
  ctx.beginPath();
  ctx.moveTo(X(xTrompa), Y(piso + 0.25));
  ctx.lineTo(X(xTrompa), Y(piso - 1.55));
  ctx.lineTo(X(xTrompa + 0.25), Y(piso - 1.85));
  ctx.lineTo(X(xTrompa + 2.3), Y(piso - 1.85));
  ctx.lineTo(X(xTrompa + 2.3), Y(piso + 0.25));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#9fc3dc";                           // parabrisas
  ctx.fillRect(X(xTrompa + 0.05), Y(piso - 1.55), 0.5 * s, 0.7 * s);
  ctx.fillStyle = "#dd6418";                           // franja naranja (zuncho)
  ctx.fillRect(X(xTrompa), Y(piso - 0.2), 2.3 * s, 0.08 * s);
}

// Tractor de arriba: cabina y chasis angosto
function dibujarTractorArriba(v, c, xTrompa, xEjeDel, xEjeTrac) {
  const { ctx, s, m } = v;
  ctx.fillStyle = "#3a4853";                           // chasis
  ctx.fillRect(m + xTrompa * s, m + (c.ancho / 2 - 0.45) * s, (xEjeTrac + 0.9 - xTrompa) * s, 0.9 * s);
  cubiertasArriba(v, xEjeDel, c.ancho, false);
  cubiertasArriba(v, xEjeTrac, c.ancho, false);
  ctx.fillStyle = ASFALTO;                             // cabina
  ctx.fillRect(m + xTrompa * s, m, 2.3 * s, c.ancho * s);
  ctx.fillStyle = "#9fc3dc";                           // techo con parabrisas
  ctx.fillRect(m + (xTrompa + 0.1) * s, m + 0.15 * s, 0.25 * s, (c.ancho - 0.3) * s);
}

function dibujarVistas(camion, r) {
  const resultado = document.getElementById("resultado");
  const caja = document.createElement("section");
  caja.className = "tarjeta vistas";
  caja.innerHTML = "<h2>Cómo queda cargado</h2>";
  resultado.appendChild(caja);

  // Vista 3D (vista3d.js): se puede girar con el dedo
  if (typeof crearVista3D === "function") crearVista3D(caja, camion, r);

  // Posición del tractor en metros desde el frente del semi (negativo = más adelante)
  const xEjeDel = camion.perno - camion.quintaRueda;   // eje delantero del tractor
  const xEjeTrac = xEjeDel + camion.ejeTraccion;       // eje de tracción
  const xTrompa = xEjeDel - 1.4;                       // frente de la cabina
  const xMin = Math.min(xTrompa, 0) - 0.2;
  const anchoDibujo = camion.largo + 0.2 - xMin;       // arriba y costado con la misma escala

  // % de uso de cada eje (para las etiquetas debajo de las ruedas)
  const uso = {
    delantero: r.ejes.delantero / camion.maxDelantero,
    traccion: r.ejes.traccion / camion.maxTraccion,
    semi: r.ejes.enEjeSemi / camion.maxSemi
  };

  // ---------- VISTA DE ARRIBA ----------
  const arriba = crearCanvas(caja, "De arriba", anchoDibujo, camion.ancho + 1.35, 900, xMin, -0.3);
  dibujarTractorArriba(arriba, camion, xTrompa, xEjeDel, xEjeTrac);
  arriba.ctx.fillStyle = "#f4f5f4";                    // piso del semi
  arriba.ctx.fillRect(arriba.m, arriba.m, camion.largo * arriba.s, camion.ancho * arriba.s);
  for (const eje of r.conf.ejes) cubiertasArriba(arriba, eje.x, camion.ancho, eje.levantado);

  for (const b of r.ubicados) {
    const d = b.detalle, p = d.pieza;
    const y0 = (camion.ancho - b.ancho) / 2;           // centrado a lo ancho
    if (b.tipo === "vigueta") {
      // De abajo hacia arriba: cada nivel tapa al de abajo (más arriba = más claro)
      recorrerPaquetes(b, camion, (l, x, y, n) => {
        paqueteArriba(arriba, x, y, l.largo, camion.anchoPaq, n);
        fajas(arriba, x, l.largo, y, y + camion.anchoPaq);
      });
    } else {
      for (let f = 0; f < d.filas; f++) {
        const n = b.filas[f].unidades;                   // pallets en esta fila
        const yFila = (camion.ancho - (n * (d.aLoAncho + d.sep) - d.sep)) / 2; // centrada a lo ancho
        for (let k = 0; k < n; k++)
          rect(arriba, b.posFilas[f], yFila + k * (d.aLoAncho + d.sep), d.aLoLargo, d.aLoAncho, b.color);
      }
    }
  }
  contorno(arriba, 0, 0, camion.largo, camion.ancho);
  for (const b of r.ubicados) if (b.amarre)            // fajas de amarre a lo ancho
    for (const p of b.amarre.posiciones)
      fajaAmarre(arriba, [[b.desde + p, -0.05], [b.desde + p, camion.ancho + 0.05]]);
  r.ubicados.forEach((b, i) => numero(arriba, (b.desde + b.hasta) / 2, camion.ancho / 2, i + 1));
  regla(arriba, camion.largo, camion.ancho + 0.35);

  // ---------- VISTA DE COSTADO ----------
  const piso = camion.alto;                            // y del piso del semi (desde arriba)
  const costado = crearCanvas(caja, "De costado", anchoDibujo, camion.alto + 1.5, 900, xMin, 0);
  contorno(costado, 0, 0, camion.largo, camion.alto, true);

  for (const b of r.ubicados) {
    const d = b.detalle, p = d.pieza;
    if (b.tipo === "vigueta") {
      // El lado de atrás más claro; el de adelante (lado 1) encima y opaco
      const h = camion.altoPaq;
      for (let lado = d.carriles - 1; lado >= 0; lado--) {
        costado.ctx.globalAlpha = lado === 0 ? 1 : 0.4;
        recorrerPaquetes(b, camion, (l, x, y, n, carril) => {
          if (carril !== lado) return;
          const arribaNivel = piso - (n + 1) * h;
          if (l.paquetes.length === 2) {               // dos de 12 apilados
            capaViguetaCostado(costado, x, arribaNivel, l.largo, h / 2);
            capaViguetaCostado(costado, x, arribaNivel + h / 2, l.largo, h / 2);
          } else {
            capaViguetaCostado(costado, x, arribaNivel, l.largo, h);
          }
          fajas(costado, x, l.largo, arribaNivel, arribaNivel + h * (1 - ALTO_TACO));
          if (lado === 0) textoLargo(costado, x + l.largo / 2, arribaNivel + h * 0.4, l.largo);
        });
      }
      costado.ctx.globalAlpha = 1;
    } else {
      for (let f = 0; f < d.filas; f++)
        rect(costado, b.posFilas[f], piso - p.alto, d.aLoLargo, p.alto, b.color);
    }
  }

  for (const b of r.ubicados) if (b.amarre)            // fajas de amarre: de arriba al chasis
    for (const p of b.amarre.posiciones)
      fajaAmarre(costado, [[b.desde + p, piso - altoPilaEn(b, camion, p) - 0.02], [b.desde + p, piso + 0.15]]);

  dibujarTractorCostado(costado, camion, piso, xTrompa, xEjeDel, xEjeTrac);

  const ctx = costado.ctx, s = costado.s, m = costado.m;
  ctx.fillStyle = "#24313c";                           // chasis del semi
  ctx.fillRect(m, m + piso * s, camion.largo * s, 0.18 * s);
  ctx.fillStyle = "#b42318";                           // perno rey
  ctx.beginPath();
  ctx.moveTo(m + camion.perno * s, m + (piso + 0.18) * s);
  ctx.lineTo(m + camion.perno * s - 5, m + (piso + 0.18) * s + 9);
  ctx.lineTo(m + camion.perno * s + 5, m + (piso + 0.18) * s + 9);
  ctx.fill();

  // Ruedas: tractor y semi (la levantada va más arriba y en gris)
  const ruta = piso + 0.87;                            // línea del piso de la ruta
  ctx.strokeStyle = "#8a969e";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(m + (xMin + 0.1) * s, m + ruta * s);
  ctx.lineTo(m + (camion.largo + 0.1) * s, m + ruta * s);
  ctx.stroke();
  rueda(costado, xEjeDel, piso + 0.45, false);
  rueda(costado, xEjeTrac, piso + 0.45, false);
  for (const eje of r.conf.ejes) {
    rueda(costado, eje.x, eje.levantado ? piso + 0.2 : piso + 0.45, eje.levantado);
    if (eje.levantado) flechaArriba(costado, eje.x, ruta, piso + 0.64);
  }

  // Centro de masas de la carga: línea punteada roja con "CM"
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle = "#b42318";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(m + r.cm * s, m + 0.45 * s);
  ctx.lineTo(m + r.cm * s, m + (piso + 0.18) * s);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = "700 12px Archivo, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("CM", m + r.cm * s, m + 0.42 * s);
  ctx.restore();

  // % de uso debajo de cada eje
  etiquetaEje(costado, xEjeDel, piso + 1.25, uso.delantero);
  etiquetaEje(costado, xEjeTrac, piso + 1.25, uso.traccion);
  etiquetaEje(costado, camion.ejeSemi, piso + 1.25, uso.semi);

  // ---------- VISTA DE FRENTE (ancho × alto) ----------
  const frente = crearCanvas(caja, "De frente", camion.ancho + 0.6, camion.alto + 1, 280, -0.2, 0);
  contorno(frente, 0, 0, camion.ancho, camion.alto, true);
  dibujarSemiFrente(frente, camion);
  frente.ctx.globalAlpha = 0.55; // semitransparente: se ven las cargas de atrás
  // Pallets primero y viguetas encima, para que se vea su perfil en T
  const ordenFrente = [...r.ubicados].sort((a, b) => (a.tipo === "vigueta") - (b.tipo === "vigueta"));
  for (const b of ordenFrente) {
    const d = b.detalle, p = d.pieza;
    const y0 = (camion.ancho - b.ancho) / 2;
    if (b.tipo === "vigueta") {
      frente.ctx.globalAlpha = 0.9; // las viguetas casi opacas, para ver el perfil
      // Por carril y nivel se ve el paquete de adelante (el primero del carril).
      // Si es de 12 se ve medio paquete; si son dos de 12 apilados, uno sobre otro.
      const h = camion.altoPaq;
      frente.ctx.globalAlpha = 1;
      d.niveles.forEach((nivel, n) => {
        nivel.forEach((carril, i) => {
          if (!carril.lugares.length) return;
          const y = inicioCarriles(b, camion) + i * (camion.anchoPaq + d.sep);
          const arribaNivel = camion.alto - (n + 1) * h;
          const delante = carril.lugares[0];
          if (delante.paquetes.length === 2) {
            paqueteFrente(frente, y, arribaNivel, camion.anchoPaq, h / 2, 12);
            paqueteFrente(frente, y, arribaNivel + h / 2, camion.anchoPaq, h / 2, 12);
          } else if (porPaquete(delante.largo) === 12) {
            paqueteFrente(frente, y, arribaNivel + h / 2, camion.anchoPaq, h / 2, 12);
          } else {
            paqueteFrente(frente, y, arribaNivel, camion.anchoPaq, h, 24);
          }
        });
        etiquetaNivel(frente, camion.ancho + 0.1, camion.alto - (n + 0.5) * h, n + 1);
      });
      frente.ctx.globalAlpha = 0.55;
    } else {
      for (let k = 0; k < Math.min(p.cantidad, d.porFila); k++)
        rect(frente, y0 + k * (d.aLoAncho + d.sep), camion.alto - p.alto, d.aLoAncho, p.alto, b.color);
    }
  }
  frente.ctx.globalAlpha = 1;

  // Faja de amarre vista de frente: sube del chasis, pasa por arriba y baja
  const pila = r.ubicados.find(b => b.tipo === "vigueta");
  if (pila && pila.amarre) {
    const y0 = inicioCarriles(pila, camion), y1 = y0 + pila.ancho;
    const tope = camion.alto - pila.detalle.niveles.length * camion.altoPaq - 0.03;
    fajaAmarre(frente, [[-0.03, camion.alto + 0.1], [y0, tope], [y1, tope], [camion.ancho + 0.03, camion.alto + 0.1]]);
  }
}

// Faja de amarre: línea amarilla con borde oscuro (puntos en metros)
function fajaAmarre(v, puntos) {
  const { ctx, s, m } = v;
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.lineJoin = "round";
  for (const [color, ancho] of [[ASFALTO, 5], ["#f5b800", 3]]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = ancho;
    ctx.beginPath();
    puntos.forEach(([x, y], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, m + x * s, m + y * s));
    ctx.stroke();
  }
  ctx.restore();
}

// ====== CONECTAR BOTONES ======
document.getElementById("btnAgregar").addEventListener("click", agregarCarga);
document.getElementById("btnCalcular").addEventListener("click", () => calcular());

// Mientras se escribe: marcar en rojo los datos del camión que no tienen sentido
for (const [id] of RANGOS_CAMION) {
  document.getElementById(id).addEventListener("input", () => marcarCampos(validarCamion(leerCamion())));
}
document.getElementById("ejeElevable").addEventListener("change", () => marcarCampos(validarCamion(leerCamion())));
document.getElementById("trabada").addEventListener("change", recalcularSiHayResultado);



// Campos de la carga según el tipo (viguetas: solo largo y cantidad)
document.getElementById("cargaTipo").addEventListener("change", actualizarCamposCarga);
actualizarCamposCarga();

// Mostrar la lista vacía al abrir la página
mostrarCargas();
