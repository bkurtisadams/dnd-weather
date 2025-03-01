// WeatherDialog.js
import { WeatherDisplay } from './WeatherDisplay.js';
import { baselineData } from '../../constants/baseline-data.js';
import { weatherPhenomena } from '../../constants/precipitation-table.js';
import { rollDice } from '../../utils/dice.js';

import { highWindsTable, windChillTable } from '../../constants/wind-effects.js';
import { terrainEffects } from '../../constants/terrain-effects.js';
import { moonPhases, lycanthropeActivity } from '../../constants/moon-phases.js';

Handlebars.registerHelper('isObject', function(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
});

console.log("WeatherDialog.js loaded, importing:", {
    weatherPhenomena,
    baselineData
});

// Add to WeatherDialog.js
Handlebars.registerHelper('weatherIcon', function(condition, precipitation) {
    if (precipitation && precipitation !== 'none') {
      if (precipitation.includes('snow')) return 'fa-snowflake';
      if (precipitation.includes('rain') || precipitation.includes('drizzle')) return 'fa-cloud-rain';
      if (precipitation.includes('thunder')) return 'fa-bolt';
      if (precipitation.includes('hail')) return 'fa-cloud-meatball';
      if (precipitation.includes('fog')) return 'fa-smog';
    }
    
    if (condition === 'Clear') return 'fa-sun';
    if (condition === 'Partly Cloudy') return 'fa-cloud-sun';
    if (condition === 'Cloudy') return 'fa-cloud';
    
    return 'fa-cloud';
  });
  
