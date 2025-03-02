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
            // Load saved month and day from settings
            selectedMonth: game.settings.get('dnd-weather', 'selectedMonth'),
            selectedDay: game.settings.get('dnd-weather', 'selectedDay'),
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
            
            // Add remaining time calculation if timing data is available
            let remainingTime = "";
            if (this.state.currentWeather?.timing?.end) {
                const calendar = this._getCalendarIntegration();
                if (calendar) {
                    try {
                        const currentDate = calendar.getCurrentDate();
                        const endDate = this.state.currentWeather.timing.end;
                        
                        const currentTimestamp = calendar.dateToTimestamp(currentDate);
                        const endTimestamp = calendar.dateToTimestamp(endDate);
                        
                        const remainingSeconds = Math.max(0, endTimestamp - currentTimestamp);
                        if (remainingSeconds > 0) {
                            const remainingHours = Math.floor(remainingSeconds / 3600);
                            const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);
                            remainingTime = ` (${remainingHours}h ${remainingMinutes}m remaining)`;
                        }
                    } catch (error) {
                        console.error("DND-Weather | Error calculating remaining time:", error);
                    }
                }
            }
            
            // Format total duration
            if (duration >= 24) {
                const days = Math.floor(duration / 24);
                const remainingHours = duration % 24;
                text = `Weather event duration: ${days} ${days === 1 ? 'day' : 'days'}${remainingHours > 0 ? `, ${remainingHours} ${remainingHours === 1 ? 'hour' : 'hours'}` : ''}${remainingTime}`;
            } else {
                text = `Weather event duration: ${duration} ${duration === 1 ? 'hour' : 'hours'}${remainingTime}`;
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
    // Updated method
    async _saveSettings() {
        await game.settings.set('dnd-weather', 'latitude', this.state.latitude);
        await game.settings.set('dnd-weather', 'terrain', this.state.terrain);
        await game.settings.set('dnd-weather', 'elevation', this.state.elevation);
        await game.settings.set('dnd-weather', 'selectedMonth', this.state.selectedMonth);
        await game.settings.set('dnd-weather', 'selectedDay', this.state.selectedDay);
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

        // Add month input listener
        html.find('select[name="month"]').on('change', async (event) => {
            this.state.selectedMonth = event.target.value;
            await game.settings.set('dnd-weather', 'selectedMonth', this.state.selectedMonth);
            console.log("DND-Weather | Month changed to:", this.state.selectedMonth);
        });

        // Add day input listener
        html.find('input[name="day"]').on('change', async (event) => {
            this.state.selectedDay = Number(event.target.value);
            await game.settings.set('dnd-weather', 'selectedDay', this.state.selectedDay);
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

        // for weather report
        html.find('.generate-report').off('click').on('click', this._onGenerateReport.bind(this));
        html.find('.share-weather').off('click').on('click', this._shareTodaysWeather.bind(this));
        
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

  async _onGenerateReport(event) {
    event.preventDefault();
    console.log("DND-Weather | Generate report clicked");
    
    // Check for Simple Calendar directly
    const simpleCalendarActive = !!window.SimpleCalendar;
    console.log("DND-Weather | Simple Calendar available:", simpleCalendarActive);

    // Get saved location name or default to terrain type
    const savedLocationName = game.settings.get('dnd-weather', 'lastLocationName') || this.state.terrain;
    console.log("DND-Weather | Using saved location name:", savedLocationName);
    
    // Create a dialog to configure the report
    const dialog = new Dialog({
        title: "Generate Weather Report",
        content: `
            <form>
                <div class="form-group">
                    <label>Location Name:</label>
                    <input type="text" name="locationName" value="${savedLocationName}" placeholder="e.g., Hommlet, Greyhawk City">
                </div>
                <div class="form-group">
                    <label>Number of Days:</label>
                    <input type="number" name="days" value="7" min="1" max="14">
                </div>
                <div class="form-group">
                    <label>Starting Month:</label>
                    <select name="month">
                        ${this.months.map(m => `<option value="${m}" ${m === this.state.selectedMonth ? 'selected' : ''}>${m}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Starting Day:</label>
                    <input type="number" name="day" value="${this.state.selectedDay}" min="1" max="28">
                </div>
                <div class="form-group">
                    <label>Use Simple Calendar Dates:</label>
                    <input type="checkbox" name="useCalendar" ${simpleCalendarActive ? '' : 'disabled'}>
                    ${!simpleCalendarActive ? '<span class="notes">(Simple Calendar not available)</span>' : ''}
                </div>
                <div class="form-group">
                    <label>Include Moon Phases:</label>
                    <input type="checkbox" name="includeMoons" checked>
                </div>
                <div class="form-group">
                    <label>Include Temperature Details:</label>
                    <input type="checkbox" name="includeTemp" checked>
                </div>
                <div class="form-group">
                    <label>Include Wind Details:</label>
                    <input type="checkbox" name="includeWind" checked>
                </div>
                <div class="form-group">
                    <label>Include Special Effects:</label>
                    <input type="checkbox" name="includeEffects" checked>
                </div>
                <div class="form-group">
                    <label>Format:</label>
                    <select name="format">
                        <option value="detailed">Detailed</option>
                        <option value="compact">Compact</option>
                    </select>
                </div>
            </form>
        `,
        buttons: {
            generate: {
                icon: '<i class="fas fa-calendar-alt"></i>',
                label: "Generate Report",
                callback: html => this._generateWeatherReport(html)
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel"
            }
        },
        default: "generate",
        width: 400
    });
    
    dialog.render(true);
}

// Update the _generateWeatherReport method to verify calendar integration
async _generateWeatherReport(html) {
    const days = parseInt(html.find('[name="days"]').val()) || 7;
    const month = html.find('[name="month"]').val();
    const startDay = parseInt(html.find('[name="day"]').val()) || 1;
    const locationName = html.find('[name="locationName"]').val() || this.state.terrain;
    
    console.log("DND-Weather | Location name for report:", locationName);

    // Save the location name for future use
    try {
        await game.settings.set('dnd-weather', 'lastLocationName', locationName);
        console.log("DND-Weather | Saved location name:", locationName);
    } catch (error) {
        console.warn("DND-Weather | Could not save location name:", error);
    }
    
    // Check for Simple Calendar
    const useCalendar = html.find('[name="useCalendar"]').prop("checked") && !!window.SimpleCalendar;
    
    const includeMoons = html.find('[name="includeMoons"]').prop("checked");
    const includeTemp = html.find('[name="includeTemp"]').prop("checked");
    const includeWind = html.find('[name="includeWind"]').prop("checked");
    const includeEffects = html.find('[name="includeEffects"]').prop("checked");
    const format = html.find('[name="format"]').val();
    
    console.log(`DND-Weather | Generating ${days} day report for "${locationName}" starting from ${month} ${startDay}`);
    console.log(`DND-Weather | Using Simple Calendar: ${useCalendar}`);
    
    // Set the loading state
    this.state.loading = true;
    this.render();
    
    try {
        const weatherSystem = globalThis.dndWeather?.weatherSystem;
        if (!weatherSystem) {
            ui.notifications.error("Weather system not initialized");
            return;
        }
        
        // Store original settings to restore after report generation
        const originalSettings = {...weatherSystem.settings};
        
        // Update weather system settings for report
        weatherSystem.settings = {
            ...weatherSystem.settings,
            month: month,
            day: startDay,
            latitude: this.state.latitude,
            elevation: this.state.elevation,
            terrain: this.state.terrain
        };
        
        // Set up start/end date tracking
        let startDateStr = useCalendar 
            ? this._formatSimpleCalendarDate(month, startDay)
            : `${month} ${startDay}`;
            
        let endDateStr = "";
        
        // Generate weather for each day
        const weatherData = [];
        let currentDay = startDay;
        let currentMonth = month;
        
        for (let i = 0; i < days; i++) {
            console.log(`DND-Weather | Generating day ${i+1} (${currentMonth} ${currentDay})`);
            
            // Update day for weather generation
            weatherSystem.settings.day = currentDay;
            weatherSystem.settings.month = currentMonth;
            
            // Generate weather for this day
            const dayWeather = await weatherSystem.generateDailyWeather(new Date());
            weatherData.push({
                day: currentDay,
                month: currentMonth,
                weather: dayWeather
            });
            
            // Advance to next day, handle month rollover
            currentDay++;
            if (currentDay > 28) { // Assuming 28-day months in Greyhawk
                currentDay = 1;
                // Find next month in cycle
                const monthIndex = this.months.indexOf(currentMonth);
                currentMonth = this.months[(monthIndex + 1) % this.months.length];
            }
        }
        
        // Calculate end date based on last generated day
        const lastDay = weatherData[weatherData.length - 1];
        if (useCalendar) {  // Changed from options.useCalendar to useCalendar
            try {
                endDateStr = this._formatSimpleCalendarDate(lastDay.month, lastDay.day);
                console.log("DND-Weather | Calculated end date:", endDateStr);
            } catch (error) {
                console.error("DND-Weather | Error formatting end date:", error);
                endDateStr = `${lastDay.month} ${lastDay.day}`;
            }
        } else {
            endDateStr = `${lastDay.month} ${lastDay.day}`;
        }
        
        // Restore original settings
        weatherSystem.settings = originalSettings;
        
        // Create the report message
        const reportOptions = { 
            includeMoons, 
            includeTemp, 
            includeWind, 
            includeEffects,
            locationName,
            startDate: startDateStr,
            endDate: endDateStr,
            useCalendar
        };
        
        const reportContent = format === 'detailed' 
            ? this._formatDetailedReport(weatherData, reportOptions)
            : this._formatCompactReport(weatherData, reportOptions);
        
        // Send the report to chat
        this._sendWeatherReport(reportContent);
        
        ui.notifications.info(`Generated weather report for ${days} days`);
    } catch (error) {
        console.error("DND-Weather | Error generating report:", error);
        ui.notifications.error(`Error generating report: ${error.message}`);
    } finally {
        this.state.loading = false;
        this.render();
    }
}

// Updated helper to map between your module and Simple Calendar
_formatSimpleCalendarDate(monthName, day) {
    try {
        if (!window.SimpleCalendar || !window.SimpleCalendar.api) {
            console.warn("DND-Weather | Simple Calendar API not available");
            return `${monthName} ${day}`;
        }
        
        // Get all months from Simple Calendar
        const scMonths = window.SimpleCalendar.api.getAllMonths();
        console.log("DND-Weather | Available SC months:", scMonths.map(m => m.name));
        console.log("DND-Weather | Simple Calendar months full details:", scMonths);
        
        // Use our mapping helper to ensure proper matching
        const mappedMonthName = this._mapGreyhawkToSimpleCalendarMonth(monthName);
        
        // Find matching month by name (case-insensitive and trim)
        const matchingMonth = scMonths.find(m => 
            m.name.toLowerCase().trim() === mappedMonthName.toLowerCase().trim());
        
        console.log("DND-Weather | Trying to match month:", monthName,
                    "Found:", matchingMonth ? matchingMonth.name : "None");
        
        if (matchingMonth) {
            console.log("DND-Weather | Matched month details:", {
                id: matchingMonth.id,
                name: matchingMonth.name,
                numericRepresentation: matchingMonth.numericRepresentation
            });
        }
        
        if (!matchingMonth) {
            console.warn(`DND-Weather | Month not found in Simple Calendar: ${monthName}`);
            // Fall back to Greyhawk format if not found
            return `${monthName} ${day}`;
        }
        
        // Get current date as a template
        const currentDate = window.SimpleCalendar.api.currentDateTime();
        
        // Try getting a date directly from the calendar API if available
        try {
            // See if there's a method to get the date string directly
            if (typeof window.SimpleCalendar.api.getDateString === 'function') {
                const dateString = window.SimpleCalendar.api.getDateString({
                    year: currentDate.year,
                    month: matchingMonth.numericRepresentation || matchingMonth.id,
                    day: parseInt(day, 10)
                });
                console.log("DND-Weather | Got date string directly:", dateString);
                if (dateString) {
                    return dateString;
                }
            }
        } catch (directError) {
            console.warn("DND-Weather | Direct date string retrieval failed:", directError);
        }
        
        // Format manually using the Greyhawk month name (since the SC formatting isn't working)
        const formattedDate = `${monthName} ${day}, ${currentDate.year}`;
        console.log("DND-Weather | Formatted manually:", formattedDate);
        
        return formattedDate;
        
    } catch (error) {
        console.error("DND-Weather | Error formatting Simple Calendar date:", error);
        return `${monthName} ${day}`;
    }
}

// Helper method to map Greyhawk months to Simple Calendar months
_mapGreyhawkToSimpleCalendarMonth(greyhawkMonth) {
    // Get month names from each calendar
    const monthNameMap = {
        // Use exact Greyhawk names as keys, Simple Calendar names as values
        'Needfest': 'Needfest',
        'Fireseek': 'Fireseek',
        'Readying': 'Readying',
        'Coldeven': 'Coldeven',
        'Growfest': 'Growfest',
        'Planting': 'Planting',
        'Flocktime': 'Flocktime',
        'Wealsun': 'Wealsun',
        'Richfest': 'Richfest',
        'Reaping': 'Reaping',
        'Goodmonth': 'Goodmonth',
        'Harvester': 'Harvester',
        'Brewfest': 'Brewfest',
        'Patchwall': 'Patchwall',
        "Ready'reat": "Ready'reat",
        'Sunsebb': 'Sunsebb'
    };
    
    // Try to get the mapped name, fall back to original
    return monthNameMap[greyhawkMonth] || greyhawkMonth;
}

// Updated the _formatDetailedReport method to include location name and date range
_formatDetailedReport(weatherData, options) {
    // Create detailed report with day-by-day breakdown
    let content = `<div class="dnd-weather-report">
        <h2>Weather Report: ${options.locationName}</h2>
        <p class="date-range"><strong>Period:</strong> ${options.startDate} to ${options.endDate}</p>
        <p><strong>Location:</strong> ${this.state.terrain} (Elevation: ${this.state.elevation}ft, Latitude: ${this.state.latitude}°)</p>`;
    
    // Add a calendar legend if using Simple Calendar
    if (options.useCalendar) {
        content += `<p class="calendar-note">Calendar: Greyhawk (Simple Calendar integration)</p>`;
    }
    
    content += `<hr/>`;

    weatherData.forEach(day => {
        const weather = day.weather;
        const baseConditions = weather.baseConditions;
        
        // Format day date using our helper if needed
        let dayDate = options.useCalendar
            ? this._formatSimpleCalendarDate(day.month, day.day)
            : `${day.month} ${day.day}`;
        
        content += `<div class="weather-day">
            <h3>${dayDate}</h3>
            <div class="weather-condition">
                <strong>Sky:</strong> ${baseConditions.sky}
            </div>`;
        
        // Temperature section
        if (options.includeTemp) {
            const tempHigh = baseConditions.temperature.high;
            const tempLow = baseConditions.temperature.low;
            const windChill = baseConditions.temperature.windChill;
            
            content += `<div class="weather-temperature">
                <strong>Temperature:</strong> High ${tempHigh}°F / Low ${tempLow}°F
                ${windChill ? `<br><span class="wind-chill">(Wind chill: ${windChill}°F)</span>` : ''}
            </div>`;
        }
        
        // Precipitation section
        const precip = baseConditions.precipitation;
        content += `<div class="weather-precipitation">
            <strong>Precipitation:</strong> ${precip.type !== 'none' ? precip.type : 'None'}`;
            
        if (precip.type !== 'none') {
            content += `<br><span class="precip-duration">Duration: ${precip.duration} hours</span>`;
            if (precip.amount) {
                content += `<br><span class="precip-amount">Amount: ${precip.amount}</span>`;
            }
            
            if (precip.vision !== 'Normal') {
                content += `<br><span class="precip-visibility">Visibility: ${precip.vision}</span>`;
            }
        }
        
        content += `</div>`;
        
        // Wind section
        if (options.includeWind) {
            content += `<div class="weather-wind">
                <strong>Wind:</strong> ${baseConditions.wind.speed} mph from the ${baseConditions.wind.direction}
            </div>`;
        }
        
        // Moon phases
        if (options.includeMoons) {
            content += `<div class="weather-moons">
                <strong>Moon Phases:</strong> Luna: ${baseConditions.moonPhase.luna}, Celene: ${baseConditions.moonPhase.celene}
            </div>`;
        }
        
        // Effects
        if (options.includeEffects && weather.effects) {
            const allEffects = [];
            
            if (weather.effects.terrain && weather.effects.terrain.length) {
                allEffects.push(...weather.effects.terrain);
            }
            
            if (weather.effects.temperature && weather.effects.temperature.length) {
                allEffects.push(...weather.effects.temperature);
            }
            
            if (weather.effects.wind && weather.effects.wind.length) {
                allEffects.push(...weather.effects.wind);
            }
            
            if (weather.effects.special && weather.effects.special.length) {
                allEffects.push(...weather.effects.special);
            }
            
            if (allEffects.length > 0) {
                content += `<div class="weather-effects">
                    <strong>Effects:</strong>
                    <ul>
                        ${allEffects.map(effect => `<li>${effect}</li>`).join('')}
                    </ul>
                </div>`;
            }
        }
        
        content += `<hr/></div>`;
    });
    
    content += `</div>`;
    return content;
}

// Update the _formatCompactReport method to include location name and date range
_formatCompactReport(weatherData, options) {
    // Get first and last days for full period display
    const firstDay = weatherData[0];
    const lastDay = weatherData[weatherData.length - 1];
    const fullPeriod = `${options.startDate} to ${options.endDate}`;
    
    // Improved compact report with left-justified title and smaller column headers
    let content = `<div class="dnd-weather-report-compact">
        <h2 style="text-align: left; margin-bottom: 5px; font-size: 1.2em; padding-bottom: 5px; border-bottom: 1px solid #777;">Weather Report: ${options.locationName}</h2>
        <p class="date-range" style="margin: 5px 0;"><strong>Period:</strong> ${fullPeriod}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> ${this.state.terrain} (Elevation: ${this.state.elevation}ft, Latitude: ${this.state.latitude}°)</p>
        <table class="weather-table" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background-color: rgba(60, 60, 70, 0.9);">
                    <th style="width: 50px; padding: 4px 2px; text-align: center; border: 1px solid #777; font-size: 0.8em;">Date</th>
                    <th style="width: 40px; padding: 4px 2px; text-align: center; border: 1px solid #777; font-size: 0.8em;">Sky</th>
                    <th style="width: 40px; padding: 4px 2px; text-align: center; border: 1px solid #777; font-size: 0.8em;">Pcpn</th>`;
                    
    if (options.includeTemp) content += `<th style="width: 60px; padding: 4px 2px; text-align: center; border: 1px solid #777; font-size: 0.8em;">Temp<br>H/L</th>`;
    if (options.includeWind) content += `<th style="width: 50px; padding: 4px 2px; text-align: center; border: 1px solid #777; font-size: 0.8em;">Wind</th>`;
    if (options.includeMoons) content += `<th style="width: 65px; padding: 4px 2px; text-align: center; border: 1px solid #777; font-size: 0.8em;">Moons</th>`;
    if (options.includeEffects) content += `<th style="width: 70px; padding: 4px 2px; text-align: center; border: 1px solid #777; font-size: 0.8em;">Effects</th>`;
    
    content += `</tr></thead><tbody>`;
    
    weatherData.forEach(day => {
        const weather = day.weather;
        const baseConditions = weather.baseConditions;
        
        // Format abbreviated date (just show month abbr and day)
        const abbreviatedDate = `${this._abbreviateMonth(day.month)} ${day.day}`;
        const fullDate = `${day.month} ${day.day}`;
        const skyCondition = baseConditions.sky;
        const precipType = baseConditions.precipitation.type;
        
        content += `<tr>
            <td style="text-align: left; font-size: 0.82em; padding: 3px; border: 1px solid #666;" title="Full date: ${fullDate}">${abbreviatedDate}</td>
            <td style="text-align: center; padding: 3px; border: 1px solid #666;" title="Sky condition: ${skyCondition}">${this._getSkySymbol(skyCondition)}</td>
            <td style="text-align: center; padding: 3px; border: 1px solid #666;" title="Precipitation: ${precipType !== 'none' ? precipType : 'None'}${
                precipType !== 'none' && baseConditions.precipitation.duration ? 
                `\nDuration: ${baseConditions.precipitation.duration} hours` : ''
            }">${this._getPrecipitationSymbol(precipType)}</td>`;
            
        if (options.includeTemp) {
            const tempDetails = `High: ${baseConditions.temperature.high}°F\nLow: ${baseConditions.temperature.low}°F${
                baseConditions.temperature.windChill ? 
                `\nWind Chill: ${baseConditions.temperature.windChill}°F` : ''
            }`;
            
            content += `<td style="text-align: center; font-size: 0.8em; padding: 3px; border: 1px solid #666;" title="${tempDetails}">${baseConditions.temperature.high}/${baseConditions.temperature.low}</td>`;
        }
        
        if (options.includeWind) {
            const windDetails = `${baseConditions.wind.speed} mph from the ${baseConditions.wind.direction}`;
            content += `<td style="text-align: center; font-size: 0.8em; padding: 3px; border: 1px solid #666;" title="${windDetails}">${baseConditions.wind.speed} ${this._getWindDirectionSymbol(baseConditions.wind.direction)}</td>`;
        }
        
        if (options.includeMoons) {
            // Use improved moon symbols with better contrast
            const lunaPhase = baseConditions.moonPhase.luna;
            const celenePhase = baseConditions.moonPhase.celene;
            const moonDetails = `Luna: ${lunaPhase}\nCelene: ${celenePhase}`;
            
            // Using inline styles for moon symbols to avoid DOM manipulations
            content += `<td style="text-align: center; padding: 3px; border: 1px solid #666;" title="${moonDetails}">
                ${this._getSimpleMoonSymbol(lunaPhase, 'luna')}
                ${this._getSimpleMoonSymbol(celenePhase, 'celene')}
            </td>`;
        }
        
        if (options.includeEffects) {
            const allEffects = [];
            
            if (weather.effects && weather.effects.special && weather.effects.special.length) {
                allEffects.push(...weather.effects.special);
            } else if (weather.effects && weather.effects.temperature && weather.effects.temperature.length) {
                // Only include temperature effects if no special effects
                allEffects.push(...weather.effects.temperature);
            }
            
            const effectText = allEffects.length ? allEffects[0] : '-';
            const shortEffect = this._shortenEffect(effectText);
            
            content += `<td style="text-align: left; font-size: 0.82em; max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 3px; border: 1px solid #666;" title="${effectText !== '-' ? effectText : 'No significant effects'}">${shortEffect}</td>`;
        }
        
        content += `</tr>`;
    });
    
    content += `</tbody></table>
    <div style="font-size: 0.8em; text-align: center; color: #888; margin-top: 10px; font-style: italic;">Generated by D&D Weather for Greyhawk</div>
    </div>`;
    return content;
}

// Helper to abbreviate month names
_abbreviateMonth(monthName) {
    if (!monthName) return '';
    
    // Special case for Ready'reat
    if (monthName.includes("Ready'reat")) return "Red";
    
    // Get first 3 characters otherwise
    return monthName.substring(0, 3);
}

// Improved helper for moon symbols with better visibility
_getSimpleMoonSymbol(phase, moonType) {
    // Define colors based on moon type - use direct HTML/CSS for Foundry
    const color = moonType === 'celene' ? '#88CCFF' : '#FFFFFF';
    const name = moonType === 'celene' ? 'Celene' : 'Luna';
    
    // Map phases to appropriate symbols
    let symbol = '○'; // Default empty circle
    
    // Use simple unicode characters instead of emoji to ensure compatibility
    if (phase === 'New') {
        symbol = '●'; // Black circle
    } else if (phase === 'Full') {
        symbol = '○'; // White circle
    } else if (phase === 'First Quarter' || phase === '1/4') {
        symbol = '◑'; // Half circle
    } else if (phase === 'Last Quarter' || phase === '3/4') {
        symbol = '◐'; // Half circle (opposite)
    } else if (phase.includes('Crescent')) {
        symbol = '◗'; // Crescent-like
    } else if (phase.includes('Gibbous')) {
        symbol = '◕'; // Almost full
    }
    
    // Create HTML with inline styles for better compatibility
    return `<span style="display: inline-block; color: ${color}; font-size: 1.3em; text-shadow: 0 0 2px black; margin: 0 1px;" title="${name}: ${phase}">${symbol}</span>`;
}


// Updated sky symbols with tooltips
// Updated _getSkySymbol for better partly cloudy icon visibility
_getSkySymbol(skyCondition) {
    let icon = '';
    
    switch(skyCondition) {
        case 'Clear':
            icon = '<i class="fas fa-sun" style="color: #FFD700;"></i>';
            break;
        case 'Partly Cloudy':
            // Improved partly cloudy icon with better contrast
            icon = '<i class="fas fa-cloud-sun" style="color: #FFD700; text-shadow: 0 0 2px #000;"></i>';
            break;
        case 'Cloudy':
            icon = '<i class="fas fa-cloud" style="color: #A0A0A0;"></i>';
            break;
        default:
            icon = skyCondition;
    }
    
    return icon;
}

// Updated precipitation symbols with tooltips
_getPrecipitationSymbol(precipType) {
    let icon = '-';
    
    if (!precipType || precipType === 'none') {
        return icon;
    }
    
    if (precipType.includes('snow')) {
        icon = '<i class="fas fa-snowflake" style="color: #E0FFFF;"></i>';
    } else if (precipType.includes('rain')) {
        icon = '<i class="fas fa-cloud-rain" style="color: #87CEEB;"></i>';
    } else if (precipType.includes('thunder')) {
        icon = '<i class="fas fa-bolt" style="color: #FFD700;"></i>';
    } else if (precipType.includes('drizzle')) {
        icon = '<i class="fas fa-tint" style="color: #87CEEB;"></i>';
    } else if (precipType.includes('hail')) {
        icon = '<i class="fas fa-cloud-meatball" style="color: #E0E0E0;"></i>';
    } else if (precipType.includes('fog')) {
        icon = '<i class="fas fa-smog" style="color: #C0C0C0;"></i>';
    } else {
        icon = precipType.substring(0, 4);
    }
    
    return icon;
}

// Helper for wind direction
// Updated _getWindDirectionSymbol to correctly show wind direction as "coming from"
_getWindDirectionSymbol(direction) {
    // In meteorology, wind direction is given as the direction FROM which it originates
    switch(direction) {
        case 'North': return '↓'; // North wind blows FROM north TO south
        case 'Northeast': return '↙'; // Northeast wind blows FROM northeast TO southwest
        case 'East': return '←'; // East wind blows FROM east TO west
        case 'Southeast': return '↖'; // Southeast wind blows FROM southeast TO northwest
        case 'South': return '↑'; // South wind blows FROM south TO north
        case 'Southwest': return '↗'; // Southwest wind blows FROM southwest TO northeast
        case 'West': return '→'; // West wind blows FROM west TO east
        case 'Northwest': return '↘'; // Northwest wind blows FROM northwest TO southeast
        default: return direction.substring(0, 1);
    }
}

// Helper to get moon phase symbols
_getMoonSymbol(phase) {
    switch(phase) {
        case 'New': return '🌑';
        case '1/4': return '🌓';
        case 'Full': return '🌕';
        case '3/4': return '🌗';
        case 'Waxing': return '🌔';
        case 'Waning': return '🌖';
        case 'Waxing Crescent': return '🌒';
        case 'Waxing Gibbous': return '🌔';
        case 'Waning Gibbous': return '🌖';
        case 'Waning Crescent': return '🌘';
        default: return phase.substring(0, 1);
    }
}

// Helper to shorten effect text
_shortenEffect(effectText) {
    if (!effectText || effectText === '-') return '-';
    
    // Handle common effects
    if (effectText.includes('Freezing conditions')) return 'Freezing';
    if (effectText.includes('Hot conditions')) return 'Hot';
    if (effectText.includes('Extreme heat')) return 'Ex. Heat';
    if (effectText.includes('Extreme cold')) return 'Ex. Cold';
    if (effectText.includes('Visibility')) return 'Low Vis';
    if (effectText.includes('Movement')) return 'Slow Mvt';
    
    // Generic shortening - first 8 chars + ellipsis
    if (effectText.length > 10) {
        return effectText.substring(0, 8) + '...';
    }
    
    return effectText;
}

// Update the _sendWeatherReport method with improved styling
_sendWeatherReport(content) {
    // Add styling in a style tag at the top for better organization
    const styledContent = `
        <style>
            .dnd-weather-report-compact {
                font-family: var(--font-primary);
                background: rgba(30, 30, 30, 0.95);
                border: 1px solid #777;
                border-radius: 8px;
                padding: 12px;
                color: #eee;
                max-width: 600px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
            }
            
            .dnd-weather-report-compact h2 {
                color: #f0f0f0;
                border-bottom: 1px solid #777;
                padding-bottom: 5px;
                margin-bottom: 8px;
                font-size: 1.2em;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
                text-align: left;
            }
            
            .date-range {
                color: #aaddff;
                margin: 5px 0;
                font-style: italic;
                font-size: 0.9em;
            }
            
            .weather-table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #555;
                margin-top: 8px;
                table-layout: fixed;
            }
            
            .weather-table th {
                background: rgba(50, 50, 60, 0.9);
                padding: 4px 2px;
                text-align: center;
                border: 1px solid #777;
                font-weight: bold;
                color: #ddd;
                font-size: 0.8em;
                text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.7);
                vertical-align: middle;
            }
            
            .weather-table td {
                padding: 3px;
                border: 1px solid #666;
                vertical-align: middle;
            }
            
            .weather-table tr:nth-child(even) {
                background: rgba(50, 50, 55, 0.5);
            }
            
            .weather-table tr:hover {
                background: rgba(60, 60, 75, 0.7);
            }
            
            /* Tooltip enhancements - simpler implementation for Foundry */
            [title] {
                position: relative;
                cursor: help;
            }
        </style>
        ${content}
    `;
    
    // Create the chat message
    ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker(),
        content: styledContent,
        whisper: game.user.isGM ? [game.user.id] : undefined // Only whisper if GM, otherwise public
    });
}

// Also update the _shareTodaysWeather method to include location name
async _shareTodaysWeather() {
    if (!this.state.currentWeather) {
        ui.notifications.warn("No current weather to share");
        return;
    }
    
    // Get location name
    const locationName = await new Promise(resolve => {
        const dialog = new Dialog({
            title: "Share Weather",
            content: `
                <div class="form-group">
                    <label>Location Name:</label>
                    <input type="text" name="locationName" value="${this.state.terrain}" placeholder="e.g., Hommlet, Greyhawk City">
                </div>
            `,
            buttons: {
                ok: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "OK",
                    callback: html => resolve(html.find('[name="locationName"]').val() || this.state.terrain)
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => resolve(null)
                }
            },
            default: "ok"
        });
        dialog.render(true);
    });
    
    if (!locationName) return;
    
    // Format the current weather
    const weather = this.state.currentWeather;
    const baseConditions = weather.baseConditions;
    
    // Get current date string
    let dateString = `${this.state.selectedMonth} ${this.state.selectedDay}`;
    if (globalThis.dndWeather?.weatherSystem?.calendarIntegration?.initialized) {
        try {
            dateString = globalThis.dndWeather.weatherSystem.calendarIntegration.formatCurrentDate();
        } catch (error) {
            console.error("DND-Weather | Error formatting current date:", error);
        }
    }
    
    const content = `<div class="dnd-weather-today">
        <h2>Weather for ${locationName}</h2>
        <p class="date-display">${dateString}</p>
        <p><strong>Location:</strong> ${weather.terrain} (Elevation: ${weather.elevation}ft)</p>
        <div class="weather-condition">
            <strong>Sky:</strong> ${baseConditions.sky}
        </div>
        <div class="weather-temperature">
            <strong>Temperature:</strong> High ${baseConditions.temperature.high}°F / Low ${baseConditions.temperature.low}°F
            ${baseConditions.temperature.windChill ? `<br><span class="wind-chill">(Wind chill: ${baseConditions.temperature.windChill}°F)</span>` : ''}
        </div>
        <div class="weather-precipitation">
            <strong>Precipitation:</strong> ${baseConditions.precipitation.type !== 'none' ? baseConditions.precipitation.type : 'None'}
            ${baseConditions.precipitation.type !== 'none' ? `<br><span class="precip-duration">Duration: ${baseConditions.precipitation.duration} hours</span>` : ''}
        </div>
        <div class="weather-wind">
            <strong>Wind:</strong> ${baseConditions.wind.speed} mph from the ${baseConditions.wind.direction}
        </div>
        <div class="weather-moons">
            <strong>Moon Phases:</strong> Luna: ${baseConditions.moonPhase.luna}, Celene: ${baseConditions.moonPhase.celene}
        </div>
        <div class="weather-daylight">
            <strong>Daylight:</strong> Sunrise: ${baseConditions.daylight.sunrise}, Sunset: ${baseConditions.daylight.sunset}
        </div>
    </div>`;
    
    // Add styling and send to chat
    const styledContent = `
        <style>
            .dnd-weather-today {
                font-family: var(--font-primary);
                background: rgba(30, 30, 30, 0.9);
                border: 1px solid #666;
                border-radius: 5px;
                padding: 10px;
                color: #eee;
            }
            .dnd-weather-today h2 {
                color: #d0d0d0;
                border-bottom: 1px solid #666;
                padding-bottom: 5px;
                margin-bottom: 5px;
            }
            .date-display {
                color: #aaddff;
                font-style: italic;
                margin: 5px 0;
            }
            .dnd-weather-today div {
                margin-bottom: 5px;
            }
            .wind-chill {
                color: #aaaaff;
            }
        </style>
        ${content}
    `;
    
    await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker(),
        content: styledContent
    });
    
    ui.notifications.info("Weather shared to chat");
}

// Helper method for Simple Calendar integration
_getCalendarIntegration() {
    const weatherSystem = globalThis.dndWeather?.weatherSystem;
    if (!weatherSystem) {
        console.log("DND-Weather | Weather system not found");
        return null;
    }
    
    if (!weatherSystem.calendarIntegration) {
        console.log("DND-Weather | Calendar integration not found");
        return null;
    }
    
    if (!weatherSystem.calendarIntegration.initialized) {
        console.log("DND-Weather | Calendar integration not initialized");
        return null;
    }
    
    console.log("DND-Weather | Calendar integration available");
    return weatherSystem.calendarIntegration;
}

_getCorrectCalendarId(monthName) {
    // Manual mapping of Greyhawk months to known Simple Calendar IDs
    // These will need to be adjusted based on your actual Simple Calendar setup
    const monthIdMap = {
        // This would be populated based on the actual IDs in your Simple Calendar
        // Inspect the actual ID values by looking at your logs
        // 'Coldeven': '...',
    };
    
    return monthIdMap[monthName] || null;
}

}