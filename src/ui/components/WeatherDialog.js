// WeatherDialog.js
console.log("WeatherDialog.js loaded");

export class WeatherDialog extends Application {
    constructor(options = {}) {
        super(options);
        console.log("WeatherDialog constructor called");
        
        // Initialize the weather system reference
        this.weatherSystem = game.modules.get('dnd-weather')?.weatherSystem;
        
        // Initialize state
        this._state = {
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
            title: game.i18n.localize("DND-WEATHER.Dialog.Title"),
            resizable: true,
            classes: ["dnd-weather", "weather-dialog"]
        });
    }

    async getData() {
        try {
            // Get current weather data
            const weather = this.weatherSystem?.getCurrentWeather() || {};
            
            // Return template data
            return {
                weather,
                isGM: game.user.isGM,
                loading: this._state.loading,
                error: this._state.error,
                lastUpdate: this._state.lastUpdate
            };
        } catch (error) {
            console.error("Failed to get weather data:", error);
            return {
                weather: {},
                isGM: game.user.isGM,
                loading: false,
                error: error.message,
                lastUpdate: this._state.lastUpdate
            };
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Button listeners with error handling
        html.find('.generate-weather').click(async (event) => {
            event.preventDefault();
            await this._handleAction(this._onGenerateWeather.bind(this));
        });

        html.find('.update-weather').click(async (event) => {
            event.preventDefault();
            await this._handleAction(this._onUpdateWeather.bind(this));
        });

        html.find('.settings').click(async (event) => {
            event.preventDefault();
            await this._handleAction(this._onOpenSettings.bind(this));
        });

        html.find('.refresh-weather').click(async (event) => {
            event.preventDefault();
            await this._handleAction(async () => {
                await this.render(true);
            });
        });

        // Add retry button listener
        html.find('.retry-button').click(async (event) => {
            event.preventDefault();
            this._state.error = null;
            await this.render(true);
        });
    }

    async _handleAction(action) {
        if (this._state.loading) return;

        this._state.loading = true;
        this._state.error = null;
        await this.render(false);

        try {
            await action();
            this._state.lastUpdate = new Date().toLocaleTimeString();
        } catch (error) {
            console.error("Action failed:", error);
            this._state.error = game.i18n.localize("DND-WEATHER.Dialog.Error.Failed");
            ui.notifications.error(this._state.error);
        } finally {
            this._state.loading = false;
            await this.render(true);
        }
    }

    async _onGenerateWeather() {
        if (!this.weatherSystem) {
            throw new Error(game.i18n.localize("DND-WEATHER.Dialog.Error.NoSystem"));
        }

        await this.weatherSystem.generateWeather();
        ui.notifications.info(game.i18n.localize("DND-WEATHER.Dialog.Notifications.Generated"));
    }

    async _onUpdateWeather() {
        if (!this.weatherSystem) {
            throw new Error(game.i18n.localize("DND-WEATHER.Dialog.Error.NoSystem"));
        }

        await this.weatherSystem.updateWeather();
        ui.notifications.info(game.i18n.localize("DND-WEATHER.Dialog.Notifications.Updated"));
    }

    _onOpenSettings() {
        game.settings.sheet.render(true);
    }

    async close(options={}) {
        // Clean up state
        this._state = {
            loading: false,
            error: null,
            lastUpdate: null
        };
        
        return super.close(options);
    }
}