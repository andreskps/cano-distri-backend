import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderCodeService {
  /**
   * Genera un código único para el pedido
   * Formato: PEDIDO-YYYY-NNNNN
   * Ejemplo: PEDIDO-2024-00001
   */
  generateOrderCode(): string {
    const year = new Date().getFullYear();
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    
    // Combinar timestamp y random para mayor unicidad
    const uniqueNumber = (timestamp % 100000) + random;
    const paddedNumber = uniqueNumber.toString().padStart(5, '0');
    
    return `PEDIDO-${year}-${paddedNumber}`;
  }

  /**
   * Genera un código secuencial basado en el último código existente
   * @param lastOrderCode - Último código de pedido en la base de datos
   */
  generateSequentialCode(lastOrderCode?: string): string {
    const year = new Date().getFullYear();
    
    if (!lastOrderCode) {
      return `PEDIDO-${year}-00001`;
    }

    // Extraer el número del último código
    const match = lastOrderCode.match(/PEDIDO-(\d{4})-(\d{5})/);
    
    if (!match) {
      return `PEDIDO-${year}-00001`;
    }

    const lastYear = parseInt(match[1]);
    const lastNumber = parseInt(match[2]);

    // Si es un año nuevo, empezar desde 1
    if (lastYear < year) {
      return `PEDIDO-${year}-00001`;
    }

    // Incrementar el número secuencial
    const nextNumber = (lastNumber + 1).toString().padStart(5, '0');
    return `PEDIDO-${year}-${nextNumber}`;
  }

  /**
   * Valida si un código de pedido tiene el formato correcto
   */
  isValidOrderCode(code: string): boolean {
    const pattern = /^PEDIDO-\d{4}-\d{5}$/;
    return pattern.test(code);
  }
}
