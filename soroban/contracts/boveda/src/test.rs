#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};

fn preparar() -> (Env, BovedaClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let id = env.register(Boveda, ());
    let cliente = BovedaClient::new(&env, &id);
    let admin = Address::generate(&env);
    cliente.inicializar(&admin, &60, &120);
    (env, cliente, admin)
}

#[test]
fn reglas_de_la_boveda() {
    let (env, c, _) = preparar();
    let prov = Address::generate(&env);
    let otro = Address::generate(&env);
    c.permitir(&prov);

    let id1 = BytesN::from_array(&env, &[1; 32]);
    c.autorizar(&id1, &prov, &54);
    assert_eq!(c.gastado_hoy(), 54);

    assert_eq!(c.try_autorizar(&id1, &prov, &54), Err(Ok(Error::PagoDuplicado)));
    let id2 = BytesN::from_array(&env, &[2; 32]);
    assert_eq!(c.try_autorizar(&id2, &prov, &80), Err(Ok(Error::SuperaLimite)));
    assert_eq!(c.try_autorizar(&id2, &otro, &10), Err(Ok(Error::DestinoNoPermitido)));
    c.autorizar(&id2, &prov, &51);
    let id3 = BytesN::from_array(&env, &[3; 32]);
    assert_eq!(c.try_autorizar(&id3, &prov, &55), Err(Ok(Error::SuperaPresupuesto)));

    c.detener(&true);
    assert_eq!(c.try_autorizar(&id3, &prov, &1), Err(Ok(Error::PagosDetenidos)));
}
