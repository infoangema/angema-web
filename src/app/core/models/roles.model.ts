export interface Role {
  id: string;
  name: string;
  permissions: Permissions;
}

export interface Permissions {
  manage_users: boolean;
  manage_inventory: boolean;
  manage_orders: boolean;
  view_reports: boolean;
  manage_integrations: boolean;
  manage_business: boolean;
  manage_tenants: boolean;
  manage_platform: boolean;
}

export const ROLES: Role[] = [
  {
    id: 'root',
    name: 'Root Administrator',
    permissions: {
      manage_users: true,
      manage_inventory: true,
      manage_orders: true,
      view_reports: true,
      manage_integrations: true,
      manage_business: true,
      manage_tenants: true,
      manage_platform: true
    }
  },
  {
    id: 'admin',
    name: 'Administrator',
    permissions: {
      manage_users: true,
      manage_inventory: true,
      manage_orders: true,
      view_reports: true,
      manage_integrations: true,
      manage_business: true,
      manage_tenants: false,
      manage_platform: false
    }
  },
  {
    id: 'manager',
    name: 'Inventory Manager',
    permissions: {
      manage_users: false,
      manage_inventory: true,
      manage_orders: true,
      view_reports: true,
      manage_integrations: false,
      manage_business: false,
      manage_tenants: false,
      manage_platform: false
    }
  },
  {
    id: 'operator',
    name: 'Sales Operator',
    permissions: {
      manage_users: false,
      manage_inventory: false,
      manage_orders: true,
      view_reports: false,
      manage_integrations: false,
      manage_business: false,
      manage_tenants: false,
      manage_platform: false
    }
  }
]; 