// Crea dos cuentas de PRUEBA en Stellar Testnet y las fondea con Friendbot.
// - Pagador: la cuenta de la farmacia (su clave secreta se guarda en .env.local).
// - Proveedor: la cuenta de prueba autorizada de "Distribuidora Andina (demo)".
//
// Uso:  pnpm exec tsx scripts/crear-cuentas-testnet.ts

import { existsSync, appendFileSync, readFileSync } from "node:fs";
import { Keypair } from "@stellar/stellar-sdk";

const ARCHIVO = ".env.local";

if (existsSync(ARCHIVO) && readFileSync(ARCHIVO, "utf8").includes("STELLAR_PAGADOR_SECRET")) {
  console.log(`Ya existen cuentas en ${ARCHIVO}. No se crean nuevas.`);
  process.exit(0);
}

async function fondear(publica: string) {
  const respuesta = await fetch(`https://friendbot.stellar.org/?addr=${publica}`);
  if (!respuesta.ok) throw new Error(`Friendbot respondió ${respuesta.status}`);
}

async function main() {
  const pagador = Keypair.random();
  const proveedor = Keypair.random();

  console.log("Fondeando cuentas con Friendbot (Testnet)...");
  await fondear(pagador.publicKey());
  await fondear(proveedor.publicKey());

  appendFileSync(
    ARCHIVO,
    [
      "",
      "# Stellar TESTNET (activos de prueba, sin valor). NO subir a GitHub.",
      `STELLAR_PAGADOR_SECRET=${pagador.secret()}`,
      `STELLAR_PROVEEDOR_PROV001_PUBLIC=${proveedor.publicKey()}`,
      "",
    ].join("\n"),
  );

  // Solo mostramos claves PÚBLICAS. La secreta queda únicamente en .env.local.
  console.log("✅ Cuentas creadas y guardadas en .env.local");
  console.log(`Pagador (farmacia):   https://stellar.expert/explorer/testnet/account/${pagador.publicKey()}`);
  console.log(`Proveedor (prov-001): https://stellar.expert/explorer/testnet/account/${proveedor.publicKey()}`);
}

main().catch((error) => {
  console.error("❌ No se pudieron crear las cuentas:", error instanceof Error ? error.message : error);
  process.exit(1);
});