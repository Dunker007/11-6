/**
 * Idle Computing Services Index
 * Central export point for idle computing revenue services
 */

export { idleRevenueService } from './idleRevenueService';
export { idleProfitMaximizerService } from './idleProfitMaximizerService';

export type {
  IdleNetwork,
  ComputeResource,
  EarningsHistory,
  PowerCost,
  NetworkConfig,
} from './idleRevenueService';

export type {
  ElectricityPricing,
  NetworkProfitability,
  ProfitOptimization,
  HourlyPrediction,
  ProfitAlert,
} from './idleProfitMaximizerService';
