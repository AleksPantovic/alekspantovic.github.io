import type { FromSchema } from 'json-schema-to-ts';
import * as schemas from './schemas';

export type AccessTokenFormDataParam = FromSchema<typeof schemas.AccessToken.formData>;
export type AccessTokenResponse400 = FromSchema<typeof schemas.AccessToken.response['400']>;
export type InstallFormDataParam = FromSchema<typeof schemas.Install.formData>;
export type InstallResponse400 = FromSchema<typeof schemas.Install.response['400']>;
export type InstanceAddFormDataParam = FromSchema<typeof schemas.InstanceAdd.formData>;
export type InstanceAddResponse400 = FromSchema<typeof schemas.InstanceAdd.response['400']>;
export type InstanceRemoveFormDataParam = FromSchema<typeof schemas.InstanceRemove.formData>;
export type InstanceRemoveResponse400 = FromSchema<typeof schemas.InstanceRemove.response['400']>;
export type UninstallFormDataParam = FromSchema<typeof schemas.Uninstall.formData>;
export type UninstallResponse400 = FromSchema<typeof schemas.Uninstall.response['400']>;
