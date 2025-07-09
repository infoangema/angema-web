export interface Warehouse {
  id: string;
  businessId: string;
  name: string;
  code: string;
  address: string;
  manager: string;
  isActive: boolean;
  sectors?: WarehouseSector[];
}

export interface WarehouseSector {
  id: string;
  name: string;
  positions: string[];
}

export interface WarehouseLocation {
  warehouseId: string;
  sectorId: string;
  position: string;
  displayName?: string;
} 