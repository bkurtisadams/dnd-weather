// Weather report formatting 
/**
 * Generates comprehensive weather reports by combining data from all subsystems
 */
export class ReportGenerator {
    constructor({
        calendarIntegration,
        temperatureCalculator,
        precipitationHandler,
        windSystem,
        moonPhaseTracker,
        specialWeatherEvents
    }) {
        this.calendar = calendarIntegration;
        this.temperature = temperatureCalculator;
        this.precipitation = precipitationHandler;
        this.wind = windSystem;
        this.moonPhases = moonPhaseTracker;
        this.specialEvents = specialWeatherEvents;
    }

    /**
     * Generate a complete weather report for current conditions
     * @param {string} terrainType - Type of terrain
     * @returns {Object} Complete weather report
     */
    generateCurrentReport(terrainType) {
        // Get current date and time
        const currentDate = this.calendar.getCurrentDate();
        const isDaytime = this.calendar.isDaytime();

        // Generate all weather components
        const temperature = this._generateTemperatureReport(terrainType, currentDate);
        const wind = this._generateWindReport(terrainType);
        const precipitation = this._generatePrecipitationReport(terrainType, temperature.current);
        const moonPhases = this._generateMoonPhaseReport(currentDate);
        const specialEvent = this._checkSpecialEvents(terrainType, { temperature, wind, precipitation });

        // Generate final report
        return {
            date: currentDate,
            timeOfDay: isDaytime ? 'day' : 'night',
            temperature,
            wind,
            precipitation,
            moonPhases,
            specialEvent,
            effects: this._compileEffects({
                temperature,
                wind,
                precipitation,
                specialEvent
            }),
            visibility: this._calculateVisibility({
                precipitation,
                specialEvent,
                isDaytime
            }),
            travel: this._calculateTravelConditions({
                temperature,
                wind,
                precipitation,
                specialEvent
            })
        };
    }

    /**
     * Generate a forecast for upcoming days
     * @param {string} terrainType - Type of terrain
     * @param {number} days - Number of days to forecast
     * @returns {Array} Array of daily forecasts
     */
    generateForecast(terrainType, days = 3) {
        const forecast = [];
        let currentDate = this.calendar.getCurrentDate();

        for (let i = 1; i <= days; i++) {
            // Advance date
            currentDate = this.calendar.addDays(currentDate, 1);

            // Generate basic prediction
            const prediction = {
                date: currentDate,
                temperature: this._predictTemperature(terrainType, currentDate),
                precipitation: this._predictPrecipitation(terrainType),
                wind: this._predictWind(terrainType),
                confidence: this._calculateForecastConfidence(i)
            };

            forecast.push(prediction);
        }

        return forecast;
    }

    /**
     * Generate a weather history report
     * @param {string} terrainType - Type of terrain
     * @param {number} days - Number of past days to include
     * @returns {Array} Array of historical weather reports
     */
    generateHistory(terrainType, days = 7) {
        const history = [];
        let currentDate = this.calendar.getCurrentDate();

        for (let i = 1; i <= days; i++) {
            // Move back one day
            currentDate = this.calendar.addDays(currentDate, -1);

            // Generate historical weather
            const historicalWeather = {
                date: currentDate,
                temperature: this._generateTemperatureReport(terrainType, currentDate),
                precipitation: this._generatePrecipitationReport(terrainType, temperature.current),
                wind: this._generateWindReport(terrainType),
                moonPhases: this._generateMoonPhaseReport(currentDate)
            };

            history.push(historicalWeather);
        }

        return history;
    }

    // Private helper methods
    _generateTemperatureReport(terrainType, date) {
        const baseTemp = this.temperature.calculateTemperature(terrainType, date);
        const { high, low } = this.temperature.calculateHighLow(baseTemp, terrainType);
        
        return {
            current: baseTemp,
            high,
            low,
            windChill: this.wind ? this.temperature.calculateWindChill(baseTemp, this.wind.getCurrentSpeed()) : null,
            effects: this.temperature.getTemperatureEffects(baseTemp)
        };
    }

    _generateWindReport(terrainType) {
        const windConditions = this.wind.generateWindConditions(terrainType);
        
        return {
            speed: windConditions.speed,
            direction: this._determineWindDirection(),
            effects: windConditions.effects,
            specialEffects: this.wind.checkForSpecialWindEvents(windConditions.speed, terrainType)
        };
    }

    _generatePrecipitationReport(terrainType, temperature) {
        const precipitation = this.precipitation.generatePrecipitation(terrainType, temperature);
        
        return {
            type: precipitation.type,
            intensity: precipitation.amount,
            duration: precipitation.duration,
            effects: precipitation.effects,
            rainbow: this.precipitation.checkForRainbow(precipitation)
        };
    }

