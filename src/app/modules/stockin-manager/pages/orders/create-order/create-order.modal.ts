import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ZXingScannerComponent, ZXingScannerModule } from '@zxing/ngx-scanner';

import { OrderService } from '../../../services/order.service';
import { CustomerService } from '../../../services/customer.service';
import { ProductService } from '../../../services/product.service';
import { NotificationService } from '../../../../../core/services/notification.service';

import { Customer } from '../../../models/customer.model';
import { SKU } from '../../../models/sku.model';
import { CreateOrderRequest, CreateOrderItem, OrderSource, OrderValidation } from '../../../models/order.model';

@Component({
  selector: 'app-create-order-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ZXingScannerModule],
  templateUrl: './create-order-modal-new.template.html'
})
export class CreateOrderModalComponent implements OnInit, OnDestroy {
  @Output() orderCreated = new EventEmitter<void>();
  @Output() modalClose = new EventEmitter<void>();
  @ViewChild('scanner') scanner!: ZXingScannerComponent;

  orderForm: FormGroup;
  isCreating = false;
  
  // Customer selection
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  selectedCustomer: Customer | null = null;
  customerSearchTerm = '';

  // Product selection
  products: SKU[] = [];
  filteredProducts: SKU[] = [];
  productSearchTerm = '';
  showBarcodeScanner = false;
  
  // Barcode scanner
  availableDevices: MediaDeviceInfo[] = [];
  currentDevice: MediaDeviceInfo | undefined = undefined;
  hasPermission = false;

  // Order items
  orderItems: (CreateOrderItem & { 
    productName: string; 
    skuCode: string; 
    subtotal: number; 
    availableStock?: number;
    attributes?: any;
  })[] = [];

  // Validation
  validationErrors: any[] = [];
  validationWarnings: any[] = [];

  // Order totals
  orderTotals = {
    subtotal: 0,
    taxes: 0,
    discounts: 0,
    total: 0
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private customerService: CustomerService,
    private productService: ProductService,
    private notificationService: NotificationService
  ) {
    this.orderForm = this.fb.group({
      source: ['manual', Validators.required],
      discounts: [0, [Validators.min(0)]],
      notes: ['']
    });
  }

