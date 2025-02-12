// Monthly baseline temperatures and weather data for Greyhawk calendar
export const baselineData = {
    "Needfest": {
        baseDailyTemp: 30,
        dailyHighAdj: "d10",
        dailyLowAdj: "-d20",
        chanceOfPrecip: 46,
        skyConditions: { clear: [1, 23], partlyCloudy: [24, 50], cloudy: [51, 100] },
        sunrise: "7:10",
        sunset: "4:35"
    },
    "Fireseek": {
        baseDailyTemp: 32,
        dailyHighAdj: "d10",
        dailyLowAdj: "-d20",
        chanceOfPrecip: 46,
        skyConditions: { clear: [1, 23], partlyCloudy: [24, 50], cloudy: [51, 100] },
        sunrise: "7:21",
        sunset: "5:01"
    },
    "Readying": {
        baseDailyTemp: 34,
        dailyHighAdj: "d6+4",
        dailyLowAdj: "-(d10+4)",
        chanceOfPrecip: 40,
        skyConditions: { clear: [1, 25], partlyCloudy: [26, 50], cloudy: [51, 100] },
        sunrise: "6:55",
        sunset: "5:36"
    },
    "Coldeven": {
        baseDailyTemp: 42,
        dailyHighAdj: "d8+4",
        dailyLowAdj: "-(d10+4)",
        chanceOfPrecip: 44,
        skyConditions: { clear: [1, 27], partlyCloudy: [28, 54], cloudy: [55, 100] },
        sunrise: "6:12",
        sunset: "6:09"
    },
    "Growfest": {
        baseDailyTemp: 47,
        dailyHighAdj: "d8+5",
        dailyLowAdj: "-(d8+5)",
        chanceOfPrecip: 43,
        skyConditions: { clear: [1, 23], partlyCloudy: [24, 55], cloudy: [56, 100] },
        sunrise: "5:48",
        sunset: "6:24"
    },
    "Planting": {
        baseDailyTemp: 52,
        dailyHighAdj: "d10+6",
        dailyLowAdj: "-(d8+4)",
        chanceOfPrecip: 42,
        skyConditions: { clear: [1, 20], partlyCloudy: [21, 55], cloudy: [56, 100] },
        sunrise: "5:24",
        sunset: "6:39"
    },
    "Flocktime": {
        baseDailyTemp: 63,
        dailyHighAdj: "d10+6",
        dailyLowAdj: "-(d10+6)",
        chanceOfPrecip: 42,
        skyConditions: { clear: [1, 20], partlyCloudy: [21, 53], cloudy: [54, 100] },
        sunrise: "4:45",
        sunset: "7:10"
    },
    "Wealsun": {
        baseDailyTemp: 71,
        dailyHighAdj: "d8+8",
        dailyLowAdj: "-(d6+6)",
        chanceOfPrecip: 36,
        skyConditions: { clear: [1, 20], partlyCloudy: [21, 60], cloudy: [61, 100] },
        sunrise: "4:32",
        sunset: "7:32"
    },
    "Richfest": {
        baseDailyTemp: 74,
        dailyHighAdj: "d6+6",
        dailyLowAdj: "-(d6+6)",
        chanceOfPrecip: 34,
        skyConditions: { clear: [1, 22], partlyCloudy: [23, 61], cloudy: [62, 100] },
        sunrise: "4:38",
        sunset: "7:30"
    },
    "Reaping": {
        baseDailyTemp: 77,
        dailyHighAdj: "d6+4",
        dailyLowAdj: "-(d6+6)",
        chanceOfPrecip: 33,
        skyConditions: { clear: [1, 22], partlyCloudy: [23, 62], cloudy: [63, 100] },
        sunrise: "4:45",
        sunset: "7:29"
    },
    "Goodmonth": {
        baseDailyTemp: 75,
        dailyHighAdj: "d4+6",
        dailyLowAdj: "-(d6+6)",
        chanceOfPrecip: 33,
        skyConditions: { clear: [1, 25], partlyCloudy: [26, 60], cloudy: [61, 100] },
        sunrise: "5:13",
        sunset: "6:57"
    },
    "Harvester": {
        baseDailyTemp: 68,
        dailyHighAdj: "d8+6",
        dailyLowAdj: "-(d8+6)",
        chanceOfPrecip: 33,
        skyConditions: { clear: [1, 33], partlyCloudy: [34, 54], cloudy: [55, 100] },
        sunrise: "5:42",
        sunset: "6:10"
    },
    "Brewfest": {
        baseDailyTemp: 62,
        dailyHighAdj: "d8+6",
        dailyLowAdj: "-(d8+6)",
        chanceOfPrecip: 35,
        skyConditions: { clear: [1, 34], partlyCloudy: [35, 57], cloudy: [58, 100] },
        sunrise: "5:57",
        sunset: "5:46"
    },
    "Patchwall": {
        baseDailyTemp: 57,
        dailyHighAdj: "d10+5",
        dailyLowAdj: "-(d10+5)",
        chanceOfPrecip: 36,
        skyConditions: { clear: [1, 35], partlyCloudy: [36, 60], cloudy: [61, 100] },
        sunrise: "6:12",
        sunset: "5:21"
    },
    "Ready'reat": {
        baseDailyTemp: 46,
        dailyHighAdj: "d10+6",
        dailyLowAdj: "-(d10+4)",
        chanceOfPrecip: 40,
        skyConditions: { clear: [1, 20], partlyCloudy: [21, 50], cloudy: [51, 100] },
        sunrise: "6:46",
        sunset: "4:45"
    },
    "Sunsebb": {
        baseDailyTemp: 33,
        dailyHighAdj: "d8+5",
        dailyLowAdj: "-d20",
        chanceOfPrecip: 43,
        skyConditions: { clear: [1, 25], partlyCloudy: [26, 50], cloudy: [51, 100] },
        sunrise: "7:19",
        sunset: "4:36"
    }
};

