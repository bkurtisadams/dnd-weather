// Precipitation system tests 
import { PrecipitationHandler } from '../src/subsystems/PrecipitationHandler.js';
import { PRECIPITATION_TABLE } from '../src/constants/precipitation-table.js';
import { TERRAIN_EFFECTS } from '../src/constants/terrain-effects.js';
import { jest } from '@jest/globals';

// Mock the dice utility
jest.mock('../src/utils/dice.js', () => ({
    rollDice: jest.fn()
}));

import { rollDice } from '../src/utils/dice.js';

describe('PrecipitationHandler', () => {
    let precipitationHandler;
    let mockTemperatureCalculator;

    beforeEach(() => {
        // Reset mock between tests
        jest.clearAllMocks();
        
        mockTemperatureCalculator = {
            calculateTemperature: jest.fn()
        };
        
        precipitationHandler = new PrecipitationHandler(mockTemperatureCalculator);
    });

    describe('generatePrecipitation', () => {
        it('should return no precipitation when roll is above threshold', () => {
            rollDice.mockReturnValue(95);  // High roll
            
            const result = precipitationHandler.generatePrecipitation('plains', 65, 10);
            
            expect(result).toEqual({
                type: 'none',
                amount: 0,
                duration: 0,
                effects: []
            });
        });

        it('should apply terrain modifiers to precipitation chance', () => {
            rollDice.mockReturnValue(85);
            
            // Test jungle terrain which has +10% precipitation chance
            precipitationHandler.generatePrecipitation('jungle', 65, 10);
            
            // Verify roll was modified by terrain effect
            expect(rollDice).toHaveBeenCalledWith(1, 100);
        });

        it('should respect temperature requirements for precipitation types', () => {
            rollDice.mockReturnValue(20);  // Roll that would normally give snow
            
            const result = precipitationHandler.generatePrecipitation('plains', 75, 10);  // Too warm for snow
            
            // Should get rain instead of snow due to temperature
            expect(result.type).not.toContain('snow');
        });

        it('should respect terrain restrictions for precipitation types', () => {
            rollDice.mockReturnValue(95);  // Roll that would normally give monsoon
            
            const result = precipitationHandler.generatePrecipitation('desert', 65, 10);
            
            // Should not get monsoon in desert
            expect(result.type).not.toBe('monsoon');
        });
    });

    describe('calculateContinuation', () => {
        it('should end precipitation when continuation roll fails', () => {
            rollDice.mockReturnValue(100);  // High roll = no continuation
            
            const currentPrecip = {
                type: PRECIPITATION_TABLE.find(p => p.name === 'light rain'),
                amount: 1,
                duration: 4,
                effects: []
            };
            
            const result = precipitationHandler.calculateContinuation(currentPrecip);
            
            expect(result).toEqual({
                type: 'none',
                amount: 0,
                duration: 0,
                effects: []
            });
        });

        it('should move up precipitation table when roll is 1', () => {
            // Mock rolls for continuation check and change check
            rollDice
                .mockReturnValueOnce(50)  // Continue precipitation
                .mockReturnValueOnce(1);   // Move up table
            
            const currentPrecip = {
                type: PRECIPITATION_TABLE.find(p => p.name === 'heavy rain'),
                amount: 2,
                duration: 4,
                effects: []
            };
            
            const result = precipitationHandler.calculateContinuation(currentPrecip);
            
            // Should have moved up to light rain
            expect(result.type.name).toBe('light rain');
        });

        it('should move down precipitation table when roll is 10', () => {
            rollDice
                .mockReturnValueOnce(50)  // Continue precipitation
                .mockReturnValueOnce(10);  // Move down table
            
            const currentPrecip = {
                type: PRECIPITATION_TABLE.find(p => p.name === 'light rain'),
                amount: 1,
                duration: 4,
                effects: []
            };
            
            const result = precipitationHandler.calculateContinuation(currentPrecip);
            
            // Should have moved down to heavy rain
            expect(result.type.name).toBe('heavy rain');
        });
    });

    describe('checkForRainbow', () => {
        it('should not generate rainbow when precipitation has no rainbow chance', () => {
            const precip = {
                type: { name: 'heavy snow', rainbowChance: 0 }
            };
            
            const result = precipitationHandler.checkForRainbow(precip);
            
            expect(result).toBeNull();
        });

        it('should generate single rainbow most commonly', () => {
            rollDice
                .mockReturnValueOnce(10)   // Success on rainbow check
                .mockReturnValueOnce(50);  // Type roll in single rainbow range
            
            const precip = {
                type: { name: 'light rain', rainbowChance: 15 }
            };
            
            const result = precipitationHandler.checkForRainbow(precip);
            
            expect(result).toEqual({ type: 'single' });
        });

        it('should generate special rainbows on high rolls', () => {
            rollDice
                .mockReturnValueOnce(10)   // Success on rainbow check
                .mockReturnValueOnce(99);  // Bifrost roll
            
            const precip = {
                type: { name: 'light rain', rainbowChance: 15 }
            };
            
            const result = precipitationHandler.checkForRainbow(precip);
            
            expect(result).toEqual({
                type: 'bifrost',
                description: 'Bifrost bridge or clouds in shape of rain deity'
            });
        });
    });

    describe('Effect Calculation', () => {
        it('should include wind effects when speed is high enough', () => {
            rollDice.mockReturnValue(50);  // Mid-range roll
            
            const result = precipitationHandler.generatePrecipitation('plains', 65, 35);  // High wind
            
            expect(result.effects).toContain('High winds affecting precipitation');
        });

        it('should calculate correct visibility modifications', () => {
            rollDice
                .mockReturnValueOnce(25)   // Roll for heavy fog
                .mockReturnValueOnce(8)    // Duration
                .mockReturnValueOnce(0);   // Amount
            
            const result = precipitationHandler.generatePrecipitation('plains', 65, 10);
            
            expect(result.visibility).toBe('2 feet');
        });

        it('should calculate correct movement penalties', () => {
            rollDice
                .mockReturnValueOnce(25)   // Roll for heavy fog
                .mockReturnValueOnce(8)    // Duration
                .mockReturnValueOnce(0);   // Amount
            
            const result = precipitationHandler.generatePrecipitation('plains', 65, 10);
            
            expect(result.movement).toEqual({
                foot: 0.25,
                horse: 0.25,
                cart: 0.25
            });
        });
    });
});