  async ngOnInit() {
    await this.loadCustomers();
    await this.loadProducts();
    
    // Watch for discount changes
    this.orderForm.get('discounts')?.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => {
        this.calculateTotals();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadCustomers() {
    try {
      this.customerService.watchCustomers()
        .pipe(takeUntil(this.destroy$))
        .subscribe(customers => {
          this.customers = customers;
        });
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  }

  async loadProducts() {
    try {
      const response = await this.productService.getProductsByBusiness({
        search: '',
        category: null,
        warehouse: null,
        lowStock: false,
        active: true
      }, 100);
      
      this.products = response.items;
      this.filteredProducts = this.products;
      console.log('Products loaded:', this.products.length);
    } catch (error) {
      console.error('Error loading products:', error);
      this.notificationService.error('Error al cargar productos');
    }
  }

  searchCustomers() {
    if (!this.customerSearchTerm) {
      this.filteredCustomers = [];
      return;
    }

    const searchLower = this.customerSearchTerm.toLowerCase();
    this.filteredCustomers = this.customers.filter(customer =>
      customer.firstName.toLowerCase().includes(searchLower) ||
      customer.lastName.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower)
    ).slice(0, 10); // Limit to 10 results
  }

  selectCustomer(customer: Customer) {
    this.selectedCustomer = customer;
    this.customerSearchTerm = `${customer.firstName} ${customer.lastName}`;
    this.filteredCustomers = [];
  }

  clearCustomer() {
    this.selectedCustomer = null;
    this.customerSearchTerm = '';
    this.filteredCustomers = [];
  }

  searchProducts() {
    if (!this.productSearchTerm) {
      this.filteredProducts = this.products;
      return;
    }

    const searchLower = this.productSearchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(product =>
      product.name.toLowerCase().includes(searchLower) ||
      product.code.toLowerCase().includes(searchLower)
    );

    // Si hay solo un resultado exacto por código, agregarlo automáticamente
    if (this.filteredProducts.length === 1) {
      const exactMatch = this.filteredProducts.find(product => 
        product.code.toLowerCase() === searchLower
      );
      if (exactMatch && !this.isProductAlreadyAdded(exactMatch.id)) {
        this.addProductToOrder(exactMatch);
        this.productSearchTerm = '';
        this.filteredProducts = this.products;
      }
    }
  }

  toggleBarcodeScanner() {
    this.showBarcodeScanner = !this.showBarcodeScanner;
    if (this.showBarcodeScanner) {
      this.initializeBarcodeScanner();
    }
  }

  async initializeBarcodeScanner() {
    try {
      // Request camera permissions
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.hasPermission = true;
      stream.getTracks().forEach(track => track.stop()); // Stop the stream, scanner will handle it
      
      // Get available devices
      this.availableDevices = await navigator.mediaDevices.enumerateDevices();
      this.availableDevices = this.availableDevices.filter(device => device.kind === 'videoinput');
      
      if (this.availableDevices.length > 0) {
        this.currentDevice = this.availableDevices[0];
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.hasPermission = false;
      this.notificationService.error('No se pudo acceder a la cámara');
    }
  }

  onCodeResult(result: string) {
    console.log('Barcode scanned:', result);
    this.productSearchTerm = result;
    this.searchProducts();
    
    // Auto-close scanner after successful scan
    this.showBarcodeScanner = false;
  }

  onPermissionResponse(permission: boolean) {
    this.hasPermission = permission;
  }

  onDeviceChange(device: MediaDeviceInfo) {
    this.currentDevice = device;
  }

  addProductToOrder(product: SKU) {
    if (this.isProductAlreadyAdded(product.id)) {
      return;
    }

    const availableStock = product.stock.current - product.stock.reserved;
    if (availableStock <= 0) {
      this.notificationService.warning('Este producto no tiene stock disponible');
      return;
    }

    const newItem = {
      skuId: product.id,
      quantity: 1,
      unitPrice: product.pricing.price,
      productName: product.name,
      skuCode: product.code,
      subtotal: product.pricing.price,
      availableStock,
      attributes: product.attributes
    };

    this.orderItems.push(newItem);
    this.calculateTotals();
    this.productSearchTerm = '';
    this.filteredProducts = this.products;
  }

  isProductAlreadyAdded(productId: string): boolean {
    return this.orderItems.some(item => item.skuId === productId);
  }

  updateItemQuantity(index: number, newQuantity: number) {
    if (newQuantity < 1) return;
    
    const item = this.orderItems[index];
    if (item.availableStock && newQuantity > item.availableStock) {
      this.notificationService.warning(`Solo hay ${item.availableStock} unidades disponibles`);
      return;
    }

    item.quantity = newQuantity;
    item.subtotal = item.quantity * (item.unitPrice || 0);
    this.calculateTotals();
  }

  updateItemPrice(index: number, newPrice: number) {
    if (newPrice < 0) return;
    
    const item = this.orderItems[index];
    item.unitPrice = newPrice;
    item.subtotal = item.quantity * (item.unitPrice || 0);
    this.calculateTotals();
  }

  removeItem(index: number) {
    this.orderItems.splice(index, 1);
    this.calculateTotals();
  }

  calculateTotals() {
    const subtotal = this.orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const discounts = this.orderForm.get('discounts')?.value || 0;
    const taxes = 0; // TODO: Implement tax calculation if needed
    const total = subtotal + taxes - discounts;

    this.orderTotals = {
      subtotal,
      taxes,
      discounts,
      total: Math.max(0, total)
    };
  }

  canCreateOrder(): boolean {
    return !!(
      this.selectedCustomer &&
      this.orderItems.length > 0 &&
      this.orderForm.valid &&
      this.validationErrors.length === 0
    );
  }

  async onSubmit() {
    if (!this.canCreateOrder() || this.isCreating) {
      return;
    }

    // Validate order before submitting
    await this.validateOrder();
    
    if (this.validationErrors.length > 0) {
      return;
    }

    this.isCreating = true;

    try {
      const createRequest: CreateOrderRequest = {
        customerId: this.selectedCustomer!.id,
        items: this.orderItems.map(item => ({
          skuId: item.skuId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        notes: this.orderForm.value.notes || undefined,
        discounts: this.orderForm.value.discounts || 0,
        source: this.orderForm.value.source as OrderSource
      };

      const result = await this.orderService.createOrder(createRequest);

      if (result.success) {
        this.notificationService.showSuccess('Orden creada exitosamente');
        this.orderCreated.emit();
      } else {
        this.validationErrors = result.errors?.map(error => ({ message: error })) || [];
        this.notificationService.showError('Error al crear la orden');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      this.notificationService.showError('Error al crear la orden');
    } finally {
      this.isCreating = false;
    }
  }

  private async validateOrder() {
    this.validationErrors = [];
    this.validationWarnings = [];

    if (!this.selectedCustomer) {
      this.validationErrors.push({ message: 'Debe seleccionar un cliente' });
    }

    if (this.orderItems.length === 0) {
      this.validationErrors.push({ message: 'La orden debe contener al menos un producto' });
    }

    // Validate stock for each item
    for (const item of this.orderItems) {
      if (item.availableStock !== undefined && item.quantity > item.availableStock) {
        this.validationErrors.push({ 
          message: `Stock insuficiente para ${item.productName}. Disponible: ${item.availableStock}` 
        });
      }

      if (item.availableStock !== undefined && item.availableStock - item.quantity < 5) {
        this.validationWarnings.push({ 
          message: `Stock bajo para ${item.productName} después de esta orden` 
        });
      }
    }

    if (this.orderTotals.total <= 0) {
      this.validationErrors.push({ message: 'El total de la orden debe ser mayor a cero' });
    }
  }

  closeModal() {
    this.modalClose.emit();
  }
}