// WeatherDialog.js
import { baselineData } from '../../constants/baseline-data.js';
import { weatherPhenomena } from '../../constants/precipitation-table.js';

Handlebars.registerHelper('isObject', function(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
});

console.log("WeatherDialog.js loaded, importing:", {
    weatherPhenomena,
    baselineData
});

// Add near the top of the file, after imports
Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
});

export class WeatherDialog extends Application {
    constructor(options = {}) {
        super(options);
        this.weatherTimer = null;
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
            latitude: game.settings.get('dnd-weather', 'latitude'),
            terrain: game.settings.get('dnd-weather', 'terrain'),
            elevation: game.settings.get('dnd-weather', 'elevation')            
        };

        // Add months array from baselineData.js
        /* this.months = Object.keys(globalThis.dndWeather?.weatherSystem?.baselineData || {});
        console.log("Available months:", this.months); */

        // Bind methods to preserve 'this' context
        this._onGenerateWeather = this._onGenerateWeather.bind(this);
        this._onUpdateWeather = this._onUpdateWeather.bind(this);
        this._onOpenSettings = this._onOpenSettings.bind(this);
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
                notes: ''
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
                            precipitation = {
                                type: precipType,
                                amount: precipData.amount || precipDetails.precipitation.amount,
                                duration: precipData.duration || precipDetails.precipitation.duration,
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
                                windSpeed: precipDetails.precipitation.windSpeed || 'Normal',
                                notes: precipDetails.notes || '',
                                rainbowChance: precipDetails.chanceRainbow || 0,
                                continues: precipData.continues || false,
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
    
            // Return combined data
            return {
                weather: {
                    temperature: currentWeather.baseConditions.temperature.high,
                    temperatureLow: currentWeather.baseConditions.temperature.low,
                    windChill: currentWeather.baseConditions.temperature.windChill,
                    wind: currentWeather.baseConditions.wind.speed,
                    windDirection: currentWeather.baseConditions.wind.direction,
                    precipitation: precipitation,
                    moonPhase: {
                        luna: currentWeather.baseConditions.moonPhase?.luna || 'Unknown',
                        celene: currentWeather.baseConditions.moonPhase?.celene || 'Unknown'
                    },
                    conditions: currentWeather.baseConditions.sky,
                    daylight: daylight  // Add new daylight data
                },
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

    // Add to activateListeners method around line 85
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
    }

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

    /* async _onUpdateWeather(event) {
        event.preventDefault();
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
            const weather = await weatherSystem.updateWeather();
            if (weather) {
                this.state.currentWeather = weather;
                this.state.lastUpdate = new Date().toLocaleTimeString();
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
    } */

    async _onUpdateWeather(event) {
        event.preventDefault();
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
                ui.notifications.info("New weather generated");
                return;
            }
    
            const precipitation = currentWeather.baseConditions.precipitation;
            // Before attempting the update
            console.log("DND-Weather | Current precipitation state:", {
                type: precipitation.type,
                chanceContinuing: precipitation.chanceContinuing,
                duration: precipitation.duration
            });
            
            // Check for continuation if there's current precipitation
            if (precipitation.type !== 'none' && precipitation.chanceContinuing) {
                console.log("DND-Weather | Checking precipitation continuation for", precipitation.type);
                
                const continuationRoll = await rollDice(1, 100)[0];
                console.log("DND-Weather | Continuation check:", {
                    roll: continuationRoll,
                    chance: precipitation.chanceContinuing
                });
    
                if (continuationRoll <= precipitation.chanceContinuing) {
                    // Roll for type change
                    const changeRoll = await rollDice(1, 10)[0];
                    console.log("DND-Weather | Precipitation continues, type change roll:", changeRoll);
    
                    const weather = await weatherSystem.updateWeather({
                        continues: true,
                        changeRoll: changeRoll,
                        currentType: precipitation.type
                    });
    
                    if (weather) {
                        this.state.currentWeather = weather;
                        this.state.lastUpdate = new Date().toLocaleTimeString();
                        ui.notifications.info(`Weather continues with ${weather.baseConditions.precipitation.type}`);
                    }
                } else {
                    console.log("DND-Weather | Precipitation ends, checking for rainbow");
                    const weather = await weatherSystem.updateWeather({
                        continues: false,
                        checkRainbow: true
                    });
    
                    if (weather) {
                        this.state.currentWeather = weather;
                        this.state.lastUpdate = new Date().toLocaleTimeString();
                        ui.notifications.info("Weather system updated - precipitation ended");
                    }
                }
            } else {
                console.log("DND-Weather | No precipitation to continue, generating new weather");
                const weather = await weatherSystem.updateWeather();
                
                if (weather) {
                    this.state.currentWeather = weather;
                    this.state.lastUpdate = new Date().toLocaleTimeString();
                    ui.notifications.info("Weather updated successfully");
                } else {
                    throw new Error("No weather data updated");
                }
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

    _onOpenSettings(event) {
        event.preventDefault();
        console.log("DND-Weather | Settings clicked");
        game.settings.sheet.render(true);
    }

    async close(options={}) {
        console.log("DND-Weather | Dialog closing");
        this.state = {
            loading: false,
            error: null,
            lastUpdate: null,
            currentWeather: null
        };
        return super.close(options);
    }
}