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
    
    // Create a dialog to configure the report
    const dialog = new Dialog({
        title: "Generate Weather Report",
        content: `
            <form>
                <div class="form-group">
                    <label>Location Name:</label>
                    <input type="text" name="locationName" value="${this.state.terrain}" placeholder="e.g., Hommlet, Greyhawk City">
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
                    <input type="checkbox" name="useCalendar" ${game.modules.get('simple-calendar')?.active ? 'checked' : 'disabled'}>
                    ${!game.modules.get('simple-calendar')?.active ? '<span class="notes">(Simple Calendar not active)</span>' : ''}
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

// Update the _generateWeatherReport method to handle the new fields
async _generateWeatherReport(html) {
    const days = parseInt(html.find('[name="days"]').val()) || 7;
    const month = html.find('[name="month"]').val();
    const startDay = parseInt(html.find('[name="day"]').val()) || 1;
    const locationName = html.find('[name="locationName"]').val() || this.state.terrain;
    const useCalendar = html.find('[name="useCalendar"]').prop("checked") && game.modules.get('simple-calendar')?.active;
    const includeMoons = html.find('[name="includeMoons"]').prop("checked");
    const includeTemp = html.find('[name="includeTemp"]').prop("checked");
    const includeWind = html.find('[name="includeWind"]').prop("checked");
    const includeEffects = html.find('[name="includeEffects"]').prop("checked");
    const format = html.find('[name="format"]').val();
    
    console.log(`DND-Weather | Generating ${days} day report for "${locationName}" starting from ${month} ${startDay}`);
    
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
        let startDateStr = `${month} ${startDay}`;
        let endDateStr = "";
        
        // If using Simple Calendar, get the proper date strings
        if (useCalendar && weatherSystem.calendarIntegration?.initialized) {
            try {
                // Set up the calendar date
                const calDate = weatherSystem.calendarIntegration.getCurrentDate();
                calDate.month = weatherSystem.calendarIntegration.getMonthIndex(month);
                calDate.day = startDay;
                
                // Get formatted start date
                startDateStr = weatherSystem.calendarIntegration.formatDate(calDate);
                
                // Calculate end date
                const endDate = {...calDate};
                let daysToAdd = days - 1; // Adjust since we're starting on day 1
                
                // Add days to the end date
                while (daysToAdd > 0) {
                    endDate.day++;
                    // Check for month rollover
                    const daysInMonth = weatherSystem.calendarIntegration.getDaysInMonth(endDate.month);
                    if (endDate.day > daysInMonth) {
                        endDate.day = 1;
                        endDate.month++;
                        // Check for year rollover
                        if (endDate.month >= weatherSystem.calendarIntegration.getMonthsInYear()) {
                            endDate.month = 0;
                            endDate.year++;
                        }
                    }
                    daysToAdd--;
                }
                
                // Get formatted end date
                endDateStr = weatherSystem.calendarIntegration.formatDate(endDate);
            } catch (error) {
                console.error("DND-Weather | Error with calendar dates:", error);
                // Fall back to manual date calculation
                useCalendar = false;
            }
        }
        
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
        
        // If we didn't calculate end date with Simple Calendar
        if (!endDateStr) {
            endDateStr = `${currentMonth} ${currentDay - 1}`;
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

// Update the _formatDetailedReport method to include location name and date range
_formatDetailedReport(weatherData, options) {
    // Create detailed report with day-by-day breakdown
    let content = `<div class="dnd-weather-report">
        <h2>Weather Report: ${options.locationName}</h2>
        <p class="date-range"><strong>Period:</strong> ${options.startDate} to ${options.endDate}</p>
        <p><strong>Location:</strong> ${this.state.terrain} (Elevation: ${this.state.elevation}ft, Latitude: ${this.state.latitude}°)</p>
        <hr/>`;
    
    weatherData.forEach(day => {
        const weather = day.weather;
        const baseConditions = weather.baseConditions;
        
        // Format day date - use calendar format if requested
        let dayDate = `${day.month} ${day.day}`;
        if (options.useCalendar && globalThis.dndWeather?.weatherSystem?.calendarIntegration?.initialized) {
            try {
                const calDate = globalThis.dndWeather.weatherSystem.calendarIntegration.getCurrentDate();
                calDate.month = globalThis.dndWeather.weatherSystem.calendarIntegration.getMonthIndex(day.month);
                calDate.day = day.day;
                dayDate = globalThis.dndWeather.weatherSystem.calendarIntegration.formatDate(calDate);
            } catch (error) {
                console.error("DND-Weather | Error formatting calendar date:", error);
            }
        }
        
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
    // Create compact report as a table
    let content = `<div class="dnd-weather-report-compact">
        <h2>Weather Report: ${options.locationName}</h2>
        <p class="date-range"><strong>Period:</strong> ${options.startDate} to ${options.endDate}</p>
        <p><strong>Location:</strong> ${this.state.terrain} (Elevation: ${this.state.elevation}ft, Latitude: ${this.state.latitude}°)</p>
        <table class="weather-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Sky</th>
                    <th>Precipitation</th>`;
                    
    if (options.includeTemp) content += `<th>Temp (High/Low)</th>`;
    if (options.includeWind) content += `<th>Wind</th>`;
    if (options.includeMoons) content += `<th>Moons</th>`;
    if (options.includeEffects) content += `<th>Notable Effects</th>`;
    
    content += `</tr></thead><tbody>`;
    
    weatherData.forEach(day => {
        const weather = day.weather;
        const baseConditions = weather.baseConditions;
        
        // Format day date - use calendar format if requested
        let dayDate = `${day.month} ${day.day}`;
        if (options.useCalendar && globalThis.dndWeather?.weatherSystem?.calendarIntegration?.initialized) {
            try {
                const calDate = globalThis.dndWeather.weatherSystem.calendarIntegration.getCurrentDate();
                calDate.month = globalThis.dndWeather.weatherSystem.calendarIntegration.getMonthIndex(day.month);
                calDate.day = day.day;
                dayDate = globalThis.dndWeather.weatherSystem.calendarIntegration.formatDate(calDate, {showWeekday: false});
            } catch (error) {
                console.error("DND-Weather | Error formatting calendar date:", error);
            }
        }
        
        content += `<tr>
            <td>${dayDate}</td>
            <td>${baseConditions.sky}</td>
            <td>${baseConditions.precipitation.type !== 'none' ? baseConditions.precipitation.type : 'None'}</td>`;
            
        if (options.includeTemp) {
            content += `<td>${baseConditions.temperature.high}°F/${baseConditions.temperature.low}°F</td>`;
        }
        
        if (options.includeWind) {
            content += `<td>${baseConditions.wind.speed} mph (${baseConditions.wind.direction})</td>`;
        }
        
        if (options.includeMoons) {
            content += `<td>L: ${baseConditions.moonPhase.luna.substring(0,1)}, C: ${baseConditions.moonPhase.celene.substring(0,1)}</td>`;
        }
        
        if (options.includeEffects) {
            const allEffects = [];
            
            if (weather.effects.special && weather.effects.special.length) {
                allEffects.push(...weather.effects.special);
            } else if (weather.effects.temperature && weather.effects.temperature.length) {
                // Only include temperature effects if no special effects
                allEffects.push(...weather.effects.temperature);
            }
            
            content += `<td>${allEffects.length ? allEffects[0] : '-'}</td>`;
        }
        
        content += `</tr>`;
    });
    
    content += `</tbody></table></div>`;
    return content;
}

// Update the _sendWeatherReport method with improved styling
_sendWeatherReport(content) {
    // Add styling to the content
    const styledContent = `
        <style>
            .dnd-weather-report, .dnd-weather-report-compact {
                font-family: var(--font-primary);
                background: rgba(30, 30, 30, 0.9);
                border: 1px solid #666;
                border-radius: 5px;
                padding: 10px;
                color: #eee;
            }
            .dnd-weather-report h2, .dnd-weather-report-compact h2 {
                color: #d0d0d0;
                border-bottom: 1px solid #666;
                padding-bottom: 5px;
                margin-bottom: 5px;
            }
            .date-range {
                color: #aaddff;
                margin: 5px 0;
                font-style: italic;
            }
            .dnd-weather-report h3 {
                color: #aaddff;
                margin: 5px 0;
            }
            .weather-day {
                margin-bottom: 10px;
            }
            .weather-effects ul {
                margin: 5px 0 5px 20px;
            }
            .wind-chill {
                color: #aaaaff;
            }
            .weather-table {
                width: 100%;
                border-collapse: collapse;
            }
            .weather-table th {
                background: #444;
                padding: 5px;
                text-align: left;
            }
            .weather-table td {
                padding: 5px;
                border-bottom: 1px solid #555;
            }
            .weather-table tr:nth-child(even) {
                background: rgba(50, 50, 50, 0.5);
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
    if (!weatherSystem || !weatherSystem.calendarIntegration || !weatherSystem.calendarIntegration.initialized) {
        return null;
    }
    return weatherSystem.calendarIntegration;
}
}