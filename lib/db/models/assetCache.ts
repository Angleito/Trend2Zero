import mongoose, { Schema, Document, Model } from 'mongoose';
import dbConnect from '../mongodb';

// Define connection states as numeric constants
export const ConnectionState = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  DISCONNECTING: 3
};

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

// Interface for Cryptocurrency Detection Results
export interface ICryptoDetection extends Document {
  address: string;
  network: string;
  detectionResult: {
    isCryptocurrency: boolean;
    confidence: number;
    metadata?: {
      symbol?: string;
      name?: string;
      type?: string;
      contractAddress?: string;
      blockchain?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Schema definitions
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

// Schema for Cryptocurrency Detection Results
const CryptoDetectionSchema: Schema = new Schema(
  {
    address: { type: String, required: true, index: true },
    network: { type: String, required: true, index: true },
    detectionResult: {
      isCryptocurrency: { type: Boolean, required: true },
      confidence: { type: Number, required: true },
      metadata: {
        symbol: { type: String },
        name: { type: String },
        type: { type: String },
        contractAddress: { type: String },
        blockchain: { type: String }
      }
    }
  },
  { timestamps: true }
);

// Indexes
AssetPriceSchema.index({ symbol: 1, updatedAt: -1 });
HistoricalDataSchema.index({ symbol: 1, days: 1, updatedAt: -1 });
AssetListSchema.index({ category: 1, page: 1, pageSize: 1, updatedAt: -1 });
CryptoDetectionSchema.index({ address: 1, network: 1, updatedAt: -1 });

// Model initialization function with connection state handling
export async function initializeModels(): Promise<{
  AssetPrice: Model<IAssetPrice>;
  HistoricalData: Model<IHistoricalData>;
  AssetList: Model<IAssetList>;
  CryptoDetection: Model<ICryptoDetection>;
}> {
  try {
    console.log('[MongoDB] Initializing models: Attempting database connection');
    const connection = await dbConnect();

    console.log(`[MongoDB] Connection readyState: ${connection.readyState}`);
    if (connection.readyState !== ConnectionState.CONNECTED) {
      const connectionError = new Error('MongoDB connection not established');
      console.error('[MongoDB] Connection Error:', connectionError);
      throw connectionError;
    }

    // Detailed model initialization logging
    console.log('[MongoDB] Checking and initializing models');
    const AssetPrice = mongoose.models.AssetPrice || mongoose.model<IAssetPrice>('AssetPrice', AssetPriceSchema);
    const HistoricalData = mongoose.models.HistoricalData || mongoose.model<IHistoricalData>('HistoricalData', HistoricalDataSchema);
    const AssetList = mongoose.models.AssetList || mongoose.model<IAssetList>('AssetList', AssetListSchema);
    const CryptoDetection = mongoose.models.CryptoDetection || mongoose.model<ICryptoDetection>('CryptoDetection', CryptoDetectionSchema);

    console.log('[MongoDB] Models initialized successfully');
    return {
      AssetPrice,
      HistoricalData,
      AssetList,
      CryptoDetection
    };
  } catch (error) {
    console.error('[MongoDB] Critical Error initializing models:', error);
    
    // Enhanced fallback logging
    console.warn('[MongoDB] Providing fallback models for SSR');
    return {
      AssetPrice: mongoose.models.AssetPrice || mongoose.model<IAssetPrice>('AssetPrice', AssetPriceSchema),
      HistoricalData: mongoose.models.HistoricalData || mongoose.model<IHistoricalData>('HistoricalData', HistoricalDataSchema),
      AssetList: mongoose.models.AssetList || mongoose.model<IAssetList>('AssetList', AssetListSchema),
      CryptoDetection: mongoose.models.CryptoDetection || mongoose.model<ICryptoDetection>('CryptoDetection', CryptoDetectionSchema)
    };
  }
}

// Default export for direct model access (use with caution)
export const AssetPrice = mongoose.models.AssetPrice || mongoose.model<IAssetPrice>('AssetPrice', AssetPriceSchema);
export const HistoricalData = mongoose.models.HistoricalData || mongoose.model<IHistoricalData>('HistoricalData', HistoricalDataSchema);
export const AssetList = mongoose.models.AssetList || mongoose.model<IAssetList>('AssetList', AssetListSchema);
export const CryptoDetection = mongoose.models.CryptoDetection || mongoose.model<ICryptoDetection>('CryptoDetection', CryptoDetectionSchema);
