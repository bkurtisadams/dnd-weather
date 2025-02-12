// Integration tests 
// @vitest 
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WeatherSystem } from '../src/weather-system';
import { TemperatureCalculator } from '../src/subsystems/TemperatureCalculator';
import { PrecipitationHandler } from '../src/subsystems/PrecipitationHandler';
import { WindSystem } from '../src/subsystems/WindSystem';
import { MoonPhaseTracker } from '../src/subsystems/MoonPhaseTracker';
import { SpecialWeatherEvents } from '../src/subsystems/SpecialWeatherEvents';
import { CalendarIntegration } from '../src/subsystems/CalendarIntegration';
import { ReportGenerator } from '../src/subsystems/ReportGenerator';

describe('WeatherSystem Integration Tests', () => {
  let weatherSystem;
  let mockGameTime;

  beforeEach(() => {
    // Mock game time for consistent testing
    mockGameTime = {
      month: 'Patchwall',
      day: 1,
      year: 2025,
      hour: 12
    };

    // Initialize weather system with test configuration
    weatherSystem = new WeatherSystem({
      location: {
        terrain: 'plains',
        latitude: 45,
        elevation: 0,
        isCoastal: false
      },
      general: {
        enabled: true,
        autoUpdate: true,
        updateInterval: 24
      },
      calendar: {
        useSimpleCalendar: true,
        syncWithGameTime: true
      }
    });
  });

  describe('Core System Integration', () => {
    it('should properly initialize all subsystems', () => {
      expect(weatherSystem.temperatureCalculator).toBeInstanceOf(TemperatureCalculator);
      expect(weatherSystem.precipitationHandler).toBeInstanceOf(PrecipitationHandler);
      expect(weatherSystem.windSystem).toBeInstanceOf(WindSystem);
      expect(weatherSystem.moonPhaseTracker).toBeInstanceOf(MoonPhaseTracker);
      expect(weatherSystem.specialEvents).toBeInstanceOf(SpecialWeatherEvents);
      expect(weatherSystem.calendarIntegration).toBeInstanceOf(CalendarIntegration);
      expect(weatherSystem.reportGenerator).toBeInstanceOf(ReportGenerator);
    });

    it('should generate consistent weather based on game time', () => {
      const weather1 = weatherSystem.generateWeather(mockGameTime);
      const weather2 = weatherSystem.generateWeather(mockGameTime);
      expect(weather1).toEqual(weather2);
    });
  });

  describe('Temperature Calculation Integration', () => {
    it('should apply terrain and elevation effects to temperature', () => {
      const mountainWeather = new WeatherSystem({
        ...weatherSystem.config,
        location: {
          terrain: 'mountains',
          latitude: 45,
          elevation: 3000,
          isCoastal: false
        }
      });

      const plainWeather = weatherSystem.generateWeather(mockGameTime);
      const mountWeather = mountainWeather.generateWeather(mockGameTime);

      // Mountains should be colder (-3 degrees per 1000ft)
      expect(mountWeather.temperature).toBeLessThan(plainWeather.temperature);
      expect(mountWeather.temperature).toBe(plainWeather.temperature - 9);
    });

    it('should apply wind chill effects when temperature is below 35°F', () => {
      const coldWeather = weatherSystem.generateWeather({
        ...mockGameTime,
        month: 'Fireseek' // Winter month
      });

      if (coldWeather.temperature < 35) {
        expect(coldWeather.effectiveTemperature).toBeLessThan(coldWeather.temperature);
      }
    });
  });

  describe('Precipitation Integration', () => {
    it('should adjust precipitation based on terrain', () => {
      const jungleWeather = new WeatherSystem({
        ...weatherSystem.config,
        location: {
          terrain: 'jungle',
          latitude: 45,
          elevation: 0,
          isCoastal: false
        }
      });

      const desertWeather = new WeatherSystem({
        ...weatherSystem.config,
        location: {
          terrain: 'desert',
          latitude: 45,
          elevation: 0,
          isCoastal: false
        }
      });

      // Generate 100 weather samples for each terrain
      const samples = 100;
      let jungleRainCount = 0;
      let desertRainCount = 0;

      for (let i = 0; i < samples; i++) {
        const jWeather = jungleWeather.generateWeather({...mockGameTime, day: i});
        const dWeather = desertWeather.generateWeather({...mockGameTime, day: i});
        
        if (jWeather.precipitation !== 'None') jungleRainCount++;
        if (dWeather.precipitation !== 'None') desertRainCount++;
      }

      // Jungle should have significantly more precipitation
      expect(jungleRainCount).toBeGreaterThan(desertRainCount * 2);
    });

    it('should handle precipitation type changes based on temperature', () => {
      const coldWeather = weatherSystem.generateWeather({
        ...mockGameTime,
        month: 'Fireseek',
        hour: 0 // Midnight for colder temp
      });

      const warmWeather = weatherSystem.generateWeather({
        ...mockGameTime,
        month: 'Flocktime',
        hour: 12 // Noon for warmer temp
      });

      // If there's precipitation and temp is below freezing, it should be snow
      if (coldWeather.temperature < 32 && coldWeather.precipitation !== 'None') {
        expect(coldWeather.precipitation).toMatch(/snow|sleet|blizzard/i);
      }

      // If there's precipitation and temp is above freezing, it should be rain
      if (warmWeather.temperature > 32 && warmWeather.precipitation !== 'None') {
        expect(warmWeather.precipitation).toMatch(/rain|drizzle|storm/i);
      }
    });
  });

  describe('Special Events Integration', () => {
    it('should generate terrain-appropriate special events', () => {
      const plainsWeather = weatherSystem.generateWeather(mockGameTime);
      if (plainsWeather.specialEvents.length > 0) {
        expect(plainsWeather.specialEvents[0]).toMatch(/tornado|earthquake/i);
      }

      const mountainWeather = new WeatherSystem({
        ...weatherSystem.config,
        location: { terrain: 'mountains', latitude: 45, elevation: 5000, isCoastal: false }
      }).generateWeather(mockGameTime);

      if (mountainWeather.specialEvents.length > 0) {
        expect(mountainWeather.specialEvents[0]).toMatch(/avalanche|windstorm|volcano|earthquake/i);
      }
    });
  });

  describe('Calendar Integration', () => {
    it('should sync with Simple Calendar module', () => {
      const mockSimpleCalendar = {
        api: {
          currentDateTime: {
            month: { name: 'Patchwall' },
            day: { number: 1 },
            year: { number: 2025 },
            hour: 12
          }
        }
      };

      // Mock the global simple-calendar module
      global.SimpleCalendar = mockSimpleCalendar;

      const weather = weatherSystem.generateWeather();
      expect(weather.timestamp.month).toBe('Patchwall');
      expect(weather.timestamp.day).toBe(1);
      expect(weather.timestamp.year).toBe(2025);
    });
  });

  describe('Wind System Integration', () => {
    it('should adjust wind effects based on terrain and elevation', () => {
      const baseWeather = weatherSystem.generateWeather(mockGameTime);
      
      const mountainWeather = new WeatherSystem({
        ...weatherSystem.config,
        location: { terrain: 'mountains', latitude: 45, elevation: 5000, isCoastal: false }
      }).generateWeather(mockGameTime);

      // Mountains should have stronger winds (+5mph per 1000ft)
      expect(mountainWeather.windSpeed).toBe(baseWeather.windSpeed + 25);
    });

    it('should calculate correct movement penalties based on wind speed', () => {
      const highWindWeather = weatherSystem.generateWeather({
        ...mockGameTime,
        windOverride: 45 // Force high wind condition
      });

      // Check movement penalties based on wind speed table
      if (highWindWeather.windSpeed >= 45) {
        expect(highWindWeather.effects).toContain('All travel slowed by 50%');
        expect(highWindWeather.effects).toContain('torches and small fires will be blown out');
      }
    });
  });

  describe('Report Generator Integration', () => {
    it('should generate comprehensive weather reports', () => {
      const report = weatherSystem.generateDetailedReport(mockGameTime);
      
      expect(report).toHaveProperty('temperature');
      expect(report).toHaveProperty('windSpeed');
      expect(report).toHaveProperty('windDirection');
      expect(report).toHaveProperty('precipitation');
      expect(report).toHaveProperty('visibility');
      expect(report).toHaveProperty('effects');
      expect(report).toHaveProperty('specialEvents');
      expect(report).toHaveProperty('terrain');
      expect(report).toHaveProperty('timestamp');
    });

    it('should include all relevant weather effects in reports', () => {
      const report = weatherSystem.generateDetailedReport({
        ...mockGameTime,
        temperature: 20,
        windSpeed: 50
      });

      // Should include wind chill effects
      expect(report.effects).toContain(expect.stringMatching(/wind chill|effective temperature/i));
      
      // Should include wind speed effects
      expect(report.effects).toContain(expect.stringMatching(/travel slowed|blown out/i));
    });
  });
});