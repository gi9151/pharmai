// Agente de compras de PrecioJusto Pharma AI.
//
// El agente solo puede usar las HERRAMIENTAS definidas aquí. No ejecuta consultas
// arbitrarias, no ve claves privadas y no decide si un pago se aprueba:
// eso lo hace el motor de políticas (lib/politicas.ts).
//
// Por ahora el agente usa reglas deterministas. Más adelante se podrá conectar
// un modelo de IA que elija qué herramientas usar, pero los límites seguirán
// aplicándose aquí, en el código.

import { recomendarTodo, type Recomendacion } from "./comparador";
import type { Cotizacion, Producto, Proveedor } from "./tipos";
import { evaluarPago, type EstadoPagos, type Politica, type SolicitudPago } from "./politicas";
import type { ServicioPagos } from "./pagos";

export type EntradaRegistro = {
  momento: number; // orden del paso dentro de la ejecución
  tipo: "analisis" | "propuesta" | "aprobado" | "rechazado" | "pago" | "error";
  mensaje: string;
};

export type ContextoAgente = {
  productos: Producto[];
  cotizaciones: Cotizacion[];
  proveedores: Proveedor[];
  politica: Politica;
  estado: EstadoPagos; // pagos ya realizados y saldo
  servicioPagos: ServicioPagos;
  fecha: string; // "AAAA-MM-DD"
  activo: string;
};

export type ResultadoAgente = {
  registro: EntradaRegistro[];
  estadoFinal: EstadoPagos;
  aprobadas: number;
  rechazadas: number;
};

// Herramientas explícitas: lo ÚNICO que el agente puede hacer.
export function crearHerramientas(ctx: ContextoAgente) {
  return {
    detectarReposiciones: (): Recomendacion[] =>
      recomendarTodo(ctx.productos, ctx.cotizaciones, ctx.proveedores),

    proponerOrden: (rec: Recomendacion): SolicitudPago | null => {
      if (!rec.elegida) return null;
      return {
        // Mismo producto + mismo proveedor + mismo día = mismo identificador.
        // Así, si el agente se ejecuta dos veces, el segundo pago se rechaza por duplicado.
        idempotencia: `orden-${rec.producto.id}-${rec.elegida.proveedor.id}-${ctx.fecha}`,
        destinatario: rec.elegida.proveedor.id,
        activo: ctx.activo,
        red: ctx.servicioPagos.red,
        importe: rec.elegida.costoTotal,
        fecha: ctx.fecha,
        motivo: `Reposición de ${rec.elegida.cantidad} u de ${rec.producto.nombreGenerico}`,
      };
    },
  };
}

export async function ejecutarAgente(ctx: ContextoAgente): Promise<ResultadoAgente> {
  const registro: EntradaRegistro[] = [];
  const anotar = (tipo: EntradaRegistro["tipo"], mensaje: string) =>
    registro.push({ momento: registro.length + 1, tipo, mensaje });

  // Copia del estado para no modificar el original.
  const estado: EstadoPagos = {
    pagosRealizados: [...ctx.estado.pagosRealizados],
    saldoDisponible: ctx.estado.saldoDisponible,
  };
  let aprobadas = 0;
  let rechazadas = 0;

  const herramientas = crearHerramientas(ctx);
  const recomendaciones = herramientas.detectarReposiciones();
  anotar("analisis", `Se detectaron ${recomendaciones.length} productos por debajo del stock mínimo.`);

  for (const rec of recomendaciones) {
    const solicitud = herramientas.proponerOrden(rec);
    if (!solicitud) {
      anotar("rechazado", `${rec.producto.nombreGenerico}: sin cotización válida. ${rec.explicacion}`);
      rechazadas++;
      continue;
    }

    anotar(
      "propuesta",
      `${rec.producto.nombreGenerico}: propone pagar ${solicitud.importe.toFixed(2)} ${solicitud.activo} a ${rec.elegida!.proveedor.nombre}. ${rec.explicacion}`,
    );

    const decision = evaluarPago(solicitud, ctx.politica, estado);
    if (!decision.aprobado) {
      anotar("rechazado", `${rec.producto.nombreGenerico}: rechazado por políticas. ${decision.motivos.join(" ")}`);
      rechazadas++;
      continue;
    }
    anotar("aprobado", `${rec.producto.nombreGenerico}: aprobado por el motor de políticas sin intervención humana.`);

    try {
      const resultado = await ctx.servicioPagos.ejecutar(solicitud, decision);
      if (resultado.estado === "rechazado") {
        anotar("error", `${rec.producto.nombreGenerico}: el servicio de pagos lo rechazó. ${resultado.error}`);
        rechazadas++;
        continue;
      }
      estado.pagosRealizados.push({
        idempotencia: solicitud.idempotencia,
        importe: solicitud.importe,
        fecha: solicitud.fecha,
      });
      estado.saldoDisponible -= solicitud.importe;
      anotar(
        "pago",
        resultado.estado === "confirmado"
          ? `${rec.producto.nombreGenerico}: pago CONFIRMADO en Stellar Testnet (hash ${resultado.referencia}). Activos de prueba, sin valor real.`
          : `${rec.producto.nombreGenerico}: pago SIMULADO registrado (ref. ${resultado.referencia}). No se movió dinero real.`,
      );
      aprobadas++;
    } catch {
      anotar("error", `${rec.producto.nombreGenerico}: error al ejecutar el pago. No se asume que se haya pagado.`);
      rechazadas++;
    }
  }

  anotar("analisis", `Resumen: ${aprobadas} pagos ejecutados, ${rechazadas} rechazados.`);
  return { registro, estadoFinal: estado, aprobadas, rechazadas };
}