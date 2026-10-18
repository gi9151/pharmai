import { describe, expect, it } from "vitest";
import {
  evaluarPago,
  type EstadoPagos,
  type Politica,
  type SolicitudPago,
} from "./politicas";

// Política de ejemplo, como la configuraría el administrador de la farmacia.
const politica: Politica = {
  limitePorTransaccion: 100,
  presupuestoDiario: 150,
  destinatariosPermitidos: ["prov-001", "prov-002"],
  activosPermitidos: ["XLM"],
  redesPermitidas: ["simulacion", "stellar-testnet"],
  pagosDetenidos: false,
};

const estadoVacio: EstadoPagos = { pagosRealizados: [], saldoDisponible: 1000 };

const solicitudValida: SolicitudPago = {
  idempotencia: "orden-001",
  destinatario: "prov-001",
  activo: "XLM",
  red: "stellar-testnet",
  importe: 54,
  fecha: "2026-10-18",
  motivo: "Reposición de Ibuprofeno",
};

describe("Motor de políticas de pago", () => {
  it("aprueba un pago que cumple todas las políticas", () => {
    const decision = evaluarPago(solicitudValida, politica, estadoVacio);
    expect(decision.aprobado).toBe(true);
    expect(decision.motivos).toEqual([]);
  });

  it("rechaza un pago que supera el límite por transacción", () => {
    const decision = evaluarPago({ ...solicitudValida, importe: 120 }, politica, estadoVacio);
    expect(decision.aprobado).toBe(false);
    expect(decision.motivos.join(" ")).toContain("límite por transacción");
  });

  it("rechaza un destinatario no permitido", () => {
    const decision = evaluarPago({ ...solicitudValida, destinatario: "prov-999" }, politica, estadoVacio);
    expect(decision.aprobado).toBe(false);
    expect(decision.motivos.join(" ")).toContain("lista permitida");
  });

  it("rechaza un pago duplicado (mismo identificador)", () => {
    const estado: EstadoPagos = {
      pagosRealizados: [{ idempotencia: "orden-001", importe: 54, fecha: "2026-10-18" }],
      saldoDisponible: 1000,
    };
    const decision = evaluarPago(solicitudValida, politica, estado);
    expect(decision.aprobado).toBe(false);
    expect(decision.motivos.join(" ")).toContain("duplicado");
  });

  it("rechaza si se supera el presupuesto diario acumulado", () => {
    const estado: EstadoPagos = {
      pagosRealizados: [{ idempotencia: "orden-000", importe: 100, fecha: "2026-10-18" }],
      saldoDisponible: 1000,
    };
    const decision = evaluarPago(solicitudValida, politica, estado);
    expect(decision.aprobado).toBe(false);
    expect(decision.motivos.join(" ")).toContain("presupuesto diario");
  });

  it("no cuenta pagos de otros días en el presupuesto diario", () => {
    const estado: EstadoPagos = {
      pagosRealizados: [{ idempotencia: "orden-000", importe: 100, fecha: "2026-10-17" }],
      saldoDisponible: 1000,
    };
    expect(evaluarPago(solicitudValida, politica, estado).aprobado).toBe(true);
  });

  it("rechaza un activo no permitido", () => {
    const decision = evaluarPago({ ...solicitudValida, activo: "USDC" }, politica, estadoVacio);
    expect(decision.aprobado).toBe(false);
  });

  it("rechaza una red no permitida (por ejemplo, producción)", () => {
    const decision = evaluarPago({ ...solicitudValida, red: "stellar-mainnet" }, politica, estadoVacio);
    expect(decision.aprobado).toBe(false);
    expect(decision.motivos.join(" ")).toContain("red");
  });

  it("rechaza si el saldo no alcanza", () => {
    const decision = evaluarPago(solicitudValida, politica, { pagosRealizados: [], saldoDisponible: 20 });
    expect(decision.aprobado).toBe(false);
    expect(decision.motivos.join(" ")).toContain("Saldo insuficiente");
  });

  it("rechaza todo cuando el botón de emergencia está activo", () => {
    const decision = evaluarPago(solicitudValida, { ...politica, pagosDetenidos: true }, estadoVacio);
    expect(decision.aprobado).toBe(false);
    expect(decision.motivos.join(" ")).toContain("emergencia");
  });

  it("rechaza datos incompletos o inválidos", () => {
    const casos: Partial<SolicitudPago>[] = [
      { idempotencia: "" },
      { destinatario: "   " },
      { importe: 0 },
      { importe: -10 },
      { importe: Number.NaN },
      { fecha: "18/10/2026" },
      { motivo: "" },
    ];
    for (const cambio of casos) {
      const decision = evaluarPago({ ...solicitudValida, ...cambio }, politica, estadoVacio);
      expect(decision.aprobado).toBe(false);
    }
  });

  it("rechaza ante un error inesperado (datos corruptos)", () => {
    const estadoRoto = { pagosRealizados: null, saldoDisponible: 1000 } as unknown as EstadoPagos;
    const decision = evaluarPago(solicitudValida, politica, estadoRoto);
    expect(decision.aprobado).toBe(false);
  });
});