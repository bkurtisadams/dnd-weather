// Moon phase system tests 
import { MoonPhaseTracker } from '../src/subsystems/MoonPhaseTracker.js';
import { MOON_PHASES } from '../src/constants/moon-phases.js';
import { jest } from '@jest/globals';

describe('MoonPhaseTracker', () => {
    let moonPhaseTracker;
    let mockCalendarManager;

    beforeEach(() => {
        // Create mock calendar manager
        mockCalendarManager = {
            getDaysBetweenDates: jest.fn(),
            getSeason: jest.fn(),
            addDays: jest.fn()
        };

        moonPhaseTracker = new MoonPhaseTracker(mockCalendarManager);
    });

    describe('calculateCurrentPhases', () => {
        it('should calculate correct Luna phase for reference date', () => {
            // Setup reference date
            const referenceDate = {
                year: 576,
                month: 7,
                day: 15
            };

            mockCalendarManager.getDaysBetweenDates.mockReturnValue(0);

            const result = moonPhaseTracker.calculateCurrentPhases(referenceDate);

            expect(result.luna.phase).toBe('full');
        });

        it('should calculate correct Celene phase for reference date', () => {
            const referenceDate = {
                year: 576,
                month: 7,
                day: 15
            };

            mockCalendarManager.getDaysBetweenDates.mockReturnValue(0);

            const result = moonPhaseTracker.calculateCurrentPhases(referenceDate);

            expect(result.celene.phase).toBe('new');
        });

        it('should calculate Luna phase after one full cycle', () => {
            const date = {
                year: 576,
                month: 8,
                day: 12 // 28 days after reference
            };

            mockCalendarManager.getDaysBetweenDates.mockReturnValue(28);

            const result = moonPhaseTracker.calculateCurrentPhases(date);

            expect(result.luna.phase).toBe('full');
        });

        it('should calculate Celene phase after one full cycle', () => {
            const date = {
                year: 576,
                month: 10,
                day: 14 // 91 days after reference
            };

            mockCalendarManager.getDaysBetweenDates.mockReturnValue(91);

            const result = moonPhaseTracker.calculateCurrentPhases(date);

            expect(result.celene.phase).toBe('new');
        });

        it('should include correct effects for each moon', () => {
            mockCalendarManager.getDaysBetweenDates.mockReturnValue(0);

            const result = moonPhaseTracker.calculateCurrentPhases({});

            expect(result.luna.effects).toContain('Increased lycanthrope activity');
            expect(result.luna.effects.length).toBeGreaterThan(0);
            expect(result.celene.effects.length).toBeGreaterThan(0);
        });

        it('should calculate correct visibility values', () => {
            mockCalendarManager.getDaysBetweenDates.mockReturnValue(0);

            const result = moonPhaseTracker.calculateCurrentPhases({});

            // Celene should have lower visibility than Luna
            expect(result.celene.visibility).toBeLessThan(result.luna.visibility);
        });
    });

    describe('getNextPhaseDate', () => {
        it('should calculate next Luna full moon correctly', () => {
            const startDate = {
                year: 576,
                month: 7,
                day: 16
            };

            mockCalendarManager.getDaysBetweenDates.mockReturnValue(1);
            mockCalendarManager.addDays.mockReturnValue({
                year: 576,
                month: 8,
                day: 12
            });

            const result = moonPhaseTracker.getNextPhaseDate('luna', 'full', startDate);

            expect(mockCalendarManager.addDays).toHaveBeenCalledWith(startDate, 27);
        });

        it('should calculate next Celene new moon correctly', () => {
            const startDate = {
                year: 576,
                month: 7,
                day: 16
            };

            mockCalendarManager.getDaysBetweenDates.mockReturnValue(1);
            mockCalendarManager.addDays.mockReturnValue({
                year: 576,
                month: 10,
                day: 14
            });

            const result = moonPhaseTracker.getNextPhaseDate('celene', 'new', startDate);

            expect(mockCalendarManager.addDays).toHaveBeenCalledWith(startDate, 90);
        });
    });

    describe('checkAstrologicalSignificance', () => {
        it('should detect lunar conjunctions', () => {
            // Set up a date where both moons are full
            mockCalendarManager.getDaysBetweenDates.mockReturnValue(364); // One year after reference
            
            const result = moonPhaseTracker.checkAstrologicalSignificance({});

            expect(result.type).toBe('conjunction');
        });

        it('should detect lunar oppositions', () => {
            // Set up a date where moons are in opposition
            mockCalendarManager.getDaysBetweenDates.mockReturnValue(182); // Half year after reference
            
            const result = moonPhaseTracker.checkAstrologicalSignificance({});

            expect(result.type).toBe('opposition');
        });

        it('should detect seasonal significance', () => {
            mockCalendarManager.getDaysBetweenDates.mockReturnValue(0);
            mockCalendarManager.getSeason.mockReturnValue('winter');

            const result = moonPhaseTracker.checkAstrologicalSignificance({});

            expect(result.type).toBe('seasonal');
        });
    });

    describe('Combined Effects', () => {
        it('should calculate correct combined light levels', () => {
            // Set up full moon for both
            mockCalendarManager.getDaysBetweenDates.mockReturnValue(364);

            const result = moonPhaseTracker.calculateCurrentPhases({});

            expect(result.combined).toContain('Maximum moonlight - Night treated as twilight');
        });

        it('should handle complete darkness', () => {
            // Set up new moon for both
            mockCalendarManager.getDaysBetweenDates.mockReturnValue(378);

            const result = moonPhaseTracker.calculateCurrentPhases({});

            expect(result.combined).toContain('Complete darkness');
        });

        it('should calculate intermediate light levels', () => {
            // Set up different phases
            mockCalendarManager.getDaysBetweenDates.mockReturnValue(7);

            const result = moonPhaseTracker.calculateCurrentPhases({});

            expect(result.combined.some(effect => effect.includes('Combined light level'))).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle dates before reference date', () => {
            mockCalendarManager.getDaysBetweenDates.mockReturnValue(-28);

            const result = moonPhaseTracker.calculateCurrentPhases({});

            expect(result.luna.phase).toBeDefined();
            expect(result.celene.phase).toBeDefined();
        });

        it('should handle far future dates', () => {
            mockCalendarManager.getDaysBetweenDates.mockReturnValue(10000);

            const result = moonPhaseTracker.calculateCurrentPhases({});

            expect(result.luna.phase).toBeDefined();
            expect(result.celene.phase).toBeDefined();
        });

        it('should handle invalid phase queries gracefully', () => {
            expect(() => {
                moonPhaseTracker.getNextPhaseDate('luna', 'invalid_phase', {});
            }).toThrow();
        });
    });
});