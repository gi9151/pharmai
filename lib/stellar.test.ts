import { describe, expect, it } from "vitest";
import { Keypair } from "@stellar/stellar-sdk";
import { HORIZON_TESTNET, ServicioPagosStellarTestnet } from "./stellar";
import type { SolicitudPago } from "./politicas";

// Estas pruebas NO usan internet: comprueban los controles previos a la firma.
const pagador = Keypair.random();
const proveedor = Keypair.random();

const crear = () =>
  new ServicioPagosStellarTestnet({
    horizonUrl: HORIZON_TESTNET,
    secretoPagador: pagador.secret(),
    cuentasProveedores: { "prov-001": proveedor.publicKey() },
  });

const solicitud: SolicitudPago = {
  idempotencia: "orden-test",
  destinatario: "prov-001",
  activo: "XLM",
  red: "stellar-testnet",
  importe: 10,
  fecha: "2026-10-18",
  motivo: "Prueba",
};
const aprobada = { aprobado: true, motivos: [] };

describe("Servicio de pagos Stellar Testnet", () => {
  it("se niega a usar una red que no sea Testnet", () => {
    expect(
      () =>
        new ServicioPagosStellarTestnet({
          horizonUrl: "https://horizon.stellar.org", // red principal (dinero real)
          secretoPagador: pagador.secret(),
          cuentasProveedores: {},
        }),
    ).toThrow("Testnet");
  });

  it("no arranca sin una clave válida", () => {
    expect(
      () =>
        new ServicioPagosStellarTestnet({
          horizonUrl: HORIZON_TESTNET,
          secretoPagador: undefined,
          cuentasProveedores: {},
        }),
    ).toThrow();
  });

  it("no firma una solicitud que no fue aprobada", async () => {
    const r = await crear().ejecutar(solicitud, { aprobado: false, motivos: ["x"] });
    expect(r.estado).toBe("rechazado");
  });

  it("no firma para un proveedor sin cuenta autorizada", async () => {
    const r = await crear().ejecutar({ ...solicitud, destinatario: "prov-999" }, aprobada);
    expect(r.estado).toBe("rechazado");
  });

  it("no firma otro activo ni otra red", async () => {
    expect((await crear().ejecutar({ ...solicitud, activo: "USDC" }, aprobada)).estado).toBe("rechazado");
    expect((await crear().ejecutar({ ...solicitud, red: "simulacion" }, aprobada)).estado).toBe("rechazado");
  });

  it("no expone la clave secreta", () => {
    const servicio = crear();
    expect(JSON.stringify(servicio)).not.toContain(pagador.secret());
    expect(servicio.cuentaPublica).toBe(pagador.publicKey());
  });
});