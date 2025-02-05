export type Size = string;

export type Carrier = 'DHL' | 'FedEx' | 'UPS' | 'TORRESTIR' | 'Other';

export interface Address {
  street: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
}

export interface SizeQuantity {
  size: Size;
  quantity: number;
}

export interface BoxModel {
  id: string;
  modelReference: string;
  modelDescription: string;
  color: string;
  sizeQuantities: SizeQuantity[];
}

export interface BoxDimensions {
  length: number;
  width: number;
  height: number;
}

export interface Box {
  id: string;
  models: BoxModel[];
  netWeight: number;
  grossWeight: number;
  boxNumber: number;
  dimensions: BoxDimensions;
  sizeDescriptions?: Record<string, string>;
}

export interface ShippingDocument {
  name: string;
  url: string;
  uploadedAt: Date;
}

export interface PackingList {
  id: string;
  code: string;
  client: Client;
  boxes: Box[];
  trackingNumbers: string[];
  carrier: Carrier;
  customCarrier?: string;
  shippingDocument?: ShippingDocument;
  createdAt: Date;
  updatedAt: Date;
}