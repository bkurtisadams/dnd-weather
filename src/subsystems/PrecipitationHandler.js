// Precipitation determination 
import { PRECIPITATION_TABLE } from '../constants/precipitation-table.js';
import { TERRAIN_EFFECTS } from '../constants/terrain-effects.js';
import { rollDice } from '../utils/dice.js';

/**
 * Handles precipitation generation and effects based on terrain and temperature
 */
export class PrecipitationHandler {
    constructor(temperatureCalculator) {
        this.temperatureCalculator = temperatureCalculator;
    }

    /**
     * Generate precipitation details based on terrain and current conditions
     * @param {string} terrainType - The type of terrain
     * @param {number} temperature - Current temperature in Fahrenheit
     * @param {number} windSpeed - Current wind speed in mph
     * @returns {Object} Precipitation details
     */
    generatePrecipitation(terrainType, temperature, windSpeed) {
        // Get terrain modifiers
        const terrainEffect = TERRAIN_EFFECTS[terrainType] || TERRAIN_EFFECTS.plains;
        
        // Roll for precipitation (d100)
        let precipRoll = rollDice(1, 100);
        
        // Apply terrain modifier to precipitation chance
        precipRoll += (terrainEffect.precipitationChance || 0);

        // If no precipitation occurs
        if (precipRoll > 100) {
            return {
                type: 'none',
                amount: 0,
                duration: 0,
                effects: []
            };
        }

        // Find appropriate precipitation type based on temperature and roll
        const precipType = this._determinePrecipitationType(precipRoll, temperature, terrainType);
        
        if (!precipType) {
            return {
                type: 'none',
                amount: 0,
                duration: 0,
                effects: []
            };
        }

        // Calculate duration and amount
        const duration = this._calculateDuration(precipType);
        const amount = this._calculateAmount(precipType);

        // Determine special effects
        const effects = this._determineEffects(precipType, windSpeed);

        return {
            type: precipType.name,
            amount,
            duration,
            effects,
            visibility: precipType.visibility,
            movement: precipType.movement,
            tracking: precipType.tracking,
            chanceOfGettingLost: precipType.chanceOfGettingLost
        };
    }

    /**
     * Calculate continuation of current precipitation
     * @param {Object} currentPrecipitation - Current precipitation details
     * @returns {Object} Updated precipitation details
     */
    calculateContinuation(currentPrecipitation) {
        const continuationRoll = rollDice(1, 100);
        
        if (continuationRoll <= currentPrecipitation.type.chanceToContinue) {
            // Roll for precipitation type change
            const changeRoll = rollDice(1, 10);
            
            if (changeRoll === 1) {
                // Move up one line on precipitation table
                const currentIndex = PRECIPITATION_TABLE.findIndex(p => p.name === currentPrecipitation.type.name);
                if (currentIndex > 0) {
                    const newType = PRECIPITATION_TABLE[currentIndex - 1];
                    return this._generateNewPrecipitation(newType);
                }
            } else if (changeRoll === 10) {
                // Move down one line on precipitation table
                const currentIndex = PRECIPITATION_TABLE.findIndex(p => p.name === currentPrecipitation.type.name);
                if (currentIndex < PRECIPITATION_TABLE.length - 1) {
                    const newType = PRECIPITATION_TABLE[currentIndex + 1];
                    return this._generateNewPrecipitation(newType);
                }
            }
            
            // No change in type, just generate new duration
            return {
                ...currentPrecipitation,
                duration: this._calculateDuration(currentPrecipitation.type)
            };
        }

        // Precipitation ends
        return {
            type: 'none',
            amount: 0,
            duration: 0,
            effects: []
        };
    }

    /**
     * Check for rainbow occurrence
     * @param {Object} precipitation - Current precipitation details
     * @returns {Object} Rainbow details if one occurs
     */
    checkForRainbow(precipitation) {
        if (!precipitation.type.rainbowChance) return null;

        const rainbowRoll = rollDice(1, 100);
        if (rainbowRoll <= precipitation.type.rainbowChance) {
            const rainbowTypeRoll = rollDice(1, 100);
            
            if (rainbowTypeRoll <= 89) return { type: 'single' };
            if (rainbowTypeRoll <= 95) return { type: 'double', isOmen: true };
            if (rainbowTypeRoll <= 98) return { type: 'triple', isOmen: true };
            if (rainbowTypeRoll === 99) return { type: 'bifrost', description: 'Bifrost bridge or clouds in shape of rain deity' };
            return { type: 'deity', description: 'Rain deity or servant in sky' };
        }

        return null;
    }

    // Private helper methods
    _determinePrecipitationType(roll, temperature, terrainType) {
        const validTypes = PRECIPITATION_TABLE.filter(type => {
            // Check temperature requirements
            if (type.minTemp && temperature < type.minTemp) return false;
            if (type.maxTemp && temperature > type.maxTemp) return false;
            
            // Check terrain restrictions
            if (type.restrictedTerrains && type.restrictedTerrains.includes(terrainType)) return false;
            
            return true;
        });

        return validTypes.find(type => roll <= type.chance);
    }

    _calculateDuration(precipType) {
        if (!precipType.duration) return 0;
        
        const [count, sides] = precipType.duration.dice.split('d').map(Number);
        return rollDice(count, sides) + (precipType.duration.modifier || 0);
    }

    _calculateAmount(precipType) {
        if (!precipType.amount) return 0;
        
        const [count, sides] = precipType.amount.dice.split('d').map(Number);
        return rollDice(count, sides) + (precipType.amount.modifier || 0);
    }

    _determineEffects(precipType, windSpeed) {
        const effects = [];
        
        // Add base effects from precipitation type
        if (precipType.effects) {
            effects.push(...precipType.effects);
        }

        // Add wind-related effects
        if (windSpeed >= 30) {
            effects.push('High winds affecting precipitation');
        }

        return effects;
    }

    _generateNewPrecipitation(precipType) {
        return {
            type: precipType,
            amount: this._calculateAmount(precipType),
            duration: this._calculateDuration(precipType),
            effects: this._determineEffects(precipType, 0), // Wind speed would need to be passed in
            visibility: precipType.visibility,
            movement: precipType.movement,
            tracking: precipType.tracking,
            chanceOfGettingLost: precipType.chanceOfGettingLost
        };
    }
}