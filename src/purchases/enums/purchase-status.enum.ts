export enum PurchaseStatus {
  DRAFT = 'draft',           // Borrador
  PENDING = 'pending',       // Pendiente de aprobar
  APPROVED = 'approved',     // Aprobada
  ORDERED = 'ordered',       // Pedida al proveedor
  PARTIAL = 'partial',       // Recibida parcialmente
  RECEIVED = 'received',     // Recibida completamente
  CANCELLED = 'cancelled',   // Cancelada
}