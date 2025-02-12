// Constants index 
export { baselineData, calendarLabels } from './baseline-data';
export { terrainEffects } from './terrain-effects';
export { precipitationTable } from './precipitation-table';
export { highWindsTable, windChillTable } from './wind-effects';
export { moonPhases, lycanthropeActivity } from './moon-phases';
export { specialWeatherTable } from './special-weather-events';

// Weather type constants
export const WEATHER_TYPES = {
    CLEAR: 'clear',
    PARTLY_CLOUDY: 'partlyCloudy',
    CLOUDY: 'cloudy'
};

// Season constants
export const SEASONS = {
    WINTER: 'Winter',
    SPRING: 'Spring',
    LOW_SUMMER: 'Low Summer',
    HIGH_SUMMER: 'High Summer',
    AUTUMN: 'Autumn'
};

// Special weather event constants
export const SPECIAL_WEATHER = {
    EARTHQUAKE: 'Earthquake',
    TORNADO: 'Tornado',
    FLASH_FLOOD: 'Flash Flood',
    WINDSTORM: 'Windstorm',
    SANDSTORM: 'Sandstorm',
    AVALANCHE: 'Avalanche',
    VOLCANO: 'Volcano'
};

// Month constants
export const MONTHS = {
    NEEDFEST: 'Needfest',
    FIRESEEK: 'Fireseek',
    READYING: 'Readying',
    COLDEVEN: 'Coldeven',
    GROWFEST: 'Growfest',
    PLANTING: 'Planting',
    FLOCKTIME: 'Flocktime',
    WEALSUN: 'Wealsun',
    RICHFEST: 'Richfest',
    REAPING: 'Reaping',
    GOODMONTH: 'Goodmonth',
    HARVESTER: 'Harvester',
    BREWFEST: 'Brewfest',
    PATCHWALL: 'Patchwall',
    READYREAT: 'Ready\'reat',
    SUNSEBB: 'Sunsebb'
};

// Moon phase constants
export const MOON_PHASES = {
    NEW: 'New',
    WAXING_CRESCENT: 'Waxing Crescent',
    FIRST_QUARTER: '1st quarter',
    WAXING_GIBBOUS: 'Waxing Gibbous',
    FULL: 'Full',
    WANING_GIBBOUS: 'Waning Gibbous',
    LAST_QUARTER: '3rd quarter',
    WANING_CRESCENT: 'Waning Crescent'
};

// Week day constants
export const WEEKDAYS = {
    STARDAY: 'Starday',
    SUNDAY: 'Sunday',
    MOONDAY: 'Moonday',
    GODSDAY: 'Godsday',
    WATERDAY: 'Waterday',
    EARTHDAY: 'Earthday',
    FREEDAY: 'Freeday'
};

// System configuration constants
export const CONFIG = {
    DEFAULT_LATITUDE: 35,  // City of Greyhawk latitude
    MILES_PER_DEGREE: 70,  // Miles per degree of latitude
    DEFAULT_YEAR: 576,     // Common campaign starting year
    TEMPERATURE_UNITS: {
        FAHRENHEIT: 'F',
        CELSIUS: 'C'
    },
    WIND_SPEED_UNITS: {
        MPH: 'mph',
        KPH: 'kph'
    }
};

// Rainbow type constants
export const RAINBOW_TYPES = {
    NONE: 'None',
    SINGLE: 'Single rainbow',
    DOUBLE: 'Double rainbow (may be an omen)',
    TRIPLE: 'Triple rainbow (almost certainly an omen)',
    BIFROST: 'Bifrost bridge or clouds in the shape of rain deity',
    DEITY: 'Rain deity or servant in sky'
};