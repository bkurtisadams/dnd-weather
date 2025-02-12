// Temperature calculation system 
// Import necessary constants
import { baselineData, terrainEffects } from '../constants';
import { evalDice } from '../utils/dice';

export class TemperatureCalculator {
    constructor() {
        this.recordTempDuration = 0;
        this.recordTempType = 'none';
    }

    /**
     * Calculate daily temperatures based on month, latitude, altitude, and terrain
     */
    calculateDailyTemperatures(month, latitude, altitude, terrain, season) {
        console.log(`Calculating temperatures for ${month}, lat: ${latitude}, alt: ${altitude}, terrain: ${terrain}`);
        
        // Get baseline data for the month
        const monthData = baselineData[month];
        if (!monthData) {
            throw new Error(`Invalid month: ${month}`);
        }

        // Step 1: Check for record temperatures
        const recordTemps = this.checkForRecordTemperatures(monthData.baseDailyTemp);
        let baseTemp = monthData.baseDailyTemp;
        if (recordTemps.isRecord) {
            baseTemp = recordTemps.adjustedTemp;
            this.recordTempType = recordTemps.type;
            this.recordTempDuration = recordTemps.duration;
        }

        // Step 2: Calculate latitude adjustment
        const latitudeAdjustment = this.calculateLatitudeAdjustment(latitude);
        baseTemp += latitudeAdjustment;

        // Step 3: Calculate altitude adjustment
        const altitudeAdjustment = this.calculateAltitudeAdjustment(altitude);
        baseTemp += altitudeAdjustment;

        // Step 4: Calculate daily high and low with terrain adjustments
        let dailyHigh = baseTemp;
        let dailyLow = baseTemp;

        // Handle Sylvan Forest special case
        if (terrain === "Forest, Sylvan") {
            const temps = this.calculateSylvanForestTemps(monthData, season, baseTemp);
            dailyHigh = temps.high;
            dailyLow = temps.low;
        } else {
            // Normal terrain adjustments
            const terrainData = terrainEffects[terrain];
            if (terrainData) {
                dailyHigh += evalDice(monthData.dailyHighAdj) + terrainData.temperatureAdjustment.day;
                dailyLow += evalDice(monthData.dailyLowAdj) + terrainData.temperatureAdjustment.night;
            } else {
                dailyHigh += evalDice(monthData.dailyHighAdj);
                dailyLow += evalDice(monthData.dailyLowAdj);
            }
        }

        return {
            high: Math.round(dailyHigh),
            low: Math.round(dailyLow),
            recordType: this.recordTempType,
            recordDuration: this.recordTempDuration
        };
    }

    /**
     * Check for record temperature events
     */
    checkForRecordTemperatures(baseTemp) {
        const roll = Math.floor(Math.random() * 100) + 1;
        console.log(`Rolling for record temperatures: ${roll}`);

        if (roll === 1) {
            return {
                isRecord: true,
                type: "Extreme record low",
                adjustedTemp: baseTemp - 30,
                duration: this.determineRecordDuration()
            };
        } else if (roll === 2) {
            return {
                isRecord: true,
                type: "Severe record low",
                adjustedTemp: baseTemp - 20,
                duration: this.determineRecordDuration()
            };
        } else if (roll >= 3 && roll <= 4) {
            return {
                isRecord: true,
                type: "Record low",
                adjustedTemp: baseTemp - 10,
                duration: this.determineRecordDuration()
            };
        } else if (roll >= 97 && roll <= 98) {
            return {
                isRecord: true,
                type: "Record high",
                adjustedTemp: baseTemp + 10,
                duration: this.determineRecordDuration()
            };
        } else if (roll === 99) {
            return {
                isRecord: true,
                type: "Severe record high",
                adjustedTemp: baseTemp + 20,
                duration: this.determineRecordDuration()
            };
        } else if (roll === 100) {
            return {
                isRecord: true,
                type: "Extreme record high",
                adjustedTemp: baseTemp + 30,
                duration: this.determineRecordDuration()
            };
        }

        return { isRecord: false };
    }

    /**
     * Calculate latitude-based temperature adjustment
     */
    calculateLatitudeAdjustment(latitude) {
        // Base temperature is calibrated for 40° latitude
        return (40 - latitude) * 2;
    }

    /**
     * Calculate altitude-based temperature adjustment
     */
    calculateAltitudeAdjustment(altitude) {
        // -3 degrees per 1000 feet of elevation
        return -Math.floor(altitude / 1000) * 3;
    }

    /**
     * Calculate special temperature adjustments for Sylvan Forest
     */
    calculateSylvanForestTemps(monthData, season, baseTemp) {
        let highAdj = 0;
        let lowAdj = 0;

        switch(season) {
            case 'Winter':
                lowAdj = 0.25 * evalDice(monthData.dailyLowAdj);
                highAdj = evalDice(monthData.dailyHighAdj);
                break;
            case 'Spring':
            case 'Autumn':
                highAdj = 0.25 * evalDice(monthData.dailyHighAdj);
                lowAdj = 0.5 * evalDice(monthData.dailyLowAdj);
                break;
            case 'Low Summer':
            case 'High Summer':
                highAdj = 0.5 * evalDice(monthData.dailyHighAdj);
                lowAdj = 0.5 * evalDice(monthData.dailyLowAdj);
                break;
        }

        return {
            high: Math.round(baseTemp + highAdj),
            low: Math.round(baseTemp + lowAdj)
        };
    }

    /**
     * Calculate wind chill effect
     */
    calculateWindChill(temp, windSpeed) {
        if (temp >= 35 || windSpeed < 5) {
            return temp; // No wind chill effect
        }

        // Find the closest wind speed row in the table
        const windSpeeds = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
        const closestWindSpeed = windSpeeds.reduce((prev, curr) => 
            Math.abs(curr - windSpeed) < Math.abs(prev - windSpeed) ? curr : prev
        );

        // Find the closest temperature column
        const temps = [35, 30, 25, 20, 15, 10, 5, 0, -5, -10, -15, -20];
        const closestTemp = temps.reduce((prev, curr) => 
            Math.abs(curr - temp) < Math.abs(prev - temp) ? curr : prev
        );

        // Get the wind chill from the table
        return this.getWindChillFromTable(closestWindSpeed, closestTemp);
    }

    /**
     * Determine duration of record temperatures
     */
    determineRecordDuration() {
        const roll = Math.floor(Math.random() * 20) + 1;
        if (roll === 1) return 1;
        if (roll <= 3) return 2;
        if (roll <= 10) return 3;
        if (roll <= 14) return 4;
        if (roll <= 17) return 5;
        if (roll <= 19) return 6;
        return 7;
    }
}

// Example usage:
// const calculator = new TemperatureCalculator();
// const temps = calculator.calculateDailyTemperatures('Fireseek', 35, 1000, 'Plains', 'Winter');
// console.log(temps);