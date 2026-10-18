// Historial de auditoría y control de emergencia, guardados en archivos JSON.
//
// ⚠️ Solo servidor o scripts (usa el sistema de archivos).
// Para el MVP usamos archivos; más adelante esto se reemplazará por PostgreSQL
// sin cambiar el resto del código, porque todo pasa por estas funciones.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { EntradaRegistro, TransaccionAgente } from "./agente";
import type { PagoRegistrado } from "./politicas";

export const ARCHIVO_HISTORIAL = "data/registro-testnet.json";
export const ARCHIVO_CONTROL = "data/control.json";

export type Ejecucion = {
  fecha: string; // fecha y hora ISO
  red: string;
  aprobadas: number;
  rechazadas: number;
  transacciones: TransaccionAgente[];
  registro: EntradaRegistro[];
};

export type Historial = {
  pagosRealizados: PagoRegistrado[]; // base para la idempotencia
  ejecuciones: Ejecucion[]; // más reciente primero
};

export type Control = {
  pagosDetenidos: boolean;
  actualizado: string | null;
};

function leerJson(ruta: string): unknown {
  if (!existsSync(ruta)) return null;
  try {
    return JSON.parse(readFileSync(ruta, "utf8"));
  } catch {
    // Archivo dañado: no se puede confiar en él.
    throw new Error(`El archivo ${ruta} está dañado. Revísalo antes de continuar.`);
  }
}

function guardarJson(ruta: string, datos: unknown) {
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, JSON.stringify(datos, null, 2));
}

export function leerHistorial(ruta = ARCHIVO_HISTORIAL): Historial {
  const datos = leerJson(ruta) as Record<string, unknown> | null;
  if (!datos) return { pagosRealizados: [], ejecuciones: [] };

  // Formato nuevo.
  if (Array.isArray(datos.ejecuciones) && Array.isArray(datos.pagosRealizados)) {
    return datos as unknown as Historial;
  }

  // Formato antiguo (Etapa 6): una sola ejecución con estadoFinal.
  const estadoFinal = datos.estadoFinal as { pagosRealizados?: PagoRegistrado[] } | undefined;
  if (estadoFinal && Array.isArray(estadoFinal.pagosRealizados)) {
    return {
      pagosRealizados: estadoFinal.pagosRealizados,
      ejecuciones: [
        {
          fecha: String(datos.fecha ?? ""),
          red: "stellar-testnet",
          aprobadas: Number(datos.aprobadas ?? 0),
          rechazadas: Number(datos.rechazadas ?? 0),
          transacciones: [],
          registro: (datos.registro as EntradaRegistro[]) ?? [],
        },
      ],
    };
  }

  throw new Error(`El archivo ${ruta} tiene un formato desconocido.`);
}

export function agregarEjecucion(
  ejecucion: Ejecucion,
  pagosRealizados: PagoRegistrado[],
  ruta = ARCHIVO_HISTORIAL,
): Historial {
  const anterior = leerHistorial(ruta);
  const nuevo: Historial = {
    pagosRealizados,
    ejecuciones: [ejecucion, ...anterior.ejecuciones], // se acumula, nunca se borra
  };
  guardarJson(ruta, nuevo);
  return nuevo;
}

export function leerControl(ruta = ARCHIVO_CONTROL): Control {
  try {
    const datos = leerJson(ruta) as Partial<Control> | null;
    if (!datos) return { pagosDetenidos: false, actualizado: null };
    // Si el valor no es claramente "false", se consideran detenidos (rechazo por defecto).
    return { pagosDetenidos: datos.pagosDetenidos !== false, actualizado: datos.actualizado ?? null };
  } catch {
    return { pagosDetenidos: true, actualizado: null };
  }
}

export function guardarControl(pagosDetenidos: boolean, ruta = ARCHIVO_CONTROL): Control {
  const control: Control = { pagosDetenidos, actualizado: new Date().toISOString() };
  guardarJson(ruta, control);
  return control;
}