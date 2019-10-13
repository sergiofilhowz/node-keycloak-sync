import KeycloakAdmin from 'keycloak-admin';
import _ from 'lodash';
import { Client, Realm, Role, RoleReference } from './models';
import RoleRepresentation from 'keycloak-admin/lib/defs/roleRepresentation';
import RealmRepresentation from 'keycloak-admin/lib/defs/realmRepresentation';
import ClientRepresentation from 'keycloak-admin/lib/defs/clientRepresentation';

class KeycloakSyncronizer {
  keycloak: KeycloakAdmin;

  constructor() {
    // options
    this.keycloak = new KeycloakAdmin();
    // await kcAdminClient.auth({
    //   username: 'wwwy3y3',
    //   password: 'wwwy3y3',
    //   grantType: 'password',
    //   clientId: 'admin-cli',
    // });
  }

  async synchronize(realm:Realm) {
    const theRealm:RealmRepresentation = await this.keycloak.realms.findOne({ realm: realm.id });
    if (theRealm === null) {
      // TODO create
    } else {
      // TODO update
    }

    if (realm.clients) {
      for (let client of realm.clients) {
        await this.syncClient(realm, client);
      }
      await this.syncRealmRoles(realm);
      for (let client of realm.clients) {
        await this.syncClientRealmRoles(realm, client);
        await this.syncCompositeRoles(realm, client);
      }
    }
  }

  /**
   * Creates realm roles, this method needs to be executed
   * after the creation of all client's roles
   * @param realm
   */
  private async syncRealmRoles(realm:Realm) {
    for (let role of realm.realm_roles) {
      const roles:Array<RoleRepresentation> = await this.keycloak.roles.find();
      // this.keycloak.roles.delById({ id: '1', realm: realm.id });
      this.keycloak.roles.create({
        realm: realm.id,
        name: role.name,
        composite: role.composite && role.composite.length > 0,
        description: role.description,
        clientRole: false
        // composite
      });
      final RoleResource roleResource = resource.roles().get(role.getName());
      final RoleRepresentation roleRepresentation = roleResource.toRepresentation();
      if (roleRepresentation == null) {
        resource.roles().create(role.toRepresentation());
      } else {
        roleRepresentation.setDescription(role.getDescription());
        roleResource.update(roleRepresentation);
      }
      roleResource.deleteComposites(new ArrayList<>(roleResource.getRoleComposites()));
      if (role.getComposite() != null) {
        final List<RoleRepresentation> collect = role.getComposite().stream()
            .map(roleReference -> getByClientId(roleReference.getClientId()).roles().get(roleReference.getRole()))
            .map(RoleResource::toRepresentation)
      .collect(Collectors.toList());
        roleResource.addComposites(collect);
      }
    }
  }

  /**
   * This method will assign realm roles to clients.
   *
   * Some clients have realm roles to be able to connect to other clients.
   *
   * @param realm
   * @param client
   */
  private async syncClientRealmRoles(realm:Realm, client:Client) {

  }

  /**
   * This method will populate all the properties from the json to the client.
   * It will also sync all roles
   * @param realm
   * @param client
   */
  private async syncClient(realm:Realm, client:Client) {
    const clients = await this.keycloak.clients.find({ clientId: client.client_id, realm: realm.id });
    const keycloakClient = clients.length ? clients[0] : {};

    this.fillClient(keycloakClient, client);
    if (keycloakClient.id) {
      await this.keycloak.clients.update({ id: keycloakClient.id, realm: realm.id }, keycloakClient);
    } else {
      await this.keycloak.clients.create(keycloakClient);
      // TODO we need to assign the generated ID to the client
    }

    await this.syncRoles(realm, client);
  }

  /**
   * This method creates all composite roles from existant roles.
   * It needs to be executed after the creation of all client's roles
   * @param realm
   * @param client
   */
  private async syncCompositeRoles(realm: Realm, client: Client) {
    const rolesComposed:Array<Role> = client.roles.filter(role => _.toLength(role.composite));
    for (let role of rolesComposed) {
      this.keycloak.clients.findRole({ id: '1', roleName: role.name });
      const compositeRoles:Array<RoleReference> = await this.keycloak
          .getCompositeRoles(realm, client, role.name);

      const compare = (role:RoleReference, clientrole:RoleReference) =>
        role.client_id && clientrole.client_id && role.role === clientrole.role;
      const toBeRemoved:Array<RoleReference> = _.differenceWith(compositeRoles, role.composite, compare);
      const toBeAdded:Array<RoleReference> = _.differenceWith(role.composite, compositeRoles, compare);

      await this.keycloak.addCompositeRole(realm, client, toBeAdded);
      await this.keycloak.removeCompositeRole(realm, client, toBeRemoved);
    }
  }

  /**
   * This method creates all client's roles
   * @param realm
   * @param client
   */
  private async syncRoles(realm:Realm, client:Client) {
    const roles:Array<RoleRepresentation> = await this.keycloak.clients.listRoles({
      id: client.id,
      realm: realm.id
    });

    const compareFromLocal = (role:Role, clientrole:RoleRepresentation) => role.name === clientrole.name;
    const compareFromClient = (clientrole:RoleRepresentation, role:Role) => role.name === clientrole.name;
    const toBeRemoved:Array<RoleRepresentation> = _.differenceWith(roles, client.roles, compareFromClient);
    const toBeAdded:Array<Role> = _.differenceWith(client.roles, roles, compareFromLocal);

    for (let role of toBeRemoved) {
      await this.keycloak.clients.delRole({ realm: realm.id, id: client.id, roleName: role.name });
    }
    for (let role of toBeAdded) {
      await this.keycloak.clients.createRole({
        realm: realm.id,
        id: client.id,
        description: role.description,
        clientRole: true,
        composite: role.composite && role.composite.length > 0
      });
    }
  }

  /**
   * Fill all properties from the json to the client itself
   * @param keycloakClient
   * @param client
   */
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

    assignIfPresent(client.root_url, keycloakClient, 'rootUrl');
    assignIfPresent(client.valid_redirect_uris, keycloakClient, 'validRedirectUris');
    assignIfPresent(client.web_origins, keycloakClient, 'webOrigins');
    assignIfPresent(client.base_url, keycloakClient, 'baseUrl');
  }

}

/**
 * Assigns a value to an object property only if the value is present
 * @param value the value to be checked and then assigned
 * @param obj the object to have a property assined
 * @param property the object property name
 */
function assignIfPresent(value:any, obj:any, property:string) {
  if (value) {
    obj[property] = value;
  }
}
