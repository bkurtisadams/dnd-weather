// weather-system.js
import { baselineData } from './constants/baseline-data.js';
import { terrainEffects } from './constants/terrain-effects.js';
import { weatherPhenomena } from './constants/precipitation-table.js';
// weather-system.js - check/add these with imports at top
import { specialWeatherTable } from './constants/special-weather-events.js';
import { calendarLabels } from './constants/baseline-data.js';
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
            let windChill = null;
            if (lowTemp < 35) {
                windChill = applyWindChill(lowTemp, wind.speed, windChillTable);
            }

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

    // _determineSkyConditions method 
    _determineSkyConditions(roll, conditions) {
        console.log("Sky conditions roll:", roll);
        if (roll <= conditions.clear[1]) return 'Clear';
        if (roll <= conditions.partlyCloudy[1]) return 'Partly Cloudy';
        return 'Cloudy';
    }

    async _determinePrecipitation(roll, temperature) {
        console.log("DND-Weather | Determining precipitation for roll:", roll, "temp:", temperature);
        
        // Find matching precipitation type from table
        for (const [type, data] of Object.entries(weatherPhenomena)) {
            if (roll >= data.diceRange[0] && roll <= data.diceRange[1]) {
                // Check terrain restrictions first
                if (data.restrictedTerrain?.includes(this.settings.terrain)) {
                    console.log(`DND-Weather | Weather type ${type} is restricted in ${this.settings.terrain}, rerolling...`);
                    return this._determinePrecipitation(await rollDice(1, 100)[0], temperature);
                }
                
                // Check temperature requirements
                if (data.temperature.max !== null && temperature > data.temperature.max) {
                    console.log(`DND-Weather | Temperature ${temperature}°F too high for ${type}, rerolling...`);
                    return this._determinePrecipitation(await rollDice(1, 100)[0], temperature);
                }
                if (data.temperature.min !== null && temperature < data.temperature.min) {
                    console.log(`DND-Weather | Temperature ${temperature}°F too low for ${type}, rerolling...`);
                    return this._determinePrecipitation(await rollDice(1, 100)[0], temperature);
                }
                
                // Fix for temperatures near freezing (convert rain to snow)
                let finalType = type;
                if (temperature <= 37) {
                    if (type === 'rainstorm-light') {
                        console.log(`DND-Weather | Converting rainstorm-light to snowstorm-light due to freezing temperature (${temperature}°F)`);
                        finalType = 'snowstorm-light';
                    } else if (type === 'rainstorm-heavy') {
                        console.log(`DND-Weather | Converting rainstorm-heavy to snowstorm-heavy due to freezing temperature (${temperature}°F)`);
                        finalType = 'snowstorm-heavy';
                    } else if (type === 'drizzle') {
                        console.log(`DND-Weather | Converting drizzle to light snow due to freezing temperature (${temperature}°F)`);
                        finalType = 'snowstorm-light';
                    } else if (type === 'thunderstorm') {
                        console.log(`DND-Weather | Converting thunderstorm to snow with thunder due to freezing temperature (${temperature}°F)`);
                        finalType = 'snowstorm-heavy';  // With added thunder effect
                    }
                }
                
                // If we converted the type, get the new data
                const finalData = finalType !== type ? weatherPhenomena[finalType] : data;
                if (!finalData) {
                    console.error(`DND-Weather | Converted type ${finalType} not found in weather phenomena table`);
                    return this._determinePrecipitation(await rollDice(1, 100)[0], temperature);
                }
    
                // Calculate duration
                const duration = await this._calculatePrecipitationDuration(finalData);
                
                // Roll for amount if present
                let amount = null;
                if (finalData.precipitation.amount) {
                    amount = await evalDice(finalData.precipitation.amount);
                }
    
                return {
                    type: finalType,
                    amount,
                    duration: duration,
                    movement: finalData.precipitation.movement,
                    vision: finalData.precipitation.vision,
                    infraUltra: finalData.precipitation.infraUltra,
                    tracking: finalData.precipitation.tracking,
                    chanceLost: finalData.precipitation.chanceLost,
                    windSpeed: finalData.precipitation.windSpeed,
                    notes: finalData.notes,
                    chanceContinuing: finalData.chanceContinuing || 0,
                    chanceRainbow: finalData.chanceRainbow || 0,
                    continues: false,
                    previousType: null,
                    changed: false,
                    effects: this._getPrecipitationEffects(finalData)
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
            chanceContinuing: 0,
            chanceRainbow: 0,
            continues: false,
            previousType: null,
            changed: false,
            effects: []
        };
    }

    getCurrentWeather() {
        return this.currentWeather;
    }

    /**
 * Determine wind conditions when no precipitation
 * @param {number} baseSpeed - Base wind speed from d20-1 roll
 * @param {Object} terrainEffect - Terrain modifiers
 * @returns {Object} Wind conditions
 */
async _determineWind(baseSpeed, terrainEffect) {
    console.log("DND-Weather | Determining wind for speed:", baseSpeed);
    
    let adjustedSpeed = baseSpeed;
    const terrainKey = this.settings.terrain;
    
    // Handle case where terrainEffect wasn't found by the caller
    if (!terrainEffect) {
        // Try to find terrain effect with case-insensitive match
        terrainEffect = Object.entries(terrainEffects).find(([key]) => 
            key.toLowerCase() === terrainKey.toLowerCase()
        )?.[1];
        
        if (terrainEffect) {
            console.log(`DND-Weather | Found terrain effect for "${terrainKey}" using case-insensitive match`);
        } else {
            console.log(`DND-Weather | No terrain effect found for "${terrainKey}"`);
            // Continue with default values
        }
    } else {
        console.log(`DND-Weather | Using terrain effect for "${terrainKey}"`);
    }
    
    // Apply terrain wind modifier
    if (terrainEffect) {
        // Special handling for Mountains - adjust based on elevation
        if (terrainKey.toLowerCase() === "mountains") {
            if (typeof terrainEffect.windSpeedAdjustment === 'object' && 
                terrainEffect.windSpeedAdjustment.base !== undefined && 
                terrainEffect.windSpeedAdjustment.per !== undefined) {
                
                const elevationAdj = Math.floor(this.settings.elevation / 
                    terrainEffect.windSpeedAdjustment.per) * 
                    terrainEffect.windSpeedAdjustment.base;
                
                adjustedSpeed += elevationAdj;
                console.log(`DND-Weather | Mountain wind adjustment (${this.settings.elevation}ft elevation): +${elevationAdj} mph`);
            }
        } 
        // Special handling for Rough terrain - randomly choose +5 or -5
        else if (terrainKey.toLowerCase().includes("rough") || terrainKey.toLowerCase().includes("hills")) {
            if (terrainEffect.windSpeedAdjustment === "±5") {
                const diceRoll = await rollDice(1, 2)[0];
                const variation = diceRoll === 1 ? 5 : -5;
                adjustedSpeed += variation;
                console.log(`DND-Weather | Rough terrain wind variation: ${variation > 0 ? '+' : ''}${variation} mph`);
            }
        }
        // Standard numeric adjustment for other terrains
        else if (typeof terrainEffect.windSpeedAdjustment === 'number') {
            adjustedSpeed += terrainEffect.windSpeedAdjustment;
            console.log(`DND-Weather | Terrain wind adjustment: ${terrainEffect.windSpeedAdjustment > 0 ? '+' : ''}${terrainEffect.windSpeedAdjustment} mph`);
        }
    }
    
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

async _determineWindForPrecipitation(precipitation) {
    if (!precipitation?.type || precipitation.type === 'none') {
        const baseSpeed = await rollDice(1, 20)[0];
        const direction = await this._determineWindDirection();
        return { speed: baseSpeed, direction, effects: [] };
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
    // Try to get month from Simple Calendar if it's available
    if (game.modules.get('simple-calendar')?.active && game.settings.get('dnd-weather', 'useSimpleCalendar')) {
        try {
            const simpleCalendar = SimpleCalendar.api.getCurrentCalendar();
            const currentDate = SimpleCalendar.api.getCurrentDay();
            // Return month name from simple calendar
            return currentDate.month.name;
        } catch (error) {
            console.error("DND-Weather | Error getting date from Simple Calendar:", error);
        }
    }
    
    // Fallback to current settings or default mapping
    if (this.settings.month) {
        return this.settings.month;
    }
    
    // Last resort mapping from real month to Greyhawk month
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
    
        // Define the specific phase days for each month based on the images you shared
        const phaseData = {
            // Winter-Spring Group
            'Needfest': { 
                days: [4], // Mid-Needfest (festival is 7 days)
                phases: ['Full']
            },
            'Fireseek': { 
                days: [19], 
                phases: ['3/4']
            },
            'Readying': { 
                days: [11], 
                phases: ['New']
            },
            'Coldeven': { 
                days: [4], 
                phases: ['1/4']
            },
            'Growfest': { 
                days: [4], // Mid-Growfest (festival is 7 days)
                phases: ['Full']
            },
            
            // Summer-Early Group
            'Planting': { 
                days: [19], 
                phases: ['3/4']
            },
            'Flocktime': { 
                days: [11], 
                phases: ['New']
            },
            'Wealsun': { 
                days: [4], 
                phases: ['1/4']
            },
            'Richfest': { 
                days: [4], // Mid-Richfest (festival is 7 days)
                phases: ['Full']
            },
            
            // Summer-Late Group
            'Reaping': { 
                days: [19], 
                phases: ['3/4']
            },
            'Goodmonth': { 
                days: [11], 
                phases: ['New']
            },
            'Harvester': { 
                days: [4], 
                phases: ['1/4']
            },
            'Brewfest': { 
                days: [4], // Mid-Brewfest (festival is 7 days)
                phases: ['Full']
            },
            
            // Autumn Group
            'Patchwall': { 
                days: [19], 
                phases: ['3/4']
            },
            'Ready\'reat': { 
                days: [11], 
                phases: ['New']
            },
            'Sunsebb': { 
                days: [4], 
                phases: ['1/4']
            }
        };
    
        // Check if we have data for this month
        if (!phaseData[month]) {
            console.warn("DND-Weather | No Celene phase data for month:", month);
            return 'Unknown';
        }
    
        // Check for exact match with a specific phase day
        const monthData = phaseData[month];
        const exactDayIndex = monthData.days.indexOf(day);
        if (exactDayIndex >= 0) {
            return monthData.phases[exactDayIndex];
        }
    
        // For days between specified phases, determine approximate phase
        // Main phases in cycle order
        const phases = ['New', '1/4', 'Full', '3/4'];
        
        // Get the next and previous explicit phase days from the current date
        const daysInMonth = month.endsWith('fest') ? 7 : 28;
        
        // Find the nearest day before current day with a defined phase
        let prevDay = null;
        let prevPhase = null;
        for (let d = day - 1; d >= 1; d--) {
            const phaseIndex = monthData.days.indexOf(d);
            if (phaseIndex >= 0) {
                prevDay = d;
                prevPhase = monthData.phases[phaseIndex];
                break;
            }
        }
        
        // Find the nearest day after current day with a defined phase
        let nextDay = null;
        let nextPhase = null;
        for (let d = day + 1; d <= daysInMonth; d++) {
            const phaseIndex = monthData.days.indexOf(d);
            if (phaseIndex >= 0) {
                nextDay = d;
                nextPhase = monthData.phases[phaseIndex];
                break;
            }
        }
    
        // If we don't have a previous or next day, we need to infer based on the cycle
        if (!prevDay && !nextDay) {
            console.log("DND-Weather | No reference phases in month, using default");
            return 'Unknown'; // Fallback
        }
        
        if (!prevDay) {
            // No previous phase in this month - calculate based on the previous month's last phase
            // For simplicity, returning a generic phase 
            console.log("DND-Weather | No previous phase reference found");
            return this._calculateApproximateCelenePhase(nextPhase, day/nextDay);
        }
        
        if (!nextDay) {
            // No next phase in this month - calculate based on the next month's first phase
            // For simplicity, returning a generic phase
            console.log("DND-Weather | No next phase reference found");
            return this._calculateApproximateCelenePhase(prevPhase, (day-prevDay)/(daysInMonth-prevDay));
        }
        
        // Both prev and next days are defined - calculate intermediate phase
        const progress = (day - prevDay) / (nextDay - prevDay);
        return this._calculateApproximateCelenePhase(prevPhase, progress, nextPhase);
    }
    
    // Simple helper to determine approximate phase
    _calculateApproximateCelenePhase(referencePhase, progress, targetPhase) {
        const phases = ['New', '1/4', 'Full', '3/4'];
        
        // If we have both reference points, calculate more precisely
        if (targetPhase) {
            const refIndex = phases.indexOf(referencePhase);
            let targetIndex = phases.indexOf(targetPhase);
            
            // Handle cycle wraparound
            if (targetIndex < refIndex) {
                targetIndex += 4;
            }
            
            // Calculate position in cycle
            const position = refIndex + progress * (targetIndex - refIndex);
            
            // If very close to a main phase point, return that phase
            const nearestIdx = Math.round(position) % 4;
            if (Math.abs(position - nearestIdx) < 0.15) {
                return phases[nearestIdx];
            }
            
            // Otherwise return descriptive intermediate phase
            const isWaxing = (position > refIndex && position < refIndex + 2) || 
                             (refIndex >= 2 && position < refIndex - 2);
            
            if (isWaxing) {
                return 'Waxing';
            } else {
                return 'Waning';
            }
        } 
        // With just one reference point, simply pick a nearby phase
        else {
            const refIndex = phases.indexOf(referencePhase);
            
            // Progress > 0.5 means we're past halfway to the next phase
            if (progress > 0.5) {
                const nextIdx = (refIndex + 1) % 4;
                return phases[nextIdx];
            } else {
                return referencePhase;
            }
        }
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
    console.log("DND-Weather | Updating weather with options:", options);
    
    if (!this.currentWeather?.baseConditions?.precipitation) {
        console.log("DND-Weather | No current weather, generating new");
        return this.generateDailyWeather(new Date());
    }

    const currentPrecip = this.currentWeather.baseConditions.precipitation;
    
    if (currentPrecip.type !== 'none' && !options.checkRainbow) {
        console.log("DND-Weather | Checking precipitation continuation for:", currentPrecip.type);
        
        const continuationRoll = await rollDice(1, 100)[0];
        console.log("DND-Weather | Continuation roll:", continuationRoll, "needed <=", currentPrecip.chanceContinuing);

        if (continuationRoll <= currentPrecip.chanceContinuing) {
            // Roll for precipitation type change (1 = up table, 10 = down table, 2-9 = same)
            const changeRoll = await rollDice(1, 10)[0];
            console.log("DND-Weather | Type change roll:", changeRoll);

            // Get all precipitation types as an ordered array
            const types = Object.keys(weatherPhenomena);
            const currentIndex = types.indexOf(currentPrecip.type);
            
            if (currentIndex === -1) {
                console.error("DND-Weather | Current precipitation type not found in table:", currentPrecip.type);
                return this.generateDailyWeather(new Date());
            }
            
            // Determine new type based on change roll
            let newTypeIndex = currentIndex;
            if (changeRoll === 1 && currentIndex > 0) {
                newTypeIndex = currentIndex - 1;
                console.log("DND-Weather | Moving up table to:", types[newTypeIndex]);
            } else if (changeRoll === 10 && currentIndex < types.length - 1) {
                newTypeIndex = currentIndex + 1;
                console.log("DND-Weather | Moving down table to:", types[newTypeIndex]);
            }

            // Get the new precipitation type based on the index
            let newPrecipType = types[newTypeIndex];

            // Convert rain to snow at near freezing temperatures if needed
            if (temperature <= 37) {
                if (newPrecipType === 'rainstorm-light') {
                    console.log(`DND-Weather | Converting rainstorm-light to snowstorm-light due to freezing temperature (${temperature}°F)`);
                    newPrecipType = 'snowstorm-light';
                } else if (newPrecipType === 'rainstorm-heavy') {
                    console.log(`DND-Weather | Converting rainstorm-heavy to snowstorm-heavy due to freezing temperature (${temperature}°F)`);
                    newPrecipType = 'snowstorm-heavy';
                } else if (newPrecipType === 'drizzle') {
                    console.log(`DND-Weather | Converting drizzle to light snow due to freezing temperature (${temperature}°F)`);
                    newPrecipType = 'snowstorm-light';
                } else if (newPrecipType === 'thunderstorm') {
                    console.log(`DND-Weather | Converting thunderstorm to snow with thunder due to freezing temperature (${temperature}°F)`);
                    newPrecipType = 'snowstorm-heavy';
                }
            }

            // Now get the precipitation data for the final type
            const newPrecipData = weatherPhenomena[newPrecipType];
            
            // Check temperature compatibility for new type
            const temperature = this.currentWeather.baseConditions.temperature.high;
            if ((newPrecipData.temperature.max && temperature > newPrecipData.temperature.max) ||
                (newPrecipData.temperature.min && temperature < newPrecipData.temperature.min)) {
                console.log(`DND-Weather | Temperature ${temperature}°F incompatible with ${newPrecipType}, ending precipitation`);
                return this.generateDailyWeather(new Date());
            }
            
            // Calculate new duration
            const duration = await this._calculatePrecipitationDuration(newPrecipData);
            
            // Get new wind speed from precipitation data
            const windSpeed = await evalDice(newPrecipData.precipitation.windSpeed);
            const windDirection = this.currentWeather.baseConditions.wind.direction;
            
            // Create updated weather object
            return {
                ...this.currentWeather,
                baseConditions: {
                    ...this.currentWeather.baseConditions,
                    precipitation: {
                        type: newPrecipType,
                        amount: newPrecipData.precipitation.amount ? await evalDice(newPrecipData.precipitation.amount) : null,
                        duration: duration,
                        movement: newPrecipData.precipitation.movement,
                        vision: newPrecipData.precipitation.vision,
                        infraUltra: newPrecipData.precipitation.infraUltra,
                        tracking: newPrecipData.precipitation.tracking,
                        chanceLost: newPrecipData.precipitation.chanceLost,
                        windSpeed: newPrecipData.precipitation.windSpeed,
                        notes: newPrecipData.notes,
                        chanceContinuing: newPrecipData.chanceContinuing || 0,
                        chanceRainbow: newPrecipData.chanceRainbow || 0,
                        continues: true,
                        previousType: currentPrecip.type,
                        changed: newPrecipType !== currentPrecip.type,
                        effects: this._getPrecipitationEffects(newPrecipData)
                    },
                    wind: {
                        speed: windSpeed,
                        direction: windDirection,
                        effects: this._getWindEffects(windSpeed)
                    }
                },
                timestamp: new Date().toLocaleString()
            };
        }
    }

    // Check for rainbow if ending precipitation
    if (currentPrecip.type !== 'none' && options.checkRainbow) {
        const rainbowRoll = await rollDice(1, 100)[0];
        console.log("DND-Weather | Rainbow check roll:", rainbowRoll, "needed <=", currentPrecip.chanceRainbow);
        
        if (rainbowRoll <= currentPrecip.chanceRainbow) {
            console.log("DND-Weather | Rainbow appears!");
            const typeRoll = await rollDice(1, 100)[0];
            let rainbowEffect = {};
            
            if (typeRoll <= 89) rainbowEffect = { type: 'single' };
            else if (typeRoll <= 95) rainbowEffect = { type: 'double', isOmen: true };
            else if (typeRoll <= 98) rainbowEffect = { type: 'triple', isOmen: true };
            else if (typeRoll === 99) rainbowEffect = { type: 'bifrost', description: 'Bifrost bridge or clouds in shape of rain deity' };
            else rainbowEffect = { type: 'deity', description: 'Rain deity or servant in sky' };
            
            const newWeather = await this.generateDailyWeather(new Date());
            return {
                ...newWeather,
                effects: {
                    ...newWeather.effects,
                    special: [...(newWeather.effects.special || []), 
                        `Rainbow appears: ${rainbowEffect.type}${rainbowEffect.isOmen ? ' (possible omen)' : ''}${rainbowEffect.description ? ` - ${rainbowEffect.description}` : ''}`
                    ]
                }
            };
        }
    }

    console.log("DND-Weather | Precipitation ended or no continuation, generating new weather");
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

    // Add settings change handler
    Hooks.on('updateSetting', (setting) => {
        if (setting.key.startsWith('dnd-weather')) {
            globalThis.dndWeather.weatherSystem.settings = {
                ...globalThis.dndWeather.weatherSystem.settings,
                latitude: game.settings.get('dnd-weather', 'latitude'),
                elevation: game.settings.get('dnd-weather', 'elevation'),
                terrain: game.settings.get('dnd-weather', 'terrain')
            };
        }
    });
    
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
