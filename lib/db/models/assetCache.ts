import mongoose, { Schema, Document } from 'mongoose';

// Interface for Asset Price data
export interface IAssetPrice extends Document {
  symbol: string;
  price: number;
  change?: number;
  changePercent?: number;
  priceInBTC: number;
  priceInUSD: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for Asset Price data
const AssetPriceSchema: Schema = new Schema(
  {
    symbol: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    change: { type: Number },
    changePercent: { type: Number },
    priceInBTC: { type: Number, required: true },
    priceInUSD: { type: Number, required: true },
    lastUpdated: { type: Date, required: true },
  },
  { timestamps: true }
);

// Create a compound index for efficient querying
AssetPriceSchema.index({ symbol: 1, updatedAt: -1 });

// Interface for Historical Data
export interface IHistoricalData extends Document {
  symbol: string;
  days: number;
  data: Array<{
    date: Date;
    price: number;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for Historical Data
const HistoricalDataSchema: Schema = new Schema(
  {
    symbol: { type: String, required: true, index: true },
    days: { type: Number, required: true },
    data: [
      {
        date: { type: Date, required: true },
        price: { type: Number, required: true },
        open: { type: Number },
        high: { type: Number },
        low: { type: Number },
        close: { type: Number },
        volume: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

// Create a compound index for efficient querying
HistoricalDataSchema.index({ symbol: 1, days: 1, updatedAt: -1 });

// Interface for Asset List
export interface IAssetList extends Document {
  category: string;
  page: number;
  pageSize: number;
  data: Array<{
    symbol: string;
    name: string;
    type: string;
    description?: string;
  }>;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Schema for Asset List
const AssetListSchema: Schema = new Schema(
  {
    category: { type: String, required: true, index: true },
    page: { type: Number, required: true },
    pageSize: { type: Number, required: true },
    data: [
      {
        symbol: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, required: true },
        description: { type: String },
      },
    ],
    pagination: {
      page: { type: Number },
      pageSize: { type: Number },
      totalItems: { type: Number },
      totalPages: { type: Number },
    },
  },
  { timestamps: true }
);

// Create a compound index for efficient querying
AssetListSchema.index({ category: 1, page: 1, pageSize: 1, updatedAt: -1 });

// Create models
export const AssetPrice = mongoose.models.AssetPrice || mongoose.model<IAssetPrice>('AssetPrice', AssetPriceSchema);
export const HistoricalData = mongoose.models.HistoricalData || mongoose.model<IHistoricalData>('HistoricalData', HistoricalDataSchema);
export const AssetList = mongoose.models.AssetList || mongoose.model<IAssetList>('AssetList', AssetListSchema);
