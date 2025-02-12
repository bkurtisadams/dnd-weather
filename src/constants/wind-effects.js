// Wind speed effect tables 
export const highWindsTable = [
    {
        minSpeed: 0,
        maxSpeed: 31,
        effects: {
            onLand: "No effect",
            atSea: "No effect",
            inAir: "No effect",
            inBattle: "No effect"
        }
    },
    {
        minSpeed: 32,
        maxSpeed: 54,
        effects: {
            onLand: "All travel slowed by 25%; torches will be blown out",
            atSea: "Strong Gale; sailing difficult; rowing impossible; check for damage every 6 hours:\n" +
                   "- 1% chance of capsizing\n" +
                   "- 5% chance of broken mast\n" +
                   "- 10% chance of broken beams\n" +
                   "- 20% chance of torn sail and/or fouled rigging\n" +
                   "- 10% chance of man overboard",
            inAir: "Creatures eagle-size and below can't fly",
            inBattle: "Missiles at 1/2 range and -1 to hit"
        }
    },
    {
        minSpeed: 55,
        maxSpeed: 72,
        effects: {
            onLand: "All travel slowed by 50%; torches and small fires will be blown out",
            atSea: "Storm; minor ship damage (d4 structural points); wave height d10+20 ft.; check for damage every 6 hours:\n" +
                   "- 20% chance of capsizing\n" +
                   "- 25% chance of broken mast\n" +
                   "- 35% chance of broken beams\n" +
                   "- 45% chance of torn sail and/or fouled rigging\n" +
                   "- 50% chance of man overboard",
            inAir: "Man-sized creatures cannot fly",
            inBattle: "Missiles at 1/4 range and -3 to hit"
        }
    },
    {
        minSpeed: 73,
        maxSpeed: 136,
        effects: {
            onLand: "Small trees are uprooted; all travel slowed by 75%; roofs may be torn off; torches and medium-sized fires will be blown out",
            atSea: "Hurricane; ships are endangered (d10 structural damage) and blown off course; wave height d20+20 ft.; check for damage every 6 hours:\n" +
                   "- 40% chance of capsizing\n" +
                   "- 45% chance of broken mast\n" +
                   "- 50% chance of broken beams\n" +
                   "- 65% chance of torn sail and/or fouled rigging\n" +
                   "- 70% chance of man overboard",
            inAir: "No creatures can fly, except those from the Elemental Plane of Air",
            inBattle: "No missile fire permitted; all non-magical weapon attacks are -1 to hit; dexterity bonuses to AC cancelled"
        }
    },
    {
        minSpeed: 137,
        maxSpeed: 500,
        effects: {
            onLand: "Only strong stone buildings will be undamaged; travel is impossible; up to large trees are damaged or uprooted; roofs will be torn off; torches and large fires will be blown out",
            atSea: "Ships are capsized and sunk; wave height d20+20 ft. or more",
            inAir: "No creatures can fly, except those from the Elemental Plane of Air",
            inBattle: "No missile fire permitted; all non-magical weapon attacks at -3 to hit; 20% chance per attack that any weapon will be torn from the wielder's grip by the wind; dexterity bonuses to AC cancelled"
        }
    }
];

export const windChillTable = {
    5: {35: 33, 30: 27, 25: 21, 20: 16, 15: 12, 10: 7, 5: 1, 0: -6, "-5": -11, "-10": -15, "-15": -20, "-20": -22},
    10: {35: 21, 30: 16, 25: 9, 20: 2, 15: -2, 10: -9, 5: -15, 0: -22, "-5": -27, "-10": -31, "-15": -37, "-20": -43},
    15: {35: 16, 30: 11, 25: 1, 20: -6, 15: -11, 10: -18, 5: -25, 0: -33, "-5": -40, "-10": -45, "-15": -51, "-20": -58},
    20: {35: 12, 30: 3, 25: -4, 20: -9, 15: -17, 10: -24, 5: -32, 0: -40, "-5": -46, "-10": -52, "-15": -58, "-20": -64},
    25: {35: 7, 30: 0, 25: -7, 20: -15, 15: -22, 10: -29, 5: -37, 0: -45, "-5": -52, "-10": -58, "-15": -65, "-20": -72},
    30: {35: 5, 30: -2, 25: -11, 20: -18, 15: -26, 10: -33, 5: -41, 0: -49, "-5": -56, "-10": -63, "-15": -70, "-20": -78},
    35: {35: 3, 30: -4, 25: -13, 20: -20, 15: -27, 10: -35, 5: -43, 0: -52, "-5": -60, "-10": -67, "-15": -75, "-20": -82},
    40: {35: 1, 30: -4, 25: -15, 20: -22, 15: -29, 10: -36, 5: -45, 0: -54, "-5": -62, "-10": -69, "-15": -76, "-20": -83},
    45: {35: 1, 30: -6, 25: -17, 20: -24, 15: -31, 10: -38, 5: -46, 0: -55, "-5": -63, "-10": -70, "-15": -77, "-20": -84},
    50: {35: 0, 30: -7, 25: -17, 20: -24, 15: -31, 10: -38, 5: -47, 0: -56, "-5": -64, "-10": -71, "-15": -78, "-20": -85},
    55: {35: -1, 30: -8, 25: -19, 20: -25, 15: -33, 10: -39, 5: -48, 0: -57, "-5": -65, "-10": -72, "-15": -79, "-20": -86},
    60: {35: -3, 30: -10, 25: -21, 20: -27, 15: -34, 10: -40, 5: -49, 0: -58, "-5": -66, "-10": -73, "-15": -80, "-20": -87}
};