// Calendar labels with seasonal information
export const calendarLabels = {
    "Needfest": "Needfest (Midwinter Festival)",
    "Fireseek": "Fireseek (Winter)",
    "Readying": "Readying (Spring)",
    "Coldeven": "Coldeven (Spring)",
    "Growfest": "Growfest (Spring Festival)",
    "Planting": "Planting (Low Summer)",
    "Flocktime": "Flocktime (Low Summer)",
    "Wealsun": "Wealsun (Low Summer)",
    "Richfest": "Richfest (Midsummer Festival)",
    "Reaping": "Reaping (High Summer)",
    "Goodmonth": "Goodmonth (High Summer)",
    "Harvester": "Harvester (High Summer)",
    "Brewfest": "Brewfest (Autumn Festival)",
    "Patchwall": "Patchwall (Autumn)",
    "Ready'reat": "Ready'reat (Autumn)",
    "Sunsebb": "Sunsebb (Winter)"
};

// Moon phases data
export const moonPhases = {
    luna: {
        firstQuarter: {
            positions: {
                "Fireseek-Coldeven": "4th day of month and 4th night of Growfest",
                "Planting-Wealsun": "4th day of month and 4th night of Richfest"
            }
        },
        full: {
            positions: {
                "Fireseek-Coldeven": "11th day of month",
                "Planting-Wealsun": "11th day of month"
            }
        },
        threeQuarter: {
            positions: {
                "Fireseek-Coldeven": "18th day of month",
                "Planting-Wealsun": "18th day of month"
            }
        },
        new: {
            positions: {
                "Fireseek-Coldeven": "25th day of month and 4th night of Needfest",
                "Planting-Wealsun": "25th day of month"
            }
        }
    },
    celene: {
        full: {
            positions: {
                "Fireseek-Coldeven": "Mid-Needfest and Mid-Growfest",
                "Planting-Wealsun": "Mid-Growfest and Mid-Richfest"
            }
        },
        threeQuarter: {
            positions: {
                "Fireseek-Coldeven": "19th of Fireseek",
                "Planting-Wealsun": "19th of Planting"
            }
        },
        new: {
            positions: {
                "Fireseek-Coldeven": "11th of Readying",
                "Planting-Wealsun": "11th of Flocktime"
            }
        },
        firstQuarter: {
            positions: {
                "Fireseek-Coldeven": "4th of Coldeven",
                "Planting-Wealsun": "4th of Wealsun"
            }
        }
    }
};