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

    // added history to getData() method
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
        
        // Structure the data to match the template and include weatherDuration
        return {
            weather: {
                conditions: baseConditions.sky,
                temperature: baseConditions.temperature.high,
                temperatureLow: baseConditions.temperature.low,
                windChill: baseConditions.temperature.windChill,
                wind: baseConditions.wind.speed,
                windDirection: baseConditions.wind.direction,
                precipitation: {
                    ...baseConditions.precipitation,
                    // Make sure these specific properties are explicitly extracted and set
                    continues: baseConditions.precipitation.continues || false,
                    previousType: baseConditions.precipitation.previousType || null,
                    changed: baseConditions.precipitation.changed || false,
                    duration: baseConditions.precipitation.duration || 0
                },
                // Include weatherDuration if available:
                weatherDuration: this.weatherData.weatherDuration || baseConditions.precipitation.duration,
                moonPhase: baseConditions.moonPhase,
                daylight: baseConditions.daylight
            },
            weatherTiming: this.weatherData.timing || null,
            weatherHistory: this.weatherData.history || [], // Add this line to receive history data
            effects: this.weatherData.effects || {},
            isGM: game.user.isGM,
            loading: false
        };
    }

    // Also update the update method to accept history
    async update(weatherData) {
        console.log("Weather Display updating with:", weatherData);
        // Add specific logging for precipitation continuation properties
        if (weatherData?.baseConditions?.precipitation) {
            console.log("DND-Weather | Continuation Properties:", {
                continues: weatherData.baseConditions.precipitation.continues,
                previousType: weatherData.baseConditions.precipitation.previousType,
                changed: weatherData.baseConditions.precipitation.changed,
                type: weatherData.baseConditions.precipitation.type
            });
        }
        this.weatherData = weatherData;
        await this.render(true);
    }

    // Add to WeatherDisplay.js - activateListeners method
    activateListeners(html) {
        super.activateListeners(html);
        
        // Register required Handlebars helpers
        Handlebars.registerHelper('isObject', function(value) {
            return typeof value === 'object' && value !== null && !Array.isArray(value);
        });

        Handlebars.registerHelper('eq', function(a, b) {
            return a === b;
        });

        Handlebars.registerHelper('neq', function(a, b) {
            return a !== b;
        });

        Handlebars.registerHelper('lt', function(a, b) {
            return a < b;
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

        // Add the formatDuration helper for continuing weather
        Handlebars.registerHelper('formatDuration', function(hours) {
            console.log("DND-Weather | Formatting duration in display:", hours);
            
            if (!hours || isNaN(hours)) {
                return "unknown";
            }
            
            if (hours >= 24) {
                const days = Math.floor(hours / 24);
                const remainingHours = hours % 24;
                return `${days} ${days === 1 ? 'day' : 'days'}${remainingHours > 0 ? `, ${remainingHours} ${remainingHours === 1 ? 'hour' : 'hours'}` : ''}`;
            }
            
            return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
        });

        // Add listener for restore weather buttons with event delegation
        html.on('click', '.restore-weather', async (event) => {
            const index = Number(event.currentTarget.dataset.index);
            console.log("DND-Weather | Restore weather requested for index:", index);
            
            // Trigger an event that WeatherDialog can listen for
            const restoreEvent = new CustomEvent('dnd-weather-restore', {
                detail: { index: index }
            });
            document.dispatchEvent(restoreEvent);
        });

        // Also log when history is available to help with debugging
        if (this.weatherData?.history) {
            console.log("DND-Weather | Weather history available in display:", 
                this.weatherData.history.length, "entries");
        }
    }
}