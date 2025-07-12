import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { where } from '@angular/fire/firestore';
import { DatabaseService } from '../../../core/services/database.service';
import { BusinessService } from '../../../core/services/business.service';
import { AuthService } from '../../../core/services/auth.service';
import { RootBusinessSelectorService } from './root-business-selector.service';
import { Attribute, AttributeType, AttributeFilters, CreateAttributeRequest } from '../models/attribute.model';

@Injectable({
  providedIn: 'root'
})
export class AttributeService {
  constructor(
    private databaseService: DatabaseService,
    private businessService: BusinessService,
    private authService: AuthService,
    private rootBusinessSelector: RootBusinessSelectorService
  ) {}

  /**
   * Obtener atributos por tipo para el negocio actual
   */
  getAttributesByType(type: AttributeType): Observable<Attribute[]> {
    return this.watchAttributes().pipe(
      map(attributes => 
        attributes
          .filter(attr => attr.type === type && attr.isActive)
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      )
    );
  }

  /**
   * Observar todos los atributos del negocio actual
   */
  watchAttributes(): Observable<Attribute[]> {
    const isRoot = this.authService.isRoot();
    let businessId: string | null = null;

    if (isRoot) {
      businessId = this.rootBusinessSelector.getEffectiveBusinessId();
    } else {
      // Para usuarios no root, necesitamos obtener el businessId de forma asíncrona
      return new Observable(observer => {
        this.businessService.getCurrentBusinessId().then(id => {
          if (id) {
            // Usar consulta simple sin ordenamiento para evitar índices complejos
            this.databaseService.getWhere<Attribute>('attributes', 'businessId', '==', id)
              .pipe(
                map(attributes => attributes.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)))
              )
              .subscribe(attributes => observer.next(attributes));
          } else {
            observer.next([]);
          }
        });
      });
    }

    if (businessId) {
      // Usar consulta simple sin ordenamiento para evitar índices complejos
      return this.databaseService.getWhere<Attribute>('attributes', 'businessId', '==', businessId)
        .pipe(
          map(attributes => attributes.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)))
        );
    }

    // Si no hay businessId, retornar array vacío
    return new Observable(observer => observer.next([]));
  }

  /**
   * Crear un nuevo atributo
   */
  async createAttribute(attributeData: CreateAttributeRequest): Promise<string> {
    const isRoot = this.authService.isRoot();
    let businessId: string | null = null;

    if (isRoot) {
      businessId = this.rootBusinessSelector.getEffectiveBusinessId();
    } else {
      businessId = await this.businessService.getCurrentBusinessId();
    }

    if (!businessId) {
      throw new Error('No se encontró el ID del negocio');
    }

    const attribute: Omit<Attribute, 'id' | 'createdAt' | 'updatedAt'> = {
      businessId,
      type: attributeData.type,
      code: attributeData.code.toUpperCase(),
      name: attributeData.name,
      description: attributeData.description || '',
      isActive: true,
      sortOrder: attributeData.sortOrder || 0
    };

    return this.databaseService.create('attributes', attribute);
  }

  /**
   * Actualizar un atributo
   */
  async updateAttribute(id: string, attributeData: Partial<Attribute>): Promise<void> {
    const updateData = { ...attributeData };
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }
    await this.databaseService.update('attributes', id, updateData);
  }

  /**
   * Eliminar un atributo (soft delete)
   */
  async deleteAttribute(id: string): Promise<void> {
    await this.databaseService.softDelete('attributes', id);
  }

  /**
   * Obtener un atributo por ID
   */
  async getAttributeById(id: string): Promise<Attribute | null> {
    return this.databaseService.getById<Attribute>('attributes', id);
  }

  /**
   * Verificar si un código de atributo ya existe
   */
  async isCodeUnique(code: string, type: AttributeType, excludeId?: string): Promise<boolean> {
    const isRoot = this.authService.isRoot();
    let businessId: string | null = null;

    if (isRoot) {
      businessId = this.rootBusinessSelector.getEffectiveBusinessId();
    } else {
      businessId = await this.businessService.getCurrentBusinessId();
    }

    if (!businessId) {
      return false;
    }

    try {
      // Usar solo un filtro para evitar índices complejos y filtrar en cliente
      const attributes = await this.databaseService.getOnce<Attribute>('attributes', 
        where('businessId', '==', businessId)
      );

      // Filtrar en el cliente para evitar índices complejos
      const filteredAttributes = attributes.filter(attr => 
        attr.type === type && 
        attr.code.toUpperCase() === code.toUpperCase() && 
        attr.isActive
      );

      if (excludeId) {
        return filteredAttributes.filter(attr => attr.id !== excludeId).length === 0;
      }

      return filteredAttributes.length === 0;
    } catch (error) {
      console.error('Error checking code uniqueness:', error);
      return false;
    }
  }

  /**
   * Obtener opciones predeterminadas para un tipo específico
   */
  getDefaultOptions(type: AttributeType): { code: string; name: string }[] {
    switch (type) {
      case 'color':
        return [
          { code: 'BLA', name: 'Blanco' },
          { code: 'NEG', name: 'Negro' },
          { code: 'ROJ', name: 'Rojo' },
          { code: 'AZU', name: 'Azul' },
          { code: 'VER', name: 'Verde' },
          { code: 'AMA', name: 'Amarillo' },
          { code: 'NAR', name: 'Naranja' },
          { code: 'ROS', name: 'Rosa' },
          { code: 'VIO', name: 'Violeta' },
          { code: 'GRI', name: 'Gris' }
        ];
      case 'size':
        return [
          { code: 'XS', name: 'Extra Small' },
          { code: 'S', name: 'Small' },
          { code: 'M', name: 'Medium' },
          { code: 'L', name: 'Large' },
          { code: 'XL', name: 'Extra Large' },
          { code: 'XXL', name: '2X Large' },
          { code: 'XXXL', name: '3X Large' }
        ];
      case 'material':
        return [
          { code: 'ALG', name: 'Algodón' },
          { code: 'POL', name: 'Poliéster' },
          { code: 'LAN', name: 'Lana' },
          { code: 'NIL', name: 'Nylon' },
          { code: 'SED', name: 'Seda' },
          { code: 'LIN', name: 'Lino' },
          { code: 'CUE', name: 'Cuero' },
          { code: 'DEN', name: 'Denim' }
        ];
      default:
        return [];
    }
  }
}