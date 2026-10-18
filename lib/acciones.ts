"use server";

// Acciones del servidor que se ejecutan desde botones del panel.
// ⚠️ MVP: todavía no hay inicio de sesión. Antes de usar con datos reales,
// solo el administrador autenticado debería poder cambiar este control.

import { revalidatePath } from "next/cache";
import { guardarControl } from "../lib/historial";

export async function cambiarPagosDetenidos(formData: FormData) {
  // Validación en el servidor: solo se aceptan los valores exactos "detener" o "reanudar".
  const accion = formData.get("accion");
  if (accion !== "detener" && accion !== "reanudar") return;
  guardarControl(accion === "detener");
  revalidatePath("/");
}