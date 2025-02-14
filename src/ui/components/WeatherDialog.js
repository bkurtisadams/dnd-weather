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

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "weather-dialog",
            template: "modules/dnd-weather/src/ui/templates/weather-dialog.hbs",
            width: 500,
            height: 'auto',
            title: "Weather System",
            resizable: true,
            classes: ["dnd-weather", "weather-dialog"]
        });
    }

    getData() {
        console.log("WeatherDialog getData called");
        try {
            const weatherSystem = globalThis.dndWeather?.weatherSystem;
            if (!weatherSystem) {
                console.error("DND-Weather | Weather system not found in getData");
                return this._getErrorData("Weather system not initialized");
            }
    
            // Add form data
            const formData = {
                months: this.months, // Use this.months directly
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

            console.log("DND-Weather | Form data:", formData); // debug log

            // Get current weather data
            const currentWeather = this.state.currentWeather || weatherSystem.getCurrentWeather();
            console.log("DND-Weather | Current weather data:", currentWeather);

            if (!currentWeather || !currentWeather.baseConditions) {
                return {
                    ...this._getErrorData("No weather data available"),
                    ...formData
                };
            }

            // Get precipitation details from weatherPhenomena table
            const precipType = currentWeather.baseConditions.precipitation;
            console.log("DND-Weather | Precipitation type:", precipType);
            
            let precipDetails = null;
            if (precipType && precipType !== 'none') {
                // Convert precipitation type to match table keys
                const precipKey = precipType.toLowerCase().replace(/\s+/g, '-');
                precipDetails = weatherPhenomena[precipKey];
                console.log("DND-Weather | Looking up precipitation details for", precipKey, ":", precipDetails);
            }

            // Add safer data access
            const precipitation = {
                type: precipType || 'none',
                amount: 'none',
                duration: 'none',
                movement: 'Normal',
                vision: 'Normal',
                notes: ''
            };

            // Modify the precipitation object creation in getData()
            if (precipDetails) {
                precipitation.amount = precipDetails.precipitation?.amount || 'none';
                precipitation.duration = precipDetails.precipitation?.duration || 'none';
                precipitation.movement = precipDetails.precipitation?.movement || 'Normal';
                precipitation.vision = precipDetails.precipitation?.vision || 'Normal';
                precipitation.infraUltra = precipDetails.precipitation?.infraUltra || 'Normal';
                precipitation.tracking = precipDetails.precipitation?.tracking || 'Normal';
                precipitation.chanceLost = precipDetails.precipitation?.chanceLost || 'Normal';
                precipitation.windSpeed = precipDetails.precipitation?.windSpeed || 'Normal';
                precipitation.notes = precipDetails.notes || '';
                
                console.log("DND-Weather | Full precipitation details:", precipitation);
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
                    // Add this if it's not already there
                    moonPhase: {
                        luna: currentWeather.baseConditions.moonPhase?.luna || 'Unknown',
                        celene: currentWeather.baseConditions.moonPhase?.celene || 'Unknown'
                    },
                    conditions: currentWeather.baseConditions.sky
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
                conditions: 'Unknown'
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