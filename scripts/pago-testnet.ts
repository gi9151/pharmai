// Ejecuta el agente con pagos REALES en Stellar TESTNET (activos de prueba, sin valor).
// Verifica cada transacción en la red y guarda el registro en data/registro-testnet.json.
//
// Uso:  pnpm exec tsx scripts/pago-testnet.ts

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { PagoRegistrado } from "../lib/politicas";
import { ejecutarAgente } from "../lib/agente";
import { cotizaciones, productos, proveedores } from "../lib/datos";
import { politicaTestnet } from "../lib/configuracion";
import { HORIZON_TESTNET, ServicioPagosStellarTestnet } from "../lib/stellar";

async function main() {
  process.loadEnvFile(".env.local");

  const servicio = new ServicioPagosStellarTestnet({
    horizonUrl: HORIZON_TESTNET,
    secretoPagador: process.env.STELLAR_PAGADOR_SECRET,
    cuentasProveedores: { "prov-001": process.env.STELLAR_PROVEEDOR_PROV001_PUBLIC },
  });

  const saldo = await servicio.saldoXLM();
  console.log(`Cuenta de la farmacia: ${servicio.cuentaPublica}`);
  console.log(`Saldo verificado en Testnet: ${saldo} XLM de prueba\n`);

  // Pagos ya hechos en ejecuciones anteriores: así el agente no los repite (idempotencia).
  const REGISTRO = "data/registro-testnet.json";
  const pagosAnteriores: PagoRegistrado[] = existsSync(REGISTRO)
    ? JSON.parse(readFileSync(REGISTRO, "utf8")).estadoFinal.pagosRealizados
    : [];

  // La fecha de hoy forma parte del identificador idempotente de cada orden.
  const hoy = new Date().toISOString().slice(0, 10);

  const resultado = await ejecutarAgente({
    productos,
    cotizaciones,
    proveedores,
    politica: politicaTestnet,
    estado: { pagosRealizados: pagosAnteriores, saldoDisponible: saldo },
    servicioPagos: servicio,
    fecha: hoy,
    activo: "XLM",
  });

  for (const entrada of resultado.registro) {
    console.log(`[${entrada.tipo}] ${entrada.mensaje}`);
  }

  const hashes = resultado.registro
    .map((e) => e.mensaje.match(/hash ([0-9a-f]{64})/)?.[1])
    .filter(Boolean);
  if (hashes.length > 0) {
    console.log("\nVerifica las transacciones en el explorador:");
    for (const h of hashes) console.log(`https://stellar.expert/explorer/testnet/tx/${h}`);
  }

  mkdirSync("data", { recursive: true });
  writeFileSync(
    REGISTRO,
    JSON.stringify({ fecha: new Date().toISOString(), ...resultado }, null, 2),
  );
  console.log("\nRegistro guardado en data/registro-testnet.json");
}

main().catch((error) => {
  console.error("❌ Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});