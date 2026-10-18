import { cotizaciones, farmacia, productos, proveedores } from "../lib/datos";
import { necesitaReposicion, recomendarTodo } from "../lib/comparador";
import { ejecutarAgente } from "../lib/agente";
import { ServicioPagosSimulado } from "../lib/pagos";
import {
  ACTIVO_DEMO,
  estadoInicialDemo,
  FECHA_DEMO,
  politicaDemo,
} from "../lib/configuracion";
import { leerControl, leerHistorial } from "../lib/historial";
import { cambiarPagosDetenidos } from "../lib/acciones";



const estilosRegistro: Record<string, string> = {
  analisis: "bg-slate-100 text-slate-700",
  propuesta: "bg-sky-50 text-sky-700",
  aprobado: "bg-emerald-50 text-emerald-700",
  pago: "bg-emerald-100 text-emerald-800",
  rechazado: "bg-red-50 text-red-700",
  error: "bg-red-100 text-red-800",
};

const moneda = (valor: number) =>
  new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
  }).format(valor);

export default async function Home() {
  const productosBajos = productos.filter(necesitaReposicion);
  const control = leerControl();
  let historial;
  let errorHistorial: string | null = null;
  try {
    historial = leerHistorial();
  } catch (error) {
    historial = { pagosRealizados: [], ejecuciones: [] };
    errorHistorial = error instanceof Error ? error.message : "No se pudo leer el historial.";
  }
  const pagosTestnet = historial.ejecuciones.flatMap((ejecucion) =>
    ejecucion.transacciones.map((t) => ({ ...t, fechaEjecucion: ejecucion.fecha })),
  );
  const agente = await ejecutarAgente({
    productos,
    cotizaciones,
    proveedores,
    politica: { ...politicaDemo, pagosDetenidos: control.pagosDetenidos },
    estado: estadoInicialDemo,
    servicioPagos: new ServicioPagosSimulado(),
    fecha: FECHA_DEMO,
    activo: ACTIVO_DEMO,
  });
  const recomendaciones = recomendarTodo(productos, cotizaciones, proveedores);
  const ahorroTotal = recomendaciones.reduce(
    (suma, r) => suma + r.ahorroFrenteHabitual,
    0,
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-6 lg:block">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-bold text-white">
            P
          </div>
          <div>
            <h1 className="text-lg font-bold">PrecioJusto</h1>
            <p className="text-xs text-slate-500">Pharma AI · Bolivia</p>
          </div>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Menú principal
        </p>
        <nav className="space-y-2">
          {[
            ["▦", "Panel principal"],
            ["⇄", "Comparar proveedores"],
            ["▤", "Inventario"],
            ["◷", "Compras inteligentes"],
            ["☷", "Actividad"],
          ].map(([icono, texto], index) => (
            <div
              key={texto}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
                index === 0
                  ? "bg-emerald-50 font-semibold text-emerald-700"
                  : "text-slate-600"
              }`}
            >
              <span>{icono}</span>
              {texto}
            </div>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-slate-900 p-4 text-white">
          <p className="text-sm font-semibold">Asistente inteligente</p>
          <p className="mt-2 text-xs leading-5 text-slate-300">
            Encuentra mejores precios y anticipa faltantes de stock.
          </p>
          <span className="mt-3 inline-block rounded-full bg-emerald-400/20 px-3 py-1 text-xs text-emerald-300">
            ● Modo demostración
          </span>
        </div>
      </aside>

      <section className="mx-auto max-w-7xl p-5 sm:p-8 lg:ml-64 lg:p-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Inicio / Panel principal</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Tu farmacia, más inteligente.
            </h2>
            <p className="mt-2 text-slate-500">
              {farmacia.nombre} · {farmacia.ciudad}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-500">Mercado</p>
            <p className="font-semibold">Bolivia · BOB (Bs)</p>
          </div>
        </header>

        <div className="mb-8 rounded-3xl bg-gradient-to-r from-emerald-800 to-teal-600 p-6 text-white sm:p-8">
          <p className="text-sm font-medium text-emerald-100">
            PRECIOJUSTO PHARMA AI
          </p>
          <h3 className="mt-3 max-w-2xl text-2xl font-bold sm:text-3xl">
            Compra con inteligencia. Ahorra en cada pedido.
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50">
            Compara proveedores, detecta productos que necesitan reposición y
            toma decisiones basadas en datos.
          </p>
          <div className="mt-5 inline-flex rounded-xl bg-white/15 px-4 py-2 text-sm">
            ✦ Datos ficticios para demostración
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { titulo: "Productos registrados", valor: String(productos.length), nota: "En el catálogo de prueba" },
            { titulo: "Alertas de inventario", valor: String(productosBajos.length), nota: "Por debajo del stock mínimo" },
            { titulo: "Proveedores", valor: String(proveedores.length), nota: `${cotizaciones.length} cotizaciones de ejemplo` },
            { titulo: "Ahorro identificado", valor: moneda(ahorroTotal), nota: "Frente al proveedor habitual" },
          ].map((dato) => (
            <article
              key={dato.titulo}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{dato.titulo}</p>
              <p className="mt-3 text-3xl font-bold">{dato.valor}</p>
              <p className="mt-2 text-xs text-slate-400">{dato.nota}</p>
            </article>
          ))}
        </div>

        <article className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Inventario</h3>
              <p className="mt-1 text-sm text-slate-500">
                Existencias actuales frente al stock mínimo
              </p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              {productosBajos.length} alertas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Producto</th>
                  <th className="pb-3 pr-4 font-medium">Existencias</th>
                  <th className="pb-3 pr-4 font-medium">Mínimo</th>
                  <th className="pb-3 pr-4 font-medium">Precio compra</th>
                  <th className="pb-3 pr-4 font-medium">Proveedor</th>
                  <th className="pb-3 pr-4 font-medium">Vence</th>
                  <th className="pb-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => {
                  const bajo = necesitaReposicion(producto);
                  const proveedor = proveedores.find(
                    (p) => p.id === producto.proveedorId,
                  );
                  return (
                    <tr
                      key={producto.id}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="py-4 pr-4">
                        <p className="font-semibold">{producto.nombreGenerico}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {producto.presentacion}
                        </p>
                      </td>
                      <td className="py-4 pr-4">{producto.existencias}</td>
                      <td className="py-4 pr-4">{producto.stockMinimo}</td>
                      <td className="py-4 pr-4">{moneda(producto.precioCompra)}</td>
                      <td className="py-4 pr-4 text-slate-600">
                        {proveedor?.nombre ?? "—"}
                      </td>
                      <td className="py-4 pr-4 text-slate-600">
                        {producto.vencimiento ?? "—"}
                      </td>
                      <td className="py-4">
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                            bajo
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {bajo ? "Reponer" : "Disponible"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <h3 className="mb-4 text-lg font-bold">Comparación de proveedores</h3>
        <div className="grid gap-6 xl:grid-cols-3">
          {recomendaciones.map((rec) => (
            <article
              key={rec.producto.id}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <p className="font-bold">{rec.producto.nombreGenerico}</p>
              <p className="mt-1 text-sm text-slate-500">
                Se necesitan {rec.cantidadNecesaria} unidades
              </p>

              <div className="mt-5 space-y-3">
                {rec.evaluaciones.map((ev) => {
                  const elegida = rec.elegida?.cotizacion.id === ev.cotizacion.id;
                  return (
                    <div
                      key={ev.cotizacion.id}
                      className={`rounded-xl border p-4 ${
                        elegida
                          ? "border-emerald-300 bg-emerald-50/50"
                          : ev.valida
                            ? "border-slate-100"
                            : "border-slate-100 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold">{ev.proveedor.nombre}</p>
                        {elegida && (
                          <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
                            Recomendado
                          </span>
                        )}
                        {!ev.valida && (
                          <span className="whitespace-nowrap rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                            Rechazado
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xl font-bold">{moneda(ev.costoTotal)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {ev.cantidad} u × {moneda(ev.cotizacion.precioUnitario)} +{" "}
                        {moneda(ev.costoTransporte)} transporte · entrega{" "}
                        {ev.cotizacion.entregaHoras} h · vence {ev.cotizacion.vencimiento}
                      </p>
                      {ev.motivosRechazo.map((motivo) => (
                        <p key={motivo} className="mt-1 text-xs text-red-600">
                          {motivo}
                        </p>
                      ))}
                    </div>
                  );
                })}
              </div>

              <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                <span className="font-semibold">¿Por qué?</span> {rec.explicacion}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-3">
          <article
            className={`rounded-2xl border p-6 ${
              control.pagosDetenidos
                ? "border-red-300 bg-red-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <h3 className="text-lg font-bold">Control de pagos</h3>
            <p className="mt-1 text-sm text-slate-500">
              Entornos: simulación (panel) y Stellar Testnet (script)
            </p>
            <p
              className={`mt-5 text-2xl font-bold ${
                control.pagosDetenidos ? "text-red-700" : "text-emerald-700"
              }`}
            >
              {control.pagosDetenidos ? "⛔ Pagos detenidos" : "● Pagos habilitados"}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {control.pagosDetenidos
                ? "El agente seguirá analizando y proponiendo, pero no ejecutará ningún pago."
                : "El agente paga solo lo que cumple todas las políticas."}
            </p>
            <form action={cambiarPagosDetenidos} className="mt-5">
              <input
                type="hidden"
                name="accion"
                value={control.pagosDetenidos ? "reanudar" : "detener"}
              />
              <button
                type="submit"
                className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white ${
                  control.pagosDetenidos
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {control.pagosDetenidos
                  ? "Reanudar pagos"
                  : "Botón de emergencia: detener pagos"}
              </button>
            </form>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-2">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">Pagos en Stellar Testnet</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Verificados en la red · activos de prueba, sin valor real
                </p>
              </div>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                {historial.ejecuciones.length} ejecuciones registradas
              </span>
            </div>
            {errorHistorial && (
              <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {errorHistorial}
              </p>
            )}
            {pagosTestnet.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aún no hay pagos con enlace guardado. Ejecuta{" "}
                <code className="rounded bg-slate-100 px-1">pnpm exec tsx scripts/pago-testnet.ts</code>
              </p>
            ) : (
              <ul className="space-y-3">
                {pagosTestnet.map((pago) => (
                  <li
                    key={pago.referencia}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 p-4 text-sm"
                  >
                    <div>
                      <p className="font-semibold">{pago.producto}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {pago.importe.toFixed(2)} {pago.activo} ·{" "}
                        {new Date(pago.fechaEjecucion).toLocaleString("es-BO")}
                      </p>
                    </div>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${pago.referencia}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700"
                    >
                      Ver transacción ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>

        <article className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Actividad del agente (simulación)</h3>
              <p className="mt-1 text-sm text-slate-500">
                Límite por pago: {moneda(politicaDemo.limitePorTransaccion)} ·
                Presupuesto diario: {moneda(politicaDemo.presupuestoDiario)}
              </p>
            </div>
            <div className="flex gap-2 text-xs font-medium">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                {agente.aprobadas} pagados
              </span>
              <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">
                {agente.rechazadas} rechazados
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                Pagos: simulación
              </span>
            </div>
          </div>
          <ol className="space-y-2">
            {agente.registro.map((entrada) => (
              <li key={entrada.momento} className="flex gap-3 text-sm">
                <span
                  className={`h-fit whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ${estilosRegistro[entrada.tipo]}`}
                >
                  {entrada.tipo}
                </span>
                <span className="text-slate-700">{entrada.mensaje}</span>
              </li>
            ))}
          </ol>
        </article>

        <footer className="mt-8 flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400">
          <p>PrecioJusto Pharma AI · Prototipo para ideathon</p>
          <p>Modo seguro: solo simulación y Stellar Testnet, sin dinero real</p>
        </footer>
      </section>
    </main>
  );
}