// weather-system.js
import { baselineData } from './constants/baseline-data.js';
import { terrainEffects } from './constants/terrain-effects.js';
import { weatherPhenomena } from './constants/precipitation-table.js';
import { highWindsTable, windChillTable } from './constants/wind-effects.js';
import { moonPhases, lycanthropeActivity } from './constants/moon-phases.js';
import { WeatherDialog } from './ui/components/WeatherDialog.js';
import { rollDice, evalDice } from './utils/dice.js';
import { registerSettings } from './settings.js';
import { MILES_PER_LATITUDE } from './utils/latitude.js';
// Add temperature utilities
import { 
    calculateLatitudeAdjustment, 
    calculateAltitudeAdjustment,
    applyWindChill 
} from './utils/temperature.js';


export class GreyhawkWeatherSystem {
    constructor(options = {}) {
        this.settings = {
            latitude: 40,
            elevation: 0,
            terrain: 'plains',
            month: 'Fireseek', // Default to Fireseek for testing
            day: 1, // Default to 1st day of the month for testing
            ...options
        };
        
        //this.temperatureCalculator = new TemperatureCalculator();
        
        console.log("DND-Weather | Initialized with settings:", this.settings);
        console.log("DND-Weather | Temperature calculator initialized");
        
        this.currentWeather = null;
    }

    /**
     * Determine current season based on month
     * @param {string} month - Current month name
     * @returns {string} Season name
     */
    _getSeason(month) {
        console.log("DND-Weather | Determining season for month:", month);
        
        const seasonMap = {
            // Winter
            'Fireseek': 'Winter',
            'Sunsebb': 'Winter',
            'Needfest': 'Winter',
            
            // Spring
            'Readying': 'Spring',
            'Coldeven': 'Spring',
            'Growfest': 'Spring',
            
            // Low Summer
            'Planting': 'Low Summer',
            'Flocktime': 'Low Summer',
            'Wealsun': 'Low Summer',
            'Richfest': 'Low Summer',
            
            // High Summer
            'Reaping': 'High Summer',
            'Goodmonth': 'High Summer',
            'Harvester': 'High Summer',
            
            // Autumn
            'Patchwall': 'Autumn',
            'Ready\'reat': 'Autumn',
            'Brewfest': 'Autumn'
        };

        const season = seasonMap[month] || 'Unknown';
        console.log("DND-Weather | Determined season:", season);
        return season;
    }

    /* async generateWeather(days = 1) {
        console.log("DND-Weather | Generating weather for", days, "days");
        const weatherData = [];
        const currentDate = new Date(); // TODO: Use calendar integration

        for (let i = 0; i < days; i++) {
            const weather = await this.generateDailyWeather(currentDate);
            weatherData.push(weather);
        }

        // Store first day's weather as current
        if (weatherData.length > 0) {
            this.currentWeather = weatherData[0];
        }

        return weatherData;
    } */

        // /weather-system.js - generateWeather method
        async generateWeather(days = 1) {
            console.log("DND-Weather | Generating weather for", days, "days");
            try {
                const weatherData = [];
                const currentDate = new Date(); // TODO: Use calendar integration
                
                for (let i = 0; i < days; i++) {
                    const weather = await this.generateDailyWeather(currentDate);
                    weatherData.push(weather);
                }
                
                // Validate weather data before returning
                if (weatherData.length > 0) {
                    console.log("DND-Weather | Generated weather data:", weatherData[0]);
                } else {
                    console.warn("DND-Weather | No weather data generated");
                }
                
                return weatherData;
            } catch (error) {
                console.error("DND-Weather | Error generating weather:", error);
                throw error;
            }
        }

