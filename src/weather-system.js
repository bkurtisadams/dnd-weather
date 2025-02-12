// weather-system.js
console.log("DND-Weather | Loading weather-system.js");
'use strict';

import { WeatherDialog } from './ui/components/WeatherDialog.js';
import { evalDice, rollDie, rollDice, rollPercentile } from './utils/dice.js';
import { 
    applyWindChill, 
    calculateLatitudeAdjustment, 
    calculateAltitudeAdjustment,
    calculateTempHumidityEffects,
    calculateTimeOfDayAdjustment 
} from './utils/temperature.js';
import { WeatherCalculator } from './utils/weather-calculations.js';

// Create bare minimum files for now to get it loading
const BaselineData = {};
const TerrainEffects = {};
const PrecipitationTable = {};
const WindEffects = {};
const SpecialWeatherEvents = {};
const MOON_PHASES = {};

class TemperatureCalculator {
    constructor(settings) {
        this.settings = settings;
    }
    
    async calculateBaseTemperature(date) {
        return 65; // Default temperature for testing
    }
    
    async calculateDailyTemperatures(baseTemp) {
        return {
            highTemp: baseTemp + 10,
            lowTemp: baseTemp - 10
        };
    }
    
    calculateWindChill(temp, windSpeed) {
        return applyWindChill(temp, windSpeed);
    }
}

class PrecipitationHandler {
    constructor(settings) {
        this.settings = settings;
    }
    
    async determinePrecipitation(date, highTemp, lowTemp) {
        return {
            hasPrecipitation: false,
            type: 'none'
        };
    }
}

class WindSystem {
    constructor(settings) {
        this.settings = settings;
    }
    
    async calculateWindConditions(hasPrecipitation) {
        return {
            speed: 5,
            direction: 'North'
        };
    }
}

class MoonPhaseTracker {
    async calculateMoonPhase(date) {
        return 'Full Moon';
    }
}

class ReportGenerator {
    generateReport(data) {
        return data;
    }
    
    getCurrentReport() {
        return {
            temperature: 65,
            conditions: 'Clear',
            wind: 'Light',
            moonPhase: 'Full Moon'
        };
    }
}

class CalendarIntegration {
    async getCurrentDate() {
        return new Date();
    }
    
    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
}

export class GreyhawkWeatherSystem {
    constructor(options = {}) {
        this.settings = {
            latitude: 40,
            elevation: 0,
            terrain: 'plains',
            ...options
        };
    
        // Initialize subsystems
        this.tempCalculator = new TemperatureCalculator(this.settings);
        this.precipHandler = new PrecipitationHandler(this.settings);
        this.windSystem = new WindSystem(this.settings);
        this.moonTracker = new MoonPhaseTracker();
        this.reportGen = new ReportGenerator();
        this.calendar = new CalendarIntegration();
    }

    async generateWeather(days = 1) {
        const weatherData = [];
        const currentDate = await this.calendar.getCurrentDate();

        for (let i = 0; i < days; i++) {
            const date = this.calendar.addDays(currentDate, i);
            const weather = await this.generateDailyWeather(date);
            weatherData.push(weather);
        }

        return weatherData;
    }

    async generateDailyWeather(date) {
        try {
            const weather = await this.generateWeatherForDate(date);
            const baseTemp = await this.tempCalculator.calculateBaseTemperature(date);
            const { highTemp, lowTemp } = await this.tempCalculator.calculateDailyTemperatures(baseTemp);
            const skyConditions = await this.determineSkyConds();
            const precipitation = await this.precipHandler.determinePrecipitation(date, highTemp, lowTemp);
            const wind = await this.windSystem.calculateWindConditions(precipitation.hasPrecipitation);
            const specialEvents = await this.determineSpecialEvents(precipitation, highTemp, lowTemp);
            const windChill = this.calculateWindChill(lowTemp, wind.speed);
            const moonPhase = await this.moonTracker.calculateMoonPhase(date);
        } catch (error) {
            console.error("Failed to generate weather:", error);
            // Notify user through UI
            ui.notifications.error("Failed to generate weather");
            return null;
        }

        return this.reportGen.generateReport({
            date,
            highTemp,
            lowTemp,
            windChill,
            skyConditions,
            precipitation,
            wind,
            specialEvents,
            moonPhase
        });
    }

    async determineSkyConds() {
        const roll = await rollDice(1, 100)[0];
        if (roll <= 30) return 'Clear';
        if (roll <= 70) return 'Partly Cloudy';
        return 'Cloudy';
    }

    async determineSpecialEvents(precipitation, highTemp, lowTemp) {
        if (!precipitation.hasPrecipitation) return null;
        
        const roll = await rollDice(1, 100)[0];
        if (roll === 100) {
            const terrainEvents = SpecialWeatherEvents[this.settings.terrain];
            const eventRoll = await rollDice(1, 100)[0];
            return terrainEvents?.find(event => 
                eventRoll <= event.chance && 
                highTemp >= event.minTemp && 
                lowTemp <= event.maxTemp
            );
        }
        return null;
    }

    calculateWindChill(temp, windSpeed) {
        if (temp > 35) return null;
        return this.tempCalculator.calculateWindChill(temp, windSpeed);
    }

    // UI Integration Methods
    getCurrentWeather() {
        return this.reportGen.getCurrentReport();
    }

    async updateWeather() {
        const weather = await this.generateDailyWeather(await this.calendar.getCurrentDate());
        return weather;
    }
}

// Initialize the module
Hooks.once('init', () => {
    console.log('DND-Weather | Initializing weather system');
    
    // Create global namespace for the module
    globalThis.dndWeather = globalThis.dndWeather || {};
    
    // Initialize the weather system
    const weatherSystem = new GreyhawkWeatherSystem();
    
    // Register everything in the global namespace
    globalThis.dndWeather = {
        weatherSystem: weatherSystem,
        WeatherDialog: WeatherDialog
    };
    
    // Also register in the module API
    const moduleData = game.modules.get('dnd-weather');
    moduleData.api = {
        weatherSystem: weatherSystem,
        WeatherDialog: WeatherDialog
    };
});

// Add Scene Controls
Hooks.on('getSceneControlButtons', (controls) => {
    console.log("DND-Weather | Adding weather controls");
    
    const weatherControls = {
        name: "weather",
        title: "Generate Weather",
        icon: "fas fa-cloud",
        visible: true,
        button: true,
        onClick: () => {
            console.log("DND-Weather | Weather button clicked");
            const dialog = new globalThis.dndWeather.WeatherDialog();
            dialog.render(true);
        }
    };

    // Add to existing controls
    const basicControls = controls.find(c => c.name === "basic");
    if (basicControls) {
        basicControls.tools.push(weatherControls);
    } else {
        controls.push({
            name: "basic",
            title: "Basic Controls",
            tools: [weatherControls]
        });
    }
});

// Also add this to your initialization hook to make sure the weather system is available
Hooks.once('init', () => {
    console.log('DND-Weather | Initializing weather system');
    game.dndWeather = {
        weatherSystem: new GreyhawkWeatherSystem(),
        WeatherDialog: WeatherDialog
    };
    
    // Make it available through the module API as well
    game.modules.get('dnd-weather').weatherSystem = game.dndWeather.weatherSystem;
});

// Register settings when ready
Hooks.once('ready', () => {
    console.log("DND-Weather | Weather module ready");
});

