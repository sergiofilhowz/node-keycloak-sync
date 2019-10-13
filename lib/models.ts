export interface RoleReference {
  client_id: string;
  role: string;
}

export interface Role {
  name: string;
  description?: string;
  composite?: Array<RoleReference>;
}

export interface Client {
  id?: string;

  client_id: string;
  name: string;
  access_type?: string;
  service_account_enabled?: boolean;
  standard_flow_enabled?: boolean;
  implicit_flow_enabled?: boolean;
  direct_access_grants_enabled?: boolean;
  roles?: Array<Role>;
  realm_roles?: Array<string>;
  service_account_roles?: Array<RoleReference>;

  root_url?: string;
  base_url?: string;
  valid_redirect_uris?: Array<string>;
  web_origins?: Array<string>;
}

export interface Realm {
  id: string;
  display_name: string;
  clients: Array<Client>;
  realm_roles?: Array<Role>;

  access_token_lifespan?: number;
  access_token_lifespan_for_implicit_flow?: number;
  sso_session_idle_timeout?: number;
  sso_session_max_lifespan?: number;
  sso_session_idle_timeout_remember_me?: number;
  sso_session_max_lifespan_remember_me?: number;
  offline_session_idle_timeout?: number;
  offline_session_max_lifespan?: number;
  access_code_lifespan?: number;
  access_code_lifespan_user_action?: number;
  access_code_lifespan_login?: number;
  action_token_generated_by_admin_lifespan?: number;
  action_token_generated_by_user_lifespan?: number;
}