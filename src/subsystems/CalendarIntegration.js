// Simple Calendar integration 
/**
 * Handles integration with Simple Calendar module and provides
 * calendar-related utilities for the weather system
 */
export class CalendarIntegration {
    constructor() {
        this.simpleCalendar = null;
        this.initialized = false;
    }

    /**
     * Initialize the calendar integration
     * @returns {boolean} Whether initialization was successful
     */
    async initialize() {
        try {
            // Wait for Simple Calendar to be ready
            await this._waitForSimpleCalendar();
            
            // Get Simple Calendar API
            this.simpleCalendar = SimpleCalendar.api;
            
            if (!this.simpleCalendar) {
                console.error('DnD Weather | Simple Calendar API not found');
                return false;
            }

            // Register for calendar update events
            this.simpleCalendar.addEventListener(
                SimpleCalendar.Hooks.DateTimeChanged,
                this._handleDateChange.bind(this)
            );

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('DnD Weather | Failed to initialize calendar integration:', error);
            return false;
        }
    }

    /**
     * Get the current date
     * @returns {Object} Current date details
     */
    getCurrentDate() {
        if (!this.initialized) return null;

        const currentDate = this.simpleCalendar.getCurrentDay();
        return this._formatDate(currentDate);
    }

    /**
     * Get the number of days between two dates
     * @param {Object} date1 First date
     * @param {Object} date2 Second date
     * @returns {number} Number of days between dates
     */
    getDaysBetweenDates(date1, date2) {
        if (!this.initialized) return 0;

        const timestamp1 = this.simpleCalendar.dateToTimestamp(this._toSimpleCalendarDate(date1));
        const timestamp2 = this.simpleCalendar.dateToTimestamp(this._toSimpleCalendarDate(date2));

        return Math.floor((timestamp2 - timestamp1) / (this.simpleCalendar.const.SECONDS_PER_DAY));
    }

    /**
     * Add days to a date
     * @param {Object} date Starting date
     * @param {number} days Number of days to add
     * @returns {Object} Resulting date
     */
    addDays(date, days) {
        if (!this.initialized) return date;

        const scDate = this._toSimpleCalendarDate(date);
        const timestamp = this.simpleCalendar.dateToTimestamp(scDate);
        const newTimestamp = timestamp + (days * this.simpleCalendar.const.SECONDS_PER_DAY);
        const newDate = this.simpleCalendar.timestampToDate(newTimestamp);

        return this._formatDate(newDate);
    }

    /**
     * Get the current season
     * @returns {string} Current season name
     */
    getCurrentSeason() {
        if (!this.initialized) return 'spring';

        const currentDate = this.simpleCalendar.getCurrentDay();
        return this._determineSeason(currentDate);
    }

    /**
     * Get the season for a specific date
     * @param {Object} date Date to check
     * @returns {string} Season name
     */
    getSeason(date) {
        if (!this.initialized) return 'spring';

        const scDate = this._toSimpleCalendarDate(date);
        return this._determineSeason(scDate);
    }

    /**
     * Check if current date is a holiday
     * @returns {Object|null} Holiday details if current date is a holiday
     */
    checkForHoliday() {
        if (!this.initialized) return null;

        const currentDate = this.simpleCalendar.getCurrentDay();
        const notes = this.simpleCalendar.getNotes(currentDate);

        for (const note of notes) {
            if (note.categories.some(cat => cat.name.toLowerCase() === 'holiday')) {
                return {
                    name: note.title,
                    description: note.content,
                    type: 'holiday'
                };
            }
        }

        return null;
    }

    /**
     * Get sunrise and sunset times for current date
     * @returns {Object} Sunrise and sunset times
     */
    getDaylightHours() {
        if (!this.initialized) return { sunrise: '6:00', sunset: '18:00' };

        const currentDate = this.simpleCalendar.getCurrentDay();
        return this._calculateDaylightHours(currentDate);
    }

    // Private helper methods
    async _waitForSimpleCalendar() {
        // Wait for up to 30 seconds for Simple Calendar to be ready
        for (let i = 0; i < 30; i++) {
            if (window.SimpleCalendar) return;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        throw new Error('Simple Calendar not found after 30 seconds');
    }

    _handleDateChange(data) {
        // Emit our own event for weather system components
        const event = new CustomEvent('weatherDateChanged', {
            detail: {
                date: this._formatDate(data.date),
                diff: data.diff
            }
        });
        document.dispatchEvent(event);
    }

    _formatDate(scDate) {
        return {
            year: scDate.year,
            month: scDate.month,
            day: scDate.day,
            weekday: scDate.weekday,
            season: this._determineSeason(scDate)
        };
    }

    _toSimpleCalendarDate(date) {
        return {
            year: date.year,
            month: date.month,
            day: date.day,
            hour: 12, // Default to noon for consistent day/night calculations
            minute: 0,
            second: 0
        };
    }

    _determineSeason(date) {
        // Get configured seasons from Simple Calendar
        const seasons = this.simpleCalendar.seasonsConfig;
        
        // Find current season based on date
        for (const season of seasons) {
            if (this.simpleCalendar.dateInSeason(date, season)) {
                return season.name.toLowerCase();
            }
        }

        // Default to spring if no season found
        return 'spring';
    }

    _calculateDaylightHours(date) {
        const seasonData = {
            spring: { sunrise: '6:00', sunset: '18:00' },
            summer: { sunrise: '5:00', sunset: '19:00' },
            autumn: { sunrise: '6:00', sunset: '18:00' },
            winter: { sunrise: '7:00', sunset: '17:00' }
        };

        const season = this._determineSeason(date);
        return seasonData[season] || seasonData.spring;
    }

    /**
     * Get latitude for the current campaign setting
     * For Greyhawk, this is roughly equivalent to Earth's temperate zones
     * @returns {number} Approximate latitude
     */
    getLatitude() {
        // Default to roughly temperate zone latitude
        return 45;
    }

    /**
     * Check if the current date is during daytime
     * @returns {boolean} Whether it's currently daytime
     */
    isDaytime() {
        if (!this.initialized) return true;

        const currentTime = this.simpleCalendar.getCurrentTime();
        const daylight = this.getDaylightHours();

        // Convert times to minutes for comparison
        const currentMinutes = this._timeToMinutes(currentTime);
        const sunriseMinutes = this._timeToMinutes(daylight.sunrise);
        const sunsetMinutes = this._timeToMinutes(daylight.sunset);

        return currentMinutes >= sunriseMinutes && currentMinutes < sunsetMinutes;
    }

    _timeToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return (hours * 60) + minutes;
    }
}