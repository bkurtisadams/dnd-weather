// Weather report display 
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wind, 
  Thermometer, 
  Cloud, 
  Sun, 
  Moon, 
  Compass,
  AlertTriangle,
  Eye,
  Mountain,
  Droplets
} from 'lucide-react';

const WeatherReport = ({ 
  terrain = 'plains',
  baseTemperature = 65,
  elevation = 0,
  latitude = 45,
  currentMonth = 'Patchwall'
}) => {
  // Weather report sections
  const [report, setReport] = useState({
    baseConditions: {
      temperature: {
        high: baseTemperature + 8,
        low: baseTemperature - 8,
        adjusted: {
          high: 0,
          low: 0
        }
      },
      sky: 'Partly Cloudy',
      precipitation: 'None',
      wind: {
        speed: 12,
        direction: 'North'
      },
      visibility: 'Normal'
    },
    effects: {
      terrain: [],
      temperature: [],
      precipitation: [],
      wind: [],
      special: []
    }
  });

  // Calculate terrain effects based on table
  const getTerrainEffects = (terrainType) => {
    const effects = {
      'rough terrain': { windSpeed: 5, special: ['01-80: Windstorm', '81-00: Earthquake'] },
      'forest': { temperature: -5, windSpeed: -5, special: ['01-80: Quicksand', '81-00: Earthquake'] },
      'jungle': { precipitation: 10, temperature: 5, windSpeed: -10 },
      'swamp': { precipitation: 5, temperature: 5, windSpeed: -5 },
      'plains': { windSpeed: 5, special: ['01-50: Tornado', '51-00: Earthquake'] },
      'desert': { precipitation: -30, temperature: [10, -10], windSpeed: 5 },
      'mountains': { 
        temperature: -3, 
        windSpeed: 5, 
        special: ['01-20: Wind storm', '21-50: Rock avalanche', '51-75: Snow avalanche']
      }
    };
    return effects[terrainType] || {};
  };

  // Temperature adjustments for elevation and latitude
  const getTemperatureAdjustments = () => {
    // -3 degrees per 1000 feet elevation
    const elevationAdjustment = Math.floor(elevation / 1000) * -3;
    // -2 degrees per 5 degrees latitude above 45°
    const latitudeAdjustment = latitude > 45 ? Math.floor((latitude - 45) / 5) * -2 : 0;
    return { elevationAdjustment, latitudeAdjustment };
  };

  return (
    <div className="w-full max-w-4xl">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Detailed Weather Report</span>
            {report.effects.special.length > 0 && (
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Temperature Section */}
          <div className="mb-4 p-3 border rounded-lg">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-red-500" />
              Temperature
            </h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-sm text-gray-600">Base Range</p>
                <p className="font-medium">
                  {report.baseConditions.temperature.high}°F / {report.baseConditions.temperature.low}°F
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Adjusted Range</p>
                <p className="font-medium">
                  {report.baseConditions.temperature.adjusted.high}°F / {report.baseConditions.temperature.adjusted.low}°F
                </p>
              </div>
            </div>
            {report.effects.temperature.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                <p className="font-medium">Effects:</p>
                <ul className="list-disc list-inside">
                  {report.effects.temperature.map((effect, index) => (
                    <li key={index}>{effect}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Precipitation Section */}
          <div className="mb-4 p-3 border rounded-lg">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              Precipitation
            </h3>
            <p className="font-medium">{report.baseConditions.precipitation}</p>
            {report.effects.precipitation.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                <ul className="list-disc list-inside">
                  {report.effects.precipitation.map((effect, index) => (
                    <li key={index}>{effect}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Wind Section */}
          <div className="mb-4 p-3 border rounded-lg">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Wind className="h-5 w-5 text-blue-500" />
              Wind Conditions
            </h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-sm text-gray-600">Speed</p>
                <p className="font-medium">{report.baseConditions.wind.speed} mph</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Direction</p>
                <p className="font-medium">{report.baseConditions.wind.direction}</p>
              </div>
            </div>
            {report.effects.wind.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                <p className="font-medium">Effects:</p>
                <ul className="list-disc list-inside">
                  {report.effects.wind.map((effect, index) => (
                    <li key={index}>{effect}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Terrain Effects */}
          <div className="mb-4 p-3 border rounded-lg">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mountain className="h-5 w-5 text-green-500" />
              Terrain Effects
            </h3>
            {report.effects.terrain.length > 0 ? (
              <ul className="list-disc list-inside mt-2">
                {report.effects.terrain.map((effect, index) => (
                  <li key={index} className="text-sm text-gray-600">{effect}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">No special terrain effects</p>
            )}
          </div>

          {/* Special Effects */}
          {report.effects.special.length > 0 && (
            <div className="p-3 border rounded-lg bg-yellow-50">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                Special Weather Events
              </h3>
              <ul className="list-disc list-inside mt-2">
                {report.effects.special.map((effect, index) => (
                  <li key={index} className="text-sm text-yellow-700">{effect}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WeatherReport;