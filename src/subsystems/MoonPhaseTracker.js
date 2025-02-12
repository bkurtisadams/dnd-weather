// Moon phase calculations 
import { MOON_PHASES } from '../constants/moon-phases.js';

/**
 * Handles tracking and calculating moon phases for Luna and Celene
 * in the World of Greyhawk setting
 */
export class MoonPhaseTracker {
    constructor(calendarManager) {
        this.calendarManager = calendarManager;
        
        // Luna: 28 day cycle
        this.lunaOrbitalPeriod = 28;
        
        // Celene: 91 day cycle
        this.celeneOrbitalPeriod = 91;
        
        // Known reference point for synchronizing cycles
        // Goodmonth (7th month) 15, Common Year 576
        this.referenceDate = {
            year: 576,
            month: 7,
            day: 15,
            lunaPhase: 'full',  // Luna was full
            celenePhase: 'new'  // Celene was new
        };
    }

    /**
     * Calculate current moon phases based on date
     * @param {Object} date Current date from calendar
     * @returns {Object} Current phases and effects of both moons
     */
    calculateCurrentPhases(date) {
        const daysSinceReference = this._calculateDaysSinceReference(date);
        
        const lunaPhase = this._calculateLunaPhase(daysSinceReference);
        const celenePhase = this._calculateCelenePhase(daysSinceReference);
        
        return {
            luna: {
                phase: lunaPhase,
                name: 'Luna',
                effects: this._getMoonEffects('luna', lunaPhase),
                visibility: this._calculateVisibility('luna', lunaPhase),
                lightLevel: this._calculateLightLevel('luna', lunaPhase)
            },
            celene: {
                phase: celenePhase,
                name: 'Celene',
                effects: this._getMoonEffects('celene', celenePhase),
                visibility: this._calculateVisibility('celene', celenePhase),
                lightLevel: this._calculateLightLevel('celene', celenePhase)
            },
            combined: this._calculateCombinedEffects(lunaPhase, celenePhase)
        };
    }

    /**
     * Get the next occurrence of a specific moon phase
     * @param {string} moon Which moon to check ('luna' or 'celene')
     * @param {string} targetPhase Desired phase
     * @param {Object} startDate Starting date to search from
     * @returns {Object} Date of next occurrence
     */
    getNextPhaseDate(moon, targetPhase, startDate) {
        const orbitalPeriod = moon === 'luna' ? this.lunaOrbitalPeriod : this.celeneOrbitalPeriod;
        const daysSinceReference = this._calculateDaysSinceReference(startDate);
        
        // Calculate current position in cycle
        const currentCycleDay = daysSinceReference % orbitalPeriod;
        
        // Find target phase position
        const targetDay = MOON_PHASES[targetPhase].cyclePosition * orbitalPeriod;
        
        // Calculate days until next occurrence
        let daysUntilPhase = targetDay - currentCycleDay;
        if (daysUntilPhase <= 0) {
            daysUntilPhase += orbitalPeriod;
        }
        
        return this._addDaysToDate(startDate, daysUntilPhase);
    }

    /**
     * Calculate whether current date is astrologically significant
     * @param {Object} date Current date
     * @returns {Object|null} Description of significance if any
     */
    checkAstrologicalSignificance(date) {
        const phases = this.calculateCurrentPhases(date);
        
        // Check for lunar conjunctions
        if (phases.luna.phase === phases.celene.phase) {
            return {
                type: 'conjunction',
                description: `Conjunction of Luna and Celene in ${phases.luna.phase} phase`,
                significance: 'Major astrological event'
            };
        }
        
        // Check for oppositions
        if (this._areOpposingPhases(phases.luna.phase, phases.celene.phase)) {
            return {
                type: 'opposition',
                description: 'Luna and Celene in opposition',
                significance: 'Time of magical amplification'
            };
        }
        
        // Check for individual moon special phases
        const lunaSignificance = this._checkIndividualSignificance('luna', phases.luna.phase, date);
        const celeneSignificance = this._checkIndividualSignificance('celene', phases.celene.phase, date);
        
        return lunaSignificance || celeneSignificance;
    }

