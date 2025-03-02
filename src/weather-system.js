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
import { CalendarIntegration } from './CalendarIntegration.js';


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

        // Initialize calendar integration as null first
        this.calendarIntegration = null;
        this.currentWeatherStart = null;
        this.currentWeatherEnd = null;
        
        console.log("DND-Weather | Initialized with settings:", this.settings);
        
        this.currentWeather = null;
    }

    /**
     * Initialize calendar integration
     * Should be called after Foundry is ready
     */
    /**
 * Initialize calendar integration
 * Should be called after Foundry is ready
 */
    // Update the initializeCalendar method
// Update the initializeCalendar method
async initializeCalendar() {
    try {
        console.log("DND-Weather | Beginning calendar initialization");
        
        if (!game || !game.modules) {
            console.warn("DND-Weather | Game context not available for calendar integration");
            return false;
        }
        
        // Check for both possible module IDs
        const simpleCalendarModule = game.modules.get('foundryvtt-simple-calendar') || 
                                    game.modules.get('simple-calendar');
        
        if (!simpleCalendarModule || !simpleCalendarModule.active) {
            console.warn(`DND-Weather | Simple Calendar module not found or not active (checked IDs: 'foundryvtt-simple-calendar', 'simple-calendar')`);
            return false;
        }
        
        console.log(`DND-Weather | Simple Calendar module found and active: ${simpleCalendarModule.id}`);
        
        return new Promise((resolve) => {
            // Wait for Simple Calendar API to be available
            if (window.SimpleCalendar) {
                console.log("DND-Weather | window.SimpleCalendar found");
                if (window.SimpleCalendar.Hooks?.Ready) {
                    console.log("DND-Weather | Waiting for SimpleCalendar ready hook");
                    
                    Hooks.once(window.SimpleCalendar.Hooks.Ready, () => {
                        console.log("DND-Weather | SimpleCalendar ready hook fired");
                        this._initializeWithCalendarAPI(window.SimpleCalendar, resolve);
                    });
                } else {
                    // If the Ready hook isn't available, try to initialize directly
                    console.log("DND-Weather | SimpleCalendar.Hooks.Ready not found, trying to initialize directly");
                    this._initializeWithCalendarAPI(window.SimpleCalendar, resolve);
                }
            } else {
                console.warn("DND-Weather | window.SimpleCalendar not found, checking for initialization");
                
                // Check if SimpleCalendar might be initialized later
                const checkInterval = setInterval(() => {
                    if (window.SimpleCalendar) {
                        console.log("DND-Weather | window.SimpleCalendar found after waiting");
                        clearInterval(checkInterval);
                        this._initializeWithCalendarAPI(window.SimpleCalendar, resolve);
                    }
                }, 1000);
                
                // Set a timeout to abandon the wait
                setTimeout(() => {
                    clearInterval(checkInterval);
                    if (!this.calendarIntegration) {
                        console.warn("DND-Weather | SimpleCalendar API never became available (timeout)");
                        resolve(false);
                    }
                }, 10000);
            }
        });
    } catch (error) {
        console.error("DND-Weather | Error initializing calendar:", error);
        return false;
    }
}

// Add the _initializeWithCalendarAPI method
async _initializeWithCalendarAPI(api, resolvePromise) {
    try {
        console.log("DND-Weather | Initializing with SimpleCalendar API");
        
        // Store API reference
        this.calendarAPI = api;
        
        if (typeof CalendarIntegration !== 'function') {
            console.error("DND-Weather | CalendarIntegration class not found - check your imports");
            resolvePromise(false);
            return;
        }
        
        // Initialize the calendar integration
        try {
            this.calendarIntegration = new CalendarIntegration(api);
            const success = await this.calendarIntegration.initialize();
            
            if (success) {
                console.log("DND-Weather | Calendar integration initialized successfully");
                
                // Register for date change events using Foundry's hook system
                const hookName = api.Hooks?.DateTimeChanged || 'simple-calendar.dateChanged';
                console.log(`DND-Weather | Registering for hook: ${hookName}`);
                
                Hooks.on(hookName, (newDate) => {
                    console.log("DND-Weather | Calendar date changed:", newDate);
                    this._checkWeatherExpiration(newDate);
                });
                
                resolvePromise(true);
            } else {
                console.warn("DND-Weather | Failed to initialize calendar integration");
                resolvePromise(false);
            }
        } catch (error) {
            console.error("DND-Weather | Error in CalendarIntegration:", error);
            resolvePromise(false);
        }
    } catch (error) {
        console.error("DND-Weather | Error in _initializeWithCalendarAPI:", error);
        resolvePromise(false);
    }
}

    
// Add method to setup calendar listeners
_setupCalendarListeners() {
    if (!this.calendarIntegration) return;
    
    document.addEventListener('weatherDateChanged', (event) => {
        console.log("DND-Weather | Calendar date changed:", event.detail);
        this._checkWeatherExpiration(event.detail.date);
    });
}
    
