// Role feature barrel export
export { roleRoutes } from "./role.routes.js";
export { roleController } from "./role.controller.js";
export { RoleService, createRoleService, type IRoleService } from "./role.service.js";
export { roleRepository, RoleRepository, type IRoleRepository, type RoleWithPermissions } from "./role.repository.js";
export * from "./role.validation.js";