    async generateDailyWeather(date) {
        try {
            // Get the current month's baseline data
            const month = this.settings.month || this._getGreyhawkMonth(date);
            console.log("DND-Weather | Generating weather for month:", month);

            const monthData = baselineData[month];
            if (!monthData) {
                console.error("DND-Weather | Invalid month:", month);
                throw new Error(`Invalid month: ${month}`);
            }
            
            // Step 1: Calculate base temperature and adjustments
            const baseTemp = monthData.baseDailyTemp;
            console.log("DND-Weather | Base temperature:", baseTemp);
            
            // Check for temperature extremes
            const tempExtreme = await this._checkTemperatureExtremes(baseTemp);
            let adjustedBaseTemp = tempExtreme.isExtreme ? tempExtreme.adjustedTemp : baseTemp;
            console.log("DND-Weather | Temperature after extremes check:", {
                isExtreme: tempExtreme.isExtreme,
                type: tempExtreme.type,
                adjustedTemp: adjustedBaseTemp
            });
    
            // Calculate daily high/low adjustments
            const highAdj = await evalDice(monthData.dailyHighAdj);
            const lowAdj = await evalDice(monthData.dailyLowAdj);
            console.log("DND-Weather | Daily adjustments:", { highAdj, lowAdj });
            
            // Apply latitude adjustment (2°F per 2 1/3 hexes from 40th parallel)
            //const latitudeAdj = ((this.settings.latitude - 40) / 2.33) * 2;
            const latitudeAdj = calculateLatitudeAdjustment(this.settings.latitude);
            console.log("DND-Weather | Latitude adjustment:", latitudeAdj);

            
            // Apply elevation adjustment (-3°F per 1000 feet)
            //const elevationAdj = Math.floor(this.settings.elevation / 1000) * -3;
            const elevationAdj = calculateAltitudeAdjustment(this.settings.elevation);
            console.log("DND-Weather | Elevation adjustment:", elevationAdj);

            // Calculate final temperatures
            const highTemp = adjustedBaseTemp + highAdj + latitudeAdj + elevationAdj;
            const lowTemp = adjustedBaseTemp + lowAdj + latitudeAdj + elevationAdj;
            console.log("DND-Weather | Final temperatures:", { high: highTemp, low: lowTemp });
    
            // Step 2: Determine sky conditions
            const skyRoll = await rollDice(1, 100)[0];
            const skyConditions = this._determineSkyConditions(skyRoll, monthData.skyConditions);
    
            // Step 3: Check for precipitation
            const precipRoll = await rollDice(1, 100)[0];
            const terrainEffect = terrainEffects[this.settings.terrain];
            const basePrecipChance = monthData.chanceOfPrecip;
            const adjustedPrecipChance = basePrecipChance + (terrainEffect?.precipAdj || 0);
    
            let precipitation = { type: 'none', effects: [] };
            let wind = { speed: 0, direction: 'North' };
    
            if (precipRoll <= adjustedPrecipChance) {
                // Roll for precipitation type
                const typeRoll = await rollDice(1, 100)[0];
                precipitation = await this._determinePrecipitation(typeRoll, highTemp);
                console.log("DND-Weather | Checking precipitation continuation data:", {
                    type: precipitation.type,
                    chanceContinuing: precipitation.chanceContinuing,
                    duration: precipitation.duration
                });
                
                // If special weather (00), check terrain table
                if (precipitation.type === 'special') {
                    const specialEvent = await this._determineSpecialWeather(terrainEffect);
                    precipitation.specialEvent = specialEvent;
                }
    
                // Get wind speed from precipitation table
                wind = await this._determineWindForPrecipitation(precipitation);
            } else {
                // No precipitation - roll d20-1 for wind speed
                const windRoll = await rollDice(1, 20)[0];
                wind = await this._determineWind(windRoll - 1, terrainEffect);
            }
    
            // Step 5: Calculate wind chill if needed
            //const windChill = lowTemp < 35 ? this._calculateWindChill(lowTemp, wind.speed) : null;
            const windChill = lowTemp < 35 ? applyWindChill(lowTemp, wind.speed, windChillTable) : null;

            // Get moon phases
            const moonPhase = await this._determineMoonPhases();
            console.log("DND-Weather | Calculated moon phases:", moonPhase);
    
            return {
                baseConditions: {
                    temperature: {
                        high: Math.round(highTemp),
                        low: Math.round(lowTemp),
                        windChill,
                        extremeType: tempExtreme.type
                    },
                    sky: skyConditions,
                    precipitation: {
                        type: precipitation.type,
                        amount: precipitation.amount,
                        duration: precipitation.duration,
                        movement: precipitation.movement,
                        vision: precipitation.vision,
                        infraUltra: precipitation.infraUltra,
                        tracking: precipitation.tracking,
                        chanceLost: precipitation.chanceLost,
                        windSpeed: precipitation.windSpeed,
                        notes: precipitation.notes,
                        chanceRainbow: precipitation.chanceRainbow,
                        chanceContinuing: precipitation.chanceContinuing,
                        effects: precipitation.effects
                    },
                    wind: {
                        speed: wind.speed,
                        direction: wind.direction
                    },
                    moonPhase: {
                        luna: moonPhase.luna,
                        celene: moonPhase.celene
                    },
                    daylight: {
                        sunrise: monthData.sunrise,
                        sunset: monthData.sunset
                    }
                },
                effects: {
                    terrain: terrainEffect?.effects || [],
                    temperature: this._getTemperatureEffects(highTemp, lowTemp),
                    wind: wind.effects,
                    special: precipitation.specialEvent ? [precipitation.specialEvent] : []
                },
                terrain: this.settings.terrain,
                elevation: this.settings.elevation,
                timestamp: new Date().toLocaleString()
            };
    
        } catch (error) {
            console.error("DND-Weather | Failed to generate weather:", error);
            throw error;
        }
    }

