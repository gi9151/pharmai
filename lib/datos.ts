import type { Cotizacion, Farmacia, Producto, Proveedor } from "./tipos";

// ⚠️ Datos 100% ficticios para demostración. No son precios ni empresas reales.

export const farmacia: Farmacia = {
  id: "farm-001",
  nombre: "Farmacia Demo Illimani",
  ciudad: "La Paz",
};

export const proveedores: Proveedor[] = [
  { id: "prov-001", nombre: "Distribuidora Andina (demo)", ciudad: "La Paz", costoTransporte: 15 },
  { id: "prov-002", nombre: "FarmaBol (demo)", ciudad: "El Alto", costoTransporte: 25 },
  { id: "prov-003", nombre: "Medicamentos del Sur (demo)", ciudad: "Cochabamba", costoTransporte: 40 },
];

export const productos: Producto[] = [
  {
    id: "prod-001",
    nombreGenerico: "Paracetamol",
    presentacion: "500 mg · caja x 100 tabletas",
    categoria: "Analgésicos",
    existencias: 120,
    stockMinimo: 40,
    precioCompra: 0.35,
    proveedorId: "prov-001",
    vencimiento: "2027-08-31",
  },
  {
    id: "prod-002",
    nombreGenerico: "Ibuprofeno",
    presentacion: "400 mg · caja x 50 tabletas",
    categoria: "Antiinflamatorios",
    existencias: 18,
    stockMinimo: 30,
    precioCompra: 0.8,
    proveedorId: "prov-001",
    vencimiento: "2027-03-15",
  },
  {
    id: "prod-003",
    nombreGenerico: "Amoxicilina",
    presentacion: "500 mg · caja x 21 cápsulas",
    categoria: "Antibióticos",
    existencias: 12,
    stockMinimo: 20,
    precioCompra: 1.25,
    proveedorId: "prov-002",
    vencimiento: "2027-01-10",
  },
  {
    id: "prod-004",
    nombreGenerico: "Loratadina",
    presentacion: "10 mg · caja x 30 tabletas",
    categoria: "Antialérgicos",
    existencias: 65,
    stockMinimo: 25,
    precioCompra: 0.6,
    proveedorId: "prov-003",
    vencimiento: "2027-11-30",
  },
  {
    id: "prod-005",
    nombreGenerico: "Omeprazol",
    presentacion: "20 mg · caja x 28 cápsulas",
    categoria: "Gastrointestinales",
    existencias: 8,
    stockMinimo: 25,
    precioCompra: 0.9,
    proveedorId: "prov-002",
    vencimiento: "2027-05-20",
  },
];

export const cotizaciones: Cotizacion[] = [
  // Ibuprofeno: FarmaBol es el más barato, pero su lote vence pronto.
  { id: "cot-001", productoId: "prod-002", proveedorId: "prov-001", precioUnitario: 0.78, cantidadMinima: 50, disponible: 500, entregaHoras: 24, vencimiento: "2028-02-28" },
  { id: "cot-002", productoId: "prod-002", proveedorId: "prov-002", precioUnitario: 0.7, cantidadMinima: 50, disponible: 300, entregaHoras: 48, vencimiento: "2027-01-31" },
  { id: "cot-003", productoId: "prod-002", proveedorId: "prov-003", precioUnitario: 0.75, cantidadMinima: 100, disponible: 1000, entregaHoras: 72, vencimiento: "2028-06-30" },

  // Amoxicilina: Medicamentos del Sur es barato, pero no tiene stock suficiente.
  { id: "cot-004", productoId: "prod-003", proveedorId: "prov-001", precioUnitario: 1.3, cantidadMinima: 21, disponible: 200, entregaHoras: 24, vencimiento: "2027-12-31" },
  { id: "cot-005", productoId: "prod-003", proveedorId: "prov-002", precioUnitario: 1.18, cantidadMinima: 42, disponible: 150, entregaHoras: 48, vencimiento: "2028-03-31" },
  { id: "cot-006", productoId: "prod-003", proveedorId: "prov-003", precioUnitario: 1.05, cantidadMinima: 21, disponible: 10, entregaHoras: 72, vencimiento: "2028-01-31" },

  // Omeprazol: comparación más directa.
  { id: "cot-007", productoId: "prod-005", proveedorId: "prov-001", precioUnitario: 0.95, cantidadMinima: 28, disponible: 400, entregaHoras: 24, vencimiento: "2028-04-30" },
  { id: "cot-008", productoId: "prod-005", proveedorId: "prov-002", precioUnitario: 0.82, cantidadMinima: 56, disponible: 250, entregaHoras: 48, vencimiento: "2028-02-28" },
];
