
const productos = [
  { nombre: "Paracetamol 500 mg", categoria: "Analgésicos", stock: 120, minimo: 40, precio: 0.35 },
  { nombre: "Ibuprofeno 400 mg", categoria: "Antiinflamatorios", stock: 18, minimo: 30, precio: 0.8 },
  { nombre: "Amoxicilina 500 mg", categoria: "Antibióticos", stock: 12, minimo: 20, precio: 1.25 },
  { nombre: "Loratadina 10 mg", categoria: "Antialérgicos", stock: 65, minimo: 25, precio: 0.6 },
];

const proveedores = [
  { nombre: "Distribuidora Andina", precio: "Bs 32,00", entrega: "24 horas" },
  { nombre: "FarmaBol", precio: "Bs 29,50", entrega: "48 horas" },
  { nombre: "Medicamentos del Sur", precio: "Bs 34,00", entrega: "24 horas" },
];

const moneda = (valor: number) =>
  new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
  }).format(valor);

export default function Home() {
  const productosBajos = productos.filter((p) => p.stock < p.minimo);

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
            <p className="text-sm text-slate-500">
              Inicio / Panel principal
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Tu farmacia, más inteligente.
            </h2>
            <p className="mt-2 text-slate-500">
              Controla tus productos, compara precios y compra mejor.
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
            { titulo: "Alertas de inventario", valor: String(productosBajos.length), nota: "Requieren revisión" },
            { titulo: "Proveedores", valor: String(proveedores.length), nota: "Con precios de ejemplo" },
            { titulo: "Ahorro identificado", valor: "Bs 18,00", nota: "Estimación ficticia" },
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

        <div className="grid gap-6 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-2">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">Inventario de muestra</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Productos que necesitan seguimiento
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
                    <th className="pb-3 pr-4 font-medium">Stock</th>
                    <th className="pb-3 pr-4 font-medium">Mínimo</th>
                    <th className="pb-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => {
                    const bajo = producto.stock < producto.minimo;
                    return (
                      <tr
                        key={producto.nombre}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="py-4 pr-4">
                          <p className="font-semibold">{producto.nombre}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {producto.categoria}
                          </p>
                        </td>
                        <td className="py-4 pr-4">{producto.stock}</td>
                        <td className="py-4 pr-4">{producto.minimo}</td>
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

          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold">Comparación de proveedores</h3>
            <p className="mt-1 text-sm text-slate-500">
              Ejemplo de cotización para un pedido
            </p>

            <div className="mt-5 space-y-4">
              {proveedores.map((proveedor, index) => (
                <div
                  key={proveedor.nombre}
                  className="rounded-xl border border-slate-100 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {proveedor.nombre}
                    </p>
                    {index === 1 && (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                        Menor precio
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xl font-bold">{proveedor.precio}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Entrega estimada: {proveedor.entrega}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-400">
              Los precios y plazos son inventados. Verifica cotizaciones reales
              antes de comprar.
            </p>
          </article>
        </div>

        <footer className="mt-8 flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400">
          <p>PrecioJusto Pharma AI · Prototipo para ideathon</p>
          <p>Modo seguro: sin pagos ni conexiones bancarias</p>
        </footer>
      </section>
    </main>
  );
}
