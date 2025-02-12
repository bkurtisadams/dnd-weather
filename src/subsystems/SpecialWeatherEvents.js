// Special weather phenomena 
import { SPECIAL_WEATHER_EVENTS } from '../constants/special-weather-events.js';
import { TERRAIN_EFFECTS } from '../constants/terrain-effects.js';
import { rollDice } from '../utils/dice.js';

/**
 * Handles generation and effects of special weather events
 */
export class SpecialWeatherEvents {
    constructor(windSystem, precipitationHandler) {
        this.windSystem = windSystem;
        this.precipitationHandler = precipitationHandler;
    }

    /**
     * Check for and generate special weather events
     * @param {string} terrainType - Type of terrain
     * @param {Object} currentWeather - Current weather conditions
     * @returns {Object|null} Special event details if one occurs
     */
    checkForSpecialEvent(terrainType, currentWeather) {
        // Get terrain-specific events
        const terrainEffect = TERRAIN_EFFECTS[terrainType] || TERRAIN_EFFECTS.plains;
        const possibleEvents = terrainEffect.specialWeatherEvents || [];

        // Base chance roll
        const eventRoll = rollDice(1, 100);
        
        // Find matching event if any
        for (const event of possibleEvents) {
            if (eventRoll <= event.chance && this._checkEventConditions(event, currentWeather)) {
                return this._generateEventDetails(event, currentWeather);
            }
        }

        return null;
    }

    /**
     * Generate supernatural cause for special event
     * @param {Object} event - The special event
     * @returns {Object} Supernatural cause details
     */
    generateSuperNaturalCause(event) {
        const causeRoll = rollDice(1, 100);
        
        if (causeRoll <= 30) {
            return {
                type: 'elemental',
                details: this._generateElementalDetails(event)
            };
        } else if (causeRoll <= 60) {
            return {
                type: 'controlled_elemental',
                details: this._generateControlledElementalDetails(event)
            };
        } else if (causeRoll <= 90) {
            return {
                type: 'npc_monster',
                details: this._generateNPCDetails(event)
            };
        } else if (causeRoll <= 98) {
            return {
                type: 'planar_creature',
                details: this._generatePlanarCreatureDetails(event)
            };
        } else if (causeRoll === 99) {
            return {
                type: 'deity',
                details: this._generateDeityDetails(event)
            };
        } else {
            return {
                type: 'deity_battle',
                details: this._generateDeityBattleDetails(event)
            };
        }
    }

    /**
     * Calculate the duration of a special event
     * @param {Object} event - The special event
     * @param {Object} currentWeather - Current weather conditions
     * @returns {number} Duration in hours
     */
    calculateEventDuration(event, currentWeather) {
        const baseDuration = event.duration || { dice: '1d6' };
        const [count, sides] = baseDuration.dice.split('d').map(Number);
        let duration = rollDice(count, sides);

        // Apply modifiers based on conditions
        if (currentWeather.windSpeed > 30) {
            duration = Math.max(1, Math.floor(duration * 0.75));
        }

        if (currentWeather.precipitation && currentWeather.precipitation.type !== 'none') {
            duration = Math.floor(duration * 1.25);
        }

        return duration + (baseDuration.modifier || 0);
    }

    /**
     * Calculate immediate effects of a special event
     * @param {Object} event - The special event
     * @param {string} terrainType - Type of terrain
     * @returns {Array} List of immediate effects
     */
    calculateImmediateEffects(event, terrainType) {
        const effects = [...(event.immediateEffects || [])];

        // Add terrain-specific effects
        const terrainEffects = this._getTerrainSpecificEffects(event, terrainType);
        effects.push(...terrainEffects);

        return effects;
    }

    /**
     * Calculate ongoing effects of a special event
     * @param {Object} event - The special event
     * @returns {Array} List of ongoing effects
     */
    calculateOngoingEffects(event) {
        const effects = [...(event.ongoingEffects || [])];

        // Add any conditional effects
        if (event.conditions) {
            for (const condition of event.conditions) {
                if (this._checkCondition(condition)) {
                    effects.push(...condition.effects);
                }
            }
        }

        return effects;
    }

    // Private helper methods
    _checkEventConditions(event, currentWeather) {
        if (!event.conditions) return true;

        for (const condition of event.conditions) {
            // Check temperature conditions
            if (condition.minTemp && currentWeather.temperature < condition.minTemp) return false;
            if (condition.maxTemp && currentWeather.temperature > condition.maxTemp) return false;

            // Check wind conditions
            if (condition.minWind && currentWeather.windSpeed < condition.minWind) return false;
            if (condition.maxWind && currentWeather.windSpeed > condition.maxWind) return false;

            // Check precipitation conditions
            if (condition.requiresPrecipitation && 
                (!currentWeather.precipitation || currentWeather.precipitation.type === 'none')) {
                return false;
            }
        }

        return true;
    }

