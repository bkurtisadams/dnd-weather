// Terrain modification tables
export const terrainEffects = {
    "Rough terrain or hills": {
        precipAdj: 0,
        temperatureAdjustment: { day: 0, night: 0 },
        windSpeedAdjustment: "±5",
        specialWeather: [
            { range: [1, 80], event: "Windstorm" },
            { range: [81, 100], event: "Earthquake" }
        ],
        notes: ""
    },
    "Forest": {
        precipAdj: 0,
        temperatureAdjustment: { day: -5, night: -5 },
        windSpeedAdjustment: -5,
        specialWeather: [
            { range: [1, 80], event: "Quicksand" },
            { range: [81, 100], event: "Earthquake" }
        ],
        notes: ""
    },
    "Jungle": {
        precipAdj: 10,
        temperatureAdjustment: { day: 5, night: 5 },
        windSpeedAdjustment: -10,
        specialWeather: [
            { range: [1, 5], event: "Volcano" },
            { range: [6, 60], event: "Rain forest downpour" },
            { range: [61, 80], event: "Quicksand" },
            { range: [81, 100], event: "Earthquake" }
        ],
        notes: ""
    },
    "Swamp or marsh": {
        precipAdj: 5,
        temperatureAdjustment: { day: 5, night: 5 },
        windSpeedAdjustment: -5,
        specialWeather: [
            { range: [1, 25], event: "Quicksand" },
            { range: [26, 80], event: "Sun shower" },
            { range: [81, 100], event: "Earthquake" }
        ],
        notes: "In the Cold Marshes, temperature adjustment is -5"
    },
    "Dust": {
        precipAdj: -25,
        temperatureAdjustment: { day: 10, night: -10 },
        windSpeedAdjustment: 0,
        specialWeather: [
            { range: [1, 40], event: "Flash flood" },
            { range: [41, 70], event: "Dust storm" },
            { range: [71, 85], event: "Tornado" },
            { range: [86, 100], event: "Earthquake" }
        ],
        notes: "No fog, gale, or hurricane permitted"
    },
    "Plains": {
        precipAdj: 0,
        temperatureAdjustment: { day: 0, night: 0 },
        windSpeedAdjustment: 5,
        specialWeather: [
            { range: [1, 50], event: "Tornado" },
            { range: [51, 100], event: "Earthquake" }
        ],
        notes: "No monsoon or tropical storm permitted"
    },
    "Desert": {
        precipAdj: -30,
        temperatureAdjustment: { day: 10, night: -10 },
        windSpeedAdjustment: 5,
        specialWeather: [
            { range: [1, 25], event: "Flash flood" },
            { range: [26, 50], event: "Sandstorm" },
            { range: [51, 65], event: "Oasis" },
            { range: [66, 85], event: "Mirage oasis" },
            { range: [86, 100], event: "Earthquake" }
        ],
        notes: "No fog, mist, blizzard, monsoon, tropical storm, gale, or hurricane permitted"
    },
    "Mountains": {
        precipAdj: 0,
        temperatureAdjustment: {
            base: -3,
            per: 1000,
            unit: "feet of elevation"
        },
        windSpeedAdjustment: {
            base: 5,
            per: 1000,
            unit: "feet of elevation"
        },
        specialWeather: [
            { range: [1, 20], event: "Wind storm" },
            { range: [21, 50], event: "Rock avalanche" },
            { range: [51, 75], event: "Snow avalanche" },
            { range: [76, 80], event: "Volcano" },
            { range: [81, 100], event: "Earthquake" }
        ],
        notes: ""
    },
    "Seacoast": {
        precipAdj: 5,
        temperatureAdjustment: {
            cold: -5,
            warm: 5,
            note: "current dependent"
        },
        windSpeedAdjustment: 5,
        specialWeather: [
            { range: [1, 80], event: "Earthquake" },
            { range: [81, 94], event: "Tsunami" },
            { range: [95, 100], event: "Undersea volcano" }
        ],
        notes: "Within 2 hexes of coastline. Duration of fog & mist doubled"
    },
    "At sea": {
        precipAdj: 15,
        temperatureAdjustment: {
            cold: -10,
            warm: 5,
            note: "current dependent"
        },
        windSpeedAdjustment: 10,
        specialWeather: [
            { range: [1, 20], event: "Tsunami" },
            { range: [21, 40], event: "Undersea volcano" },
            { range: [41, 100], event: "Undersea earthquake" }
        ],
        notes: "More than 1 hex from coast. Duration of fog & mist doubled"
    },
    "Forest, Sylvan": {
        precipAdj: -30,
        temperatureAdjustment: { day: 0, night: 0 },
        windSpeedAdjustment: -5,
        specialWeather: [],
        notes: "Sylvan zones should have temperate weather conditions and minimal precipitation throughout the year due to the influence of Faerie upon the climate"
    }
};

// Special Weather Event Causes
export const specialWeatherCauses = {
    elemental: { range: [1, 30], description: "Elemental(s) or giant(s)" },
    elementalNPC: { range: [31, 60], description: "Elemental(s) under NPC control" },
    npcMonster: { range: [61, 90], description: "NPC or monster" },
    demon: { range: [91, 98], description: "Demons, devils, or creatures from the appropriate Elemental Plane" },
    deity: { range: [99, 99], description: "A deity or his/her servants" },
    deityBattle: { range: [100, 100], description: "A battle between two or more deities" }
};

// General notes for terrain effects
export const terrainNotes = [
    "When Special Weather Phenomena that do not involve precipitation occur, the DM may re-roll the chance (and/or type) of precipitation.",
    "All Special Weather Phenomena have a 10% chance that they have been caused by one of the following (roll d100):",
    "All terrain effects are cumulative and may therefore cancel each other out, except that intervening mountains block all effects.",
    "For desert terrain, there is a 2% per hour cumulative chance that a creature or character will become blinded by the glare."
];