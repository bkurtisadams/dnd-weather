// Wind effects and calculations 
import { WIND_EFFECTS, WIND_CHILL_TABLE } from '../constants/wind-effects.js';
import { TERRAIN_EFFECTS } from '../constants/terrain-effects.js';
import { rollDice } from '../utils/dice.js';

/**
 * Handles wind generation, effects, and wind chill calculations
 */
export class WindSystem {
    /**
     * Generate wind conditions based on terrain and current weather
     * @param {string} terrainType - The type of terrain
     * @param {boolean} isPrecipitating - Whether precipitation is occurring
     * @returns {Object} Wind conditions and effects
     */
    generateWindConditions(terrainType, isPrecipitating) {
        // Get terrain wind modifier
        const terrainEffect = TERRAIN_EFFECTS[terrainType] || TERRAIN_EFFECTS.plains;
        const windModifier = terrainEffect.windSpeedModifier || 0;

        // Base wind speed calculation
        let windSpeed = this._calculateBaseWindSpeed(isPrecipitating);
        
        // Apply terrain modifier
        windSpeed = Math.max(0, windSpeed + windModifier);

        // Get effects based on wind speed
        const effects = this._determineWindEffects(windSpeed);

        return {
            speed: windSpeed,
            ...effects
        };
    }

    /**
     * Calculate wind chill effect
     * @param {number} temperature - Current temperature in Fahrenheit
     * @param {number} windSpeed - Current wind speed in mph
     * @returns {number} Wind chill temperature
     */
    calculateWindChill(temperature, windSpeed) {
        // Only calculate wind chill for temperatures of 35°F or below
        if (temperature > 35 || windSpeed === 0) {
            return temperature;
        }

        // Find closest wind speed row in table
        const windSpeeds = Object.keys(WIND_CHILL_TABLE)
            .map(Number)
            .sort((a, b) => Math.abs(a - windSpeed) - Math.abs(b - windSpeed));
        
        const closestWindSpeed = windSpeeds[0];

        // Find closest temperature column
        const temps = Object.keys(WIND_CHILL_TABLE[closestWindSpeed])
            .map(Number)
            .sort((a, b) => Math.abs(a - temperature) - Math.abs(b - temperature));
        
        const closestTemp = temps[0];

        return WIND_CHILL_TABLE[closestWindSpeed][closestTemp];
    }

    /**
     * Check for special wind-based events
     * @param {number} windSpeed - Current wind speed
     * @param {string} terrainType - The type of terrain
     * @returns {Object|null} Special event details if one occurs
     */
    checkForSpecialWindEvents(windSpeed, terrainType) {
        // Only check for special events in high winds
        if (windSpeed < 30) return null;

        const eventRoll = rollDice(1, 100);
        
        // Check for terrain-specific wind events
        if (terrainType === 'mountains' && eventRoll <= 20) {
            return {
                type: 'windstorm',
                severity: this._calculateWindstormSeverity(windSpeed)
            };
        }

        if (['desert', 'plains'].includes(terrainType) && eventRoll <= 40) {
            return {
                type: terrainType === 'desert' ? 'sandstorm' : 'dust storm',
                duration: rollDice(1, 8),
                effects: this._calculateStormEffects(windSpeed)
            };
        }

        return null;
    }

    /**
     * Calculate effects on flying creatures
     * @param {number} windSpeed - Current wind speed
     * @param {Object} creature - Creature details including size and weight
     * @returns {Object} Effects on flying
     */
    calculateFlyingEffects(windSpeed, creature) {
        if (windSpeed < 15) {
            return { canFly: true, effects: [] };
        }

        const effects = [];
        let canFly = true;

        // Basic size category checks
        if (windSpeed >= 30 && creature.size === 'eagle-size or below') {
            canFly = false;
            effects.push('Too small to fly in these winds');
        }
        
        if (windSpeed >= 45 && creature.size === 'man-sized') {
            canFly = false;
            effects.push('Too small to fly in these winds');
        }

        if (windSpeed >= 60) {
            canFly = creature.planeOfOrigin === 'Air';
            if (!canFly) {
                effects.push('Only creatures from Plane of Air can fly');
            }
        }

        // Calculate chances of being blown off course for magical flight
        if (windSpeed > 35 && creature.magicalFlight) {
            const blowOffChance = this._calculateBlowOffChance(windSpeed, creature);
            if (blowOffChance > 0) {
                effects.push(`${blowOffChance}% chance per round of being blown off course`);
            }
        }

        return { canFly, effects };
    }

    // Private helper methods
    _calculateBaseWindSpeed(isPrecipitating) {
        let windSpeed;
        
        if (isPrecipitating) {
            // Higher base winds during precipitation
            const diceCount = rollDice(1, 3) + 1; // 2-4 dice
            windSpeed = rollDice(diceCount, 8);
        } else {
            windSpeed = rollDice(1, 20);
        }

        return windSpeed;
    }

    _determineWindEffects(windSpeed) {
        // Find applicable wind effect tier
        const tier = Object.entries(WIND_EFFECTS)
            .find(([speed, _]) => windSpeed <= parseInt(speed))
            ?.[1] || WIND_EFFECTS['75+'];

        return {
            landEffects: tier.land,
            seaEffects: tier.sea,
            airEffects: tier.air,
            battleEffects: tier.battle,
            movementModifier: tier.movement || 1,
            rangeModifier: tier.range || 1
        };
    }

    _calculateWindstormSeverity(windSpeed) {
        if (windSpeed >= 75) return 'catastrophic';
        if (windSpeed >= 60) return 'severe';
        if (windSpeed >= 45) return 'strong';
        return 'moderate';
    }

    _calculateStormEffects(windSpeed) {
        const effects = ['Visibility severely reduced'];
        
        if (windSpeed >= 50) {
            effects.push('Possible structural damage to buildings');
        }
        
        if (windSpeed >= 40) {
            effects.push('Small objects may become projectiles');
        }

        return effects;
    }

    _calculateBlowOffChance(windSpeed, creature) {
        // Base chance
        let chance = windSpeed - (creature.magicalFlight?.maxSpeed || 0);
        
        // Weight modifications
        const weightInPounds = creature.weight || 150; // Default to human weight
        chance -= Math.floor(weightInPounds / 100) * 5;
        
        // Light weight penalty
        if (weightInPounds < 100) {
            chance += Math.floor((100 - weightInPounds) / 5);
        }

        return Math.max(0, chance);
    }
}