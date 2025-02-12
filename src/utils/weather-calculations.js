// Weather calculation utilities
import { weatherPhenomena, rainbowEffects } from '../constants/precipitation-table.js';
import { rollDice } from './dice.js';

export class WeatherCalculator {
    static async determinePrecipitation(temperature) {
        const roll = await rollDice(100);
        
        for (const [key, phenomenon] of Object.entries(weatherPhenomena)) {
            if (roll >= phenomenon.diceRange[0] && roll <= phenomenon.diceRange[1]) {
                // Check temperature requirements
                if (phenomenon.temperature.max !== null && temperature > phenomenon.temperature.max) {
                    return this.determinePrecipitation(temperature); // Reroll if too warm
                }
                if (phenomenon.temperature.min !== null && temperature < phenomenon.temperature.min) {
                    return this.determinePrecipitation(temperature); // Reroll if too cold
                }
                return phenomenon;
            }
        }
        return null;
    }

    static async determineRainbow(weatherType) {
        if (weatherType.chanceRainbow === 0) return null;
        
        const roll = await rollDice(100);
        if (roll <= weatherType.chanceRainbow) {
            const rainbowRoll = await rollDice(100);
            for (const [key, effect] of Object.entries(rainbowEffects)) {
                if (rainbowRoll >= effect.range[0] && rainbowRoll <= effect.range[1]) {
                    return effect;
                }
            }
        }
        return null;
    }

    static async weatherContinues(weatherType) {
        const roll = await rollDice(100);
        if (roll <= weatherType.chanceContinuing) {
            const typeChangeRoll = await rollDice(10);
            switch(typeChangeRoll) {
                case 1: return "increase"; // Up one line on table
                case 10: return "decrease"; // Down one line on table
                default: return "same"; // No change
            }
        }
        return "stops";
    }

    static calculateMovementRate(weatherType, movementMode) {
        const movement = weatherType.precipitation.movement;
        if (typeof movement === "string") {
            return movement; // Handle cases like "1/4 (all)"
        }
        return movement[movementMode.toLowerCase()] || "normal";
    }

    static calculateTracking(weatherType, hours) {
        const tracking = weatherType.precipitation.tracking;
        if (tracking.includes("cum.")) {
            const penalty = parseInt(tracking);
            return penalty * hours;
        }
        return parseInt(tracking) || 0;
    }

    static calculateWindSpeed(weatherType) {
        const windSpeed = weatherType.precipitation.windSpeed;
        if (!windSpeed) return 0;
        
        // Handle dice notation like "4d10" or fixed values
        if (windSpeed.includes("d")) {
            const [count, sides] = windSpeed.split("d").map(Number);
            let speed = 0;
            for (let i = 0; i < count; i++) {
                speed += Math.floor(Math.random() * sides) + 1;
            }
            return speed;
        }
        return parseInt(windSpeed);
    }

    static isAllowedInTerrain(weatherType, terrain) {
        return !weatherType.restrictedTerrain.includes(terrain);
    }
}