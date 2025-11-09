import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useCryptoStore } from '@/services/crypto/cryptoStore';
import type { CoinbaseCandle } from '@/types/crypto';
import { CHART_CONSTANTS, POLLING_INTERVALS, DEFAULTS } from '@/utils/constants';
import { usePolling } from '@/utils/hooks/usePolling';
import '../../../../styles/CryptoLab.css';

type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';
type ChartType = 'candlestick' | 'line' | 'area';

const TIMEFRAME_MAP: Record<Timeframe, string> = {
  '1m': 'ONE_MINUTE',
  '5m': 'FIVE_MINUTE',
  '15m': 'FIFTEEN_MINUTE',
  '1h': 'ONE_HOUR',
  '4h': 'SIX_HOUR',
  '1d': 'ONE_DAY',
  '1w': 'ONE_DAY', // Use daily for weekly
};

interface TradingChartProps {
  productId: string;
}

function TradingChart({ productId }: TradingChartProps) {
  const { chartData, isLoadingChart, loadChartData } = useCryptoStore();
  const [timeframe, setTimeframe] = useState<Timeframe>(DEFAULTS.CHART_TIMEFRAME);
  const [chartType, setChartType] = useState<ChartType>(DEFAULTS.CHART_TYPE);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Memoize timeframe string to avoid recreating on each render
  const timeframeString = useMemo(() => TIMEFRAME_MAP[timeframe], [timeframe]);

  // Load chart data when product or timeframe changes
  useEffect(() => {
    if (productId) {
      loadChartData(productId, timeframeString);
    }
  }, [productId, timeframeString, loadChartData]);

  // Poll for chart updates
  usePolling(
    () => {
      if (productId) {
        loadChartData(productId, timeframeString);
      }
    },
    POLLING_INTERVALS.CHART_DATA,
    !!productId
  );

  const handleTimeframeChange = useCallback((tf: Timeframe) => {
    setTimeframe(tf);
  }, []);

  const handleChartTypeChange = useCallback((ct: ChartType) => {
    setChartType(ct);
  }, []);

  // Memoize chart calculations
  const chartCalculations = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return null;
    }

    const slicedData = chartData.slice(-CHART_CONSTANTS.MAX_DATA_POINTS);
    const dataLength = slicedData.length;
    
    if (dataLength === 0) return null;

    const min = Math.min(...chartData.map((c) => parseFloat(c.low)));
    const max = Math.max(...chartData.map((c) => parseFloat(c.high)));
    const range = max - min || 1;

    return {
      slicedData,
      dataLength,
      min,
      max,
      range,
    };
  }, [chartData]);

  return (
    <div className="trading-chart">
      <div className="chart-header">
        <div className="chart-controls">
          <div className="timeframe-selector">
            {(['1m', '5m', '15m', '1h', '4h', '1d', '1w'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                className={`timeframe-btn ${timeframe === tf ? 'active' : ''}`}
                onClick={() => handleTimeframeChange(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
          <div className="chart-type-selector">
            <button
              className={`chart-type-btn ${chartType === 'candlestick' ? 'active' : ''}`}
              onClick={() => handleChartTypeChange('candlestick')}
            >
              Candles
            </button>
            <button
              className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
              onClick={() => handleChartTypeChange('line')}
            >
              Line
            </button>
            <button
              className={`chart-type-btn ${chartType === 'area' ? 'active' : ''}`}
              onClick={() => handleChartTypeChange('area')}
            >
              Area
            </button>
          </div>
        </div>
      </div>

      <div className="chart-container" ref={chartContainerRef}>
        {isLoadingChart ? (
          <div className="chart-loading">
            <p>Loading chart data...</p>
          </div>
        ) : !chartCalculations ? (
          <div className="chart-placeholder">
            <p>No chart data available</p>
            <p className="chart-hint">Chart will display price history here</p>
          </div>
        ) : (
          <div className="chart-visualization">
            <div className="chart-svg-container">
              <svg width="100%" height="100%" viewBox={`0 0 ${CHART_CONSTANTS.CHART_WIDTH} ${CHART_CONSTANTS.CHART_HEIGHT}`}>
                {chartData.length > 0 && (
                  <g>
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <line
                        key={`grid-h-${i}`}
                        x1="0"
                        y1={(i * CHART_CONSTANTS.CHART_HEIGHT) / 4}
                        x2={CHART_CONSTANTS.CHART_WIDTH}
                        y2={(i * CHART_CONSTANTS.CHART_HEIGHT) / 4}
                        stroke="rgba(139, 92, 246, 0.1)"
                        strokeWidth="1"
                      />
                    ))}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <line
                        key={`grid-v-${i}`}
                        x1={(i * CHART_CONSTANTS.CHART_WIDTH) / 4}
                        y1="0"
                        x2={(i * CHART_CONSTANTS.CHART_WIDTH) / 4}
                        y2={CHART_CONSTANTS.CHART_HEIGHT}
                        stroke="rgba(139, 92, 246, 0.1)"
                        strokeWidth="1"
                      />
                    ))}
                    
                    {/* Price line */}
                    {(() => {
                      const { slicedData, dataLength, min, range } = chartCalculations;
                      if (dataLength === 0) return null;
                      
                      return (
                        <polyline
                          points={slicedData
                            .map((candle: CoinbaseCandle, idx: number) => {
                              const x = dataLength === 1 
                                ? CHART_CONSTANTS.CHART_WIDTH / 2 
                                : (idx / (dataLength - 1)) * CHART_CONSTANTS.CHART_WIDTH;
                              const close = parseFloat(candle.close);
                              const y = CHART_CONSTANTS.CHART_HEIGHT - ((close - min) / range) * CHART_CONSTANTS.CHART_HEIGHT;
                              return `${x},${y}`;
                            })
                            .join(' ')}
                          fill="none"
                          stroke="var(--violet-500)"
                          strokeWidth="2"
                        />
                      );
                    })()}
                    
                    {/* Candlesticks (if candlestick mode) */}
                    {chartType === 'candlestick' && chartCalculations && (() => {
                      const { slicedData, dataLength, min, range } = chartCalculations;
                      
                      return slicedData.map((candle: CoinbaseCandle, idx: number) => {
                        const x = dataLength === 1 
                          ? CHART_CONSTANTS.CHART_WIDTH / 2 
                          : (idx / (dataLength - 1)) * CHART_CONSTANTS.CHART_WIDTH;
                        const open = parseFloat(candle.open);
                        const close = parseFloat(candle.close);
                        const high = parseFloat(candle.high);
                        const low = parseFloat(candle.low);
                        
                        const yOpen = CHART_CONSTANTS.CHART_HEIGHT - ((open - min) / range) * CHART_CONSTANTS.CHART_HEIGHT;
                        const yClose = CHART_CONSTANTS.CHART_HEIGHT - ((close - min) / range) * CHART_CONSTANTS.CHART_HEIGHT;
                        const yHigh = CHART_CONSTANTS.CHART_HEIGHT - ((high - min) / range) * CHART_CONSTANTS.CHART_HEIGHT;
                        const yLow = CHART_CONSTANTS.CHART_HEIGHT - ((low - min) / range) * CHART_CONSTANTS.CHART_HEIGHT;
                        
                        const isGreen = close >= open;
                        const color = isGreen ? 'var(--emerald-500)' : 'var(--red-500)';
                        
                        return (
                          <g key={`candle-${candle.time}-${idx}`}>
                            {/* Wick */}
                            <line
                              x1={x}
                              y1={yHigh}
                              x2={x}
                              y2={yLow}
                              stroke={color}
                              strokeWidth="1"
                            />
                            {/* Body */}
                            <rect
                              x={x - 3}
                              y={Math.min(yOpen, yClose)}
                              width="6"
                              height={Math.abs(yClose - yOpen) || 2}
                              fill={color}
                            />
                          </g>
                        );
                      });
                    })()}
                  </g>
                )}
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TradingChart;
