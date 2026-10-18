import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { agregarEjecucion, guardarControl, leerControl, leerHistorial, type Ejecucion } from "./historial";

// Cada prueba usa una carpeta temporal: no toca tus archivos reales de data/.
const carpeta = () => mkdtempSync(join(tmpdir(), "pharmai-"));

const ejecucion = (aprobadas: number): Ejecucion => ({
  fecha: new Date().toISOString(),
  red: "stellar-testnet",
  aprobadas,
  rechazadas: 0,
  transacciones: [],
  registro: [],
});

describe("Historial de auditoría", () => {
  it("empieza vacío si no hay archivo", () => {
    expect(leerHistorial(join(carpeta(), "h.json"))).toEqual({ pagosRealizados: [], ejecuciones: [] });
  });

  it("acumula ejecuciones en lugar de reemplazarlas", () => {
    const ruta = join(carpeta(), "h.json");
    agregarEjecucion(ejecucion(2), [], ruta);
    agregarEjecucion(ejecucion(0), [], ruta);
    const h = leerHistorial(ruta);
    expect(h.ejecuciones).toHaveLength(2);
    expect(h.ejecuciones[0].aprobadas).toBe(0); // la más reciente primero
  });

  it("lee el formato antiguo de la Etapa 6 sin perder los pagos", () => {
    const ruta = join(carpeta(), "h.json");
    writeFileSync(
      ruta,
      JSON.stringify({
        fecha: "2026-10-18T15:00:00Z",
        aprobadas: 0,
        rechazadas: 3,
        registro: [],
        estadoFinal: { pagosRealizados: [{ idempotencia: "a", importe: 54, fecha: "2026-10-18" }], saldoDisponible: 1 },
      }),
    );
    expect(leerHistorial(ruta).pagosRealizados).toHaveLength(1);
  });

  it("falla de forma segura si el archivo está dañado", () => {
    const ruta = join(carpeta(), "h.json");
    writeFileSync(ruta, "{ esto no es json");
    expect(() => leerHistorial(ruta)).toThrow("dañado");
  });
});

describe("Botón de emergencia", () => {
  it("por defecto los pagos están habilitados", () => {
    expect(leerControl(join(carpeta(), "c.json")).pagosDetenidos).toBe(false);
  });

  it("guarda y lee el estado detenido", () => {
    const ruta = join(carpeta(), "c.json");
    guardarControl(true, ruta);
    expect(leerControl(ruta).pagosDetenidos).toBe(true);
    guardarControl(false, ruta);
    expect(leerControl(ruta).pagosDetenidos).toBe(false);
  });

  it("si el archivo está dañado, detiene los pagos (rechazo por defecto)", () => {
    const ruta = join(carpeta(), "c.json");
    writeFileSync(ruta, "dañado");
    expect(leerControl(ruta).pagosDetenidos).toBe(true);
  });
});