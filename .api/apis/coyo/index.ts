import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core'
import Oas from 'oas';
import APICore from 'api/dist/core';
import definition from './openapi.json';

class SDK {
  spec: Oas;
  core: APICore;

  constructor() {
    this.spec = Oas.init(definition);
    this.core = new APICore(this.spec, 'coyo/1.1.0 (api/6.1.3)');
  }

  /**
   * Optionally configure various options that the SDK allows.
   *
   * @param config Object of supported SDK options and toggles.
   * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
   * should be represented in milliseconds.
   */
  config(config: ConfigOptions) {
    this.core.setConfig(config);
  }

  /**
   * If the API you're using requires authentication you can supply the required credentials
   * through this method and the library will magically determine how they should be used
   * within your API request.
   *
   * With the exception of OpenID and MutualTLS, it supports all forms of authentication
   * supported by the OpenAPI specification.
   *
   * @example <caption>HTTP Basic auth</caption>
   * sdk.auth('username', 'password');
   *
   * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
   * sdk.auth('myBearerToken');
   *
   * @example <caption>API Keys</caption>
   * sdk.auth('myApiKey');
   *
   * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
   * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
   * @param values Your auth credentials for the API; can specify up to two strings or numbers.
   */
  auth(...values: string[] | number[]) {
    this.core.setAuth(...values);
    return this;
  }

  /**
   * If the API you're using offers alternate server URLs, and server variables, you can tell
   * the SDK which one to use with this method. To use it you can supply either one of the
   * server URLs that are contained within the OpenAPI definition (along with any server
   * variables), or you can pass it a fully qualified URL to use (that may or may not exist
   * within the OpenAPI definition).
   *
   * @example <caption>Server URL with server variables</caption>
   * sdk.server('https://{region}.api.example.com/{basePath}', {
   *   name: 'eu',
   *   basePath: 'v14',
   * });
   *
   * @example <caption>Fully qualified server URL</caption>
   * sdk.server('https://eu.api.example.com/v14');
   *
   * @param url Server URL
   * @param variables An object of variables to replace into the server URL.
   */
  server(url: string, variables = {}) {
    this.core.setServer(url, variables);
  }

  /**
   * This event is sent when a Haiilo admin wants to install the plug-in
   *
   * @summary Life cycle event 'install'
   * @throws FetchError<400, types.InstallResponse400> The plug-in encountered an error while installing.
   */
  install(body: types.InstallFormDataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/install', 'post', body);
  }

  /**
   * This event is sent when a Haiilo admin wants to uninstall the plug-in
   *
   * @summary Life cycle event 'uninstall'
   * @throws FetchError<400, types.UninstallResponse400> The plug-in encountered an error while uninstalling.
   */
  uninstall(body: types.UninstallFormDataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/uninstall', 'post', body);
  }

  /**
   * This event is sent when a Haiilo editor wants to add a plug-in instance
   *
   * @summary Life cycle event 'instance_add'
   * @throws FetchError<400, types.InstanceAddResponse400> The plug-in encountered an error while adding an instance.
   */
  instance_add(body: types.InstanceAddFormDataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/instance_add', 'post', body);
  }

  /**
   * This event is sent when a Haiilo editor wants to remove a plug-in instance
   *
   * @summary Life cycle event 'instance_remove'
   * @throws FetchError<400, types.InstanceRemoveResponse400> The plug-in encountered an error while removing an instance.
   */
  instance_remove(body: types.InstanceRemoveFormDataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/instance_remove', 'post', body);
  }

  /**
   * This event will be sent after installation if the manifest requested to receive a Haiilo
   * API access token
   *
   * @summary API access token event 'access_token'
   * @throws FetchError<400, types.AccessTokenResponse400> The plug-in encountered an error while processing the authentication token.
   */
  access_token(body: types.AccessTokenFormDataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/access_token', 'post', body);
  }
}

const createSDK = (() => { return new SDK(); })()
;

export default createSDK;

export type { AccessTokenFormDataParam, AccessTokenResponse400, InstallFormDataParam, InstallResponse400, InstanceAddFormDataParam, InstanceAddResponse400, InstanceRemoveFormDataParam, InstanceRemoveResponse400, UninstallFormDataParam, UninstallResponse400 } from './types';
