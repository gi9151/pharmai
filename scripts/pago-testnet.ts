// Ejecuta el agente con pagos REALES en Stellar TESTNET (activos de prueba, sin valor).
// Verifica cada transacción en la red y AGREGA la ejecución al historial de auditoría.
//
// Uso:  pnpm exec tsx scripts/pago-testnet.ts

import { ejecutarAgente } from "../lib/agente";
import { cotizaciones, productos, proveedores } from "../lib/datos";
import { politicaTestnet } from "../lib/configuracion";
import { agregarEjecucion, ARCHIVO_HISTORIAL, leerControl, leerHistorial } from "../lib/historial";
import { HORIZON_TESTNET, ServicioPagosStellarTestnet } from "../lib/stellar";

async function main() {
  process.loadEnvFile(".env.local");

  // Botón de emergencia: lo revisa el código, no la IA.
  const control = leerControl();
  if (control.pagosDetenidos) {
    console.log("⛔ Los pagos están detenidos por el botón de emergencia. Reanúdalos desde el panel.\n");
  }

  const servicio = new ServicioPagosStellarTestnet({
    horizonUrl: HORIZON_TESTNET,
    secretoPagador: process.env.STELLAR_PAGADOR_SECRET,
    cuentasProveedores: { "prov-001": process.env.STELLAR_PROVEEDOR_PROV001_PUBLIC },
  });

  const saldo = await servicio.saldoXLM();
  console.log(`Cuenta de la farmacia: ${servicio.cuentaPublica}`);
  console.log(`Saldo verificado en Testnet: ${saldo} XLM de prueba\n`);

  // Pagos de ejecuciones anteriores: así el agente no los repite (idempotencia).
  const historial = leerHistorial();

  const resultado = await ejecutarAgente({
    productos,
    cotizaciones,
    proveedores,
    politica: { ...politicaTestnet, pagosDetenidos: control.pagosDetenidos },
    estado: { pagosRealizados: historial.pagosRealizados, saldoDisponible: saldo },
    servicioPagos: servicio,
    fecha: new Date().toISOString().slice(0, 10),
    activo: "XLM",
  });

  for (const entrada of resultado.registro) {
    console.log(`[${entrada.tipo}] ${entrada.mensaje}`);
  }

  if (resultado.transacciones.length > 0) {
    console.log("\nVerifica las transacciones en el explorador:");
    for (const t of resultado.transacciones) {
      console.log(`${t.producto}: https://stellar.expert/explorer/testnet/tx/${t.referencia}`);
    }
  }

  const nuevo = agregarEjecucion(
    {
      fecha: new Date().toISOString(),
      red: servicio.red,
      aprobadas: resultado.aprobadas,
      rechazadas: resultado.rechazadas,
      transacciones: resultado.transacciones,
      registro: resultado.registro,
    },
    resultado.estadoFinal.pagosRealizados,
  );
  console.log(`\nEjecución agregada a ${ARCHIVO_HISTORIAL} (${nuevo.ejecuciones.length} en total).`);
}

main().catch((error) => {
  console.error("❌ Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});