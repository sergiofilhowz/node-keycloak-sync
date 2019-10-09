export interface KeycloakRealm {
  realm: string;
  enabled: boolean;

  displayName: string;
  accessTokenLifespan: number;
  accessTokenLifespanForImplicitFlow: number;
  ssoSessionIdleTimeout: number;
  ssoSessionMaxLifespan: number;
  ssoSessionIdleTimeoutRememberMe: number;
  ssoSessionMaxLifespanRememberMe: number;
  offlineSessionIdleTimeout: number;
  offlineSessionMaxLifespan: number;
  accessCodeLifespan: number;
  accessCodeLifespanUserAction: number;
  accessCodeLifespanLogin: number;
  actionTokenGeneratedByAdminLifespan: number;
  actionTokenGeneratedByUserLifespan: number;
}