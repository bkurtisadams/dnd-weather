// WeatherDialog.js
console.log("WeatherDialog.js loaded");

export class WeatherDialog extends Application {
    constructor(options = {}) {
        super(options);
        console.log("WeatherDialog constructor called");
        
        this.state = {
            loading: false,
            error: null,
            lastUpdate: null,
            currentWeather: null
        };

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

            // Get current weather data
            const currentWeather = this.state.currentWeather || weatherSystem.getCurrentWeather();
            console.log("DND-Weather | Current weather data:", currentWeather);

            if (!currentWeather || !currentWeather.baseConditions) {
                return this._getErrorData("No weather data available");
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
                lastUpdate: this.state.lastUpdate || currentWeather.timestamp
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

    activateListeners(html) {
        super.activateListeners(html);
        console.log("DND-Weather | Activating listeners");
        
        // Remove any existing listeners first
        html.find('.generate-weather').off('click').on('click', this._onGenerateWeather);
        html.find('.update-weather').off('click').on('click', this._onUpdateWeather);
        html.find('.settings').off('click').on('click', this._onOpenSettings);
        html.find('.refresh-weather').off('click').on('click', () => this.render());
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