// Add this new method to start duration tracking
_startDurationTracking() {
    // Clear any existing interval
    if (this.durationUpdateInterval) {
        clearInterval(this.durationUpdateInterval);
    }
    
    // Set the start time if not already set
    if (!this.weatherStartTime) {
        this.weatherStartTime = new Date();
    }
    
    // Start a new interval
    this.durationUpdateInterval = setInterval(() => {
        this._updateDurationDisplay();
    }, 1000); // Update every second
}

// Add this method to update the duration display
_updateDurationDisplay() {
    if (!this.weatherStartTime) return;
    
    const now = new Date();
    const elapsedMs = now - this.weatherStartTime;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);
    
    // Find the duration element
    const durationElement = this.element.find('#weatherDuration');
    if (durationElement.length) {
        durationElement.text(`Weather event duration: ${elapsedMinutes} minutes ${elapsedSeconds} seconds`);
    }
}
    // Add method to check if weather should expire
    _checkWeatherExpiration(currentDate) {
        if (!this.calendarIntegration || !this.currentWeatherEnd) return;
        
        try {
            // Make sure we have the methods we need
            if (typeof this.calendarIntegration.dateToTimestamp !== 'function') {
                console.error("DND-Weather | dateToTimestamp method not available");
                return;
            }
            
            const currentTimestamp = this.calendarIntegration.dateToTimestamp(currentDate);
            const endTimestamp = this.calendarIntegration.dateToTimestamp(this.currentWeatherEnd);
            
            if (currentTimestamp >= endTimestamp) {
                console.log("DND-Weather | Weather event has expired, generating new weather");
                if (game.user.isGM) {
                    this.updateWeather({
                        checkRainbow: true
                    });
                }
            }
        } catch (error) {
            console.error("DND-Weather | Error checking weather expiration:", error);
        }
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

            // Define timing data if calendar integration is available
            let timing = {};
            if (this.calendarIntegration?.initialized) {
                try {
                    // Get current date as start
                    const currentDate = this.calendarIntegration.getCurrentDate();
                    this.currentWeatherStart = currentDate;
                    timing.start = currentDate;
                    
                    // Calculate end time based on precipitation duration
                    if (precipitation.duration) {
                        const endDate = this.calendarIntegration.calculateWeatherEndTime(precipitation.duration);
                        this.currentWeatherEnd = endDate;
                        timing.end = endDate;
                        
                        console.log("DND-Weather | Weather event scheduled to end at:", endDate);
                    } else {
                        // Default duration of 4 hours for non-precipitation weather (Greyhawk minimum)
                        const endDate = this.calendarIntegration.calculateWeatherEndTime(4);
                        this.currentWeatherEnd = endDate;
                        timing.end = endDate;
                    }
                } catch (error) {
                    console.error("DND-Weather | Error setting weather timing:", error);
                }
            }
    
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
                timestamp: new Date().toLocaleString(),
                timing: Object.keys(timing).length > 0 ? timing : undefined
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
                
                let finalType = this._convertPrecipitationByTemperature(type, temperature);
                if (finalType !== type) {
                    console.log(`DND-Weather | Converting ${type} to ${finalType} due to freezing temperature (${temperature}°F)`);
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
                
                // Check if realistic mountain winds setting is enabled
                const useRealisticWinds = game.settings.get('dnd-weather', 'realisticMountainWinds');
                
                if (useRealisticWinds) {
                    // More realistic calculation: +5 mph per 3000ft
                    const elevationAdj = Math.floor(this.settings.elevation / 3000) * 5;
                    adjustedSpeed += elevationAdj;
                    console.log(`DND-Weather | Realistic mountain wind adjustment (${this.settings.elevation}ft elevation): +${elevationAdj} mph`);
                } else {
                    // Original calculation from the module
                    const elevationAdj = Math.floor(this.settings.elevation /
                        terrainEffect.windSpeedAdjustment.per) *
                        terrainEffect.windSpeedAdjustment.base;
                    
                    adjustedSpeed += elevationAdj;
                    console.log(`DND-Weather | Mountain wind adjustment (${this.settings.elevation}ft elevation): +${elevationAdj} mph`);
                }
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
            // Update to use the correct API methods
            const currentDate = SimpleCalendar.api.currentDateTime();
            // Get the month name from the current date
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

// In weather-system.js, modify the updateWeather method to ensure continuation properties are set
async updateWeather(options = {}) {
    const currentDuration = this.currentWeather?.baseConditions?.precipitation?.duration || 0;
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
            
            // Check temperature compatibility for new type
            const temperature = this.currentWeather.baseConditions.temperature.high;
            
            // Convert rain to snow at near freezing temperatures if needed
            newPrecipType = this._convertPrecipitationByTemperature(newPrecipType, temperature);
            if (newPrecipType !== types[newTypeIndex]) {
                console.log(`DND-Weather | Converting ${types[newTypeIndex]} to ${newPrecipType} due to freezing temperature (${temperature}°F)`);
            }
            
            // Now get the precipitation data for the final type
            const newPrecipData = weatherPhenomena[newPrecipType];
            
            if (!newPrecipData) {
                console.error("DND-Weather | Precipitation data not found for type:", newPrecipType);
                return this.generateDailyWeather(new Date());
            }
            
            // Check temperature compatibility for new type
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
            
            // Note: Time advancement is now handled by the WeatherDialog component

            // Set new start/end times
            if (this.calendarIntegration?.initialized) {
                try {
                    // Use currentDateTime() instead of getCurrentDate()
                    this.currentWeatherStart = this.calendarIntegration.simpleCalendar.currentDateTime();
                    
                    // Calculate new end time based on new precipitation duration
                    this.currentWeatherEnd = this.calendarIntegration.calculateWeatherEndTime(duration);
                } catch (error) {
                    console.error("DND-Weather | Error updating weather timing:", error);
                }
            }
            
            // Create updated weather object with timing information
            const updatedWeather = {
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
            
            // Add timing information if available
            if (this.currentWeatherStart && this.currentWeatherEnd) {
                updatedWeather.timing = {
                    start: this.currentWeatherStart,
                    end: this.currentWeatherEnd
                };
            }
            
            // THIS IS THE KEY PART: Explicitly log that we're setting continuation properties
            console.log("DND-Weather | Setting weather continuation properties:", {
                continues: true,
                previousType: currentPrecip.type,
                changed: newPrecipType !== currentPrecip.type
            });
            
            this.currentWeather = updatedWeather;
            return updatedWeather;
        }
    }

    // Weather is not continuing - generate new weather
    console.log("DND-Weather | Precipitation ended or no continuation, generating new weather");
    
    // Store current weather before generating new weather (for potential continuation marking)
    const previousWeather = this.currentWeather;
    const newWeather = await this.generateDailyWeather(new Date());
    
    // If the previous weather had precipitation and the new weather also has precipitation,
    // we should still mark it as a continuation (though changed)
    if (previousWeather?.baseConditions?.precipitation?.type !== 'none' &&
        newWeather.baseConditions.precipitation.type !== 'none') {
        
        console.log("DND-Weather | Both previous and new weather have precipitation, marking as continuation");
        
        // Mark the new weather as a continuation, but with a changed type
        newWeather.baseConditions.precipitation.continues = true;
        newWeather.baseConditions.precipitation.previousType = previousWeather.baseConditions.precipitation.type;
        newWeather.baseConditions.precipitation.changed = true;
        
        console.log("DND-Weather | Setting continuation properties for new precipitation:", {
            continues: true,
            previousType: previousWeather.baseConditions.precipitation.type,
            changed: true
        });
    }
    
    // Update current weather and return
    this.currentWeather = newWeather;
    return newWeather;
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

/**
 * Converts rain-type precipitation to snow-type at near-freezing temperatures
 * @param {string} precipType - Type of precipitation
 * @param {number} temperature - Current temperature in °F
 * @returns {string} - Potentially converted precipitation type
 */
_convertPrecipitationByTemperature(precipType, temperature) {
    // Skip if no precipitation, or if temperature is above freezing threshold
    if (!precipType || precipType === 'none' || temperature > 37) {
      return precipType;
    }
    
    // Map of rain precipitation types to their snow equivalents
    const conversions = {
      'rainstorm-light': 'snowstorm-light',
      'rainstorm-heavy': 'snowstorm-heavy',
      'drizzle': 'snowstorm-light',
      'thunderstorm': 'snowstorm-heavy'
    };
    
    // Return the converted type if available, otherwise return the original
    return conversions[precipType] || precipType;
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

    // Corrected 'init' hook
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

    // Add separate 'ready' hook for calendar initialization
    Hooks.once('ready', async () => {
        console.log('DND-Weather | Foundry ready, initializing calendar integration');
        
        // Wait a short time to ensure all modules are fully loaded
        setTimeout(async () => {
            // Initialize calendar integration
            if (globalThis.dndWeather?.weatherSystem) {
                try {
                    const success = await globalThis.dndWeather.weatherSystem.initializeCalendar();
                    console.log('DND-Weather | Calendar integration initialized:', success);
                } catch (error) {
                    console.error('DND-Weather | Error initializing calendar integration:', error);
                }
            } else {
                console.warn('DND-Weather | Weather system not available for calendar integration');
            }
        }, 1000);
    });

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
