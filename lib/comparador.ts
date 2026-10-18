import type { Cotizacion, Producto, Proveedor } from "./tipos";

// Reglas del comparador. Son explícitas para que cualquier persona pueda revisarlas.
export const REGLAS = {
  // Fecha fija para que la demo siempre dé el mismo resultado.
  fechaReferencia: "2026-10-18",
  // Un lote debe tener al menos estos días de vida útil para aceptarse.
  diasMinimosVencimiento: 180,
  // Se repone hasta este múltiplo del stock mínimo.
  multiploReposicion: 2,
};

export type EvaluacionCotizacion = {
  cotizacion: Cotizacion;
  proveedor: Proveedor;
  cantidad: number;
  costoProductos: number;
  costoTransporte: number;
  costoTotal: number;
  diasVidaUtil: number;
  valida: boolean;
  motivosRechazo: string[];
};

export type Recomendacion = {
  producto: Producto;
  cantidadNecesaria: number;
  evaluaciones: EvaluacionCotizacion[];
  elegida: EvaluacionCotizacion | null;
  ahorroFrenteHabitual: number;
  explicacion: string;
};

const redondear = (valor: number) => Math.round(valor * 100) / 100;

function diasEntre(desde: string, hasta: string): number {
  const ms = new Date(hasta).getTime() - new Date(desde).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function necesitaReposicion(producto: Producto): boolean {
  return producto.existencias < producto.stockMinimo;
}

export function cantidadNecesaria(producto: Producto): number {
  const objetivo = producto.stockMinimo * REGLAS.multiploReposicion;
  return Math.max(objetivo - producto.existencias, 0);
}

export function evaluarCotizacion(
  cotizacion: Cotizacion,
  necesaria: number,
  proveedores: Proveedor[],
): EvaluacionCotizacion | null {
  const proveedor = proveedores.find((p) => p.id === cotizacion.proveedorId);
  if (!proveedor) return null; // Rechazo por defecto si faltan datos.

  const cantidad = Math.max(necesaria, cotizacion.cantidadMinima);
  const costoProductos = redondear(cantidad * cotizacion.precioUnitario);
  const costoTransporte = proveedor.costoTransporte;
  const diasVidaUtil = diasEntre(REGLAS.fechaReferencia, cotizacion.vencimiento);

  const motivosRechazo: string[] = [];
  if (cotizacion.disponible < cantidad) {
    motivosRechazo.push(
      `Solo tiene ${cotizacion.disponible} unidades y se necesitan ${cantidad}.`,
    );
  }
  if (diasVidaUtil < REGLAS.diasMinimosVencimiento) {
    motivosRechazo.push(
      `El lote vence en ${diasVidaUtil} días (mínimo ${REGLAS.diasMinimosVencimiento}).`,
    );
  }

  return {
    cotizacion,
    proveedor,
    cantidad,
    costoProductos,
    costoTransporte,
    costoTotal: redondear(costoProductos + costoTransporte),
    diasVidaUtil,
    valida: motivosRechazo.length === 0,
    motivosRechazo,
  };
}

export function recomendarCompra(
  producto: Producto,
  cotizaciones: Cotizacion[],
  proveedores: Proveedor[],
): Recomendacion {
  const necesaria = cantidadNecesaria(producto);

  const evaluaciones = cotizaciones
    .filter((c) => c.productoId === producto.id)
    .map((c) => evaluarCotizacion(c, necesaria, proveedores))
    .filter((e): e is EvaluacionCotizacion => e !== null)
    .sort((a, b) => a.costoTotal - b.costoTotal);

  // Gana el menor costo total entre las válidas; si empatan, la entrega más rápida.
  const validas = evaluaciones
    .filter((e) => e.valida)
    .sort(
      (a, b) =>
        a.costoTotal - b.costoTotal ||
        a.cotizacion.entregaHoras - b.cotizacion.entregaHoras,
    );
  const elegida = validas[0] ?? null;

  const habitual = validas.find((e) => e.proveedor.id === producto.proveedorId);
  const ahorroFrenteHabitual =
    elegida && habitual ? redondear(habitual.costoTotal - elegida.costoTotal) : 0;

  let explicacion: string;
  if (evaluaciones.length === 0) {
    explicacion = "No hay cotizaciones disponibles para este producto.";
  } else if (!elegida) {
    explicacion = "Ninguna cotización cumple las reglas. No se recomienda comprar.";
  } else {
    const masBarataUnitaria = [...evaluaciones].sort(
      (a, b) => a.cotizacion.precioUnitario - b.cotizacion.precioUnitario,
    )[0];
    explicacion = `Se elige ${elegida.proveedor.nombre} por tener el menor costo total válido (${elegida.cantidad} unidades + transporte).`;
    if (masBarataUnitaria.cotizacion.id !== elegida.cotizacion.id) {
      explicacion += ` ${masBarataUnitaria.proveedor.nombre} tenía el precio unitario más bajo, pero ${
        masBarataUnitaria.valida
          ? "su costo total era mayor."
          : masBarataUnitaria.motivosRechazo.join(" ").toLowerCase()
      }`;
    }
  }

  return {
    producto,
    cantidadNecesaria: necesaria,
    evaluaciones,
    elegida,
    ahorroFrenteHabitual,
    explicacion,
  };
}

export function recomendarTodo(
  productos: Producto[],
  cotizaciones: Cotizacion[],
  proveedores: Proveedor[],
): Recomendacion[] {
  return productos
    .filter(necesitaReposicion)
    .map((p) => recomendarCompra(p, cotizaciones, proveedores));
}