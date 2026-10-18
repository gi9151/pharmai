import { describe, expect, it } from "vitest";
import { ejecutarAgente, type ContextoAgente } from "./agente";
import { cotizaciones, productos, proveedores } from "./datos";
import { ACTIVO_DEMO, estadoInicialDemo, FECHA_DEMO, politicaDemo } from "./configuracion";
import { ServicioPagosSimulado } from "./pagos";

const contexto = (cambios: Partial<ContextoAgente> = {}): ContextoAgente => ({
  productos,
  cotizaciones,
  proveedores,
  politica: politicaDemo,
  estado: estadoInicialDemo,
  servicioPagos: new ServicioPagosSimulado(),
  fecha: FECHA_DEMO,
  activo: ACTIVO_DEMO,
  ...cambios,
});

describe("Agente de compras", () => {
  it("paga sin confirmación lo que cumple las políticas y rechaza lo demás", async () => {
    const r = await ejecutarAgente(contexto());
    // Ibuprofeno (54) y Amoxicilina (51,40) entran en el presupuesto diario de 120.
    // Omeprazol (54,90) lo superaría, así que se rechaza.
    expect(r.aprobadas).toBe(2);
    expect(r.rechazadas).toBe(1);
    expect(r.estadoFinal.saldoDisponible).toBeCloseTo(500 - 54 - 51.4);
    expect(r.registro.some((e) => e.mensaje.includes("presupuesto diario"))).toBe(true);
  });

  it("no repite pagos si se ejecuta dos veces (idempotencia)", async () => {
    const primera = await ejecutarAgente(contexto());
    const segunda = await ejecutarAgente(contexto({ estado: primera.estadoFinal }));
    expect(segunda.aprobadas).toBe(0);
    expect(segunda.registro.some((e) => e.mensaje.includes("duplicado"))).toBe(true);
  });

  it("no paga nada con el botón de emergencia activo", async () => {
    const r = await ejecutarAgente(contexto({ politica: { ...politicaDemo, pagosDetenidos: true } }));
    expect(r.aprobadas).toBe(0);
    expect(r.estadoFinal.pagosRealizados).toHaveLength(0);
  });

  it("no paga a un proveedor fuera de la lista permitida", async () => {
    const r = await ejecutarAgente(
      contexto({ politica: { ...politicaDemo, destinatariosPermitidos: ["prov-002"], presupuestoDiario: 1000 } }),
    );
    // Todas las compras recomendadas son a prov-001, que ya no está permitido.
    expect(r.aprobadas).toBe(0);
    expect(r.registro.some((e) => e.mensaje.includes("lista permitida"))).toBe(true);
  });

  it("no asume que pagó si el servicio de pagos falla", async () => {
    const servicioRoto = {
      red: "simulacion" as const,
      ejecutar: async () => {
        throw new Error("caída");
      },
    };
    const r = await ejecutarAgente(contexto({ servicioPagos: servicioRoto }));
    expect(r.aprobadas).toBe(0);
    expect(r.estadoFinal.pagosRealizados).toHaveLength(0);
  });
});