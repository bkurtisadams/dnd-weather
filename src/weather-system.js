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
import { registerSettings } from './settings.js';

// Create bare minimum files for now to get it loading
const BaselineData = {};
const TerrainEffects = {};
const PrecipitationTable = {};
const WindEffects = {};
const SpecialWeatherEvents = {};
const MOON_PHASES = {};

// Initialize the module
Hooks.once('init', async () => {
    console.log('DND-Weather | Initializing weather system');
    
    // Register module settings first
    registerSettings();
    console.log('DND-Weather | Settings registered');
    
    // Create global namespace for the module
    globalThis.dndWeather = {
        weatherSystem: new GreyhawkWeatherSystem({
            latitude: game.settings.get('dnd-weather', 'latitude'),
            elevation: game.settings.get('dnd-weather', 'elevation'),
            terrain: game.settings.get('dnd-weather', 'terrain')
        }),
        WeatherDialog: WeatherDialog
    };
    
    // Register the module API
    const module = game.modules.get('dnd-weather');
    module.api = globalThis.dndWeather;
    
    // Also set the weatherSystem directly
    module.weatherSystem = globalThis.dndWeather.weatherSystem;

    console.log('DND-Weather | Weather system initialized:', globalThis.dndWeather.weatherSystem);
});

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
        console.log("DND-Weather | Generating weather for", days, "days");
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
            console.log("DND-Weather | Generating daily weather for:", date);
            
            // Generate base temperature
            const baseTemp = await this.tempCalculator.calculateBaseTemperature(date);
            console.log("DND-Weather | Base temperature:", baseTemp);
            
            // Calculate daily high and low
            const { highTemp, lowTemp } = await this.tempCalculator.calculateDailyTemperatures(baseTemp);
            console.log("DND-Weather | High/Low temps:", highTemp, lowTemp);
            
            // Determine sky conditions
            const skyConditions = await this.determineSkyConds();
            console.log("DND-Weather | Sky conditions:", skyConditions);
            
            // Check for precipitation
            const precipitation = await this.precipHandler.determinePrecipitation(date, highTemp, lowTemp);
            console.log("DND-Weather | Precipitation:", precipitation);
            
            // Calculate wind
            const wind = await this.windSystem.calculateWindConditions(precipitation.hasPrecipitation);
            console.log("DND-Weather | Wind conditions:", wind);
            
            // Check for special events
            const specialEvents = await this.determineSpecialEvents(precipitation, highTemp, lowTemp);
            console.log("DND-Weather | Special events:", specialEvents);
            
            // Calculate wind chill if applicable
            const windChill = this.calculateWindChill(lowTemp, wind.speed);
            console.log("DND-Weather | Wind chill:", windChill);
            
            // Get moon phase
            const moonPhase = await this.moonTracker.calculateMoonPhase(date);
            console.log("DND-Weather | Moon phase:", moonPhase);

            // Generate the final report
            const report = this.reportGen.generateReport({
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

            console.log("DND-Weather | Generated weather report:", report);
            return report;

        } catch (error) {
            console.error("DND-Weather | Failed to generate weather:", error);
            ui.notifications.error("Failed to generate weather");
            return null;
        }
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

    getCurrentWeather() {
        return this.reportGen.getCurrentReport();
    }

    async updateWeather() {
        console.log("DND-Weather | Updating current weather");
        const weather = await this.generateDailyWeather(await this.calendar.getCurrentDate());
        return weather;
    }
}

// Initialize the module
Hooks.once('init', async () => {
    console.log('DND-Weather | Initializing weather system');
    
    // Create global namespace for the module
    globalThis.dndWeather = {
        weatherSystem: new GreyhawkWeatherSystem(),
        WeatherDialog: WeatherDialog
    };
    
    // Register the module API
    game.modules.get('dnd-weather').api = {
        weatherSystem: globalThis.dndWeather.weatherSystem,
        WeatherDialog: WeatherDialog
    };

    console.log('DND-Weather | Initialization complete');
});

// Add Scene Controls
Hooks.on('getSceneControlButtons', (controls) => {
    console.log("DND-Weather | Adding weather controls");
    
    // Find the token controls group or create it
    let tokenControls = controls.find(c => c.name === "token");
    if (!tokenControls) {
        console.log("DND-Weather | Creating token controls group");
        tokenControls = {
            name: "token",
            title: "CONTROLS.Token",
            layer: "tokens",
            icon: "fas fa-user-alt",
            tools: []
        };
        controls.push(tokenControls);
    }

    // Add the weather tool to token controls
    tokenControls.tools.push({
        name: "weather",
        title: "DND-WEATHER.Controls.WeatherGenerator",
        icon: "fas fa-cloud",
        visible: game.user.isGM,
        onClick: () => {
            console.log("DND-Weather | Weather button clicked");
            new globalThis.dndWeather.WeatherDialog().render(true);
        },
        button: true
    });

    console.log("DND-Weather | Weather controls added successfully");
});

// Register settings when ready
// Initialize the module
Hooks.once('init', async () => {
    console.log('DND-Weather | Initializing weather system');
    
    // Create global namespace for the module
    globalThis.dndWeather = {
        weatherSystem: new GreyhawkWeatherSystem(),
        WeatherDialog: WeatherDialog
    };
    
    // Register the module API
    const module = game.modules.get('dnd-weather');
    module.api = globalThis.dndWeather;
    
    // Also set the weatherSystem directly
    module.weatherSystem = globalThis.dndWeather.weatherSystem;

    console.log('DND-Weather | Weather system initialized:', globalThis.dndWeather.weatherSystem);
});;