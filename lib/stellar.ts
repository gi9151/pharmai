// Servicio de pagos en Stellar TESTNET.
//
// ⚠️ SOLO TESTNET: se niega a funcionar con cualquier otra red.
// ⚠️ Solo debe usarse en el servidor o en scripts. Nunca importarlo en componentes
//    que se ejecuten en el navegador, porque maneja la clave secreta.
//
// La clave secreta vive solo dentro de esta clase. El agente no puede leerla:
// solo puede llamar a ejecutar() con una decisión aprobada por el motor de políticas.

import { createHash } from "node:crypto";
import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Memo,
  Networks,
  Operation,
  StrKey,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import type { DecisionPago, SolicitudPago } from "./politicas";
import type { ResultadoPago, ServicioPagos } from "./pagos";

export const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";

export type ConfigStellar = {
  horizonUrl: string;
  secretoPagador: string | undefined;
  // Proveedor del sistema -> cuenta pública de Stellar autorizada.
  cuentasProveedores: Record<string, string | undefined>;
};

export class ServicioPagosStellarTestnet implements ServicioPagos {
  readonly red = "stellar-testnet" as const;
  readonly #par: Keypair; // privado: no accesible desde fuera de la clase
  readonly #servidor: Horizon.Server;
  readonly #cuentas: Record<string, string | undefined>;

  constructor(config: ConfigStellar) {
    if (config.horizonUrl !== HORIZON_TESTNET) {
      throw new Error("Este servicio solo funciona con Stellar Testnet.");
    }
    if (!config.secretoPagador || !StrKey.isValidEd25519SecretSeed(config.secretoPagador)) {
      throw new Error("Falta la clave del pagador o no es válida (revisa .env.local).");
    }
    this.#par = Keypair.fromSecret(config.secretoPagador);
    this.#servidor = new Horizon.Server(config.horizonUrl);
    this.#cuentas = config.cuentasProveedores;
  }

  get cuentaPublica(): string {
    return this.#par.publicKey();
  }

  async saldoXLM(): Promise<number> {
    const cuenta = await this.#servidor.loadAccount(this.cuentaPublica);
    const nativo = cuenta.balances.find((b) => b.asset_type === "native");
    return nativo ? Number(nativo.balance) : 0;
  }

  async ejecutar(solicitud: SolicitudPago, decision: DecisionPago): Promise<ResultadoPago> {
    // Controles previos a la firma (rechazo por defecto).
    if (!decision.aprobado) {
      return { estado: "rechazado", error: "La solicitud no fue aprobada por el motor de políticas." };
    }
    if (solicitud.red !== this.red) {
      return { estado: "rechazado", error: `Este servicio solo opera en "${this.red}".` };
    }
    if (solicitud.activo !== "XLM") {
      return { estado: "rechazado", error: "Por ahora solo se admite XLM de prueba." };
    }
    const destino = this.#cuentas[solicitud.destinatario];
    if (!destino || !StrKey.isValidEd25519PublicKey(destino)) {
      return { estado: "rechazado", error: "El proveedor no tiene una cuenta Stellar autorizada." };
    }
    if (destino === this.cuentaPublica) {
      return { estado: "rechazado", error: "No se puede pagar a la propia cuenta." };
    }

    try {
      const cuenta = await this.#servidor.loadAccount(this.cuentaPublica);
      // El memo guarda la huella del identificador de idempotencia para poder auditarlo.
      const huella = createHash("sha256").update(solicitud.idempotencia).digest("hex");

      const transaccion = new TransactionBuilder(cuenta, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: destino,
            asset: Asset.native(),
            amount: solicitud.importe.toFixed(7),
          }),
        )
        .addMemo(Memo.hash(huella))
        .setTimeout(60)
        .build();

      transaccion.sign(this.#par);
      const envio = await this.#servidor.submitTransaction(transaccion);

      // No afirmamos que se pagó hasta consultar la red y ver que fue exitosa.
      const verificada = await this.#servidor.transactions().transaction(envio.hash).call();
      if (!verificada.successful) {
        return { estado: "rechazado", error: `La transacción ${envio.hash} no fue exitosa en la red.` };
      }
      return { estado: "confirmado", referencia: envio.hash };
    } catch (error) {
      // Nunca incluimos datos sensibles en el mensaje. Solo los códigos de Horizon, si existen.
      const codigos = (error as { response?: { data?: { extras?: { result_codes?: unknown } } } })
        ?.response?.data?.extras?.result_codes;
      return {
        estado: "rechazado",
        error: `Error al enviar la transacción${codigos ? `: ${JSON.stringify(codigos)}` : ""}. No se asume que se haya pagado.`,
      };
    }
  }
}