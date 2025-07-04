import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SKU {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  descripcion: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  marca?: string;
  peso?: number;
  dimensiones?: string;
}

interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  fechaRegistro: Date;
}

interface Pedido {
  id: string;
  numero: string;
  clienteId: string;
  clienteNombre: string;
  items: PedidoItem[];
  total: number;
  estado: 'pendiente' | 'procesado' | 'enviado' | 'entregado';
  fecha: Date;
}

interface PedidoItem {
  skuId: string;
  skuCodigo: string;
  skuNombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

@Component({
  selector: 'app-sku-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './sku-demo.component.html',
  styleUrls: ['./sku-demo.component.css']
})
export class SkuDemoComponent implements OnInit {
  // Datos de ejemplo
  skus: SKU[] = [];
  clientes: Cliente[] = [];
  pedidos: Pedido[] = [];
  
  // Estados de la aplicación
  currentView: 'dashboard' | 'skus' | 'clientes' | 'pedidos' | 'nuevo-sku' | 'nuevo-cliente' | 'nuevo-pedido' = 'dashboard';
  
  // Formularios
  nuevoSku: Partial<SKU> = {};
  nuevoCliente: Partial<Cliente> = {};
  nuevoPedido: Partial<Pedido> = {
    items: []
  };
  
  // Filtros y búsqueda
  searchTerm: string = '';
  selectedCategory: string = '';
  
  // Estadísticas del dashboard
  stats = {
    totalSkus: 0,
    stockBajo: 0,
    totalPedidos: 0,
    pedidosPendientes: 0,
    valorInventario: 0
  };

  constructor() { }

  ngOnInit(): void {
    this.loadDemoData();
    this.calculateStats();
  }

  loadDemoData(): void {
    // Cargar datos desde localStorage o usar datos de ejemplo
    const savedSkus = localStorage.getItem('demo-skus');
    const savedClientes = localStorage.getItem('demo-clientes');
    const savedPedidos = localStorage.getItem('demo-pedidos');

    if (savedSkus) {
      this.skus = JSON.parse(savedSkus);
    } else {
      this.skus = this.getDefaultSkus();
      this.saveSkus();
    }

    if (savedClientes) {
      this.clientes = JSON.parse(savedClientes);
    } else {
      this.clientes = this.getDefaultClientes();
      this.saveClientes();
    }

    if (savedPedidos) {
      this.pedidos = JSON.parse(savedPedidos);
    } else {
      this.pedidos = this.getDefaultPedidos();
      this.savePedidos();
    }
  }

  getDefaultSkus(): SKU[] {
    return [
      {
        id: '1',
        codigo: 'SKU-001',
        nombre: 'Laptop HP Pavilion',
        categoria: 'Electrónicos',
        precio: 899.99,
        stock: 15,
        stockMinimo: 5,
        descripcion: 'Laptop de 15.6 pulgadas con procesador Intel i5',
        fechaCreacion: new Date('2024-01-15'),
        fechaActualizacion: new Date('2024-01-15')
      },
      {
        id: '2',
        codigo: 'SKU-002',
        nombre: 'Mouse Inalámbrico Logitech',
        categoria: 'Accesorios',
        precio: 29.99,
        stock: 3,
        stockMinimo: 10,
        descripcion: 'Mouse inalámbrico con sensor óptico de alta precisión',
        fechaCreacion: new Date('2024-01-20'),
        fechaActualizacion: new Date('2024-01-20')
      },
      {
        id: '3',
        codigo: 'SKU-003',
        nombre: 'Teclado Mecánico RGB',
        categoria: 'Accesorios',
        precio: 89.99,
        stock: 8,
        stockMinimo: 5,
        descripcion: 'Teclado mecánico con switches Cherry MX y retroiluminación RGB',
        fechaCreacion: new Date('2024-02-01'),
        fechaActualizacion: new Date('2024-02-01')
      }
    ];
  }

