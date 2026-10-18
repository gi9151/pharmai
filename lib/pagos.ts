// Servicio de pagos de PrecioJusto Pharma AI.
//
// Este es el único lugar que "ejecuta" pagos. El agente NUNCA tiene acceso
// a claves ni puede llamar aquí sin una decisión aprobada por el motor de políticas.
// En esta etapa todo es SIMULADO: no se mueve dinero ni activos reales.

import type { DecisionPago, SolicitudPago } from "./politicas";

export type ResultadoPago =
  | { estado: "simulado"; referencia: string }
  | { estado: "confirmado"; referencia: string } // verificado en la red (referencia = hash)
  | { estado: "rechazado"; error: string };

export interface ServicioPagos {
  readonly red: "simulacion" | "stellar-testnet";
  ejecutar(solicitud: SolicitudPago, decision: DecisionPago): Promise<ResultadoPago>;
}

export class ServicioPagosSimulado implements ServicioPagos {
  readonly red = "simulacion" as const;

  async ejecutar(solicitud: SolicitudPago, decision: DecisionPago): Promise<ResultadoPago> {
    // Doble control: aunque alguien llame mal a este servicio, sin aprobación no se paga.
    if (!decision.aprobado) {
      return { estado: "rechazado", error: "La solicitud no fue aprobada por el motor de políticas." };
    }
    if (solicitud.red !== this.red) {
      return { estado: "rechazado", error: `Este servicio solo opera en la red "${this.red}".` };
    }
    return { estado: "simulado", referencia: `SIM-${solicitud.idempotencia}` };
  }
}