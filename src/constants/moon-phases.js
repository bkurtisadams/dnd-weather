// Moon phase data 
export const moonPhases = {
    Luna: {
        "Needfest": {4: "New"},
        "Fireseek": {1: "Waxing Crescent", 4: "1st quarter", 7: "Waxing Gibbous", 11: "Full", 14: "Waning Gibbous", 18: "3rd quarter", 21: "Waning Crescent", 25: "New"},
        "Readying": {1: "Waxing Crescent", 4: "1st quarter", 7: "Waxing Gibbous", 11: "Full", 14: "Waning Gibbous", 18: "3rd quarter", 21: "Waning Crescent", 25: "New"},
        "Coldeven": {1: "Waxing Crescent", 4: "1st quarter", 7: "Waxing Gibbous", 11: "Full", 14: "Waning Gibbous", 18: "3rd quarter", 21: "Waning Crescent", 25: "New"},
        "Growfest": {1: "Waxing Crescent", 4: "1st quarter", 7: "Waxing Gibbous"},
        "Planting": {1: "Waning Crescent", 4: "Full", 7: "Waning Gibbous", 11: "3rd quarter", 14: "Waning Crescent", 18: "New", 21: "Waxing Crescent", 25: "1st quarter", 28: "Waxing Gibbous"},
        "Flocktime": {1: "Waning Crescent", 4: "Full", 7: "Waning Gibbous", 11: "3rd quarter", 14: "Waning Crescent", 18: "New", 21: "Waxing Crescent", 25: "1st quarter", 28: "Waxing Gibbous"},
        "Wealsun": {1: "Waning Crescent", 4: "Full", 7: "Waning Gibbous", 11: "3rd quarter", 14: "Waning Crescent", 18: "New", 21: "Waxing Crescent", 25: "1st quarter", 28: "Waxing Gibbous"},
        "Richfest": {1: "Waxing Gibbous", 4: "Full"},
        "Reaping": {1: "Waning Gibbous", 4: "3rd quarter", 7: "Waning Crescent", 11: "New", 14: "Waxing Crescent", 18: "1st quarter", 21: "Waxing Gibbous", 25: "Full", 28: "Waning Gibbous"},
        "Goodmonth": {1: "Waning Gibbous", 4: "3rd quarter", 7: "Waning Crescent", 11: "New", 14: "Waxing Crescent", 18: "1st quarter", 21: "Waxing Gibbous", 25: "Full", 28: "Waning Gibbous"},
        "Harvester": {1: "Waning Gibbous", 4: "3rd quarter", 7: "Waning Crescent", 11: "New", 14: "Waxing Crescent", 18: "1st quarter", 21: "Waxing Gibbous", 25: "Full", 28: "Waning Gibbous"},
        "Brewfest": {1: "Waning Crescent", 4: "3rd quarter", 7: "Waning Gibbous"},
        "Patchwall": {1: "Waning Crescent", 4: "New", 7: "Waxing Crescent", 11: "1st quarter", 14: "Waxing Gibbous", 18: "Full", 21: "Waning Gibbous", 25: "3rd quarter", 28: "Waning Crescent"},
        "Ready'reat": {1: "Waning Crescent", 4: "New", 7: "Waxing Crescent", 11: "1st quarter", 14: "Waxing Gibbous", 18: "Full", 21: "Waning Gibbous", 25: "3rd quarter", 28: "Waning Crescent"},
        "Sunsebb": {1: "Waning Crescent", 4: "New", 7: "Waxing Crescent", 11: "1st quarter", 14: "Waxing Gibbous", 18: "Full", 21: "Waning Gibbous", 25: "3rd quarter", 28: "Waning Crescent"}
    },
    Celene: {
        "Needfest": {4: "Full"},
        "Fireseek": {19: "3rd quarter"},
        "Readying": {11: "New"},
        "Coldeven": {4: "1st quarter"},
        "Growfest": {4: "Full"},
        "Planting": {19: "3rd quarter"},
        "Flocktime": {11: "New"},
        "Wealsun": {4: "1st quarter"},
        "Richfest": {4: "Full"},
        "Reaping": {19: "3rd quarter"},
        "Goodmonth": {11: "New"},
        "Harvester": {4: "1st quarter"},
        "Brewfest": {4: "Full"},
        "Patchwall": {19: "3rd quarter"},
        "Ready'reat": {11: "New"},
        "Sunsebb": {4: "1st quarter"}
    }
};

// Lookup tables for lycanthrope activity based on moon phases
export const lycanthropeActivity = {
    both_full: "Maximum",
    luna_full: "Heightened",
    celene_full: "Heightened",
    midsummer: "Maximum",  // Special case for Richfest 4
    normal: "Normal"
};