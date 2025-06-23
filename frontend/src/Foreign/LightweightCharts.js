import * as LightweightCharts from 'lightweight-charts';

// Chart creation
export const _createChart = (element, options) => {
  return LightweightCharts.createChart(element, options);
};

// Series creation
export const _addCandlestickSeries = (chart, options) => {
  return chart.addCandlestickSeries(options);
};

export const _addLineSeries = (chart, options) => {
  return chart.addLineSeries(options);
};

// Data operations
export const _setData = (series, data) => {
  series.setData(data);
};

// Chart operations
export const _applyOptions = (chart, options) => {
  chart.applyOptions(options);
};

export const _resize = (chart, width, height) => {
  chart.resize(width, height);
};

export const _remove = (chart) => {
  chart.remove();
};

// Time scale operations
export const _timeScale = (chart) => {
  return chart.timeScale();
};

export const _fitContent = (timeScale) => {
  timeScale.fitContent();
};

// Event subscriptions
export const _subscribeClick = (chart, handler) => {
  const subscription = chart.subscribeClick((param) => {
    handler(param)();
  });
  return () => {
    subscription();
  };
};

export const _subscribeCrosshairMove = (chart, handler) => {
  const subscription = chart.subscribeCrosshairMove((param) => {
    handler(param)();
  });
  return () => {
    subscription();
  };
};

// Helper to convert PureScript values to JavaScript
export const _toJsOptions = (options) => {
  // This function handles the conversion of PureScript Maybe values and other types
  const convertValue = (value) => {
    if (value === null || value === undefined) {
      return undefined;
    }
    
    // Handle Maybe type
    if (value.constructor && value.constructor.name === 'Just') {
      return convertValue(value.value0);
    }
    if (value.constructor && value.constructor.name === 'Nothing') {
      return undefined;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(convertValue);
    }
    
    // Handle objects
    if (typeof value === 'object' && value !== null) {
      const result = {};
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          const converted = convertValue(value[key]);
          if (converted !== undefined) {
            result[key] = converted;
          }
        }
      }
      return result;
    }
    
    // Handle enum-like types
    if (value.constructor) {
      switch (value.constructor.name) {
        case 'Solid':
          return LightweightCharts.ColorType.Solid;
        case 'VerticalGradient':
          return LightweightCharts.ColorType.VerticalGradient;
        case 'HorizontalGradient':
          return LightweightCharts.ColorType.HorizontalGradient;
        case 'CMNormal':
          return LightweightCharts.CrosshairMode.Normal;
        case 'CMMagnet':
          return LightweightCharts.CrosshairMode.Magnet;
        case 'CMHidden':
          return LightweightCharts.CrosshairMode.Hidden;
        case 'LSSolid':
          return LightweightCharts.LineStyle.Solid;
        case 'LSDashed':
          return LightweightCharts.LineStyle.Dashed;
        case 'LSDotted':
          return LightweightCharts.LineStyle.Dotted;
        case 'LSLargeDashed':
          return LightweightCharts.LineStyle.LargeDashed;
        case 'LSSparseDotted':
          return LightweightCharts.LineStyle.SparseDotted;
      }
    }
    
    return value;
  };
  
  return convertValue(options);
};