    async _checkTemperatureExtremes(baseTemp) {
        const roll = await rollDice(1, 100)[0];
        
        // Check extreme temperatures table
        if (roll <= 1) return { isExtreme: true, type: 'extreme-low', adjustedTemp: baseTemp - 30 };
        if (roll <= 2) return { isExtreme: true, type: 'severe-low', adjustedTemp: baseTemp - 20 };
        if (roll <= 4) return { isExtreme: true, type: 'record-low', adjustedTemp: baseTemp - 10 };
        if (roll >= 97 && roll <= 98) return { isExtreme: true, type: 'record-high', adjustedTemp: baseTemp + 10 };
        if (roll === 99) return { isExtreme: true, type: 'severe-high', adjustedTemp: baseTemp + 20 };
        if (roll === 100) return { isExtreme: true, type: 'extreme-high', adjustedTemp: baseTemp + 30 };
        
        return { isExtreme: false, type: 'normal', adjustedTemp: baseTemp };
    }

    _determineSkyConditions(roll, conditions) {
        if (roll <= conditions.clear[1]) return 'Clear';
        if (roll <= conditions.partlyCloudy[1]) return 'Partly Cloudy';
        return 'Cloudy';
    }

    // weather-system.js, around line 316
    async _determinePrecipitation(roll, temperature) {
        // Find matching precipitation type from table
        for (const [type, data] of Object.entries(weatherPhenomena)) {
            if (roll >= data.diceRange[0] && roll <= data.diceRange[1]) {
                // Check temperature requirements
                if (data.temperature.max && temperature > data.temperature.max) {
                    return this._determinePrecipitation(await rollDice(1, 100)[0], temperature);
                }
                if (data.temperature.min && temperature < data.temperature.min) {
                    return this._determinePrecipitation(await rollDice(1, 100)[0], temperature);
                }
    
                // Calculate duration
                const duration = await this._calculatePrecipitationDuration(data);
                
                // Roll for amount if present
                let amount = null;
                if (data.precipitation.amount) {
                    const amountMatch = data.precipitation.amount.match(/(\d+)d(\d+)/);
                    if (amountMatch) {
                        const [_, count, sides] = amountMatch;
                        amount = await rollDice(parseInt(count), parseInt(sides))[0];
                    }
                }
    
                // Handle complex movement/vision structures
                const movement = typeof data.precipitation.movement === 'object' 
                    ? data.precipitation.movement 
                    : { all: data.precipitation.movement || 'Normal' };
    
                const vision = typeof data.precipitation.vision === 'object'
                    ? data.precipitation.vision
                    : { normal: data.precipitation.vision || 'Normal' };
    
                    return {
                        type,
                        amount,
                        duration,  // This will now be the actual rolled number
                        movement: data.precipitation.movement,
                        vision: data.precipitation.vision,
                        infraUltra: data.precipitation.infraUltra,
                        tracking: data.precipitation.tracking,
                        chanceLost: data.precipitation.chanceLost,
                        windSpeed: data.precipitation.windSpeed,
                        notes: data.notes,
                        chanceContinuing: data.chanceContinuing,
                        chanceRainbow: data.chanceRainbow,
                        originalDuration: data.precipitation.duration  // Keep the original string for reference
                    };
            }
        }
        return { 
            type: 'none', 
            amount: null, 
            duration: 0, 
            movement: 'Normal',
            vision: 'Normal',
            infraUltra: 'Normal',
            tracking: 'Normal',
            chanceLost: 'Normal',
            windSpeed: 'Normal',
            notes: '',
            effects: [],
            chanceRainbow: 0,
            chanceContinuing: 0
        };
    }

    getCurrentWeather() {
        return this.currentWeather;
    }

    // Add other necessary methods...
    // Additional helper methods for GreyhawkWeatherSystem class
    /**
     * Determine wind conditions when no precipitation
     * @param {number} baseSpeed - Base wind speed from d20-1 roll
     * @param {Object} terrainEffect - Terrain modifiers
     * @returns {Object} Wind conditions
     */
    async _determineWind(baseSpeed, terrainEffect) {
        console.log("DND-Weather | Determining wind for speed:", baseSpeed);
        
        // Apply terrain wind modifier
        const adjustedSpeed = baseSpeed + (terrainEffect?.windSpeedAdjustment || 0);
        console.log("DND-Weather | Adjusted wind speed:", adjustedSpeed);
        
        // Get wind direction
        const direction = await this._determineWindDirection();
        
        // Get effects based on wind speed
        const effects = this._getWindEffects(adjustedSpeed);
        
        return {
            speed: Math.max(0, adjustedSpeed),
            direction,
            effects
        };
    }

