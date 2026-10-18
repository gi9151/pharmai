<p align="center">
  <img src="docs/logo-preciojusto-1x1.png" alt="PrecioJusto Pharma AI" width="180" />
</p>

<h1 align="center">PrecioJusto Pharma AI</h1>

<p align="center">
  Agente de compras con IA para farmacias independientes de Bolivia,<br/>
  con pagos autónomos <b>limitados por políticas</b> sobre <b>Stellar Testnet</b>.
</p>

<p align="center">
  <a href="https://docs.google.com/presentation/d/1xvFdS9lDACHd6AOs_hrRcDd9bDEypmq7Yx3H0RJzFyQ/edit?usp=sharing"><b>📊 Ver la presentación</b></a>
</p>

> ⚠️ **Prototipo para ideathon.** Todos los datos (farmacia, medicamentos, proveedores y precios) son ficticios. Los pagos usan únicamente **Stellar Testnet** y activos de prueba sin valor. No se mueve dinero real.

---

## El problema

Las farmacias independientes comparan a mano cotizaciones de varios proveedores, con precios, cantidades mínimas, plazos de entrega y fechas de vencimiento distintos. Elegir solo por el precio unitario más bajo puede salir más caro o dejar lotes por vencer en el estante.

## La solución

Un agente que:

1. **Detecta** los productos por debajo del stock mínimo.
2. **Compara** cotizaciones por **costo total** (unidades × precio + transporte), respetando la cantidad mínima del proveedor, su disponibilidad y la vida útil del lote.
3. **Recomienda** la mejor opción y **explica por qué**.
4. **Propone** una orden de compra.
5. La pasa por un **motor de políticas independiente de la IA**.
6. **Paga solo lo autorizado**, sin pedir confirmación para cada operación, y **verifica** el pago en la red.
7. **Registra** cada decisión para auditoría.

### No siempre gana el más barato

| Producto | Más barato por unidad | ¿Por qué no se eligió? |
|---|---|---|
| Ibuprofeno | FarmaBol | Su lote vence en 105 días (mínimo 180). |
| Amoxicilina | Medicamentos del Sur | Solo tiene 10 unidades y se necesitan 28. |
| Omeprazol | FarmaBol | Su cantidad mínima y su transporte lo hacen más caro en total. |

## Por qué Stellar

Usamos **pagos nativos de Stellar** para que cada pago del agente sea **verificable públicamente**: cualquiera puede comprobar en el explorador que la transacción existe, cuánto se pagó y a quién.

Pagos reales del agente en Testnet:

- Ibuprofeno (54 XLM de prueba): [ver transacción](https://stellar.expert/explorer/testnet/tx/6b5d0a726ee91f857afcac740fd018b43618a32de9bb138dab37e926fc4be105)
- Amoxicilina (51,40 XLM de prueba): [ver transacción](https://stellar.expert/explorer/testnet/tx/cc8d03a217971c80612e13c4cba7a0d27e61df7fca1f34140b3329ad33a0efa7)

Cada transacción lleva en su memo la huella (SHA-256) del identificador de la orden, para poder relacionarla con nuestro registro de auditoría.

## Seguridad: autonomía con límites

Los límites **no dependen de instrucciones a la IA**: están en el código del backend y se aplican antes de firmar.

| Protección | Qué hace |
|---|---|
| Límite por transacción | Rechaza pagos por encima del máximo. |
| Presupuesto diario | Rechaza si se supera el total del día. |
| Destinatarios permitidos | Solo paga a proveedores autorizados. |
| Activos y redes permitidas | Solo XLM de prueba y solo Testnet; se niega a usar la red principal. |
| Verificación de saldo | Consulta el saldo real antes de pagar. |
| Idempotencia | No repite un pago con el mismo identificador. |
| Botón de emergencia | Detiene todos los pagos nuevos. |
| Rechazo por defecto | Ante datos incompletos, errores o dudas, no paga. |
| Clave aislada | La clave secreta vive solo en el servicio de firma; el agente nunca la ve, no va al navegador ni a los registros. |
| Verificación en la red | Un pago solo se marca como hecho después de confirmarlo en Stellar. |

Todo esto está cubierto por **30 pruebas automáticas**.

## Arquitectura

```
Inventario + cotizaciones
          │
          ▼
 Comparador (lib/comparador.ts) ── recomendación explicable
          │
          ▼
 Agente (lib/agente.ts) ── solo usa herramientas explícitas
          │  propone orden
          ▼
 Motor de políticas (lib/politicas.ts) ── decide, sin IA
          │  solo si aprueba
          ▼
 Servicio de firma (lib/stellar.ts) ── firma, envía y verifica en Testnet
          │
          ▼
 Historial de auditoría (lib/historial.ts)
```

| Archivo | Responsabilidad |
|---|---|
| `lib/tipos.ts`, `lib/datos.ts` | Tipos y datos ficticios. |
| `lib/comparador.ts` | Reglas de comparación y explicación. |
| `lib/politicas.ts` | Motor de políticas de pago. |
| `lib/agente.ts` | Agente y sus herramientas. |
| `lib/pagos.ts` | Interfaz de pagos y servicio simulado. |
| `lib/stellar.ts` | Servicio de pagos en Stellar Testnet. |
| `lib/historial.ts` | Historial acumulado y botón de emergencia. |
| `app/page.tsx` | Panel de control. |
| `scripts/` | Creación de cuentas de prueba y ejecución del agente en Testnet. |

## Tecnologías

Next.js (App Router) · React · TypeScript · Tailwind CSS · Stellar SDK · Stellar Testnet · Vitest

## Cómo ejecutarlo

Requisitos: Node.js 20 o superior y pnpm.

```bash
git clone https://github.com/gi9151/pharmai.git
cd pharmai
pnpm install
pnpm dev
```

Abre http://localhost:3000.

### Pruebas

```bash
pnpm exec vitest run
```

### Pagos en Stellar Testnet

```bash
# 1. Crea dos cuentas de prueba y las fondea con Friendbot.
#    La clave secreta se guarda solo en .env.local (excluido de Git).
pnpm exec tsx scripts/crear-cuentas-testnet.ts

# 2. Ejecuta el agente: paga lo autorizado, verifica en la red
#    y agrega la ejecución al historial.
pnpm exec tsx scripts/pago-testnet.ts
```

Si se ejecuta dos veces el mismo día, los pagos se rechazan por duplicado.

## Próximos pasos

- **Contrato Soroban "bóveda de compras":** aplicar los mismos límites directamente en la red, para que se cumplan incluso si el servidor fuera comprometido.
- **Pagos en bolivianos:** integrar un proveedor local (QR o transferencia). Antes hay que verificar en su documentación oficial si permite pagos programáticos a terceros, consulta de estado, liquidación en BOB y un entorno de pruebas. El pago en Stellar y el pago efectivo a un proveedor boliviano son cosas distintas: puede requerir un intermediario y conversión a BOB.
- **Validación con farmacias:** entrevistas para medir la frecuencia y el costo real del problema, y la disposición a pagar.
- **Producto real:** base de datos PostgreSQL, inicio de sesión y permisos (el botón de emergencia aún no tiene autenticación), y conexión opcional a un modelo de IA manteniendo los límites en el código.

## Aviso

Prototipo con fines de demostración. No es software médico, no da recomendaciones terapéuticas ni sugiere sustituciones de medicamentos, y no almacena datos de pacientes.