    _generateEventDetails(event, currentWeather) {
        const duration = this.calculateEventDuration(event, currentWeather);
        
        return {
            type: event.type,
            name: event.name,
            duration,
            area: this._calculateEventArea(event),
            immediateEffects: this.calculateImmediateEffects(event, currentWeather.terrain),
            ongoingEffects: this.calculateOngoingEffects(event),
            movement: event.movement,
            visibility: event.visibility,
            damage: this._calculateEventDamage(event, currentWeather)
        };
    }

    _calculateEventArea(event) {
        if (!event.area) return null;

        const [count, sides] = event.area.dice.split('d').map(Number);
        const baseArea = rollDice(count, sides);

        return {
            radius: baseArea + (event.area.modifier || 0),
            unit: event.area.unit || 'miles'
        };
    }

    _calculateEventDamage(event, currentWeather) {
        if (!event.damage) return null;

        const [count, sides] = event.damage.dice.split('d').map(Number);
        let damage = rollDice(count, sides);

        // Apply weather modifiers to damage
        if (currentWeather.windSpeed > 40) {
            damage = Math.floor(damage * 1.5);
        }

        return {
            amount: damage + (event.damage.modifier || 0),
            type: event.damage.type,
            frequency: event.damage.frequency || 'per round'
        };
    }

    _getTerrainSpecificEffects(event, terrainType) {
        const terrainEffect = TERRAIN_EFFECTS[terrainType];
        if (!terrainEffect || !terrainEffect.eventModifiers) return [];

        const modifier = terrainEffect.eventModifiers[event.type];
        return modifier ? modifier.effects : [];
    }

    _generateElementalDetails(event) {
        const elementalType = this._determineElementalType(event);
        const count = rollDice(1, 4);
        
        return {
            type: elementalType,
            count,
            size: this._determineElementalSize(count)
        };
    }

    _generateControlledElementalDetails(event) {
        const elementalDetails = this._generateElementalDetails(event);
        return {
            ...elementalDetails,
            controller: this._generateNPCDetails(event)
        };
    }

    _generateNPCDetails(event) {
        return {
            level: rollDice(1, 20),
            alignment: this._generateAlignment(),
            motivation: this._generateMotivation(event)
        };
    }

    _generatePlanarCreatureDetails(event) {
        const plane = this._determinePlaneOfOrigin(event);
        return {
            plane,
            type: this._generatePlanarCreatureType(plane),
            count: rollDice(1, 6)
        };
    }

    _generateDeityDetails(event) {
        return {
            domain: this._determineDeityDomain(event),
            manifestationType: this._generateManifestationType()
        };
    }

    _generateDeityBattleDetails(event) {
        return {
            deities: [
                this._generateDeityDetails(event),
                this._generateDeityDetails(event)
            ],
            cause: this._generateDeityConflictCause()
        };
    }

    _determineElementalType(event) {
        const types = ['air', 'earth', 'fire', 'water'];
        const index = rollDice(1, 4) - 1;
        return types[index];
    }

    _determineElementalSize(count) {
        if (count === 1) return 'greater';
        if (count === 2) return 'elder';
        return 'normal';
    }

    _generateAlignment() {
        const alignments = ['lawful good', 'neutral good', 'chaotic good', 
                          'lawful neutral', 'true neutral', 'chaotic neutral',
                          'lawful evil', 'neutral evil', 'chaotic evil'];
        const index = rollDice(1, 9) - 1;
        return alignments[index];
    }

    _generateMotivation(event) {
        const motivations = ['revenge', 'power', 'knowledge', 'protection', 'chaos'];
        const index = rollDice(1, 5) - 1;
        return motivations[index];
    }

    _determinePlaneOfOrigin(event) {
        const planes = ['Air', 'Earth', 'Fire', 'Water', 'Shadow', 'Positive', 'Negative'];
        const index = rollDice(1, 7) - 1;
        return planes[index];
    }

    _generatePlanarCreatureType(plane) {
        // Simplified for example - could be expanded with full creature tables
        return `${plane} Elemental`;
    }

    _determineDeityDomain(event) {
        const domains = ['Nature', 'Tempest', 'War', 'Trickery', 'Life', 'Death'];
        const index = rollDice(1, 6) - 1;
        return domains[index];
    }

    _generateManifestationType() {
        const types = ['avatar', 'sign', 'herald', 'direct intervention'];
        const index = rollDice(1, 4) - 1;
        return types[index];
    }

    _generateDeityConflictCause() {
        const causes = ['domain dispute', 'mortal followers', 'artifact', 'ancient grudge'];
        const index = rollDice(1, 4) - 1;
        return causes[index];
    }
}