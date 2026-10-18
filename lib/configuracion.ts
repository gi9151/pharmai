// Configuración del agente definida por el ADMINISTRADOR de la farmacia.
// Valores ficticios para la demo. Los importes están en bolivianos simulados.

import type { EstadoPagos, Politica } from "./politicas";

export const FECHA_DEMO = "2026-10-18";
export const ACTIVO_DEMO = "BOB-SIM";

export const politicaDemo: Politica = {
  limitePorTransaccion: 60,
  presupuestoDiario: 120,
  destinatariosPermitidos: ["prov-001", "prov-002"], // Medicamentos del Sur no está autorizado
  activosPermitidos: [ACTIVO_DEMO],
  redesPermitidas: ["simulacion"],
  pagosDetenidos: false,
};

export const estadoInicialDemo: EstadoPagos = {
  pagosRealizados: [],
  saldoDisponible: 500,
};

// Política para la prueba en Stellar Testnet (importes en XLM de prueba, sin valor).
export const politicaTestnet: Politica = {
  limitePorTransaccion: 60,
  presupuestoDiario: 120,
  destinatariosPermitidos: ["prov-001"], // solo la cuenta de prueba autorizada
  activosPermitidos: ["XLM"],
  redesPermitidas: ["stellar-testnet"],
  pagosDetenidos: false,
};