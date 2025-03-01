// Updated CalendarIntegration.js
export class CalendarIntegration {
    constructor(simpleCalendar) {
        this.simpleCalendar = simpleCalendar?.api || null;
        this.initialized = false;
    }

    /**
     * Initialize the calendar integration
     * @returns {boolean} Whether initialization was successful
     */
    async initialize() {
        try {
            if (!this.simpleCalendar) {
                console.error('DnD Weather | Simple Calendar API not provided to constructor');
                return false;
            }

            // Log available methods for debugging
            console.log('DnD Weather | Simple Calendar API methods:', 
                Object.getOwnPropertyNames(this.simpleCalendar)
                    .filter(p => typeof this.simpleCalendar[p] === 'function')
                    .join(', '));
            
            // Check if we have the necessary methods
            if (!this.hasRequiredMethods()) {
                console.error('DnD Weather | Simple Calendar API is missing required methods');
                return false;
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('DnD Weather | Failed to initialize calendar integration:', error);
            return false;
        }
    }

    /**
     * Check if the API has all required methods
     * @returns {boolean} Whether all required methods are available
     */
    hasRequiredMethods() {
        const requiredMethods = [
            'getCurrentDate',
            'dateToTimestamp',
            'timestampToDate'
        ];
        
        for (const method of requiredMethods) {
            if (typeof this.simpleCalendar[method] !== 'function') {
                console.error(`DnD Weather | Simple Calendar API missing method: ${method}`);
                return false;
            }
        }
        
        return true;
    }

    /**
     * Get the current date
     * @returns {Object} Current date details
     */
    getCurrentDate() {
        if (!this.initialized) return null;

        try {
            const currentDate = this.simpleCalendar.getCurrentDate();
            return currentDate;
        } catch (error) {
            console.error('DnD Weather | Error getting current date:', error);
            return null;
        }
    }

    /**
     * Convert date to timestamp
     * @param {Object} date Date object
     * @returns {number} Timestamp
     */
    dateToTimestamp(date) {
        if (!this.initialized) return 0;
        
        try {
            return this.simpleCalendar.dateToTimestamp(date);
        } catch (error) {
            console.error('DnD Weather | Error converting date to timestamp:', error);
            return 0;
        }
    }

    /**
     * Convert timestamp to date
     * @param {number} timestamp Timestamp
     * @returns {Object} Date object
     */
    timestampToDate(timestamp) {
        if (!this.initialized) return null;
        
        try {
            return this.simpleCalendar.timestampToDate(timestamp);
        } catch (error) {
            console.error('DnD Weather | Error converting timestamp to date:', error);
            return null;
        }
    }

    /**
     * Get the current season
     * @returns {string} Current season name
     */
    getCurrentSeason() {
        if (!this.initialized) return 'spring';

        try {
            const currentDate = this.getCurrentDate();
            
            // Try to get season from API if available
            if (typeof this.simpleCalendar.getSeason === 'function') {
                const season = this.simpleCalendar.getSeason(currentDate);
                return season.toLowerCase();
            }
            
            // Fallback to simple month-based seasons
            return this._getSeasonByMonth(currentDate);
        } catch (error) {
            console.error('DnD Weather | Error getting current season:', error);
            return 'spring';
        }
    }

    /**
     * Simple fallback method to determine season by month
     * @param {Object} date Date object
     * @returns {string} Season name
     */
    _getSeasonByMonth(date) {
        // Implement a simple mapping of months to seasons based on your calendar
        // This is a fallback method for when the API doesn't provide season info
        const monthIndex = date.month || 0;
        
        if (monthIndex >= 0 && monthIndex <= 2) return 'winter';
        if (monthIndex >= 3 && monthIndex <= 5) return 'spring';
        if (monthIndex >= 6 && monthIndex <= 8) return 'summer';
        if (monthIndex >= 9 && monthIndex <= 11) return 'autumn';
        
        return 'spring';
    }

    /**
     * Calculate the end time for a weather event
     * @param {number} durationHours Duration in hours
     * @returns {Object} End date/time
     */
    calculateWeatherEndTime(durationHours) {
        if (!this.initialized) return null;
        
        try {
            // Get current date/time
            const currentDate = this.getCurrentDate();
            
            // Calculate seconds from hours
            const totalSeconds = durationHours * 3600;
            
            // Get current timestamp
            const currentTimestamp = this.dateToTimestamp(currentDate);
            
            // Add duration to timestamp
            const endTimestamp = currentTimestamp + totalSeconds;
            
            // Convert back to date
            return this.timestampToDate(endTimestamp);
        } catch (error) {
            console.error('DnD Weather | Error calculating end time:', error);
            return null;
        }
    }
}