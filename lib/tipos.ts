// Tipos principales de PrecioJusto Pharma AI.
// Todos los datos del MVP son ficticios.

export type Farmacia = {
  id: string;
  nombre: string;
  ciudad: string;
};

export type Producto = {
  id: string;
  nombreGenerico: string;
  presentacion: string;
  categoria: string;
  existencias: number;
  stockMinimo: number;
  precioCompra: number; // Bs por unidad, último precio pagado
  proveedorId: string; // proveedor habitual
  vencimiento: string | null; // fecha ISO "AAAA-MM-DD" del lote actual
};

export type Proveedor = {
  id: string;
  nombre: string;
  ciudad: string;
  costoTransporte: number; // Bs fijos por pedido
};

export type Cotizacion = {
  id: string;
  productoId: string;
  proveedorId: string;
  precioUnitario: number; // Bs
  cantidadMinima: number; // unidades mínimas por pedido
  disponible: number; // unidades que el proveedor puede entregar
  entregaHoras: number;
  vencimiento: string; // fecha ISO del lote ofrecido
};
