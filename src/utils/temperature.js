// Temperature conversion utilities 
// Path: src/utils/temperature.js
// Utility functions for temperature calculations and adjustments

/**
 * Applies wind chill effect to a given temperature
 * @param {number} temp - Base temperature in Fahrenheit
 * @param {number} windSpeed - Wind speed in mph
 * @param {Object} windChillTable - Reference wind chill table
 * @returns {number|string} Adjusted temperature or 'N/A' if no wind chill effect
 */
export function applyWindChill(temp, windSpeed, windChillTable) {
    // No wind chill effect above 35°F
    if (temp >= 35 || !windSpeed || windSpeed < 5) {
        return temp;
    }

    // Find closest wind speed value in the table
    const speeds = Object.keys(windChillTable).map(Number);
    const closestSpeed = findClosestValue(windSpeed, speeds);

    // Find closest temperature value in the table
    const temps = Object.keys(windChillTable[closestSpeed]).map(Number);
    const closestTemp = findClosestValue(temp, temps);

    // Return wind chill value from table
    return windChillTable[closestSpeed][closestTemp];
}

/**
 * Calculate temperature adjustment based on latitude
 * @param {number} latitude - Latitude in degrees
 * @returns {number} Temperature adjustment in Fahrenheit
 */
export function calculateLatitudeAdjustment(latitude) {
    // Base calibration is at 40° latitude
    const baseLat = 40;
    // 2°F adjustment per degree of latitude difference
    return (baseLat - latitude) * 2;
}

/**
 * Calculate temperature adjustment for altitude
 * @param {number} altitude - Altitude in feet
 * @returns {number} Temperature adjustment in Fahrenheit
 */
export function calculateAltitudeAdjustment(altitude) {
    // -3°F per 1000 feet elevation
    return -Math.floor(altitude / 1000) * 3;
}

/**
 * Calculate temperature and humidity effects
 * @param {number} temp - Temperature in Fahrenheit
 * @param {number} humidity - Relative humidity percentage
 * @returns {Object} Effects including movement and visibility modifiers
 */
export function calculateTempHumidityEffects(temp, humidity) {
    const sum = temp + humidity;
    
    if (sum <= 140) {
        return {
            movementModifier: 1.0,
            visibilityModifier: 1.0,
            spellFailureChance: 0,
            effects: []
        };
    }

    if (sum <= 160) {
        return {
            movementModifier: 1.0,
            visibilityModifier: 1.0,
            spellFailureChance: 5,
            effects: ['Dexterity -1']
        };
    }

    if (sum <= 180) {
        return {
            movementModifier: 0.75,
            visibilityModifier: 0.75,
            spellFailureChance: 10,
            effects: ['Dexterity -1', 'To hit -1']
        };
    }

    if (sum <= 200) {
        return {
            movementModifier: 0.5,
            visibilityModifier: 0.5,
            spellFailureChance: 15,
            effects: ['Dexterity -2', 'To hit -2', 'AC -1']
        };
    }

    // Above 200
    return {
        movementModifier: 0.25,
        visibilityModifier: 0.25,
        spellFailureChance: 20,
        effects: ['Dexterity -3', 'To hit -3', 'AC -2']
    };
}

/**
 * Calculate day/night temperature variation
 * @param {number} baseTemp - Base temperature in Fahrenheit
 * @param {boolean} isDay - Whether it's daytime
 * @param {string} season - Current season
 * @returns {number} Adjusted temperature
 */
export function calculateTimeOfDayAdjustment(baseTemp, isDay, season) {
    const variations = {
        'Winter': { day: 5, night: -8 },
        'Spring': { day: 8, night: -5 },
        'Summer': { day: 10, night: -3 },
        'Autumn': { day: 7, night: -6 }
    };

    const adjustment = variations[season] || variations.Spring;
    return baseTemp + (isDay ? adjustment.day : adjustment.night);
}

// Helper function to find closest value in array
function findClosestValue(target, values) {
    return values.reduce((prev, curr) => 
        Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
    );
}