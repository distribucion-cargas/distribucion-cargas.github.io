// ====== VISTA 3D (sin librerías) ======
// Motor 3D chiquito, hecho a mano para que ande sin internet en iPhone y Android:
//  - Todo se arma con "caras" (polígonos en metros).
//  - Las cajas grandes se cortan en baldosas de 0,5 m para que el orden de dibujo
//    (de lo más lejos a lo más cerca) salga bien.
//  - Se gira arrastrando con el dedo y se acerca pellizcando (o con la ruedita).
//
// Ejes (en metros): x = a lo largo (0 = frente del semi, el tractor queda en x negativas)
//                   y = a lo ancho · z = para arriba (0 = la ruta)

const ALTO_PISO_3D = 1.2;          // altura del piso del semi sobre la ruta
const BALDOSA_3D = 0.5;            // tamaño máximo de cada pedacito de cara
const LUZ_3D = normalizar3([0.35, -0.55, 0.75]);

// ---------- Vectores ----------
function suma3(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function resta3(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function escala3(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
function punto3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cruz3(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function normalizar3(a) { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }

// ---------- Armado de caras ----------
// Una cara: { pts: [[x,y,z]...], n: normal, color, bordes: [true/false por lado], doble }
function caraPlana(pts, color, doble = true, encima = 0.1) {
  const n = normalizar3(cruz3(resta3(pts[1], pts[0]), resta3(pts[2], pts[0])));
  return { pts, n, color, bordes: pts.map(() => true), doble, encima };
}

// Caja: x0..x1, y0..y1, z0..z1. Cada cara se corta en baldosas.
// "encima" (en metros): para piezas finas pegadas a otra (parabrisas, fajas),
// que se dibujen arriba de la cara que tocan aunque las baldosas no coincidan.
function caja3(caras, x0, x1, y0, y1, z0, z1, color, encima = 0) {
  const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
  const lados = [
    [[x0, y0, z0], [dx, 0, 0], [0, dy, 0], [0, 0, -1]],   // abajo
    [[x0, y0, z1], [dx, 0, 0], [0, dy, 0], [0, 0, 1]],    // arriba
    [[x0, y0, z0], [dx, 0, 0], [0, 0, dz], [0, -1, 0]],   // costado y0
    [[x0, y1, z0], [dx, 0, 0], [0, 0, dz], [0, 1, 0]],    // costado y1
    [[x0, y0, z0], [0, dy, 0], [0, 0, dz], [-1, 0, 0]],   // frente
    [[x1, y0, z0], [0, dy, 0], [0, 0, dz], [1, 0, 0]]     // atrás
  ];
  for (const [o, u, v, n] of lados) {
    const nu = Math.max(1, Math.ceil(Math.hypot(...u) / BALDOSA_3D));
    const nv = Math.max(1, Math.ceil(Math.hypot(...v) / BALDOSA_3D));
    for (let i = 0; i < nu; i++)
      for (let j = 0; j < nv; j++) {
        const p = (a, b) => suma3(o, suma3(escala3(u, a / nu), escala3(v, b / nv)));
        caras.push({
          pts: [p(i, j), p(i + 1, j), p(i + 1, j + 1), p(i, j + 1)],
          n, color,
          bordes: [j === 0, i === nu - 1, j === nv - 1, i === 0],   // solo el contorno de la caja
          doble: false, encima
        });
      }
  }
}

// Rueda: cilindro acostado a lo ancho (eje en y), centro en (x, z)
function rueda3(caras, x, z, r, y0, y1, color) {
  const lados = 14;
  const ang = i => (i / lados) * Math.PI * 2;
  const borde = (i, y) => [x + Math.cos(ang(i)) * r, y, z + Math.sin(ang(i)) * r];
  for (let i = 0; i < lados; i++) {
    const n = normalizar3([Math.cos(ang(i + 0.5)), 0, Math.sin(ang(i + 0.5))]);
    caras.push({ pts: [borde(i, y0), borde(i + 1, y0), borde(i + 1, y1), borde(i, y1)], n, color, bordes: [false, false, false, false], doble: false });
  }
  const tapa = y => Array.from({ length: lados }, (_, i) => borde(i, y));
  caras.push({ pts: tapa(y0), n: [0, -1, 0], color, bordes: tapa(y0).map(() => true), doble: false });
  caras.push({ pts: tapa(y1), n: [0, 1, 0], color, bordes: tapa(y1).map(() => true), doble: false });
  // Llanta (más clara) a cada lado
  const llanta = (y, s) => Array.from({ length: lados }, (_, i) =>
    [x + Math.cos(ang(i)) * r * 0.45, y + s, z + Math.sin(ang(i)) * r * 0.45]);
  caras.push({ pts: llanta(y0, -0.005), n: [0, -1, 0], color: "#c8ced2", bordes: llanta(y0, 0).map(() => false), doble: false, encima: 0.1 });
  caras.push({ pts: llanta(y1, 0.005), n: [0, 1, 0], color: "#c8ced2", bordes: llanta(y1, 0).map(() => false), doble: false, encima: 0.1 });
}

// ---------- La escena: camión + carga ----------
function armarEscena3D(camion, r) {
  const caras = [];
  const Z0 = ALTO_PISO_3D, W = camion.ancho;

  // Semi: piso, largueros y ruedas
  caja3(caras, 0, camion.largo, 0, W, Z0 - 0.15, Z0, "#3a4853");
  caja3(caras, 0, camion.largo, 0.35, 0.55, Z0 - 0.45, Z0 - 0.15, ASFALTO);
  caja3(caras, 0, camion.largo, W - 0.55, W - 0.35, Z0 - 0.45, Z0 - 0.15, ASFALTO);
  const ruedasDobles = (x, z, color) => {
    rueda3(caras, x, z, 0.5, -0.05, 0.23, color);
    rueda3(caras, x, z, 0.5, 0.26, 0.54, color);
    rueda3(caras, x, z, 0.5, W - 0.54, W - 0.26, color);
    rueda3(caras, x, z, 0.5, W - 0.23, W + 0.05, color);
  };
  for (const eje of r.conf.ejes)
    ruedasDobles(eje.x, eje.levantado ? 0.75 : 0.5, eje.levantado ? "#8c969e" : ASFALTO);

  // Tractor (misma ubicación que en las vistas 2D)
  const xEjeDel = camion.perno - camion.quintaRueda;
  const xEjeTrac = xEjeDel + camion.ejeTraccion;
  const xTrompa = xEjeDel - 1.4;
  caja3(caras, xTrompa + 0.1, xEjeTrac + 0.9, W / 2 - 0.45, W / 2 + 0.45, 0.75, 1.0, "#3a4853");   // chasis
  caja3(caras, camion.perno - 0.45, camion.perno + 0.45, W / 2 - 0.5, W / 2 + 0.5, 1.0, Z0 - 0.15, "#5d6b75"); // quinta rueda
  caja3(caras, xTrompa, xTrompa + 2.3, 0.05, W - 0.05, 0.85, 3.3, ASFALTO);                         // cabina
  // Parabrisas y franja amarilla: caras planas pegadas a la cabina (de un solo lado)
  const xf = xTrompa - 0.01, xa = xTrompa + 2.3, y0c = 0.04, y1c = W - 0.04;
  caras.push(caraPlana([[xf, 0.25, 2.2], [xf, 0.25, 3.05], [xf, W - 0.25, 3.05], [xf, W - 0.25, 2.2]], "#9fc3dc", false, 0.4));
  caras.push(caraPlana([[xf, y0c, 1.55], [xf, y0c, 1.65], [xf, y1c, 1.65], [xf, y1c, 1.55]], "#dd6418", false, 0.4));
  caras.push(caraPlana([[xTrompa, y0c, 1.55], [xa, y0c, 1.55], [xa, y0c, 1.65], [xTrompa, y0c, 1.65]], "#dd6418", false, 0.4));
  caras.push(caraPlana([[xTrompa, y1c, 1.55], [xTrompa, y1c, 1.65], [xa, y1c, 1.65], [xa, y1c, 1.55]], "#dd6418", false, 0.4));
  rueda3(caras, xEjeDel, 0.5, 0.5, 0.0, 0.3, ASFALTO);
  rueda3(caras, xEjeDel, 0.5, 0.5, W - 0.3, W, ASFALTO);
  ruedasDobles(xEjeTrac, 0.5, ASFALTO);

  // Carga
  for (const b of r.ubicados) {
    if (b.tipo === "vigueta") {
      const h = camion.altoPaq;
      recorrerPaquetes(b, camion, (l, x, y, n) => {
        const z = Z0 + n * h;
        if (l.paquetes.length === 2) {                  // dos de 12 apilados
          paquete3(caras, x, y, z, l.largo, camion.anchoPaq, h / 2);
          paquete3(caras, x, y, z + h / 2, l.largo, camion.anchoPaq, h / 2);
        } else if (porPaquete(l.largo) === 12) {         // uno solo de 12
          paquete3(caras, x, y, z, l.largo, camion.anchoPaq, h / 2);
        } else {
          paquete3(caras, x, y, z, l.largo, camion.anchoPaq, h);
        }
      });
      // Fajas de amarre: suben del borde del piso, pasan por arriba y bajan
      if (b.amarre) {
        const y0 = inicioCarriles(b, camion), y1 = y0 + b.ancho;
        for (const p of b.amarre.posiciones) {
          const X = b.desde + p, arriba = Z0 + altoPilaEn(b, camion, p) + 0.02, a = 0.04;
          const tramo = (pa, pb) => caras.push(caraPlana([
            [X - a, pa[0], pa[1]], [X + a, pa[0], pa[1]], [X + a, pb[0], pb[1]], [X - a, pb[0], pb[1]]], "#f5b800"));
          tramo([-0.01, Z0 - 0.15], [y0 - 0.01, arriba]);
          tramo([y0 - 0.01, arriba], [y1 + 0.01, arriba]);
          tramo([y1 + 0.01, arriba], [W + 0.01, Z0 - 0.15]);
        }
      }
    } else {
      const d = b.detalle, p = d.pieza;
      for (let f = 0; f < d.filas; f++) {
        const n = b.filas[f].unidades;
        const yFila = (W - (n * (d.aLoAncho + d.sep) - d.sep)) / 2;
        for (let k = 0; k < n; k++) {
          const x = b.posFilas[f], y = yFila + k * (d.aLoAncho + d.sep);
          caja3(caras, x, x + d.aLoLargo, y, y + d.aLoAncho, Z0, Z0 + 0.14, COLOR_TACO);
          caja3(caras, x, x + d.aLoLargo, y, y + d.aLoAncho, Z0 + 0.14, Z0 + p.alto, b.color);
        }
      }
    }
  }

  const xMin = xTrompa, xMax = camion.largo;
  return { caras, centro: [(xMin + xMax) / 2, W / 2, 1.6], tamano: xMax - xMin };
}

// Paquete de viguetas: tacos abajo, cuerpo de hormigón y fajas naranjas
function paquete3(caras, x, y, z, largo, ancho, alto) {
  const hTaco = alto * ALTO_TACO;
  for (const f of [0.2, 0.8])
    caja3(caras, x + largo * f - 0.06, x + largo * f + 0.06, y, y + ancho, z, z + hTaco, COLOR_TACO);
  caja3(caras, x, x + largo, y, y + ancho, z + hTaco, z + alto, COLOR_VIGUETA);
  for (const f of largo > 6 ? [0.15, 0.5, 0.85] : [0.2, 0.8])
    caja3(caras, x + largo * f - 0.02, x + largo * f + 0.02, y - 0.01, y + ancho + 0.01, z + hTaco, z + alto + 0.01, COLOR_FAJA, 0.15);
}

// ---------- Cámara y dibujo ----------
function crearVista3D(contenedor, camion, r) {
  const h3 = document.createElement("h3");
  h3.textContent = "En 3D";
  contenedor.appendChild(h3);
  const ayuda = document.createElement("p");
  ayuda.className = "nota";
  ayuda.textContent = "Arrastrá para girar · pellizcá (o usá la ruedita) para acercar.";
  contenedor.appendChild(ayuda);

  const escena = armarEscena3D(camion, r);
  const anchoCss = Math.min(contenedor.clientWidth - 36 || 300, 900);
  const altoCss = Math.round(Math.min(Math.max(anchoCss * 0.75, 260), 480));
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement("canvas");
  canvas.className = "lienzo lienzo-3d";
  canvas.width = anchoCss * dpr;
  canvas.height = altoCss * dpr;
  canvas.style.width = anchoCss + "px";
  canvas.style.height = altoCss + "px";
  contenedor.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // Botones de vistas rápidas
  const botones = document.createElement("div");
  botones.className = "botones-3d";
  contenedor.appendChild(botones);

  const inicial = { giro: -2.2, inclinacion: 0.42, distancia: escena.tamano * 1.25 };
  const cam = { ...inicial };
  const vistas = [
    ["Inicial", inicial],
    ["Atrás", { giro: 0, inclinacion: 0.15, distancia: escena.tamano * 0.9 }],
    ["Costado", { giro: -Math.PI / 2, inclinacion: 0.1, distancia: escena.tamano * 1.4 }],
    ["Arriba", { giro: -Math.PI / 2, inclinacion: 1.5, distancia: escena.tamano * 1.15 }]
  ];
  for (const [nombre, v] of vistas) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = nombre;
    btn.onclick = () => { Object.assign(cam, v); pedirDibujo(); };
    botones.appendChild(btn);
  }

  let pendiente = false;
  function pedirDibujo() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; dibujar(); });
  }

  function dibujar() {
    const W = anchoCss, H = altoCss;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Cielo y ruta
    const fondo = ctx.createLinearGradient(0, 0, 0, H);
    fondo.addColorStop(0, "#dfe7ee");
    fondo.addColorStop(1, "#f4f5f4");
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, W, H);

    // Cámara: gira alrededor del centro del camión
    const T = escena.centro;
    const C = suma3(T, escala3([
      Math.cos(cam.inclinacion) * Math.cos(cam.giro),
      Math.cos(cam.inclinacion) * Math.sin(cam.giro),
      Math.sin(cam.inclinacion)], cam.distancia));
    const adelante = normalizar3(resta3(T, C));
    let derecha = cruz3(adelante, [0, 0, 1]);
    if (Math.hypot(...derecha) < 1e-6) derecha = [1, 0, 0];
    derecha = normalizar3(derecha);
    const arriba = cruz3(derecha, adelante);
    const foco = Math.min(W, H * 1.4) * 1.05;
    const proyectar = p => {
      const d = resta3(p, C);
      const zc = punto3(d, adelante);
      if (zc < 0.1) return null;
      return [W / 2 + foco * punto3(d, derecha) / zc, H / 2 - foco * punto3(d, arriba) / zc];
    };

    // Ruta: un rectángulo grande en z = 0 (siempre atrás de todo)
    const ruta = [[-14, -8, 0], [14, -8, 0], [14, 8, 0], [-14, 8, 0]].map(p => suma3(p, [T[0], T[1], 0]));
    if (C[2] > 0) dibujarPoligono(ruta.map(proyectar), "#c9ced1", null);

    // Caras visibles, de la más lejana a la más cercana
    const visibles = [];
    for (const c of escena.caras) {
      const centro = escala3(c.pts.reduce(suma3, [0, 0, 0]), 1 / c.pts.length);
      let n = c.n;
      if (punto3(n, resta3(C, centro)) <= 0) {
        if (!c.doble) continue;
        n = escala3(n, -1);                              // cara de dos lados: se ve la de atrás
      }
      const pts2 = c.pts.map(proyectar);
      if (pts2.some(p => !p)) continue;
      const d = resta3(centro, C);
      visibles.push({ c, n, pts2, dist: Math.hypot(...d) - (c.encima || 0) });
    }
    visibles.sort((a, b) => b.dist - a.dist);
    for (const v of visibles) {
      const luz = 0.55 + 0.45 * Math.max(0, punto3(v.n, LUZ_3D));
      dibujarPoligono(v.pts2, sombrear(v.c.color, luz), v.c.bordes);
    }
  }

  function dibujarPoligono(pts, color, bordes) {
    if (pts.some(p => !p)) return;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = color;                             // tapa las rayitas entre baldosas
    ctx.lineWidth = 0.8;
    ctx.stroke();
    if (!bordes) return;
    ctx.strokeStyle = "rgba(20, 28, 36, 0.45)";          // contorno de cada caja
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    pts.forEach((p, i) => {
      if (!bordes[i]) return;
      const q = pts[(i + 1) % pts.length];
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(q[0], q[1]);
    });
    ctx.stroke();
  }

  // ---------- Dedo y mouse ----------
  const punteros = new Map();
  let distPellizco = 0;
  canvas.addEventListener("pointerdown", e => {
    canvas.setPointerCapture(e.pointerId);
    punteros.set(e.pointerId, [e.clientX, e.clientY]);
    if (punteros.size === 2) distPellizco = separacion();
  });
  canvas.addEventListener("pointermove", e => {
    if (!punteros.has(e.pointerId)) return;
    const [px, py] = punteros.get(e.pointerId);
    punteros.set(e.pointerId, [e.clientX, e.clientY]);
    if (punteros.size === 1) {
      cam.giro -= (e.clientX - px) * 0.008;
      cam.inclinacion = Math.min(1.55, Math.max(0.02, cam.inclinacion + (e.clientY - py) * 0.008));
    } else if (punteros.size === 2) {
      const d = separacion();
      if (distPellizco > 0) acercar(distPellizco / d);
      distPellizco = d;
    }
    pedirDibujo();
  });
  const soltar = e => { punteros.delete(e.pointerId); distPellizco = punteros.size === 2 ? separacion() : 0; };
  canvas.addEventListener("pointerup", soltar);
  canvas.addEventListener("pointercancel", soltar);
  canvas.addEventListener("wheel", e => { e.preventDefault(); acercar(1 + e.deltaY * 0.001); pedirDibujo(); }, { passive: false });

  function separacion() {
    const [a, b] = [...punteros.values()];
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  }
  function acercar(factor) {
    cam.distancia = Math.min(escena.tamano * 3, Math.max(escena.tamano * 0.3, cam.distancia * factor));
  }

  dibujar();
}

// Aclara u oscurece un color "#rrggbb" (luz: 0 = negro, 1 = igual)
function sombrear(hex, luz) {
  const v = parseInt(hex.slice(1), 16);
  const c = k => Math.round(((v >> k) & 255) * luz);
  return `rgb(${c(16)}, ${c(8)}, ${c(0)})`;
}
