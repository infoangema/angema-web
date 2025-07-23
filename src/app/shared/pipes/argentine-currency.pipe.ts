import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'argentineCurrency',
  standalone: true
})
export class ArgentineCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined, showDecimals: boolean = true): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '$0,00';
    }

    // Formatear el número con separadores argentinos
    const formattedNumber = this.formatArgentineNumber(value, showDecimals);
    
    return `$${formattedNumber}`;
  }

  private formatArgentineNumber(value: number, showDecimals: boolean): string {
    // Redondear a 2 decimales
    const rounded = Math.round(value * 100) / 100;
    
    // Separar parte entera y decimal
    const parts = rounded.toFixed(showDecimals ? 2 : 0).split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    // Formatear la parte entera con puntos cada 3 dígitos (desde la derecha)
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    // Retornar con formato argentino
    if (showDecimals && decimalPart) {
      return `${formattedInteger},${decimalPart}`;
    } else {
      return formattedInteger;
    }
  }
}