    // Private helper methods
    _calculateDaysSinceReference(date) {
        // Use calendar manager to get total days between dates
        return this.calendarManager.getDaysBetweenDates(
            this.referenceDate,
            date
        );
    }

    _calculateLunaPhase(daysSinceReference) {
        const cyclePosition = (daysSinceReference % this.lunaOrbitalPeriod) / this.lunaOrbitalPeriod;
        return this._getCyclePhase(cyclePosition);
    }

    _calculateCelenePhase(daysSinceReference) {
        const cyclePosition = (daysSinceReference % this.celeneOrbitalPeriod) / this.celeneOrbitalPeriod;
        return this._getCyclePhase(cyclePosition);
    }

    _getCyclePhase(position) {
        // Find the phase whose cycle position is closest to the current position
        return Object.entries(MOON_PHASES)
            .reduce((closest, [phase, data]) => {
                const currentDiff = Math.abs(position - data.cyclePosition);
                const closestDiff = Math.abs(position - MOON_PHASES[closest].cyclePosition);
                return currentDiff < closestDiff ? phase : closest;
            });
    }

    _getMoonEffects(moon, phase) {
        const baseEffects = MOON_PHASES[phase].effects || [];
        
        // Add moon-specific effects
        if (moon === 'luna') {
            if (phase === 'full') {
                baseEffects.push('Increased lycanthrope activity');
            }
        } else if (moon === 'celene') {
            if (phase === 'new') {
                baseEffects.push('Enhanced divination magic');
            }
        }
        
        return baseEffects;
    }

    _calculateVisibility(moon, phase) {
        const baseVisibility = MOON_PHASES[phase].visibility;
        
        // Celene is dimmer than Luna
        if (moon === 'celene') {
            return Math.max(0, baseVisibility - 20);
        }
        
        return baseVisibility;
    }

    _calculateLightLevel(moon, phase) {
        const baseLight = MOON_PHASES[phase].lightLevel;
        
        // Celene provides less light than Luna
        if (moon === 'celene') {
            return Math.max(0, baseLight - 1);
        }
        
        return baseLight;
    }

    _calculateCombinedEffects(lunaPhase, celenePhase) {
        const effects = [];
        
        // Check for special combinations
        if (lunaPhase === 'full' && celenePhase === 'full') {
            effects.push('Maximum moonlight - Night treated as twilight');
            effects.push('Enhanced magic effects');
        } else if (lunaPhase === 'new' && celenePhase === 'new') {
            effects.push('Complete darkness');
            effects.push('Enhanced stealth and shadow magic');
        }
        
        // Calculate combined light level
        const combinedLight = this._calculateCombinedLight(lunaPhase, celenePhase);
        effects.push(`Combined light level: ${combinedLight}`);
        
        return effects;
    }

    _calculateCombinedLight(lunaPhase, celenePhase) {
        const lunaLight = MOON_PHASES[lunaPhase].lightLevel;
        const celeneLight = Math.max(0, MOON_PHASES[celenePhase].lightLevel - 1);
        
        return Math.min(5, lunaLight + celeneLight);
    }

    _areOpposingPhases(phase1, phase2) {
        const position1 = MOON_PHASES[phase1].cyclePosition;
        const position2 = MOON_PHASES[phase2].cyclePosition;
        
        const difference = Math.abs(position1 - position2);
        return Math.abs(difference - 0.5) < 0.1; // Within 10% of being opposite
    }

    _checkIndividualSignificance(moon, phase, date) {
        // Check for seasonal alignments
        const season = this.calendarManager.getSeason(date);
        
        if (moon === 'luna' && phase === 'full' && season === 'winter') {
            return {
                type: 'seasonal',
                description: "Luna's Long Night",
                significance: 'Extended period of full moonlight'
            };
        }
        
        if (moon === 'celene' && phase === 'new' && season === 'summer') {
            return {
                type: 'seasonal',
                description: "Celene's Dark Time",
                significance: 'Period of enhanced divination'
            };
        }
        
        return null;
    }

    _addDaysToDate(date, days) {
        return this.calendarManager.addDays(date, days);
    }
}