// Check/replace the formatDuration helper in WeatherDialog.js
Handlebars.registerHelper('formatDuration', function(hours) {
    console.log("DND-Weather | Formatting duration:", hours);
    
    if (!hours || isNaN(hours)) {
        console.log("DND-Weather | Invalid duration value:", hours);
        return "unknown";
    }
    
    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days} ${days === 1 ? 'day' : 'days'}${remainingHours > 0 ? `, ${remainingHours} ${remainingHours === 1 ? 'hour' : 'hours'}` : ''}`;
    }
    
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
});;

Handlebars.registerHelper('debug', function(value) {
    console.log("DND-Weather | Template Debug:", value);
    return '';
});

// Add near the top of the file, after imports
Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
});

// In WeatherDialog.js after other Handlebars helpers
Handlebars.registerHelper('gt', function(a, b) {
    return a > b;
});

Handlebars.registerHelper('floor', function(value) {
    return Math.floor(value);
});

Handlebars.registerHelper('divide', function(a, b) {
    return a / b;
});

Handlebars.registerHelper('mod', function(a, b) {
    return a % b;
});

export class WeatherDialog extends Application {
    constructor(options = {}) {
        super(options);
        this.weatherTimer = null;
        this.displayWindow = null;
        this.weatherHistory = [];
        this.maxHistoryLength = 10;
        this.weatherStartTime = null;  // Initialize the start time property
        this.durationUpdateInterval = null; // Add this for the interval timer
        console.log("WeatherDialog constructor called");
    
        // Initialize months from baselineData
        this.months = Object.keys(baselineData);
        console.log("Available months:", this.months);
        
        this.state = {
            loading: false,
            error: null,
            lastUpdate: null,
            currentWeather: null,
            // Add new state properties
            selectedMonth: this.months[0] || 'Fireseek', // Default to first month or Fireseek
            selectedDay: 1, // initialize selectedDay
            ...this.state,
            latitude: game.settings.get('dnd-weather', 'latitude'),
            terrain: game.settings.get('dnd-weather', 'terrain'),
            elevation: game.settings.get('dnd-weather', 'elevation')            
        };
    
        // Bind methods to preserve 'this' context
        this._onGenerateWeather = this._onGenerateWeather.bind(this);
        this._onUpdateWeather = this._onUpdateWeather.bind(this);
        this._onOpenSettings = this._onOpenSettings.bind(this);
        this._updateDurationDisplay = this._updateDurationDisplay.bind(this);
        this._startDurationTracking = this._startDurationTracking.bind(this);
    }

        // Update _startDurationTracking method
        _startDurationTracking() {
            // Clear any existing interval
            if (this.durationUpdateInterval) {
                clearInterval(this.durationUpdateInterval);
                this.durationUpdateInterval = null;
            }
            
            // Update once immediately
            this._updateDurationDisplay();
            
            // Set up the interval for regular updates - every minute
            this.durationUpdateInterval = setInterval(() => {
                this._updateDurationDisplay();
            }, 60000); // Update every minute
        }
    
    // method to update duration
    _updateDurationDisplay() {
        console.log("DND-Weather | Updating duration display");
        
        // Find the duration element
        const durationElement = this.element.find('#weatherDuration');
        
        if (!durationElement.length) {
            console.error("DND-Weather | Duration element not found in DOM");
            return;
        }
        
        // Get the precipitation duration directly from the current weather
        const precipitation = this.state.currentWeather?.baseConditions?.precipitation;
        
        console.log("DND-Weather | Duration update - precipitation data:", precipitation);
        
        let text;
        if (precipitation && precipitation.type !== 'none' && precipitation.duration) {
            // Format the duration
            const duration = precipitation.duration;
            if (duration >= 24) {
                const days = Math.floor(duration / 24);
                const remainingHours = duration % 24;
                text = `Weather event duration: ${days} ${days === 1 ? 'day' : 'days'}${remainingHours > 0 ? `, ${remainingHours} ${remainingHours === 1 ? 'hour' : 'hours'}` : ''}`;
            } else {
                text = `Weather event duration: ${duration} ${duration === 1 ? 'hour' : 'hours'}`;
            }
        } else {
            // No precipitation or clear weather
            text = "Weather event duration: Not applicable (clear weather)";
        }
        
        console.log("DND-Weather | Setting duration text:", text);
        durationElement.text(text);
    }

    // Add method to ensure display window
    async _ensureDisplayWindow() {
        if (!this.displayWindow || !this.displayWindow.rendered) {
            this.displayWindow = new WeatherDisplay();
            // Set the initial data before first render
            this.displayWindow.weatherData = this.state.currentWeather;
            await this.displayWindow.render(true);
        }
        return this.displayWindow;
    }

    // Add method to refresh display
    async _refreshDisplay() {
        if (this.state.currentWeather && this.displayWindow) {
            await this.displayWindow.update(this.state.currentWeather);
        }
    }


    // Add timer methods
    _startWeatherTimer(duration) {
        if (this.weatherTimer) clearInterval(this.weatherTimer);
        
        const endTime = Date.now() + (duration * 3600 * 1000); // Convert hours to ms
        
        this.weatherTimer = setInterval(() => {
            const remaining = endTime - Date.now();
            if (remaining <= 0) {
                this._handleWeatherExpiration();
                return;
            }
            
            // Update timer display
            const hours = Math.floor(remaining / (3600 * 1000));
            const minutes = Math.floor((remaining % (3600 * 1000)) / (60 * 1000));
            this.element.find('.weather-timer').text(`${hours}h ${minutes}m remaining`);
        }, 60000); // Update every minute
    }

    _handleWeatherExpiration() {
        if (this.weatherTimer) {
            clearInterval(this.weatherTimer);
            this.weatherTimer = null;
        }
        
        // Check for weather continuation
        if (game.user.isGM) {
            this._onUpdateWeather();
        }
    }

    async _checkWeatherContinuation() {
        console.log("DND-Weather | Checking weather continuation");
        const currentWeather = this.state.currentWeather;
        
        if (!currentWeather?.baseConditions?.precipitation) {
            console.log("DND-Weather | No precipitation to continue");
            return;
        }
        
        // Get continuation chance from precipitation table
        const precipType = currentWeather.baseConditions.precipitation.type;
        const precipData = weatherPhenomena[precipType?.toLowerCase()];
        
        if (!precipData) {
            console.warn("DND-Weather | No precipitation data found for type:", precipType);
            return;
        }
        
        const continuationChance = precipData.chanceContinuing || 0;
        console.log("DND-Weather | Continuation chance:", continuationChance);
        
        // Roll for continuation
        const roll = await rollDice(1, 100);
        if (roll <= continuationChance) {
            ui.notifications.info("Current weather continues...");
            // Generate new duration
            const duration = await this._calculateNewDuration(precipData);
            this._startWeatherTimer(duration);
        } else {
            ui.notifications.info("Weather is changing...");
            this._onGenerateWeather();
        }
    }

    _notifyWeatherChanges(newWeather, oldWeather) {
        console.log("DND-Weather | Checking for notable weather changes");
        
        if (!oldWeather) return;
        
        // Check precipitation changes
        if (newWeather.precipitation?.type !== oldWeather.precipitation?.type) {
            ui.notifications.info(`Weather changing to: ${newWeather.precipitation.type}`);
        }
        
        // Check for rainbow formation
        if (newWeather.precipitation?.rainbowChance > 0) {
            const roll = Math.random() * 100;
            if (roll <= newWeather.precipitation.rainbowChance) {
                ui.notifications.info("A rainbow appears!");
            }
        }
        
        // Check for severe temperature changes
        const tempDiff = Math.abs(newWeather.temperature - oldWeather.temperature);
        if (tempDiff >= 15) {
            ui.notifications.warn(`Temperature changing dramatically by ${tempDiff}°F!`);
        }
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "weather-dialog",
            template: "modules/dnd-weather/src/ui/templates/weather-dialog.hbs",
            width: 400,  // Reduced width for compact display
            height: 'auto',
            title: "Greyhawk Weather",
            resizable: true,
            classes: ["dnd-weather", "weather-dialog"],
            minimizable: true,
            dragable: true,
            position: { height: "auto" }  // Allow auto-height for docking
        });
    }

    getData() {
        console.log("WeatherDialog getData called");
        console.log("DND-Weather | getData called with state:", {
            currentWeather: this.state.currentWeather,
            weatherSystem: globalThis.dndWeather?.weatherSystem
        });

        try {
            const weatherSystem = globalThis.dndWeather?.weatherSystem;
            if (!weatherSystem) {
                console.error("DND-Weather | Weather system not found in getData");
                return this._getErrorData("Weather system not initialized");
            }
    
            // Add form data
            const formData = {
                months: this.months,
                selectedMonth: this.state.selectedMonth,
                selectedDay: this.state.selectedDay,
                latitude: this.state.latitude,
                terrain: this.state.terrain,
                elevation: this.state.elevation,
                terrainTypes: [
                    'plains',
                    'forest',
                    'hills',
                    'mountains',
                    'desert',
                    'coast',
                    'ocean'
                ]
            };
    
            // Get current weather data
            const currentWeather = this.state.currentWeather || weatherSystem.getCurrentWeather();
            console.log("DND-Weather | Current weather data:", currentWeather);
    
            if (!currentWeather || !currentWeather.baseConditions) {
                return {
                    ...this._getErrorData("No weather data available"),
                    ...formData
                };
            }

            // Get sunrise/sunset times from baselineData
            const monthData = baselineData[this.state.selectedMonth];
            const daylight = {
                sunrise: monthData?.sunrise || 'Unknown',
                sunset: monthData?.sunset || 'Unknown'
            };
    
            // Initialize precipitation object first
            let precipitation = {
                type: 'none',
                amount: 'none',
                duration: 'none',
                movement: 'Normal',
                vision: 'Normal',
                notes: '',
                continues: false,
                chanceContinuing: 0,
                previousType: null,
                changed: false
            };

            try {
                // Get precipitation details from weatherPhenomena table
                const precipData = currentWeather.baseConditions.precipitation;
                console.log("DND-Weather | Base precipitation data:", precipData);
                
                if (precipData && precipData !== 'none') {
                    // Handle both string and object precipitation types
                    const precipType = typeof precipData === 'string' ? precipData : precipData.type;
                    console.log("DND-Weather | Precipitation continuation data:", {
                        continues: precipData.continues,
                        duration: precipData.duration,
                        previousType: precipData.previousType,
                        changed: precipData.changed
                    });
                    
                    if (precipType && precipType !== 'none') {
                        const precipKey = precipType.toLowerCase().replace(/\s+/g, '-');
                        console.log("DND-Weather | Generated precipitation key:", precipKey);
                        
                        const precipDetails = weatherPhenomena[precipKey];
                        console.log("DND-Weather | Looking up precipitation details for", precipKey, ":", precipDetails);
            
                        if (precipDetails) {
                            const isLongDurationEvent = /day/.test(precipDetails.precipitation.duration);
                            const amount = precipData.amount || precipDetails.precipitation.amount;
                            const duration = precipData.duration || precipDetails.precipitation.duration;
                            precipitation = {
                                type: precipType,
                                amount: typeof amount === 'number' ? amount : 1,
                                duration: isLongDurationEvent ? duration * 24 : duration, // Convert days to hours
                                amountSuffix: /day/.test(precipDetails.precipitation.amount) ? ' per day' : '',
                                // Properly map movement based on structure
                                movement: typeof precipDetails.precipitation.movement === 'object' 
                                    ? precipDetails.precipitation.movement 
                                    : precipDetails.precipitation.movement || 'Normal',
                                // Properly map vision based on structure    
                                vision: typeof precipDetails.precipitation.vision === 'object'
                                    ? precipDetails.precipitation.vision.normal
                                    : precipDetails.precipitation.vision || 'Normal',
                                infraUltra: typeof precipDetails.precipitation.vision === 'object'
                                    ? precipDetails.precipitation.vision.infraUltra
                                    : precipDetails.precipitation.infraUltra || 'Normal',
                                tracking: precipDetails.precipitation.tracking || 'Normal',
                                chanceLost: precipDetails.precipitation.chanceLost || 'Normal',
                                //windSpeed: precipDetails.precipitation.windSpeed || 'Normal',
                                notes: precipDetails.notes || '',
                                //rainbowChance: precipDetails.chanceRainbow || 0,
                                continues: precipData.continues || false,
                                chanceContinuing: precipDetails.chanceContinuing || 0,
                                continuingDuration: precipData.duration || 0,
                                previousType: precipData.previousType,
                                changed: precipData.changed,
                                continuingDuration: precipData.duration || 0
                            };
                            
                            console.log("DND-Weather | Full precipitation details:", precipitation);
                        } else {
                            console.warn("DND-Weather | No precipitation details found for key:", precipKey);
                        }
                    }
                }
            } catch (error) {
                console.error("DND-Weather | Error processing precipitation data:", error);
                // Continue with default precipitation values
            }
    
            // Add timing information if available
            let weatherTiming = {};
    
            // ensure weatherTiming includes remaining time:
            if (this.state.currentWeather?.timing) {
                const timing = this.state.currentWeather.timing;
                
                // Make sure weatherTiming is initialized
                weatherTiming = weatherTiming || {};
                
                if (timing.start) {
                    weatherTiming.start = this._formatCalendarDate(timing.start);
                }
                
                if (timing.end) {
                    weatherTiming.end = this._formatCalendarDate(timing.end);
                    
                    // Calculate remaining time
                    if (this.state.currentWeather?.baseConditions?.precipitation?.duration) {
                        const weatherSystem = globalThis.dndWeather?.weatherSystem;
                        if (weatherSystem?.calendarIntegration?.initialized) {
                            try {
                                // Get current date and convert to timestamp
                                const currentDate = weatherSystem.calendarIntegration.getCurrentDate();
                                const currentTimestamp = weatherSystem.calendarIntegration.dateToTimestamp(currentDate);
                                
                                // Get end timestamp
                                const endTimestamp = weatherSystem.calendarIntegration.dateToTimestamp(timing.end);
                                
                                // Calculate remaining time
                                const remainingSeconds = Math.max(0, endTimestamp - currentTimestamp);
                                const remainingHours = Math.floor(remainingSeconds / 3600);
                                const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);
                                
                                weatherTiming.remaining = `${remainingHours}h ${remainingMinutes}m`;
                                console.log("DND-Weather | Calculated remaining time:", weatherTiming.remaining);
                            } catch (error) {
                                console.error("DND-Weather | Error calculating remaining time:", error);
                            }
                        }
                    }
                }
            }

            // Calculate weather duration
            let weatherDuration = null;
            if (this.state.currentWeather?.baseConditions?.precipitation?.duration) {
                const duration = this.state.currentWeather.baseConditions.precipitation.duration;
                weatherDuration = `${duration} ${duration === 1 ? 'hour' : 'hours'}`;
                console.log("DND-Weather | Setting weather duration:", weatherDuration);
            }

            console.log("DND-Weather | Current Weather:", currentWeather);
            console.log("DND-Weather | Weather Duration:", weatherDuration);

            // Now log the return object step-by-step
            const returnData = {
                weather: {
                    temperature: currentWeather?.baseConditions?.temperature?.high || 'N/A',
                    temperatureLow: currentWeather?.baseConditions?.temperature?.low || 'N/A',
                    windChill: currentWeather?.baseConditions?.temperature?.windChill || 'N/A',
                    wind: currentWeather?.baseConditions?.wind?.speed || 'N/A',
                    windDirection: currentWeather?.baseConditions?.wind?.direction || 'N/A',
                    precipitation: precipitation,
                    moonPhase: {
                        luna: currentWeather?.baseConditions?.moonPhase?.luna || 'Unknown',
                        celene: currentWeather?.baseConditions?.moonPhase?.celene || 'Unknown'
                    },
                    conditions: currentWeather?.baseConditions?.sky || 'N/A',
                    precipitationTypes: Object.keys(weatherPhenomena),
                    weatherTiming: weatherTiming,
                    daylight: daylight,
                    weatherDuration: weatherDuration // Pass weatherDuration here
                },
                weatherHistory: this.weatherHistory || 'N/A',
                effects: currentWeather?.effects || 'N/A',
                terrain: currentWeather?.terrain || 'N/A',
                elevation: currentWeather?.elevation || 'N/A',
                isGM: game?.user?.isGM || false,
                loading: this.state?.loading || false,
                error: this.state?.error || 'N/A',
                lastUpdate: this.state?.lastUpdate || currentWeather?.timestamp || 'N/A',
                ...formData
            };

            // Now log the return data
            console.log("DND-Weather | Final return data:", returnData);

            // Return combined data including weatherDuration
            return {
                weather: {
                    temperature: currentWeather.baseConditions.temperature.high,
                    temperatureLow: currentWeather.baseConditions.temperature.low,
                    windChill: currentWeather.baseConditions.temperature.windChill,
                    wind: currentWeather.baseConditions.wind.speed,
                    windDirection: currentWeather.baseConditions.wind.direction,
                    precipitation: {
                        ...precipitation,
                        // Make sure duration is directly accessible and not hidden in nested objects
                        duration: currentWeather.baseConditions.precipitation.duration 
                    },
                    moonPhase: {
                        luna: currentWeather.baseConditions.moonPhase?.luna || 'Unknown',
                        celene: currentWeather.baseConditions.moonPhase?.celene || 'Unknown'
                    },
                    conditions: currentWeather.baseConditions.sky,
                    
                    precipitationTypes: Object.keys(weatherPhenomena),
                    weatherTiming: weatherTiming,
                    daylight: daylight,  // Add new daylight data
                    weatherDuration: weatherDuration // Pass weatherDuration here
                },
                weatherHistory: this.weatherHistory,
                effects: currentWeather.effects,
                terrain: currentWeather.terrain,
                elevation: currentWeather.elevation,
                isGM: game.user.isGM,
                loading: this.state.loading,
                error: this.state.error,
                lastUpdate: this.state.lastUpdate || currentWeather.timestamp,
                ...formData
            };
        } catch (error) {
            console.error("DND-Weather | Error in getData:", error);
            return this._getErrorData(error.message);
        }
    }

    // save settings
    async _saveSettings() {
        await game.settings.set('dnd-weather', 'latitude', this.state.latitude);
        await game.settings.set('dnd-weather', 'terrain', this.state.terrain);
        await game.settings.set('dnd-weather', 'elevation', this.state.elevation);
    }

    _getErrorData(errorMessage) {
        return {
            weather: {
                temperature: '??',
                temperatureLow: '??',
                wind: 'Unknown',
                windDirection: 'Unknown',
                precipitation: 'Unknown',
                moonPhase: 'Unknown',
                conditions: 'Unknown',
                daylight: {
                    sunrise: 'Unknown',
                    sunset: 'Unknown'
                }
            },
            effects: { terrain: [], temperature: [], precipitation: [], wind: [], special: [] },
            isGM: game.user.isGM,
            loading: false,
            error: errorMessage
        };
    }

    // Add helper method to format calendar dates
    _formatCalendarDate(calendarDate) {
        if (!calendarDate) return 'Unknown';
        
        const weatherSystem = globalThis.dndWeather?.weatherSystem;
        if (!weatherSystem?.calendarIntegration?.initialized) return 'Calendar not initialized';
        
        try {
            // Format date based on Simple Calendar configuration
            return `${calendarDate.monthName || ''} ${calendarDate.day || ''}, ${calendarDate.year || ''} at ${calendarDate.hour || '0'}:${String(calendarDate.minute || '0').padStart(2, '0')}`;
        } catch (error) {
            console.error("DND-Weather | Error formatting calendar date:", error);
            return 'Error formatting date';
        }
    }

    // activateListeners method
    activateListeners(html) {
        super.activateListeners(html);
        console.log("DND-Weather | Activating listeners");
        
        // Remove any existing listeners first
        html.find('.generate-weather').off('click').on('click', this._onGenerateWeather.bind(this));
        html.find('.update-weather').off('click').on('click', this._onUpdateWeather.bind(this));
        html.find('.settings').off('click').on('click', this._onOpenSettings.bind(this));
        html.find('.refresh-weather').off('click').on('click', () => this.render());

        // Add input listeners
        html.find('select[name="month"]').on('change', (event) => {
            this.state.selectedMonth = event.target.value;
            console.log("DND-Weather | Month changed to:", this.state.selectedMonth);
        });

        // Add day input listener
        html.find('input[name="day"]').on('change', (event) => {
            this.state.selectedDay = Number(event.target.value);
            console.log("DND-Weather | Day changed to:", this.state.selectedDay);
        });

        html.find('input[name="latitude"]').on('change', (event) => {
            this.state.latitude = Number(event.target.value);
            console.log("DND-Weather | Latitude changed to:", this.state.latitude);
        });

        html.find('select[name="terrain"]').on('change', (event) => {
            this.state.terrain = event.target.value;
            console.log("DND-Weather | Terrain changed to:", this.state.terrain);
        });

        html.find('input[name="elevation"]').on('change', (event) => {
            this.state.elevation = Number(event.target.value);
            console.log("DND-Weather | Elevation changed to:", this.state.elevation);
        });

        // save latitude settings
        html.find('input[name="latitude"]').on('change', async (event) => {
            this.state.latitude = Number(event.target.value);
            await this._saveSettings();
            console.log("DND-Weather | Latitude changed to:", this.state.latitude);
        });
        
        // activateListeners method
        html.find('.collapse-toggle').off('click').on('click', function() {
            const content = $(this).next();
            content.toggleClass('collapsed');
            const icon = $(this).find('.fas');
            icon.toggleClass('fa-chevron-down fa-chevron-up');
        });;
        
        // For the weather history restore buttons
        html.find('.restore-weather').off('click').on('click', async (event) => {
            const index = Number(event.currentTarget.dataset.index);
            console.log("DND-Weather | Restoring weather from history index:", index);
            
            if (this.weatherHistory && this.weatherHistory[index]) {
                this.state.currentWeather = this.weatherHistory[index];
                this.state.lastUpdate = new Date().toLocaleTimeString();
                
                // Update display window
                await this._ensureDisplayWindow();
                await this.displayWindow.update(this.state.currentWeather);
                
                ui.notifications.info("Restored weather from history");
                await this.render();
            }
        });
        
        // For the weather override
        html.find('#override-continuation').on('change', function() {
            const isChecked = $(this).prop('checked');
            $('.conditional-field').toggleClass('visible', isChecked);
        });
        
        html.find('.apply-override').on('click', async () => {
            const precipType = html.find('#override-precipitation').val();
            const duration = parseInt(html.find('#override-duration').val(), 10);
            const isContinuation = html.find('#override-continuation').prop('checked');
            const previousType = isContinuation ? html.find('#override-previous-type').val() : null;
            
            // Create modified weather data
            const weather = await this._createOverrideWeather(precipType, duration, isContinuation, previousType);
            
            // Update current weather
            this.state.currentWeather = weather;
            this.state.lastUpdate = new Date().toLocaleTimeString();
            
            // Update display
            if (this.displayWindow) {
            await this.displayWindow.update(weather);
            }
            
            await this.render();
        });
        // Do the same for terrain and elevation
    }

    // In WeatherDialog.js, update the _onGenerateWeather method
async _onGenerateWeather(event) {
    event.preventDefault();
    console.log("DND-Weather | Generate weather clicked");
    
    const weatherSystem = globalThis.dndWeather?.weatherSystem;
    if (!weatherSystem) {
        ui.notifications.error("Weather system not initialized");
        return;
    }

    this.state.loading = true;
    this.state.error = null;
    await this.render();

    try {
        // Update weather system settings with current form values
        weatherSystem.settings = {
            month: this.state.selectedMonth,
            day: this.state.selectedDay,
            latitude: this.state.latitude,
            elevation: this.state.elevation,
            terrain: this.state.terrain
        };
        console.log("DND-Weather | Using settings:", weatherSystem.settings);

        const weatherData = await weatherSystem.generateWeather();
        console.log("DND-Weather | Generated weather data:", weatherData);
        
        if (weatherData && weatherData.length > 0) {
            this.state.currentWeather = weatherData[0];
            this.state.lastUpdate = new Date().toLocaleTimeString();

            this._updateDurationDisplay();

            if (this.state.currentWeather) {
                this._addToWeatherHistory(this.state.currentWeather);
            }
            
            // Reset weather start time
            this.weatherStartTime = new Date();
            
            // Start duration tracking
            this._startDurationTracking();

            // Ensure display window exists and update it
            const display = await this._ensureDisplayWindow();
            await display.update(this.state.currentWeather);
            
            // Save settings after successful generation
            await this._saveSettings();

            // NEW CODE: Advance game time by 4 hours (minimum per Greyhawk rules)
            if (weatherSystem.calendarIntegration?.initialized && game.user.isGM) {
                try {
                    console.log("DND-Weather | Advancing game time by 4 hours for new weather generation");
                    await weatherSystem.calendarIntegration.advanceTimeByHours(4);
                    ui.notifications.info("Time advanced by 4 hours (minimum Greyhawk weather interval)");
                } catch (error) {
                    console.error("DND-Weather | Error advancing game time:", error);
                }
            }
            
            ui.notifications.info("Weather generated successfully");
        } else {
            throw new Error("No weather data generated");
        }
    } catch (error) {
        console.error("DND-Weather | Generate failed:", error);
        ui.notifications.error(error.message);
        this.state.error = error.message;
    } finally {
        this.state.loading = false;
        await this.render();
    }
}

    // In WeatherDialog.js, update the _onUpdateWeather method
async _onUpdateWeather(event) {
    if (event) event.preventDefault();
    console.log("DND-Weather | Update weather clicked");

    const weatherSystem = globalThis.dndWeather?.weatherSystem;
    if (!weatherSystem) {
        ui.notifications.error("Weather system not initialized");
        return;
    }

    this.state.loading = true;
    this.state.error = null;
    await this.render();

    try {
        const currentWeather = this.state.currentWeather;
        if (!currentWeather) {
            console.log("DND-Weather | No current weather, generating new");
            const weather = await weatherSystem.generateWeather();
            this.state.currentWeather = weather[0];
            this.state.lastUpdate = new Date().toLocaleTimeString();

            // Set the start time when new weather is generated
            if (!this.weatherStartTime) {
                this.weatherStartTime = new Date();
            }

            // Continue with rendering logic...
            await this._ensureDisplayWindow();
            await this.displayWindow.update(this.state.currentWeather);
            ui.notifications.info("New weather generated");
            
            // Advance time by minimum 4 hours for new weather
            if (weatherSystem.calendarIntegration?.initialized && game.user.isGM) {
                try {
                    console.log("DND-Weather | Advancing game time by 4 hours for new weather");
                    await weatherSystem.calendarIntegration.advanceTimeByHours(4);
                    ui.notifications.info("Time advanced by 4 hours (minimum Greyhawk weather interval)");
                } catch (error) {
                    console.error("DND-Weather | Error advancing game time:", error);
                }
            }
            
            this.state.loading = false;
            await this.render();
            return;
        }

        // Get current precipitation data and duration
        const precipitation = currentWeather.baseConditions.precipitation;
        const currentDuration = precipitation?.duration || 0;
        
        console.log("DND-Weather | Current precipitation state:", {
            type: precipitation.type,
            chanceContinuing: precipitation.chanceContinuing,
            duration: precipitation.duration
        });

        // Update the weather
        const updatedWeather = await weatherSystem.updateWeather();
        
        if (updatedWeather) {
            this.state.currentWeather = updatedWeather;
            this.state.lastUpdate = new Date().toLocaleTimeString();
            this._addToWeatherHistory(updatedWeather);
            
            // Reset weather start time for the new weather
            this.weatherStartTime = new Date();
            
            // Restart duration tracking
            this._startDurationTracking();

            await this._ensureDisplayWindow();
            await this.displayWindow.update(updatedWeather);
            
            // NEW CODE: Advance game time by the weather duration or minimum 4 hours
            if (weatherSystem.calendarIntegration?.initialized && game.user.isGM) {
                try {
                    // Use the greater of current duration or 4 hours (Greyhawk minimum)
                    const hoursToAdvance = Math.max(4, currentDuration);
                    console.log(`DND-Weather | Advancing game time by ${hoursToAdvance} hours (weather duration)`);
                    await weatherSystem.calendarIntegration.advanceTimeByHours(hoursToAdvance);
                    ui.notifications.info(`Time advanced by ${hoursToAdvance} hours`);
                } catch (error) {
                    console.error("DND-Weather | Error advancing game time:", error);
                }
            }
            
            ui.notifications.info("Weather updated successfully");
        } else {
            throw new Error("No weather data updated");
        }
    } catch (error) {
        console.error("DND-Weather | Update failed:", error);
        ui.notifications.error(error.message);
        this.state.error = error.message;
    } finally {
        this.state.loading = false;
        await this.render();
    }
}
 
    // Helper method to add to weather history
    _addToWeatherHistory(weather) {
        this.weatherHistory.unshift({...weather}); // Add at beginning
        
        // Keep history limited to maxHistoryLength
        if (this.weatherHistory.length > this.maxHistoryLength) {
        this.weatherHistory = this.weatherHistory.slice(0, this.maxHistoryLength);
        }
    }

    _onOpenSettings(event) {
        event.preventDefault();
        console.log("DND-Weather | Settings clicked");
        game.settings.sheet.render(true);
    }

    // Make sure to clean up when the dialog closes
    async close(options={}) {
        console.log("DND-Weather | Dialog closing");
        
        // Clear the duration update interval
        if (this.durationUpdateInterval) {
            clearInterval(this.durationUpdateInterval);
            this.durationUpdateInterval = null;
        }
        
        this.state = {
            loading: false,
            error: null,
            lastUpdate: null,
            currentWeather: null
        };
        if (this.displayWindow) {
            await this.displayWindow.close();
            this.displayWindow = null;
        }
        
        return super.close(options);
    }

    // Add to WeatherDialog.js
async _createOverrideWeather(precipType, duration, isContinuation, previousType) {
    // Start with current weather as a base
    const baseWeather = this.state.currentWeather || 
      (await globalThis.dndWeather.weatherSystem.generateDailyWeather(new Date()));
    
    // Get precipitation data
    const precipData = weatherPhenomena[precipType] || { 
      precipitation: { 
        movement: 'Normal', 
        vision: 'Normal',
        infraUltra: 'Normal',
        tracking: 'Normal',
        chanceLost: 'Normal'
      },
      chanceContinuing: 0,
      chanceRainbow: 0,
      notes: ''
    };
    
    // Create modified weather object
    return {
      ...baseWeather,
      baseConditions: {
        ...baseWeather.baseConditions,
        precipitation: {
          type: precipType,
          amount: precipData.precipitation.amount ? await evalDice(precipData.precipitation.amount) : null,
          duration: duration,
          movement: precipData.precipitation.movement,
          vision: precipData.precipitation.vision,
          infraUltra: precipData.precipitation.infraUltra,
          tracking: precipData.precipitation.tracking,
          chanceLost: precipData.precipitation.chanceLost,
          notes: precipData.notes,
          chanceContinuing: precipData.chanceContinuing || 0,
          chanceRainbow: precipData.chanceRainbow || 0,
          continues: isContinuation,
          previousType: previousType,
          changed: isContinuation && previousType !== precipType,
          effects: this._getPrecipitationEffects(precipData)
        }
      },
      timestamp: new Date().toLocaleString()
    };
  }
}