  getDefaultClientes(): Cliente[] {
    return [
      {
        id: '1',
        nombre: 'Juan Pérez',
        email: 'juan.perez@email.com',
        telefono: '+54 11 1234-5678',
        direccion: 'Av. Corrientes 1234, CABA',
        fechaRegistro: new Date('2024-01-10')
      },
      {
        id: '2',
        nombre: 'María González',
        email: 'maria.gonzalez@email.com',
        telefono: '+54 11 9876-5432',
        direccion: 'Belgrano 567, CABA',
        fechaRegistro: new Date('2024-01-25')
      }
    ];
  }

  getDefaultPedidos(): Pedido[] {
    return [
      {
        id: '1',
        numero: 'PED-001',
        clienteId: '1',
        clienteNombre: 'Juan Pérez',
        items: [
          {
            skuId: '1',
            skuCodigo: 'SKU-001',
            skuNombre: 'Laptop HP Pavilion',
            cantidad: 1,
            precio: 899.99,
            subtotal: 899.99
          }
        ],
        total: 899.99,
        estado: 'procesado',
        fecha: new Date('2024-02-15')
      }
    ];
  }

  saveSkus(): void {
    localStorage.setItem('demo-skus', JSON.stringify(this.skus));
  }

  saveClientes(): void {
    localStorage.setItem('demo-clientes', JSON.stringify(this.clientes));
  }

  savePedidos(): void {
    localStorage.setItem('demo-pedidos', JSON.stringify(this.pedidos));
  }

  calculateStats(): void {
    this.stats.totalSkus = this.skus.length;
    this.stats.stockBajo = this.skus.filter(sku => sku.stock <= sku.stockMinimo).length;
    this.stats.totalPedidos = this.pedidos.length;
    this.stats.pedidosPendientes = this.pedidos.filter(p => p.estado === 'pendiente').length;
    this.stats.valorInventario = this.skus.reduce((total, sku) => total + (sku.precio * sku.stock), 0);
  }

  // Métodos para SKUs
  crearSku(): void {
    if (this.nuevoSku.nombre && this.nuevoSku.precio) {
      const sku: SKU = {
        id: Date.now().toString(),
        codigo: this.generarCodigoSKU(),
        nombre: this.nuevoSku.nombre!,
        categoria: this.nuevoSku.categoria || 'General',
        precio: this.nuevoSku.precio!,
        stock: this.nuevoSku.stock || 0,
        stockMinimo: this.nuevoSku.stockMinimo || 5,
        descripcion: this.nuevoSku.descripcion || '',
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        marca: this.nuevoSku.marca,
        peso: this.nuevoSku.peso,
        dimensiones: this.nuevoSku.dimensiones
      };

      this.skus.push(sku);
      this.saveSkus();
      this.calculateStats();
      this.nuevoSku = {};
      this.currentView = 'skus';
    }
  }

  editarSku(sku: SKU): void {
    this.nuevoSku = { ...sku };
    this.currentView = 'nuevo-sku';
  }

  generarCodigoSKU(): string {
    const categoria = this.nuevoSku.categoria?.substring(0, 3).toUpperCase() || 'GEN';
    const timestamp = Date.now().toString().slice(-6);
    return `${categoria}-${timestamp}`;
  }

  eliminarSku(id: string): void {
    if (confirm('¿Está seguro de que desea eliminar este SKU?')) {
      this.skus = this.skus.filter(sku => sku.id !== id);
      this.saveSkus();
      this.calculateStats();
    }
  }

  // Métodos para Clientes
  crearCliente(): void {
    if (this.nuevoCliente.nombre && this.nuevoCliente.email) {
      const cliente: Cliente = {
        id: Date.now().toString(),
        nombre: this.nuevoCliente.nombre!,
        email: this.nuevoCliente.email!,
        telefono: this.nuevoCliente.telefono || '',
        direccion: this.nuevoCliente.direccion || '',
        fechaRegistro: new Date()
      };

      this.clientes.push(cliente);
      this.saveClientes();
      this.nuevoCliente = {};
      this.currentView = 'clientes';
    }
  }

