// WeatherDialog.js
console.log("WeatherDialog.js loaded");

export class WeatherDialog extends Application {
    constructor(options = {}) {
        super(options);
        console.log("WeatherDialog constructor called");
        
        // Properly initialize state as an object
        this.state = {
            loading: false,
            error: null,
            lastUpdate: null
        };
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
            // Access the weather system through the global namespace
            const weatherSystem = globalThis.dndWeather?.weatherSystem;
            if (!weatherSystem) {
                console.error("DND-Weather | Weather system not found in getData");
                return {
                    weather: {
                        temperature: '??',
                        wind: 'Unknown',
                        windDirection: 'Unknown',
                        precipitation: 'Unknown',
                        moonPhase: 'Unknown'
                    },
                    isGM: game.user.isGM,
                    loading: this.state.loading,
                    error: "Weather system not initialized"
                };
            }

            const currentWeather = weatherSystem.getCurrentWeather();
            console.log("DND-Weather | Current weather data:", currentWeather);
            
            return {
                weather: {
                    temperature: currentWeather.temperature || 65,
                    windChill: currentWeather.windChill,
                    wind: currentWeather.wind?.speed || 'Light',
                    windDirection: currentWeather.wind?.direction || 'North',
                    precipitation: currentWeather.precipitation?.type || 'None',
                    moonPhase: currentWeather.moonPhase || 'Full Moon',
                    conditions: currentWeather.conditions || 'Clear'
                },
                isGM: game.user.isGM,
                loading: this.state.loading,
                error: this.state.error
            };
        } catch (error) {
            console.error("DND-Weather | Error in getData:", error);
            return {
                weather: {
                    temperature: '??',
                    wind: 'Error',
                    windDirection: 'Error',
                    precipitation: 'Error',
                    moonPhase: 'Error'
                },
                isGM: game.user.isGM,
                loading: false,
                error: error.message
            };
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        console.log("DND-Weather | Activating listeners");
        
        html.find('.generate-weather').click(this._onGenerateWeather.bind(this));
        html.find('.update-weather').click(this._onUpdateWeather.bind(this));
        html.find('.settings').click(this._onOpenSettings.bind(this));
        html.find('.refresh-weather').click(() => this.render(true));
    }

    async _onGenerateWeather(event) {
        event.preventDefault();
        console.log("DND-Weather | Generate weather clicked");
        await this._handleAction(async () => {
            const weatherSystem = globalThis.dndWeather?.weatherSystem;
            if (!weatherSystem) throw new Error("Weather system not initialized");
            await weatherSystem.generateWeather();
            this.render(true);
        });
    }

    async _onUpdateWeather(event) {
        event.preventDefault();
        console.log("DND-Weather | Update weather clicked");
        await this._handleAction(async () => {
            const weatherSystem = globalThis.dndWeather?.weatherSystem;
            if (!weatherSystem) throw new Error("Weather system not initialized");
            await weatherSystem.updateWeather();
            this.render(true);
        });
    }

    _onOpenSettings(event) {
        event.preventDefault();
        console.log("DND-Weather | Settings clicked");
        game.settings.sheet.render(true);
    }

    async _handleAction(action) {
        if (this.state.loading) return;

        this.state.loading = true;
        this.state.error = null;
        await this.render(false);

        try {
            await action();
            this.state.lastUpdate = new Date().toLocaleTimeString();
        } catch (error) {
            console.error("DND-Weather | Action failed:", error);
            this.state.error = error.message;
            ui.notifications.error(this.state.error);
        } finally {
            this.state.loading = false;
            await this.render(true);
        }
    }

    async close(options={}) {
        // Reset state when closing
        this.state = {
            loading: false,
            error: null,
            lastUpdate: null
        };
        
        return super.close(options);
    }
}