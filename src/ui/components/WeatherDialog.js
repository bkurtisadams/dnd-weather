// WeatherDialog.js
import { baselineData } from '../../constants/baseline-data.js';
console.log("WeatherDialog.js loaded, baselineData:", baselineData);


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
            latitude: game.settings.get('dnd-weather', 'latitude'),
            terrain: game.settings.get('dnd-weather', 'terrain'),
            elevation: game.settings.get('dnd-weather', 'elevation')
        };

        // Add months array from baselineData.js
        this.months = Object.keys(globalThis.dndWeather?.weatherSystem?.baselineData || {});
        console.log("Available months:", this.months);

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
                months: this.months,
                selectedMonth: this.state.selectedMonth,
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

            // Prepare the data for the template
            return {
                weather: {
                    temperature: currentWeather.baseConditions.temperature.high,
                    temperatureLow: currentWeather.baseConditions.temperature.low,
                    windChill: currentWeather.baseConditions.temperature.windChill,
                    wind: currentWeather.baseConditions.wind.speed,
                    windDirection: currentWeather.baseConditions.wind.direction,
                    precipitation: currentWeather.baseConditions.precipitation,
                    moonPhase: currentWeather.moonPhase,
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