  eliminarCliente(id: string): void {
    if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
      this.clientes = this.clientes.filter(cliente => cliente.id !== id);
      this.saveClientes();
    }
  }

  // Métodos para Pedidos
  crearPedido(): void {
    if (this.nuevoPedido.clienteId && this.nuevoPedido.items && this.nuevoPedido.items.length > 0) {
      const cliente = this.clientes.find(c => c.id === this.nuevoPedido.clienteId);
      const pedido: Pedido = {
        id: Date.now().toString(),
        numero: `PED-${Date.now().toString().slice(-6)}`,
        clienteId: this.nuevoPedido.clienteId!,
        clienteNombre: cliente?.nombre || '',
        items: this.nuevoPedido.items!,
        total: this.nuevoPedido.items!.reduce((sum, item) => sum + item.subtotal, 0),
        estado: 'pendiente',
        fecha: new Date()
      };

      this.pedidos.push(pedido);
      this.savePedidos();
      this.calculateStats();
      this.nuevoPedido = { items: [] };
      this.currentView = 'pedidos';
    }
  }

  agregarItemAPedido(): void {
    if (this.nuevoPedido.items) {
      this.nuevoPedido.items.push({
        skuId: '',
        skuCodigo: '',
        skuNombre: '',
        cantidad: 1,
        precio: 0,
        subtotal: 0
      });
    }
  }

  actualizarSubtotal(item: PedidoItem): void {
    item.subtotal = item.cantidad * item.precio;
  }

  seleccionarSkuParaItem(item: PedidoItem, skuId: string): void {
    const sku = this.skus.find(s => s.id === skuId);
    if (sku) {
      item.skuId = sku.id;
      item.skuCodigo = sku.codigo;
      item.skuNombre = sku.nombre;
      item.precio = sku.precio;
      this.actualizarSubtotal(item);
    }
  }

  eliminarItemDePedido(index: number): void {
    if (this.nuevoPedido.items) {
      this.nuevoPedido.items.splice(index, 1);
    }
  }

  cambiarEstadoPedido(pedido: Pedido, nuevoEstado: Pedido['estado']): void {
    pedido.estado = nuevoEstado;
    this.savePedidos();
    this.calculateStats();
  }

  onEstadoChange(pedido: Pedido, event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.cambiarEstadoPedido(pedido, target.value as Pedido['estado']);
  }

  onSkuChange(item: PedidoItem, event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.seleccionarSkuParaItem(item, target.value);
  }

  // Filtros
  getSkusFiltrados(): SKU[] {
    let filtrados = this.skus;

    if (this.searchTerm) {
      filtrados = filtrados.filter(sku => 
        sku.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        sku.codigo.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.selectedCategory) {
      filtrados = filtrados.filter(sku => sku.categoria === this.selectedCategory);
    }

    return filtrados;
  }

  getSkusConStockBajo(): SKU[] {
    return this.skus.filter(sku => sku.stock <= sku.stockMinimo);
  }

  getCategorias(): string[] {
    return [...new Set(this.skus.map(sku => sku.categoria))];
  }

  // Navegación
  setView(view: typeof this.currentView): void {
    this.currentView = view;
  }

  // Utilidades
  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'warning';
      case 'procesado': return 'info';
      case 'enviado': return 'primary';
      case 'entregado': return 'success';
      default: return 'secondary';
    }
  }

  getCurrentDate(): string {
    return new Date().toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTotalPedido(): string {
    if (!this.nuevoPedido.items || this.nuevoPedido.items.length === 0) {
      return '0';
    }
    const total = this.nuevoPedido.items.reduce((sum, item) => sum + item.subtotal, 0);
    return total.toLocaleString();
  }
} 