// Combined precipitation occurrence and standard weather effects
export const weatherPhenomena = {
    "blizzard-heavy": {
        diceRange: [1, 2],
        type: "Blizzard, heavy",
        temperature: {
            min: null,
            max: 10
        },
        chanceContinuing: 5,
        chanceRainbow: 0,
        restrictedTerrain: ["Desert"],
        precipitation: {
            amount: "2d10+10",
            duration: "3d8 hours",
            movement: {
                foot: "1/8",
                horse: "1/4",
                cart: "no"
            },
            vision: {
                normal: "2' radius",
                infraUltra: "No"
            },
            tracking: "No",
            chanceLost: "+50%",
            windSpeed: "6d8+40"
        },
        notes: "Snowdrifts of up to 10' per hour may accumulate against buildings, walls, etc."
    },
    "blizzard": {
        diceRange: [3, 5],
        type: "Blizzard",
        temperature: {
            min: null,
            max: 20
        },
        chanceContinuing: 10,
        chanceRainbow: 0,
        restrictedTerrain: ["Desert"],
        precipitation: {
            amount: "2d8+8",
            duration: "3d10 hours",
            movement: "1/4 (all)",
            vision: {
                normal: "10' radius",
                infraUltra: "x 1/2"
            },
            tracking: "x 1/2",
            chanceLost: "+35%",
            windSpeed: "3d8+36"
        },
        notes: "As with heavy blizzard, but only 5' per hour"
    },
    "snowstorm-heavy": {
        diceRange: [6, 10],
        type: "Snowstorm, heavy",
        temperature: {
            min: null,
            max: 25
        },
        chanceContinuing: 20,
        chanceRainbow: 0,
        restrictedTerrain: [],
        precipitation: {
            amount: "2d8+2",
            duration: "4d6 hours",
            movement: "1/2 (all)",
            vision: "x 1/2",
            infraUltra: "x 1/2",
            tracking: "-25%",
            chanceLost: "+20%",
            windSpeed: "3d10"
        },
        notes: "Drifts of 1' per hour will occur if wind speed is above 20 mph"
    },
    "snowstorm-light": {
        diceRange: [11, 20],
        type: "Snowstorm, light",
        temperature: {
            min: null,
            max: 35
        },
        chanceContinuing: 25,
        chanceRainbow: 1,
        restrictedTerrain: [],
        precipitation: {
            amount: "d8",
            duration: "2d6 hours",
            movement: {
                foot: "3/4",
                horse: "normal",
                cart: "normal"
            },
            vision: "x 3/4",
            infraUltra: "x 1/4",
            tracking: "-10%",
            chanceLost: "+10%",
            windSpeed: "4d6"
        }
    },
    "sleet": {
        diceRange: [21, 25],
        type: "Sleet storm",
        temperature: {
            min: null,
            max: 35
        },
        chanceContinuing: 20,
        chanceRainbow: 0,
        restrictedTerrain: [],
        precipitation: {
            amount: "1/2d4",
            duration: "d6 hours",
            movement: {
                foot: "3/4",
                horse: "1/2",
                cart: "1/2"
            },
            vision: "x 3/4",
            infraUltra: "x 1/4",
            tracking: "-10%",
            chanceLost: "+5%",
            windSpeed: "3d10"
        }
    },
    "hailstorm": {
        diceRange: [26, 27],
        type: "Hailstorm",
        temperature: {
            min: null,
            max: 65
        },
        chanceContinuing: 10,
        chanceRainbow: 0,
        restrictedTerrain: ["Desert", "dust"],
        precipitation: {
            amount: "special",
            duration: "d4 hours",
            movement: "1/4 (all)",
            vision: "Normal",
            infraUltra: "Normal",
            tracking: "-10%",
            chanceLost: "+10%",
            windSpeed: "4d10"
        },
        notes: "Average diameter of hailstones is 1/2d4 inches. If stones are more than 1 inch in diameter, assess 1 point of damage per 1/2 inch of diameter every turn for those AC 6 or worse. (1½-inch diameter stones cause 3 points of damage.) Rings, bracers, etc., give no protection from this damage, but magic armor does."
    },
    "fog-heavy": {
        diceRange: [28, 30],
        type: "Fog, heavy",
        temperature: {
            min: 20,
            max: 60
        },
        chanceContinuing: 25,
        chanceRainbow: 1,
        restrictedTerrain: ["Desert", "dust"],
        precipitation: {
            amount: null,
            duration: "d12 hours",
            movement: "1/4 (all)",
            vision: "2' radius",
            infraUltra: "x 1/4",
            tracking: "-60%",
            chanceLost: "+50%",
            windSpeed: "d20"
        }
    },
    "fog-light": {
        diceRange: [31, 38],
        type: "Fog, light",
        temperature: {
            min: 30,
            max: 70
        },
        chanceContinuing: 30,
        chanceRainbow: 3,
        restrictedTerrain: ["Desert"],
        precipitation: {
            amount: null,
            duration: "2d4 hours",
            movement: "1/2 (all)",
            vision: "x 1/4",
            infraUltra: "x 3/4",
            tracking: "-30%",
            chanceLost: "+30%",
            windSpeed: "d10"
        }
    },
    "mist": {
        diceRange: [39, 40],
        type: "Mist",
        temperature: {
            min: 30,
            max: null
        },
        chanceContinuing: 15,
        chanceRainbow: 10,
        restrictedTerrain: [],
        precipitation: {
            amount: null,
            duration: "2d6 hours",
            movement: "Normal",
            vision: "Normal",
            infraUltra: "Normal",
            tracking: "-5%",
            chanceLost: "Normal",
            windSpeed: "d10"
        }
    },
    "drizzle": {
        diceRange: [41, 45],
        type: "Drizzle",
        temperature: {
            min: 25,
            max: null
        },
        chanceContinuing: 20,
        chanceRainbow: 5,
        restrictedTerrain: [],
        precipitation: {
            amount: "1/4d4",
            duration: "d10 hours",
            movement: "Normal",
            vision: "Normal",
            infraUltra: "Normal",
            tracking: "-1%/turn (cum.)",
            chanceLost: "Normal",
            windSpeed: "d20"
        }
    },
    "rainstorm-light": {
        diceRange: [46, 60],
        type: "Rainstorm, light",
        temperature: {
            min: 25,
            max: null
        },
        chanceContinuing: 45,
        chanceRainbow: 15,
        restrictedTerrain: [],
        precipitation: {
            amount: "1/2d6",
            duration: "d12 hours",
            movement: "Normal",
            vision: "Normal",
            infraUltra: "Normal",
            tracking: "-10%/turn (cum.)",
            chanceLost: "Normal",
            windSpeed: "d20"
        }
    },
    "rainstorm-heavy": {
        diceRange: [61, 70],
        type: "Rainstorm, heavy",
        temperature: {
            min: 25,
            max: null
        },
        chanceContinuing: 30,
        chanceRainbow: 20,
        restrictedTerrain: [],
        precipitation: {
            amount: "d4+3",
            duration: "d12 hours",
            movement: {
                foot: "3/4",
                horse: "normal",
                cart: "3/4"
            },
            vision: "x 3/4",
            infraUltra: "x 1/4",
            tracking: "-10%/turn (cum.)",
            chanceLost: "+10%",
            windSpeed: "2d12+10"
        }
    },
    "thunderstorm": {
        diceRange: [71, 84],
        type: "Thunderstorm",
        temperature: {
            min: 30,
            max: null
        },
        chanceContinuing: 15,
        chanceRainbow: 20,
        restrictedTerrain: [],
        precipitation: {
            amount: "d8",
            duration: "d4 hours",
            movement: "1/4 (all)",
            vision: "x 1/4",
            infraUltra: "x 1/4",
            tracking: "-10%/turn (cum.)",
            chanceLost: "+10% (+30% if horsed)",
            windSpeed: "4d10"
        },
        notes: "Lightning strikes will occur once every 10 minutes, with a 1% probability on each that the party will be hit. This chance is increased to 10% if the party shelters under trees. Damage done will be 6d6, with a saving throw for half damage allowed."
    },
    "tropical-storm": {
        diceRange: [85, 89],
        type: "Tropical storm",
        temperature: {
            min: 40,
            max: null
        },
        chanceContinuing: 20,
        chanceRainbow: 10,
        restrictedTerrain: ["Desert", "plains"],
        precipitation: {
            amount: "d6/day",
            duration: "1/2d6 days",
            movement: {
                foot: "1/4",
                horse: "1/4",
                cart: "no"
            },
            vision: "x1/2",
            infraUltra: "x1/2",
            tracking: "No",
            chanceLost: "+30%",
            windSpeed: "3d12+30"
        },
        notes: "Every 3 turns, a 10% chance of gust damage if wind speed is over 40 mph. Damage is 1d6 for every full 10 mph above 40."
    },
    "monsoon": {
        diceRange: [90, 94],
        type: "Monsoon",
        temperature: {
            min: 55,
            max: null
        },
        chanceContinuing: 30,
        chanceRainbow: 5,
        restrictedTerrain: ["Desert", "dust", "plains"],
        precipitation: {
            amount: "d8/day",
            duration: "d6+6 days",
            movement: {
                foot: "1/4",
                horse: "1/4",
                cart: "no"
            },
            vision: "x1/4",
            infraUltra: "x1/4",
            tracking: "No",
            chanceLost: "+30%",
            windSpeed: "6d10"
        }
    },
    "gale": {
        diceRange: [95, 97],
        type: "Gale",
        temperature: {
            min: 40,
            max: null
        },
        chanceContinuing: 15,
        chanceRainbow: 10,
        restrictedTerrain: ["Desert"],
        precipitation: {
            amount: "d8/day",
            duration: "1/2d6 days",
            movement: {
                foot: "1/4",
                horse: "1/4",
                cart: "no"
            },
            vision: "x1/4",
            infraUltra: "x1/4",
            tracking: "No",
            chanceLost: "+20%",
            windSpeed: "6d8+40"
        }
    },
    "hurricane": {
        diceRange: [98, 99],
        type: "Hurricane or typhoon",
        temperature: {
            min: 55,
            max: null
        },
        chanceContinuing: 20,
        chanceRainbow: 5,
        restrictedTerrain: ["Desert", "dust"],
        precipitation: {
            amount: "d10/day",
            duration: "1/2d8 days",
            movement: {
                foot: "1/4",
                horse: "1/4",
                cart: "no"
            },
            vision: "x1/4",
            infraUltra: "x1/4",
            tracking: "No",
            chanceLost: "+30%",
            windSpeed: "7d10+70"
        },
        notes: "Unprotected creatures suffer 1d6 wind damage every 3 turns, and buildings take 1d4 structural damage each turn."
    },
    "special": {
        diceRange: [100, 100],
        type: "Special",
        temperature: {
            min: null,
            max: null
        },
        chanceContinuing: 1,
        chanceRainbow: 0,
        restrictedTerrain: [],
        precipitation: {
            amount: null,
            duration: null,
            movement: null,
            vision: null,
            infraUltra: null,
            tracking: null,
            chanceLost: null,
            windSpeed: null
        },
        notes: "Refer to Terrain Table to determine type. If no continuation, roll new form of precipitation"
    }
};

