#![no_std]
//! Bóveda de compras de PrecioJusto Pharma AI (Stellar Testnet).
//!
//! Aplica EN LA BLOCKCHAIN las mismas reglas del motor de políticas:
//! límite por pago, presupuesto diario, destinatarios permitidos,
//! pagos no duplicados y botón de emergencia.
//! Solo el administrador (la farmacia) puede configurarla y autorizar pagos.

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, BytesN, Env};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    YaInicializada = 1,
    NoInicializada = 2,
    PagosDetenidos = 3,
    ImporteInvalido = 4,
    SuperaLimite = 5,
    SuperaPresupuesto = 6,
    DestinoNoPermitido = 7,
    PagoDuplicado = 8,
}

#[contracttype]
#[derive(Clone)]
pub enum Clave {
    Admin,
    Limite,
    Presupuesto,
    Detenida,
    Permitido(Address),
    Pago(BytesN<32>),
    Gastado(u64),
}

#[contract]
pub struct Boveda;

fn admin(env: &Env) -> Result<Address, Error> {
    env.storage().instance().get(&Clave::Admin).ok_or(Error::NoInicializada)
}

fn dia_actual(env: &Env) -> u64 {
    env.ledger().timestamp() / 86_400
}

#[contractimpl]
impl Boveda {
    /// Configura la bóveda. Solo se puede hacer una vez.
    pub fn inicializar(env: Env, admin: Address, limite: i128, presupuesto: i128) -> Result<(), Error> {
        if env.storage().instance().has(&Clave::Admin) {
            return Err(Error::YaInicializada);
        }
        admin.require_auth();
        if limite <= 0 || presupuesto <= 0 {
            return Err(Error::ImporteInvalido);
        }
        let s = env.storage().instance();
        s.set(&Clave::Admin, &admin);
        s.set(&Clave::Limite, &limite);
        s.set(&Clave::Presupuesto, &presupuesto);
        s.set(&Clave::Detenida, &false);
        Ok(())
    }

    /// Agrega un proveedor a la lista de destinatarios permitidos.
    pub fn permitir(env: Env, destino: Address) -> Result<(), Error> {
        admin(&env)?.require_auth();
        env.storage().persistent().set(&Clave::Permitido(destino), &true);
        Ok(())
    }

    /// Botón de emergencia: true detiene todos los pagos, false los reanuda.
    pub fn detener(env: Env, detenida: bool) -> Result<(), Error> {
        admin(&env)?.require_auth();
        env.storage().instance().set(&Clave::Detenida, &detenida);
        Ok(())
    }

    /// Autoriza y registra un pago. Rechaza si incumple cualquier regla.
    pub fn autorizar(env: Env, id: BytesN<32>, destino: Address, importe: i128) -> Result<(), Error> {
        admin(&env)?.require_auth();
        let s = env.storage().instance();

        if s.get(&Clave::Detenida).unwrap_or(true) {
            return Err(Error::PagosDetenidos);
        }
        if importe <= 0 {
            return Err(Error::ImporteInvalido);
        }
        let limite: i128 = s.get(&Clave::Limite).ok_or(Error::NoInicializada)?;
        if importe > limite {
            return Err(Error::SuperaLimite);
        }
        let p = env.storage().persistent();
        if !p.get(&Clave::Permitido(destino.clone())).unwrap_or(false) {
            return Err(Error::DestinoNoPermitido);
        }
        if p.has(&Clave::Pago(id.clone())) {
            return Err(Error::PagoDuplicado);
        }
        let dia = dia_actual(&env);
        let gastado: i128 = p.get(&Clave::Gastado(dia)).unwrap_or(0);
        let presupuesto: i128 = s.get(&Clave::Presupuesto).ok_or(Error::NoInicializada)?;
        if gastado + importe > presupuesto {
            return Err(Error::SuperaPresupuesto);
        }

        p.set(&Clave::Pago(id), &importe);
        p.set(&Clave::Gastado(dia), &(gastado + importe));
        Ok(())
    }

    /// Cuánto se autorizó hoy.
    pub fn gastado_hoy(env: Env) -> i128 {
        env.storage().persistent().get(&Clave::Gastado(dia_actual(&env))).unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