    _generateMoonPhaseReport(date) {
        const phases = this.moonPhases.calculateCurrentPhases(date);
        const significance = this.moonPhases.checkAstrologicalSignificance(date);
        
        return {
            luna: phases.luna,
            celene: phases.celene,
            combinedEffects: phases.combined,
            astrologicalSignificance: significance
        };
    }

    _checkSpecialEvents(terrainType, conditions) {
        return this.specialEvents.checkForSpecialEvent(terrainType, conditions);
    }

    _compileEffects(conditions) {
        const effects = [];

        // Add temperature effects
        if (conditions.temperature.effects) {
            effects.push(...conditions.temperature.effects);
        }

        // Add wind effects
        if (conditions.wind.effects) {
            effects.push(...conditions.wind.effects);
        }

        // Add precipitation effects
        if (conditions.precipitation.effects) {
            effects.push(...conditions.precipitation.effects);
        }

        // Add special event effects
        if (conditions.specialEvent && conditions.specialEvent.effects) {
            effects.push(...conditions.specialEvent.effects);
        }

        return this._consolidateEffects(effects);
    }

    _calculateVisibility(conditions) {
        let baseVisibility = conditions.isDaytime ? 'unlimited' : '60 feet';
        let modifiers = [];

        // Apply precipitation effects
        if (conditions.precipitation.type !== 'none') {
            const precipVisibility = conditions.precipitation.visibility;
            if (precipVisibility) {
                baseVisibility = precipVisibility;
                modifiers.push('precipitation');
            }
        }

        // Apply special event effects
        if (conditions.specialEvent && conditions.specialEvent.visibility) {
            baseVisibility = conditions.specialEvent.visibility;
            modifiers.push('special event');
        }

        return {
            distance: baseVisibility,
            modifiers
        };
    }

    _calculateTravelConditions(conditions) {
        let movementModifier = 1.0;
        const effects = [];

        // Apply temperature effects
        if (conditions.temperature.current < 0) {
            movementModifier *= 0.75;
            effects.push('difficult terrain due to extreme cold');
        }

        // Apply wind effects
        if (conditions.wind.speed > 30) {
            movementModifier *= 0.75;
            effects.push('strong winds affecting movement');
        }

        // Apply precipitation effects
        if (conditions.precipitation.type !== 'none') {
            movementModifier *= conditions.precipitation.movement || 1;
            effects.push(`movement affected by ${conditions.precipitation.type}`);
        }

        // Apply special event effects
        if (conditions.specialEvent && conditions.specialEvent.movement) {
            movementModifier *= conditions.specialEvent.movement;
            effects.push('special weather event affecting movement');
        }

        return {
            modifier: Math.max(0.25, movementModifier), // Minimum 1/4 speed
            effects
        };
    }

    _determineWindDirection() {
        // Use terrain and prevailing winds to determine direction
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const season = this.calendar.getCurrentSeason();
        
        // Implement Greyhawk's prevailing winds:
        // Fall/Winter: North and Northeast
        // Spring/Summer: East and Southeast
        let preferredDirections;
        if (season === 'fall' || season === 'winter') {
            preferredDirections = ['N', 'NE'];
        } else {
            preferredDirections = ['E', 'SE'];
        }

        // 70% chance of prevailing wind
        return Math.random() < 0.7 
            ? preferredDirections[Math.floor(Math.random() * preferredDirections.length)]
            : directions[Math.floor(Math.random() * directions.length)];
    }

    _consolidateEffects(effects) {
        // Remove duplicates
        const uniqueEffects = [...new Set(effects)];

        // Sort by severity (assuming more severe effects are longer strings)
        return uniqueEffects.sort((a, b) => b.length - a.length);
    }

    _predictTemperature(terrainType, date) {
        const baseTemp = this.temperature.calculateTemperature(terrainType, date);
        const variation = Math.floor(Math.random() * 10) - 5; // ±5 degrees
        
        return {
            predicted: baseTemp + variation,
            range: '±5°'
        };
    }

    _predictPrecipitation(terrainType) {
        const chance = Math.random() * 100;
        const terrainEffect = TERRAIN_EFFECTS[terrainType] || TERRAIN_EFFECTS.plains;
        
        return {
            chance: chance + (terrainEffect.precipitationChance || 0),
            confidence: 'moderate'
        };
    }

    _predictWind(terrainType) {
        const terrainEffect = TERRAIN_EFFECTS[terrainType] || TERRAIN_EFFECTS.plains;
        const baseSpeed = 5 + Math.floor(Math.random() * 20);
        
        return {
            speed: baseSpeed + (terrainEffect.windSpeedModifier || 0),
            range: '±5 mph'
        };
    }

    _calculateForecastConfidence(daysOut) {
        // Confidence decreases with each day out
        return Math.max(20, 90 - (daysOut * 20)); // 90% -> 70% -> 50% -> 30%
    }
}