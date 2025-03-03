// src/ui/components/WeatherDisplay.js - Update these methods
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

Handlebars.registerHelper('and', function() {
    return Array.prototype.slice.call(arguments, 0, -1).every(Boolean);
  });
  
  Handlebars.registerHelper('or', function() {
    return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
  });
  
  Handlebars.registerHelper('not', function(value) {
    return !value;
  });
  
  Handlebars.registerHelper('neq', function(a, b) {
    return a !== b;
  });
  
  Handlebars.registerHelper('gt', function(a, b) {
    return a > b;
  });

Handlebars.registerHelper('getMoonIcon', function(phaseName) {
    // Normalize phase name to lowercase and trim
    const phase = phaseName.toLowerCase().trim();
    
    // Use standard Font Awesome icons with descriptive title attributes
    if (phase.includes('new')) return 'fa-circle';  // Black circle for new moon
    if (phase.includes('full')) return 'fa-circle'; // White circle for full moon (will style with CSS)
    if (phase.includes('first quarter') || phase.includes('1/4')) return 'fa-adjust fa-rotate-270'; // Half moon
    if (phase.includes('last quarter') || phase.includes('3/4')) return 'fa-adjust fa-rotate-90'; // Half moon (opposite)
    if (phase.includes('waxing') && phase.includes('crescent')) return 'fa-moon'; 
    if (phase.includes('waning') && phase.includes('crescent')) return 'fa-moon fa-flip-horizontal';
    if (phase.includes('waxing') && phase.includes('gibbous')) return 'fa-adjust fa-rotate-180';
    if (phase.includes('waning') && phase.includes('gibbous')) return 'fa-adjust';
    
    // Default to full moon if no match
    return 'fa-circle';
});

Handlebars.registerHelper('shortTimestamp', function(timestamp) {
    if (!timestamp) return '';
    
    // Extract just the time portion or last part of the timestamp
    const parts = timestamp.split(',');
    if (parts.length > 1) {
        return parts[parts.length - 1].trim(); // Return just the time
    }
    return timestamp;
});

Handlebars.registerHelper('shortDate', function(timestamp) {
    if (!timestamp) return '';
    
    // Extract just the time portion and possibly the date
    const parts = timestamp.split(',');
    if (parts.length > 1) {
      return parts[parts.length - 1].trim(); // Return just the time portion
    }
    return timestamp;
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
        
        // Get settings for location data
        const selectedMonth = game.settings.get('dnd-weather', 'selectedMonth');
        const selectedDay = game.settings.get('dnd-weather', 'selectedDay');
        const latitude = game.settings.get('dnd-weather', 'latitude');
        const terrain = game.settings.get('dnd-weather', 'terrain');
        const locationName = game.settings.get('dnd-weather', 'lastLocationName') || terrain;
        
        // Get current date from calendar integration if available
        let currentDate = null;
        if (globalThis.dndWeather?.weatherSystem?.calendarIntegration?.initialized) {
          try {
            currentDate = globalThis.dndWeather.weatherSystem.calendarIntegration.formatCurrentDate();
          } catch (error) {
            console.error("DND-Weather | Error formatting current date:", error);
          }
        }
        
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
              continues: baseConditions.precipitation.continues || false,
              previousType: baseConditions.precipitation.previousType || null,
              changed: baseConditions.precipitation.changed || false,
              duration: baseConditions.precipitation.duration || 0
            },
            weatherDuration: this.weatherData.weatherDuration || baseConditions.precipitation.duration,
            moonPhase: baseConditions.moonPhase,
            daylight: baseConditions.daylight
          },
          weatherTiming: this.weatherData.timing || null,
          weatherHistory: this.weatherData.history || [],
          effects: this.weatherData.effects || {},
          isGM: game.user.isGM,
          loading: false,
          
          // Add location data
          locationName: locationName,
          currentDate: currentDate,
          selectedMonth: selectedMonth,
          selectedDay: selectedDay,
          latitude: latitude,
          terrain: terrain
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