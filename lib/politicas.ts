// Motor de políticas de pago de PrecioJusto Pharma AI.
//
// Reglas de oro:
// 1. Este código es INDEPENDIENTE de la IA. El agente puede proponer pagos,
//    pero solo este motor decide si se aprueban.
// 2. Rechazo por defecto: ante datos incompletos, errores o dudas, se rechaza.
// 3. Es una función pura: no firma, no paga y no guarda nada. Solo decide.

export type Red = "simulacion" | "stellar-testnet";

export type Politica = {
  limitePorTransaccion: number; // importe máximo de un solo pago
  presupuestoDiario: number; // suma máxima de pagos en un mismo día
  destinatariosPermitidos: string[]; // ids o cuentas autorizadas
  activosPermitidos: string[]; // por ejemplo ["XLM"]
  redesPermitidas: Red[]; // nunca incluye producción en el MVP
  pagosDetenidos: boolean; // botón de emergencia
};

export type SolicitudPago = {
  idempotencia: string; // identificador único del pago (evita duplicados)
  destinatario: string;
  activo: string;
  red: string;
  importe: number;
  fecha: string; // "AAAA-MM-DD"
  motivo: string; // para el registro de auditoría
};

export type PagoRegistrado = {
  idempotencia: string;
  importe: number;
  fecha: string;
};

export type EstadoPagos = {
  pagosRealizados: PagoRegistrado[];
  saldoDisponible: number;
};

export type DecisionPago = {
  aprobado: boolean;
  motivos: string[]; // vacío solo si se aprueba
};

const esNumeroValido = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

const esTextoValido = (t: unknown): t is string =>
  typeof t === "string" && t.trim().length > 0;

const esFechaValida = (f: unknown): f is string =>
  typeof f === "string" && /^\d{4}-\d{2}-\d{2}$/.test(f);

export function evaluarPago(
  solicitud: SolicitudPago,
  politica: Politica,
  estado: EstadoPagos,
): DecisionPago {
  try {
    // 1. Botón de emergencia: si está activo, no se evalúa nada más.
    if (politica.pagosDetenidos) {
      return {
        aprobado: false,
        motivos: ["Los pagos están detenidos por el botón de emergencia."],
      };
    }

    // 2. Datos completos y bien formados.
    const motivos: string[] = [];
    if (!esTextoValido(solicitud.idempotencia)) motivos.push("Falta el identificador de idempotencia.");
    if (!esTextoValido(solicitud.destinatario)) motivos.push("Falta el destinatario.");
    if (!esTextoValido(solicitud.activo)) motivos.push("Falta el activo.");
    if (!esTextoValido(solicitud.red)) motivos.push("Falta la red.");
    if (!esTextoValido(solicitud.motivo)) motivos.push("Falta el motivo del pago.");
    if (!esFechaValida(solicitud.fecha)) motivos.push("La fecha no es válida.");
    if (!esNumeroValido(solicitud.importe) || solicitud.importe <= 0) {
      motivos.push("El importe debe ser un número mayor a cero.");
    }
    if (!esNumeroValido(estado.saldoDisponible)) motivos.push("No se pudo verificar el saldo.");
    if (motivos.length > 0) return { aprobado: false, motivos };

    // 3. Reglas de la política.
    if (estado.pagosRealizados.some((p) => p.idempotencia === solicitud.idempotencia)) {
      motivos.push("Pago duplicado: ya existe un pago con este identificador.");
    }
    if (!politica.redesPermitidas.includes(solicitud.red as Red)) {
      motivos.push(`La red "${solicitud.red}" no está permitida.`);
    }
    if (!politica.activosPermitidos.includes(solicitud.activo)) {
      motivos.push(`El activo "${solicitud.activo}" no está permitido.`);
    }
    if (!politica.destinatariosPermitidos.includes(solicitud.destinatario)) {
      motivos.push("El destinatario no está en la lista permitida.");
    }
    if (solicitud.importe > politica.limitePorTransaccion) {
      motivos.push(
        `El importe ${solicitud.importe} supera el límite por transacción de ${politica.limitePorTransaccion}.`,
      );
    }

    const gastadoHoy = estado.pagosRealizados
      .filter((p) => p.fecha === solicitud.fecha)
      .reduce((suma, p) => suma + p.importe, 0);
    if (gastadoHoy + solicitud.importe > politica.presupuestoDiario) {
      motivos.push(
        `Se superaría el presupuesto diario de ${politica.presupuestoDiario} (ya gastado hoy: ${gastadoHoy}).`,
      );
    }

    if (solicitud.importe > estado.saldoDisponible) {
      motivos.push(`Saldo insuficiente: disponible ${estado.saldoDisponible}.`);
    }

    return { aprobado: motivos.length === 0, motivos };
  } catch {
    // Cualquier error inesperado también es un rechazo.
    return { aprobado: false, motivos: ["Error inesperado al evaluar el pago."] };
  }
}