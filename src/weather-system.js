// weather-system.js
import { baselineData } from './constants/baseline-data.js';
import { terrainEffects } from './constants/terrain-effects.js';
import { weatherPhenomena } from './constants/precipitation-table.js';
import { highWindsTable, windChillTable } from './constants/wind-effects.js';
import { moonPhases, lycanthropeActivity } from './constants/moon-phases.js';
import { WeatherDialog } from './ui/components/WeatherDialog.js';
import { rollDice, evalDice } from './utils/dice.js';
import { registerSettings } from './settings.js';


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
        console.log("DND-Weather | Initialized with settings:", this.settings);
        this.currentWeather = null;
    }

    async generateWeather(days = 1) {
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
            
            // Check for temperature extremes
            const tempExtreme = await this._checkTemperatureExtremes(baseTemp);
            let adjustedBaseTemp = tempExtreme.isExtreme ? tempExtreme.adjustedTemp : baseTemp;
    
            // Calculate daily high/low adjustments
            const highAdj = await evalDice(monthData.dailyHighAdj);
            const lowAdj = await evalDice(monthData.dailyLowAdj);
            
            // Apply latitude adjustment (2°F per 2 1/3 hexes from 40th parallel)
            const latitudeAdj = ((this.settings.latitude - 40) / 2.33) * 2;
            
            // Apply elevation adjustment (-3°F per 1000 feet)
            const elevationAdj = Math.floor(this.settings.elevation / 1000) * -3;
    
            // Calculate final temperatures
            const highTemp = adjustedBaseTemp + highAdj + latitudeAdj + elevationAdj;
            const lowTemp = adjustedBaseTemp + lowAdj + latitudeAdj + elevationAdj;
    
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
            const windChill = lowTemp < 35 ? this._calculateWindChill(lowTemp, wind.speed) : null;

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
                    precipitation: precipitation.type,
                    wind: {
                        speed: wind.speed,
                        direction: wind.direction
                    },
                    //moonPhase: await this._determineMoonPhase(date)
                    moonPhase: {
                        luna: moonPhase.luna,
                        celene: moonPhase.celene
                    }
                },
                effects: {
                    terrain: terrainEffect?.effects || [],
                    temperature: this._getTemperatureEffects(highTemp, lowTemp),
                    precipitation: precipitation.effects,
                    wind: wind.effects,
                    special: precipitation.specialEvent ? [precipitation.specialEvent] : []
                },
                duration: precipitation.duration,
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

    async _determinePrecipitation(roll, temperature) {
        // Find matching precipitation type from table
        for (const [type, data] of Object.entries(weatherPhenomena)) {
            if (roll >= data.diceRange[0] && roll <= data.diceRange[1]) {
                // Check temperature requirements
                if (data.temperature.max && temperature > data.temperature.max) {
                    // Reroll if too warm
                    return this._determinePrecipitation(await rollDice(1, 100)[0], temperature);
                }
                if (data.temperature.min && temperature < data.temperature.min) {
                    // Reroll if too cold
                    return this._determinePrecipitation(await rollDice(1, 100)[0], temperature);
                }

                // Calculate duration
                const duration = await this._calculatePrecipitationDuration(data);

                return {
                    type: type,
                    effects: this._getPrecipitationEffects(data),
                    duration,
                    movement: data.precipitation.movement,
                    visibility: data.precipitation.vision,
                    tracking: data.precipitation.tracking,
                    chanceLost: data.precipitation.chanceLost
                };
            }
        }
        return { type: 'none', effects: [], duration: 0 };
    }

    getCurrentWeather() {
        return this.currentWeather;
    }

    // Add other necessary methods...
    // Additional helper methods for GreyhawkWeatherSystem class

async _determineWind(baseSpeed, terrainEffect) {
    // Apply terrain wind modifier
    const adjustedSpeed = baseSpeed + (terrainEffect?.windSpeedAdjustment || 0);
    
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

async _determineWindDirection() {
    // Roll d8 for direction
    const roll = await rollDice(1, 8)[0];
    const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
    return directions[roll - 1];
}

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

async _calculatePrecipitationDuration(precipData) {
    if (!precipData.precipitation.duration) return 0;

    // Parse duration string (e.g., "3d8 hours")
    const durationMatch = precipData.precipitation.duration.match(/(\d+)d(\d+)/);
    if (!durationMatch) return 0;

    const [_, count, sides] = durationMatch;
    return await rollDice(parseInt(count), parseInt(sides))[0];
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
    if (precipData.precipitation.movement && precipData.precipitation.movement !== 'Normal') {
        effects.push(`Movement: ${precipData.precipitation.movement}`);
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

// Add to GreyhawkWeatherSystem class

async updateWeather() {
    console.log("DND-Weather | Updating current weather");
    
    if (!this.currentWeather) {
        return this.generateDailyWeather(new Date());
    }

    // Check if current precipitation should continue
    if (this.currentWeather.baseConditions.precipitation !== 'none') {
        const continuationResult = await this._checkPrecipitationContinuation();
        if (continuationResult.continues) {
            // Update current weather with new precipitation data
            this.currentWeather = {
                ...this.currentWeather,
                baseConditions: {
                    ...this.currentWeather.baseConditions,
                    precipitation: continuationResult.type
                },
                effects: {
                    ...this.currentWeather.effects,
                    precipitation: continuationResult.effects
                },
                duration: continuationResult.duration
            };
            return this.currentWeather;
        }
    }

    // If precipitation doesn't continue or there was none, generate new weather
    return this.generateDailyWeather(new Date());
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
        return { continues: false };
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
