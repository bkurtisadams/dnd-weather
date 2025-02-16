// src/ui/components/WeatherDisplay.js
export class WeatherDisplay extends Application {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "weather-display",
            template: "modules/dnd-weather/src/ui/templates/weather-display.hbs",
            width: 400,
            height: 'auto',
            title: "Current Weather",
            resizable: true,
            classes: ["dnd-weather", "weather-display"], 
            minimizable: true
        });
    }

    getData() {
        return {
            weather: this.weatherData?.baseConditions || {},
            effects: this.weatherData?.effects || {},
            isGM: game.user.isGM,
            loading: false
        };
    }

    async update(weatherData) {
        this.weatherData = weatherData;
        this.render(true);
    }

    // Add Handlebars helpers
    activateListeners(html) {
        super.activateListeners(html);
        
        Handlebars.registerHelper('isObject', function(value) {
            return typeof value === 'object' && value !== null && !Array.isArray(value);
        });

        Handlebars.registerHelper('eq', function(a, b) {
            return a === b;
        });

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
    }
}
