import { KeycloakRealm } from './keycloak.models';
import { Client, Realm, Role } from './models';
import _ from 'lodash';

class Keycloak {
  async createRealm(realm:KeycloakRealm) {

  }
  async updateRealm(realm:KeycloakRealm) {

  }

  async findByClientId(realm:string, clientId:string):Promise<any> {

  }

  async saveClient(realm:Realm, keycloakClient:any) {

  }
}

class KeycloakSyncronizer {
  keycloak: Keycloak;

  constructor() {
    // options
    this.keycloak = new Keycloak();
  }

  async synchronize(realm:Realm) {

    if (realm.clients) {
      for (let client of realm.clients) {
        await this.syncClient(realm, client);
      }
      await this.syncRealmRoles(realm);
      for (let client of realm.clients) {
        await this.syncClientRealmRoles(realm, client);
      }
    }

  }

  async syncRealmRoles(realm:Realm) {

  }

  async syncClient(realm:Realm, client:Client) {
    const keycloakClient = await this.keycloak.findByClientId(realm.id, client.client_id) || {};
    this.fillClient(keycloakClient, client);
    await this.keycloak.saveClient(realm, keycloakClient);
    await this.syncRoles(realm, client);
  }

  async syncClientRealmRoles(realm:Realm, client:Client) {

  }

  async syncRoles(realm:Realm, client:Client) {
    const keycloakClient = await this.keycloak.findByClientId(realm.id, client.client_id);
    const roles = keycloakClient.roles;

    const compare = (role:Role, clientrole:Role) => role.name === clientrole.name;
    const toBeRemoved = _.differenceWith(roles, client.roles, compare);
    const toBeAdded = _.differenceWith(client.roles, roles, compare);
  }

  fillClient(keycloakClient:any, client:Client) {
    keycloakClient.name = client.name;
    keycloakClient.clientId = client.client_id;
    keycloakClient.enabled = true;
    keycloakClient.serviceAccountsEnabled = client.service_account_enabled;
    keycloakClient.standardFlowEnabled = client.standard_flow_enabled;
    keycloakClient.implicitFlowEnabled = client.implicit_flow_enabled;
    keycloakClient.directAccessGrantsEnabled = client.direct_access_grants_enabled;
    keycloakClient.authorizationServicesEnabled = false;
    keycloakClient.publicClient = 'public' === client.access_type;

    ifPresent(client.root_url, () => keycloakClient.rootUrl);
    ifPresent(client.valid_redirect_uris, () => keycloakClient.validRedirectUris);
    ifPresent(client.web_origins, () => keycloakClient.webOrigins);
    ifPresent(client.base_url, () => keycloakClient.baseUrl);
  }

}

function ifPresent(value:any, callback:Function) {
  if (value) callback();
}