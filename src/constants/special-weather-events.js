// Special weather phenomena 
export const specialWeatherTable = [
    {
        phenomenon: "Sandstorm",
        precipDice: "",
        duration: "1d8",
        durationUnit: "hours",
        areaEffect: "Normal",
        movement: "No",
        NormVisionRng: "No",
        IRvisionRng: "No",
        tracking: "No",
        lostChance: "+80%",
        windSpeed: "5d10",
        notes: "50% chance of d4 damage every 3 turns, no saving throw, until shelter is found"
    },
    {
        phenomenon: "Windstorm",
        precipDice: "",
        duration: "1d10",
        durationUnit: "hours",
        areaEffect: "Normal",
        movement: "1/2 (all)",
        NormVisionRng: "x1/2",
        IRvisionRng: "x3/4",
        tracking: "No",
        lostChance: "+30%",
        windSpeed: "8d10+20",
        notes: "50% chance of 2d6 rock damage every 3 turns. Characters must roll dexterity or less on d20 to save for 1/2 damage; monsters must save vs. petrification"
    },
    {
        phenomenon: "Earthquake",
        precipDice: "",
        duration: "1d10",
        durationUnit: "hours",
        areaEffect: "Normal",
        movement: "Foot: x1/4, Horse: x1/4, Cart: no (may be overturned)",
        NormVisionRng: "Normal",
        IRvisionRng: "Normal",
        tracking: "-50%",
        lostChance: "+10% (+30% on horse)",
        windSpeed: "d20",
        notes: "Center is 1-100 miles away from party, with shock waves extending 1-1000 miles. First shock wave preceded by 1-4 mild tremors. After 1-6 rounds delay, first shock wave reaches party. 1-6 shock waves total, d20 rounds between each. Each shock wave causes damage as the 7th level cleric spell Earthquake"
    },
    {
        phenomenon: "Avalanche",
        precipDice: "5d10 inches",
        duration: "1d10",
        durationUnit: "minutes",
        areaEffect: "Normal",
        movement: "May be blocked",
        NormVisionRng: "Normal",
        IRvisionRng: "Normal",
        tracking: "-60%",
        lostChance: "+10% if trail is covered",
        windSpeed: "d20",
        notes: "Damage is 2d20 pts., with save (vs. dexterity or petrification) for 1/2 damage. Victims taking more than 20 points of damage are buried and will suffocate in 6 rounds unless rescued"
    },
    {
        phenomenon: "Volcano",
        precipDice: "d8",
        duration: "1d10",
        durationUnit: "days",
        areaEffect: "Normal",
        movement: "x1/2 (all)",
        NormVisionRng: "x3/4 (x1/2 if undersea)",
        IRvisionRng: "x1/2",
        tracking: "-50%",
        lostChance: "+20% (+40% if on horse)",
        windSpeed: "d20",
        notes: "Ash burns: d4 damage every 3 Turns, no save. Location: 0-7 (d8-1) miles from party. Lava flows at d10 mph, does damage as a salamander's tail (2d6). For every day a volcano continues to erupt, the base temperature will rise 1 degree in a 60-mile-diameter area. This overheating will lapse after 7-12 months, as particles of ash in the air bring the temperature back down, but the chance of clear skies in the area will be cut by 50% for an additional 1-6 months thereafter"
    },
    {
        phenomenon: "Tsunami",
        precipDice: "Wave ht. 10d20 feet",
        duration: "1d44",
        durationUnit: "hours",
        areaEffect: "Normal",
        movement: "Normal",
        NormVisionRng: "Normal",
        IRvisionRng: "Normal",
        tracking: "No",
        lostChance: "Normal",
        windSpeed: "5d10+10",
        notes: "Save vs. dexterity/petrification (see 2 above) or drown if wave is made. If failed, victim takes d20 damage."
    },
    {
        phenomenon: "Quicksand",
        precipDice: "",
        duration: "Covers radius of d20",
        durationUnit: "",
        areaEffect: "Normal",
        movement: "Normal (until entered)",
        NormVisionRng: "Normal",
        IRvisionRng: "Normal",
        tracking: "No",
        lostChance: "+20% if skirted",
        windSpeed: "d20",
        notes: "An individual wearing no armor, leather armor, studded armor, elven chain, or magical armor will only sink up to the neck if he remains motionless, keeps his arms above the surface, and discards all heavy items. Other characters will be dragged under at a rate of 1 foot per round if motionless or 2 feet per round if attempting to escape. Drowning occurs 3 rounds after the head is submerged. If a victim is rescued after he has been submerged, assess damage of d6 per round of submersion once character is resuscitated."
    },
    {
        phenomenon: "Flash Flood",
        precipDice: "3",
        duration: "d6+2",
        durationUnit: "hours",
        areaEffect: "Normal",
        movement: "x3/4",
        NormVisionRng: "Normal",
        IRvisionRng: "Normal",
        tracking: "-5%/turn",
        lostChance: "+10%",
        windSpeed: "d20",
        notes: "A flash flood will begin with what appears to be a heavy rainstorm, with appropriate effects, during which 3 inches of rain will fall each hour. The rain will stop when 50% of the flood's duration is over, at which point all low areas will be covered with running water to a depth which is triple the amount of rainfall. This water will remain for 6-10 turns, and then disappear at a rate of 3 inches per hour. The current will vary from 5-50 mph, increasing when water flows in narrow gullies"
    },
    {
        phenomenon: "Rain Forest Downpour",
        precipDice: "1 inch per hour",
        duration: "3d4",
        durationUnit: "hours",
        areaEffect: "Normal",
        movement: "F: x1/2, H: x1/2, C: no",
        NormVisionRng: "x3/4",
        IRvisionRng: "x3/4",
        tracking: "-5% per turn",
        lostChance: "+20%",
        windSpeed: "0-5 (d6-1)",
        notes: ""
    },
    {
        phenomenon: "Sun Shower",
        precipDice: "1/2",
        duration: "6-60",
        durationUnit: "minutes",
        areaEffect: "Normal",
        movement: "Normal",
        NormVisionRng: "Normal",
        IRvisionRng: "Normal",
        tracking: "Normal",
        lostChance: "Normal",
        windSpeed: "d20",
        notes: ""
    },
    {
        phenomenon: "Tornado",
        precipDice: "1 inch per hour",
        duration: "5-50",
        durationUnit: "hours",
        areaEffect: "Normal",
        movement: "No",
        NormVisionRng: "x3/4",
        IRvisionRng: "x3/4",
        tracking: "No",
        lostChance: "+40%",
        windSpeed: "300",
        notes: ""
    },
    {
        phenomenon: "Oasis",
        precipDice: "",
        duration: "3-6",
        durationUnit: "radius",
        areaEffect: "Normal",
        movement: "Normal",
        NormVisionRng: "Normal",
        IRvisionRng: "Normal",
        tracking: "Normal",
        lostChance: "Normal",
        windSpeed: "d20",
        notes: "If the oasis is real, roll d20. A result of 1 or 2 indicates that the oasis is currently populated (determine population type via the Wilderness Encounter Charts in the DMG), while a 20 indicates that the last visitor has poisoned all the wells. If the oasis is a mirage, anyone who 'drinks' must save vs. spell or take d6 damage from swallowed sand."
    }
];