// Movement rate reference
export const movementTypes = {
    F: "foot travel",
    H: "horse travel",
    C: "carts & wagons",
    No: "not allowed"
};

// Rainbow effects table
export const rainbowEffects = {
    regular: { range: [1, 89], type: "single rainbow" },
    double: { range: [90, 95], type: "double rainbow (may be an omen)" },
    triple: { range: [96, 98], type: "triple rainbow (almost certainly an omen)" },
    bifrost: { range: [99, 99], type: "Bifrost bridge or clouds in shape of rain deity" },
    deity: { range: [100, 100], type: "rain deity or servant in sky" }
};

// General weather table notes
export const weatherTableNotes = [
    "The effects of precipitation on infravision and ultravision occur because the temperature of the precipitation is usually different than that of the surrounding terrain, resulting in a form of 'jamming' similar to that which occurs when military aircraft drop bits of metal foil to confuse enemy radar systems.",
    "The effects on tracking should be used to adjust the chances for a ranger to track any creature in the wilderness.",
    "The chance of getting lost applies to all parties, even those with maps, because landmarks are obscured, trails covered, and so on. Terrain adjustments for this possibility as stated in the DMG apply.",
    "If a party stops traveling until precipitation ceases, the effects are cancelled, except those for snow."
];

// Specific weather notes
export const specificWeatherNotes = {
    snow: "Snowdrifts of up to 10' per hour may accumulate against buildings, walls, etc.",
    hail: "Average diameter of hailstones is 1/2d4 inches. If stones are more than 1 inch in diameter, assess 1 point of damage per 1/2 inch of diameter every turn for those AC 6 or worse",
    lightning: "Lightning strikes occur once every 10 minutes, with a 1% probability on each that the party will be hit (10% under trees)",
    windDamage: "Unprotected creatures suffer 1d6 wind damage every 3 turns when wind speed exceeds 40 mph",
    temperature: "A drop in temperature to 30 degrees or less after a storm may result in icy ground, affecting travel, dexterity, etc."
};

// Visibility conditions reference
export const visibilityConditions = {
    normal: "Standard visibility based on time of day and conditions",
    x34: "Three-quarters normal visibility range",
    x12: "Half normal visibility range",
    x14: "Quarter normal visibility range",
    radius: "Visibility limited to specific radius (in feet)"
};

// Movement rate modifiers
export const movementModifiers = {
    normal: "Standard movement rate",
    "3/4": "Three-quarters normal movement rate",
    "1/2": "Half normal movement rate",
    "1/4": "Quarter normal movement rate",
    "1/8": "One-eighth normal movement rate",
    no: "Movement not possible"
};