    /**
     * Determine wind direction based on season and prevailing winds
     * @returns {string} Wind direction
     */
    async _determineWindDirection() {
        const season = this._getSeason(this.settings.month);
        console.log("DND-Weather | Determining wind direction for season:", season);
        
        // 70% chance of prevailing wind
        const prevailingRoll = await rollDice(1, 100)[0];
        console.log("DND-Weather | Prevailing wind roll:", prevailingRoll);
        
        if (prevailingRoll <= 70) {
            // Use prevailing winds based on season
            if (['Autumn', 'Winter'].includes(season)) {
                const direction = await rollDice(1, 2)[0] === 1 ? 'North' : 'Northeast';
                console.log("DND-Weather | Using fall/winter prevailing wind:", direction);
                return direction;
            } else {
                const direction = await rollDice(1, 2)[0] === 1 ? 'East' : 'Southeast';
                console.log("DND-Weather | Using spring/summer prevailing wind:", direction);
                return direction;
            }
        }
        
        // Random direction for remaining 30%
        const dirRoll = await rollDice(1, 8)[0];
        const directions = ['North', 'Northeast', 'East', 'Southeast', 
                        'South', 'Southwest', 'West', 'Northwest'];
        const direction = directions[dirRoll - 1];
        console.log("DND-Weather | Using random wind direction:", direction);
        return direction;
    }

/* async _determineWindDirection() {
    // Roll d8 for direction
    const roll = await rollDice(1, 8)[0];
    const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
    return directions[roll - 1];
} */

async _determineWindForPrecipitation(precipitation) {
    if (!precipitation?.type || precipitation.type === 'none') {
        return { speed: 0, direction: 'North', effects: [] };
    }

    const precipData = weatherPhenomena[precipitation.type];
    if (!precipData) return { speed: 0, direction: 'North', effects: [] };

    // Get wind speed from precipitation data
    const windSpeed = await evalDice(precipData.precipitation.windSpeed);
    const direction = await this._determineWindDirection();
    
    return {
        speed: windSpeed,
        direction,
        effects: this._getWindEffects(windSpeed)
    };
}

_calculateWindChill(temp, windSpeed) {
    if (temp >= 35 || windSpeed < 5) return null;

    // Find closest wind speed in table
    const windSpeeds = Object.keys(windChillTable).map(Number);
    const closestSpeed = windSpeeds.reduce((prev, curr) => 
        Math.abs(curr - windSpeed) < Math.abs(prev - windSpeed) ? curr : prev
    );

    // Find closest temperature
    const temps = Object.keys(windChillTable[closestSpeed]).map(Number);
    const closestTemp = temps.reduce((prev, curr) => 
        Math.abs(curr - temp) < Math.abs(prev - temp) ? curr : prev
    );

    return windChillTable[closestSpeed][closestTemp];
}

async _calculatePrecipitationDuration(data) {
    if (!data.precipitation.duration) return 0;

    // Parse duration string (e.g., "d4 hours" or "3d8 hours")
    const durationMatch = data.precipitation.duration.match(/(\d*)[dD](\d+)/);
    if (!durationMatch) return 0;

    const [_, count, sides] = durationMatch;
    const diceCount = count ? parseInt(count) : 1;  // If no count specified, use 1
    const result = await rollDice(diceCount, parseInt(sides))[0];
    
    console.log("DND-Weather | Calculated duration:", {
        original: data.precipitation.duration,
        parsed: { count: diceCount, sides: parseInt(sides) },
        result
    });
    
    return result;
}

async _determineSpecialWeather(terrainEffect) {
    if (!terrainEffect?.specialWeather) return null;

    const roll = await rollDice(1, 100)[0];
    
    for (const event of terrainEffect.specialWeather) {
        if (roll >= event.range[0] && roll <= event.range[1]) {
            return event.event;
        }
    }
    return null;
}

_getTemperatureEffects(highTemp, lowTemp) {
    const effects = [];
    
    if (highTemp > 95) effects.push('Extreme heat - Risk of heatstroke');
    if (highTemp > 85) effects.push('Hot conditions');
    if (lowTemp < 0) effects.push('Extreme cold - Risk of hypothermia');
    if (lowTemp < 32) effects.push('Freezing conditions');
    
    return effects;
}

_getPrecipitationEffects(precipData) {
    const effects = [];
    
    // Add movement effects
    if (precipData.precipitation.movement) {
        if (typeof precipData.precipitation.movement === 'object') {
            const movementStr = Object.entries(precipData.precipitation.movement)
                .map(([type, value]) => `${type}: ${value}`)
                .join(', ');
            effects.push(`Movement: ${movementStr}`);
        } else if (precipData.precipitation.movement !== 'Normal') {
            effects.push(`Movement: ${precipData.precipitation.movement}`);
        }
    }
    
    // Add visibility effects
    if (precipData.precipitation.vision && precipData.precipitation.vision !== 'Normal') {
        effects.push(`Visibility: ${precipData.precipitation.vision}`);
    }
    
    // Add tracking effects
    if (precipData.precipitation.tracking && precipData.precipitation.tracking !== 'Normal') {
        effects.push(`Tracking: ${precipData.precipitation.tracking}`);
    }
    
    return effects;
}

_getWindEffects(windSpeed) {
    // Find applicable wind effect tier
    for (const tier of highWindsTable) {
        if (windSpeed <= tier.maxSpeed) {
            return [
                tier.effects.onLand,
                tier.effects.inBattle
            ].filter(effect => effect !== "No effect");
        }
    }
    return [];
}

_getGreyhawkMonth(date) {
    // This should be replaced with proper calendar integration
    const months = Object.keys(baselineData);
    const monthIndex = date.getMonth();
    return months[monthIndex % months.length];
}

// src/weather-system.js
async _determineMoonPhase(date) {
    console.log("DND-Weather | Determining moon phase");
    
    // Use settings values
    const month = this.settings.month;
    const day = this.settings.day;
    
    console.log("DND-Weather | Using month:", month, "day:", day);
    
    // Check Luna's phase for this day
    const monthPhases = moonPhases.Luna[month];
    if (!monthPhases) {
        console.warn("DND-Weather | No moon phase data found for month:", month);
        return 'Unknown';
    }
    
    console.log("DND-Weather | Available phases for", month, ":", monthPhases);

    // Get all phase days for this month
    const phaseDays = Object.keys(monthPhases).map(Number);
    console.log("DND-Weather | Phase days:", phaseDays);

    // Find closest day to current day
    const closestDay = phaseDays.reduce((prev, curr) => {
        const prevDiff = Math.abs(prev - day);
        const currDiff = Math.abs(curr - day);
        return prevDiff < currDiff ? prev : curr;
    });
    
    const phase = monthPhases[closestDay];
    console.log("DND-Weather | Selected phase:", phase, "for day", closestDay);

    return phase;
}

/* async _determineCelenePhase(date) {
    const month = this.settings.month;
    const day = this.settings.day;
    
    console.log("DND-Weather | Determining Celene phase for", month, "day", day);
    
    const monthPhases = moonPhases.Celene[month];
    if (!monthPhases) {
        console.warn("DND-Weather | No Celene phase data found for month:", month);
        return 'Unknown';
    }
    
    const phaseDays = Object.keys(monthPhases).map(Number);
    const closestDay = phaseDays.reduce((prev, curr) => {
        return Math.abs(prev - day) < Math.abs(curr - day) ? prev : curr;
    });
    
    return monthPhases[closestDay];
}
 */
// src/weather-system.js
// Around line 410
async _determineMoonPhases() {
    console.log("DND-Weather | Determining moon phases for", this.settings.month, "day", this.settings.day);
    
    // Luna phases - pattern varies by month group
    let lunaPhase = await this._determineLunaPhase();
    let celenePhase = await this._determineCelenePhase();
    
    return {
        luna: lunaPhase,
        celene: celenePhase
    };
}

_determineLunaPhase() {
    const month = this.settings.month;
    const day = this.settings.day;
    
    // Fireseek-Coldeven pattern
    if (['Fireseek', 'Readying', 'Coldeven'].includes(month)) {
        if (day === 4) return '1st Quarter';
        if (day === 11) return 'Full';
        if (day === 18) return '3/4';
        if (day === 25) return 'New';
    }
    
    // Planting-Wealsun pattern
    else if (['Planting', 'Flocktime', 'Wealsun'].includes(month)) {
        if (day === 4) return 'Full';
        if (day === 11) return '3/4';
        if (day === 18) return 'New';
        if (day === 25) return '1/4';
    }
    
    // Reaping-Harvester pattern
    else if (['Reaping', 'Goodmonth', 'Harvester'].includes(month)) {
        if (day === 4) return '3/4';
        if (day === 11) return 'New';
        if (day === 18) return '1/4';
        if (day === 25) return 'Full';
    }
    
    // Patchwall-Sunsebb pattern
    else if (['Patchwall', 'Ready\'reat', 'Sunsebb'].includes(month)) {
        if (day === 4) return 'New';
        if (day === 11) return '1/4';
        if (day === 18) return 'Full';
        if (day === 25) return '3/4';
    }
    
    // Festival months are special cases
    else if (month === 'Needfest') {
        if (day === 4) return 'New';
    }
    else if (month === 'Growfest') {
        if (day === 4) return '1/4';
    }
    else if (month === 'Richfest') {
        if (day === 4) return 'Full';
    }
    else if (month === 'Brewfest') {
        if (day === 4) return '3/4';
    }

    // Calculate phases between main points
    return this._calculateIntermediateLunaPhase(day);
}

/* _determineCelenePhase() {
    const month = this.settings.month;
    const day = this.settings.day;

    // Handle each month explicitly based on the table
    if (month === 'Needfest' && day === 4) return 'Full';
    if (month === 'Fireseek' && day === 19) return '3/4';
    if (month === 'Readying' && day === 11) return 'New';
    if (month === 'Coldeven' && day === 4) return '1/4';
    if (month === 'Growfest' && day === 4) return 'Full';
    if (month === 'Planting' && day === 19) return '3/4';
    if (month === 'Flocktime' && day === 11) return 'New';
    if (month === 'Wealsun' && day === 4) return '1/4';
    if (month === 'Richfest' && day === 4) return 'Full';
    if (month === 'Reaping' && day === 19) return '3/4';
    if (month === 'Goodmonth' && day === 11) return 'New';
    if (month === 'Harvester' && day === 4) return '1/4';
    if (month === 'Brewfest' && day === 4) return 'Full';
    if (month === 'Patchwall' && day === 19) return '3/4';
    if (month === 'Ready\'reat' && day === 11) return 'New';
    if (month === 'Sunsebb' && day === 4) return '1/4';

    return null; // Return null for non-phase days
} */

_determineCelenePhase() {
    const month = this.settings.month;
    const day = this.settings.day;

    console.log("DND-Weather | Determining Celene phase for:", { month, day });

    // Define phase days for each month
    const celenePhases = {
        'Needfest': { 4: 'Full' },
        'Fireseek': { 19: '3/4' },
        'Readying': { 11: 'New' },
        'Coldeven': { 4: '1/4' },
        'Growfest': { 4: 'Full' },
        'Planting': { 19: '3/4' },
        'Flocktime': { 11: 'New' },
        'Wealsun': { 4: '1/4' },
        'Richfest': { 4: 'Full' },
        'Reaping': { 19: '3/4' },
        'Goodmonth': { 11: 'New' },
        'Harvester': { 4: '1/4' },
        'Brewfest': { 4: 'Full' },
        'Patchwall': { 19: '3/4' },
        'Ready\'reat': { 11: 'New' },
        'Sunsebb': { 4: '1/4' }
    };

    // Get the phase days for this month
    const monthPhases = celenePhases[month];
    if (!monthPhases) {
        console.warn("DND-Weather | No phase data for month:", month);
        return 'Unknown';
    }

    // Find the closest phase day
    const phaseDays = Object.keys(monthPhases).map(Number);
    if (phaseDays.includes(day)) {
        console.log("DND-Weather | Exact phase found:", monthPhases[day]);
        return monthPhases[day];
    }

    // Find the most recent phase
    const mostRecentDay = Math.max(...phaseDays.filter(d => d <= day));
    if (mostRecentDay > 0) {
        console.log("DND-Weather | Using most recent phase:", monthPhases[mostRecentDay]);
        return monthPhases[mostRecentDay];
    }

    // If we're before the first phase of this month, use the last phase from previous month
    console.log("DND-Weather | Using transitional phase");
    const phases = ['New', '1/4', 'Full', '3/4'];
    const currentPhaseIndex = phases.indexOf(monthPhases[Math.min(...phaseDays)]);
    const previousPhase = phases[(currentPhaseIndex - 1 + phases.length) % phases.length];
    return previousPhase;
}
    

_calculateIntermediateLunaPhase(day) {
    // Calculate intermediate phases based on main phase points
    if (day < 4) return 'Waxing Crescent';
    if (day < 11) return 'Waxing Gibbous';
    if (day < 18) return 'Waning Gibbous';
    if (day < 25) return 'Waning Crescent';
    return 'Waning Crescent';
}

_determineLycanthropeActivity(lunaPhase, celenePhase) {
    console.log("DND-Weather | Determining lycanthrope activity for phases:", 
                { lunaPhase, celenePhase, month: this.settings.month, day: this.settings.day });
    
    if (this.settings.month === 'Richfest' && this.settings.day === 4) {
        return lycanthropeActivity.midsummer;
    }
    if (lunaPhase === 'Full' && celenePhase === 'Full') {
        return lycanthropeActivity.both_full;
    }
    if (lunaPhase === 'Full') {
        return lycanthropeActivity.luna_full;
    }
    if (celenePhase === 'Full') {
        return lycanthropeActivity.celene_full;
    }
    return lycanthropeActivity.normal;
}

async updateWeather(options = {}) {
    console.log("DND-Weather | Updating current weather", options);
    
    if (!this.currentWeather) {
        console.log("DND-Weather | No current weather, generating new");
        return this.generateDailyWeather(new Date());
    }

    // Check if current precipitation should continue
    const currentPrecip = this.currentWeather.baseConditions.precipitation;
    if (currentPrecip.type !== 'none' && options.continues) {
        console.log("DND-Weather | Handling precipitation continuation");
        
        const { changeRoll } = options;
        let newPrecipType = currentPrecip.type;
        
        // Handle type changes based on d10 roll
        if (changeRoll === 1) {
            // Move up one line on precipitation table
            const types = Object.keys(weatherPhenomena);
            const currentIndex = types.indexOf(currentPrecip.type.toLowerCase());
            if (currentIndex > 0) {
                newPrecipType = types[currentIndex - 1];
                console.log("DND-Weather | Precipitation type moving up to:", newPrecipType);
            }
        } else if (changeRoll === 10) {
            // Move down one line on precipitation table
            const types = Object.keys(weatherPhenomena);
            const currentIndex = types.indexOf(currentPrecip.type.toLowerCase());
            if (currentIndex < types.length - 1) {
                newPrecipType = types[currentIndex + 1];
                console.log("DND-Weather | Precipitation type moving down to:", newPrecipType);
            }
        }

        // Get new precipitation details
        const typeRoll = this._getPrecipitationRollForType(newPrecipType);
        const temperature = this.currentWeather.baseConditions.temperature.high;
        const newPrecip = await this._determinePrecipitation(typeRoll, temperature);
        
        // Get wind data for the precipitation
        const wind = await this._determineWindForPrecipitation(newPrecip);
        
        // Return updated weather with continued precipitation
        return {
            ...this.currentWeather,
            baseConditions: {
                ...this.currentWeather.baseConditions,
                precipitation: {
                    ...newPrecip,
                    continues: true,
                    previousType: currentPrecip.type,
                    changed: newPrecip.type !== currentPrecip.type
                },
                wind
            },
            timestamp: new Date().toLocaleString()
        };
    } else if (currentPrecip.type !== 'none' && options.checkRainbow) {
        // Check for rainbow when precipitation ends
        console.log("DND-Weather | Checking for rainbow");
        const rainbowChance = currentPrecip.chanceRainbow || 0;
        const rainbowRoll = await rollDice(1, 100)[0];
        
        if (rainbowRoll <= rainbowChance) {
            console.log("DND-Weather | Rainbow appears!");
            // Determine rainbow type
            const typeRoll = await rollDice(1, 100)[0];
            let rainbowEffect = {};
            
            if (typeRoll <= 89) rainbowEffect = { type: 'single' };
            else if (typeRoll <= 95) rainbowEffect = { type: 'double', isOmen: true };
            else if (typeRoll <= 98) rainbowEffect = { type: 'triple', isOmen: true };
            else if (typeRoll === 99) rainbowEffect = { type: 'bifrost', description: 'Bifrost bridge or clouds in shape of rain deity' };
            else rainbowEffect = { type: 'deity', description: 'Rain deity or servant in sky' };
            
            // Generate new weather but include rainbow effect
            const newWeather = await this.generateDailyWeather(new Date());
            return {
                ...newWeather,
                effects: {
                    ...newWeather.effects,
                    special: [...(newWeather.effects.special || []), `Rainbow appears: ${rainbowEffect.type}${
                        rainbowEffect.isOmen ? ' (possible omen)' : ''
                    }${
                        rainbowEffect.description ? ` - ${rainbowEffect.description}` : ''
                    }`]
                }
            };
        }
    }

    // If no continuation or rainbow, generate new weather
    console.log("DND-Weather | Generating new weather");
    return this.generateDailyWeather(new Date());
}

// Helper method to get the correct roll value for a precipitation type
_getPrecipitationRollForType(type) {
    const precipData = weatherPhenomena[type.toLowerCase()];
    if (!precipData) return 0;
    // Return the middle of the dice range for this type
    return Math.floor((precipData.diceRange[0] + precipData.diceRange[1]) / 2);
}

async _checkPrecipitationContinuation() {
    const currentPrecipType = this.currentWeather.baseConditions.precipitation;
    const precipData = weatherPhenomena[currentPrecipType];
    
    if (!precipData) {
        return { continues: false };
    }

    // Roll for continuation
    const continuationRoll = await rollDice(1, 100)[0];
    if (continuationRoll > precipData.chanceContinuing) {
       // Add rainbow check here since precipitation is ending
       const precipHandler = new PrecipitationHandler(this.temperatureCalculator);
       const rainbow = precipHandler.checkForRainbow(precipData);
       
       return { 
           continues: false,
           rainbow: rainbow  // Add rainbow data to return object
       };
   }

    // Roll for precipitation change
    const changeRoll = await rollDice(1, 10)[0];
    let newPrecipType = currentPrecipType;

    if (changeRoll === 1) {
        // Move up one line on the table
        const types = Object.keys(weatherPhenomena);
        const currentIndex = types.indexOf(currentPrecipType);
        if (currentIndex > 0) {
            newPrecipType = types[currentIndex - 1];
        }
    } else if (changeRoll === 10) {
        // Move down one line on the table
        const types = Object.keys(weatherPhenomena);
        const currentIndex = types.indexOf(currentPrecipType);
        if (currentIndex < types.length - 1) {
            newPrecipType = types[currentIndex + 1];
        }
    }

    // Calculate new duration
    const newPrecipData = weatherPhenomena[newPrecipType];
    const duration = await this._calculatePrecipitationDuration(newPrecipData);
    const effects = this._getPrecipitationEffects(newPrecipData);

    return {
        continues: true,
        type: newPrecipType,
        duration,
        effects
    };
}

async _handleSpecialWeather() {
    const terrainEffect = terrainEffects[this.settings.terrain];
    const specialEvent = await this._determineSpecialWeather(terrainEffect);
    
    // Special events may have their own precipitation
    const rerollPrecip = await rollDice(1, 100)[0];
    let precipitation = { type: 'none', effects: [] };
    
    if (rerollPrecip <= 50) { // 50% chance to have additional precipitation
        const precipRoll = await rollDice(1, 100)[0];
        precipitation = await this._determinePrecipitation(precipRoll, this.currentWeather.baseConditions.temperature.high);
    }

    return {
        specialEvent,
        precipitation
    };
}

_calculateVisibility(precipitation, specialEvent) {
    if (specialEvent && weatherPhenomena[specialEvent]) {
        return weatherPhenomena[specialEvent].precipitation.vision;
    }
    
    if (precipitation && weatherPhenomena[precipitation.type]) {
        return weatherPhenomena[precipitation.type].precipitation.vision;
    }
    
    return 'Normal';
}

_calculateMovementModifiers(precipitation, specialEvent) {
    let modifier = 1.0;
    
    if (specialEvent && weatherPhenomena[specialEvent]) {
        const specialMovement = weatherPhenomena[specialEvent].precipitation.movement;
        if (typeof specialMovement === 'string') {
            // Handle fractions like "1/4"
            const [num, den] = specialMovement.split('/');
            modifier *= num / den;
        }
    }
    
    if (precipitation && weatherPhenomena[precipitation.type]) {
        const precipMovement = weatherPhenomena[precipitation.type].precipitation.movement;
        if (typeof precipMovement === 'string') {
            const [num, den] = precipMovement.split('/');
            modifier *= num / den;
        }
    }
    
    return Math.max(0.25, modifier); // Minimum 1/4 movement rate
}
}

// Initialize the module
Hooks.once('init', async () => {
    console.log('DND-Weather | Initializing weather system');
    
    // Register module settings first
    registerSettings();
    
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

// Add Scene Controls
Hooks.on("getSceneControlButtons", function(controls) {
    console.log("DND-Weather | Adding weather controls");
    
    // Find the token controls group or create it
    let tokenControls = controls.find(function(c) { 
        return c.name === "token";
    });

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
        onClick: function() {
            console.log("DND-Weather | Weather button clicked");
            new globalThis.dndWeather.WeatherDialog().render(true);
        },
        button: true
    });

    console.log("DND-Weather | Weather controls added successfully");
});
