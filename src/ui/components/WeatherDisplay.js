// src/ui/components/WeatherDisplay.js - Update these methods

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
        console.log("Weather Display getData called with weatherData:", this.weatherData);
        
        // Ensure we have weather data
        if (!this.weatherData?.baseConditions) {
            console.warn("Weather Display: No base conditions in weather data");
            return {
                weather: {},
                effects: {},
                isGM: game.user.isGM,
                loading: false
            };
        }

        const baseConditions = this.weatherData.baseConditions;
        
        // Structure the data to match the template
        return {
            weather: {
                // Sky conditions
                conditions: baseConditions.sky,
                
                // Temperature data
                temperature: baseConditions.temperature.high,
                temperatureLow: baseConditions.temperature.low,
                windChill: baseConditions.temperature.windChill,
                
                // Wind data
                wind: baseConditions.wind.speed,
                windDirection: baseConditions.wind.direction,
                
                // Precipitation data
                precipitation: baseConditions.precipitation,
                
                // Moon phases
                moonPhase: baseConditions.moonPhase,
                
                // Daylight data
                daylight: baseConditions.daylight
            },
            effects: this.weatherData.effects || {},
            isGM: game.user.isGM,
            loading: false
        };
    }

    async update(weatherData) {
        console.log("Weather Display updating with:", weatherData);
        this.weatherData = weatherData;
        await this.render(true);
    }

    activateListeners(html) {
        super.activateListeners(html);
        
        // Register required Handlebars helpers
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