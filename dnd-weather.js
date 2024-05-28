console.log("D&D WEATHER MODULE LOADED!!", "font-weight: bold; color: red; font-size: 16px");
console.log("version 05.19.24: reverted to version before trying to add multiday weather");
/*
SimpleCalendar.api.getCurrentYear();
SimpleCalendar.api.getCurrentMonth();
SimpleCalendar.api.getCurrentSeason();
SimpleCalendar.api.getCurrentWeekday();
SimpleCalendar.api.getNotesForDay(2022, 11, 24);
SimpleCalendar.api.getTimeConfiguration();
//To set the date to December 25th 1999 with the time 00:00:00
SimpleCalendar.api.setDate({year: 1999, month: 11, day: 24, hour: 0, minute: 0, seconds: 0});

//To set the date to December 31st 1999 and the time to 11:59:59pm
SimpleCalendar.api.setDate({year: 1999, month: 11, day: 30, hour: 23, minute: 59, seconds: 59});
SimpleCalendar.api.pauseClock();
*/
Hooks.once('ready', async function() {
    console.log("D&D Weather module is loaded and ready!");
    // Initialization code here
});

var GlobalWeatherConfig = {
    year: 568,
    //year: game.settings.get('dnd-weather', 'defaultYear') || 598,
    month: "Coldeven",
    day: 25,
    latitude: 32,	// City of Greyhawk is at 35 deg. latitude
	latitudeTempAdj: 0,
    terrain: "Mountains",
    altitude: 1000,
	altitudeTempAdj: 0,
    baseDailyTemp: 0,
    dailyHighTemp: 0,
    dailyLowTemp: 0,
    temperature: { high: 0, low: 0, effective: 0 }, // Initialize effective temperature
	//temperature: { high: 0, low: 0 },
    useRecordTemperatures: false,
	recordTemperatureType: "none",
    tempRecordLow: false,
    tempRecordHigh: false,
    tempRecordDuration: 0,
    skyCondition: "clear",
    precipType: "none",
    precipBase: 0,
    precipAdj: 0,
	precipAmount: 0,
    useRealisticWind: false,
    windSpeedInitial: 0,
	windSpeed: 0,
	windSpeedAdjustment: 0,
	windDirection: 2,
	prevailingWindDirection: 10,
	humidity: 0,  // Add humidity here
    humidityRealistic: 0,
    humidityEffects: "",
    tempWindChillAdj: 0,
	specialWeather: true,  // Indicates whether to use "special weather" or not
	specialWeatherEvent: "none", // Stores the type of special weather event
	specialWeatherEventDuration: 0,
    specialWeatherEventDurationUnit: "",
    specialWeatherPrecipAmount: 0,
	initialWeatherEvent: "none",
	initialWeatherEventDuration: 0,
	continuingWeatherEvent: "none",
	continuingWeatherEventDuration: 0,
	sunrise: 0,
	sunrset: 0,
	adjustedSunrise: 0,
	adjustedSunset: 0,
	displayMode: "full",
	rainbowType: "single",
	weekDays: ["Starday", "Sunday", "Moonday", "Godsday", "Waterday", "Earthday", "Freeday"],
    calendarLabels: {
        Needfest: "Needfest (Midwinter Festival)",
        Fireseek: "Fireseek (Winter)",
        Readying: "Readying (Spring)",
        Coldeven: "Coldeven (Spring)",
        Growfest: "Growfest (Spring Festival)",
        Planting: "Planting (Low Summer)",
        Flocktime: "Flocktime (Low Summer)",
        Wealsun: "Wealsun (Low Summer)",
        Richfest: "Richfest (Midsummer Festival)",
        Reaping: "Reaping (High Summer)",
        Goodmonth: "Goodmonth (High Summer)",
        Harvester: "Harvester (High Summer)",
        Brewfest: "Brewfest (Autumn Festival)",
        Patchwall: "Patchwall (Autumn)",
        "Ready'reat": "Ready'reat (Autumn)",  // Properly using quotes for properties that contain special characters or reserved words
        Sunsebb: "Sunsebb (Winter)"
    },
flags: {
        isSimpleCalendarAvailable: false,  // Initialize the config if not already done
        precipContinues: false,
        useSimpleCalendar: false,
		useHighWindTable: false,
		useWindChill: false,
        specialWeather: false,
		rainbow: false,
        onLand: false,
        atSea: false,
        inAir: false,
        inBattle: false,
        showSunriseSunset: true,
        showMoonPhases: true,
        showWindSpeed: true,
        showWindChill: true,
        showWindDirection: true,
        timeFormat: "24h",  // Alternatives could be "12h"
        temperatureUnit: "Fahrenheit",  // Alternative could be "Celsius"
        windSpeedUnit: "mph"  // Alternatives could be "km/h" or "None"
 
    },

specialWeatherTable: [
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
        phenomenon: "Duststorm",
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
		notes: "50% chance of 2d6 of rock damage every 3 turns. Characters must roll dexterity or " +
				"less on d20 to save for 1/2 damage; monsters must save vs. pertrifaction"
    },
    {
        phenomenon: "Earthquake",
        precipDice: "",
        duration: "1d10",
        durationUnit: "hours",
        areaEffect: "Normal",
        movement: "Foot: x1/4 Horse: x1/4 Cart: no (may be overturned)",
        NormVisionRng: "Normal",
        IRvisionRng: "Normal",
        tracking: "-50%",
        lostChance: "+10% (+30% on horse)",
        windSpeed: "d20",
		notes: "Center is 1-100 miles away from party, with shock waves extending 1-1000 miles. " +
				"The first shock wave of the earthquake will be preceded by 1-4 mild tremors, " +
				"which do no damage but cause untrained horses, cattle, and other animals to " +
				"bolt in fear and run for open ground. After a delay of 1-6	rounds, the first " +
				"shock wave reaches the party, and there are 1-6 shock waves in an earthquake. " +
				"Roll d20 to determine the number of rounds between	each of the shock waves. " +
				"Each shock wave causes damage as the 7th level cleric spell Earthquake"
    },
    {
        phenomenon: "Earthquake, Undersea",
        precipDice: "",
        duration: "1d10",
        durationUnit: "hours",
        areaEffect: "Normal",
        movement: "Foot: x1/4 Horse: x1/4 Cart: no (may be overturned)",
        NormVisionRng: "Normal",
        IRvisionRng: "Normal",
        tracking: "-50%",
        lostChance: "+10% (+30% on horse)",
        windSpeed: "d20",
		notes: "A tsunami will occur in d10 hours. Center is 1-100 miles away from party, " +
                "with shock waves extending 1-1000 miles. " +
				"The first shock wave of the earthquake will be preceded by 1-4 mild tremors, " +
				"which do no damage but cause untrained horses, cattle, and other animals to " +
				"bolt in fear and run for open ground. After a delay of 1-6	rounds, the first " +
				"shock wave reaches the party, and there are 1-6 shock waves in an earthquake. " +
				"Roll d20 to determine the number of rounds between	each of the shock waves. " +
				"Each shock wave causes damage as the 7th level cleric spell Earthquake"
    },
    {
        phenomenon: "Rock Avalanche",
        precipDice: "5d10",
        duration: "1d10",
        durationUnit: "minutes",
        areaEffect: "Normal",
        movement: "May be blocked",
        NormVisionRng: "Normal",
        IRvisionRng: "Normal",
        tracking: "-60%",
        lostChance: "+10% if trail is covered",
        windSpeed: "d20",
		notes: "Damage is 2d2O pts., with save (vs. dexterity or petrification) for 1/2 damage. " +
				"Victims taking more than 20 points of damage are buried and will suffocate in 6 rounds unless rescued"
    },
    {
        phenomenon: "Snow Avalanche",
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
		notes: "Damage is 2d2O pts., with save (vs. dexterity or petrification) for 1/2 damage. " +
				"Victims taking more than 20 points of damage are buried and will suffocate in 6 rounds unless rescued"
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
		notes: "1d8 inches of ash per day. Ash burns: d4 damage every 3 Turns, no save. Location: 0-7 (d8-l) miles from party. " +
				"Lava flows at dlO mph, does damage as a salamander's tail (2d6). For every day a volcano " +
				"continues to erupt, the base temperature will rise 1 degree in a 60-mile-diameter " +
				"area. This overheating will lapse after 7-12 months, as particles of ash in the air " +
				"bring the temperature backdown, but the chance of clear skies in the area will be " +
				"cut by 50% for anadditonal 1-6	months thereafter"
    },
    {
        phenomenon: "Volcano, Undersea",
        precipDice: "d8",
        duration: "1d10",
        durationUnit: "days",
        areaEffect: "Normal",
        movement: "x1/2 (all)",
        NormVisionRng: "x1/2",
        IRvisionRng: "x1/2",
        tracking: "-50%",
        lostChance: "+20% (+40% if on horse)",
        windSpeed: "d20",
		notes: "An island will be formed after 2d6 days. 1d8 inches of ash per day. Ash burns: d4 damage " +
                "every 3 Turns, no save. Location: 0-7 (d8-l) miles from party. " +
				"Lava flows at dlO mph, does damage as a salamander's tail (2d6). For every day a volcano " +
				"continues to erupt, the base temperature will rise 1 degree in a 60-mile-diameter " +
				"area. This overheating will lapse after 7-12 months, as particles of ash in the air " +
				"bring the temperature backdown, but the chance of clear skies in the area will be " +
				"cut by 50% for anadditonal 1-6	months thereafter"
    },
    {
        phenomenon: "Tsunami",
        precipDice: "",
        duration: "1d2",
        durationUnit: "hours",
        areaEffect: "Normal",
        movement: "Normal",
        NormVisionRng: "Normal",
        IRvisionRng: "Normal",
        tracking: "No",
        lostChance: "Normal",
        windSpeed: "5d10+10",
		notes: "Wave height is 10d20 feet. Save vs. Dexterity/Petrification or drown. If save is made, victim takes d20 damage"
    },
    {
        phenomenon: "Quicksand",
        precipDice: "",
        duration: "Normal",
        durationUnit: "",
        areaEffect: "covers radius of d20 inches",
        movement: "Normal (until entered)",
        NormVisionRng: "Normal",
        IRvisionRng: "Normal",
        tracking: "No",
        lostChance: "+20% if skirted",
        windSpeed: "d20",
		notes: "Covers a radius of d20 inches. An individual wearing no armor, leather armor, studded armor, elven chain, or magical armor " +
				"will only sink up to the neck if he remains motionless, keeps his arms above the surface, " +
				"and discards all heavy items. Other characters will be dragged under at the rate of 1 foot " +
				"per round if motionless or 2 feet per round if attempting to escape. Drowning occurs 3 rounds " +
				"after the head is submerged. If a victim is rescued after his head has been submerged, assess " +
				"damage of d6 per round of submersion once character is resuscitated"
    },
    {
        phenomenon: "Flash Flood",
        precipDice: "3",
        duration: "1d6+2",
        durationUnit: "hours",
        areaEffect: "Normal",
        movement: "Normal",
        NormVisionRng: "Normal",
        IRvisionRng: "Normal",
        tracking: "-5% per Turn",
        lostChance: "+10%",
        windSpeed: "d20",
		notes: "A flash flood will begin with what appears to be a heavy rainstorm, with appropriate effects, " +
				"during which 3 inches of rain will fall each hour. The rain will stop when 50% of the flood's " +
				"duration is over, at which point all low areas will be covered with running water to a depth " +
				"which is triple the amount of rainfall. This water will remain for 6-10 turns, and then " +
				"disappear at a rate of 3 inches per hour. The current will vary from 5-50 mph, increasing when " +
				"water flows in narrow gullies"
    },
    {
        phenomenon: "Rain Forest Downpour",
        precipDice: "d1",
        duration: "3d4",
        durationUnit: "hours",
        areaEffect: "Normal",
        movement: "Foot: x1/2, Horse: x1/2, Cart: no",
        NormVisionRng: "x3/4",
        IRvisionRng: "x3/4",
        tracking: "-5% per Turn",
        lostChance: "+20%",
        windSpeed: "d6-1",
		notes: "Precipitation is 1 inch per hour. The ground will absorb up to 6 inches of water; then mud will form, converting the area to a " +
				"swamp for travel purposes"
    },
    {
        phenomenon: "Sun Shower",
        precipDice: "x1/2",
        duration: "6d10",
        durationUnit: "minutes",
        areaEffect: "Normal",
        movement: "Normal",
        NormVisionRng: "Normal",
        IRvisionRng: "Normal",
        tracking: "No",
        lostChance: "Normal",
        windSpeed: "d20",
		notes: "95% chance of a rainbow; see note under Precipitation Occurrence Table"
    },
    {
        phenomenon: "Tornado or Cyclone",
        precipDice: "1",
        duration: "5d10",
        durationUnit: "hours",
        areaEffect: "Normal",
        movement: "normal",
        NormVisionRng: "x3/4",
        IRvisionRng: "x3/4",
        tracking: "No",
        lostChance: "+40%",
        windSpeed: "300",
		notes: "Precipitation is 1 inch per hour. 10% chance party will be transported to the Ethereal Plane. Otherwise, treat " +
				"as a triple-strength hurricane for damage"
    },
    {
        phenomenon: "Oasis",
        precipDice: "",
        duration: "Normal",
        durationUnit: "",
        areaEffect: "3-6 (d4+2) inch radius",
        movement: "Normal",
        NormVisionRng: "Normal",
        IRvisionRng: "Normal",
        tracking: "No",
        lostChance: "Normal",
        windSpeed: "d20",
		notes: "If the oasis is real, roll d20. A result of 1 or 2 inches indicates that the " +
				"oasis is currently populated (determine population type via the Wilderness " +
				"Encounter Charts in the DMG), while a 20 indicates that the last visitor has " +
				"poisoned all the wells. If the oasis is a mirage, anyone who drinks must " +
				"save vs. spell or take d6 damage from swallowed sand"
    },
    {
        phenomenon: "Mirage oasis",
        precipDice: "",
        duration: "Normal",
        durationUnit: "",
        areaEffect: "3-6 (d4+2) inch radius",
        movement: "Normal",
        NormVisionRng: "Normal",
        IRvisionRng: "Normal",
        tracking: "No",
        lostChance: "Normal",
        windSpeed: "d20",
		notes: "If the oasis is real, roll d20. A result of 1 or 2 inches indicates that the " +
				"oasis is currently populated (determine population type via the Wilderness " +
				"Encounter Charts in the DMG), while a 20 indicates that the last visitor has " +
				"poisoned all the wells. If the oasis is a mirage, anyone who drinks must " +
				"save vs. spell or take d6 damage from swallowed sand"
    }
],
	
standardWeatherTable: [
    {
        name: "Blizzard, heavy",
        precipDice: "2d10+10",
        duration: "3d8",
        durationUnit: "hours",
        movement: "Foot: x1/8, Horse: x1/4, Cart: not allowed",
        NormVisionRng: "2 ft. radius",
		IRvisionRng: "No, can't see",
        tracking: "No",
        lostChance: "+50%",
        windSpeed: "6d8+40",
        minTemp: null,
        maxTemp: 10,
        notes: "Snowdrifts of up to 10 ft per hour may accumulate against buildings, walls, etc"
    },
    {
        name: "Blizzard",
        precipDice: "2d8+8",
        duration: "3d10",
        durationUnit: "hours",
        movement: "x1/4 (foot, horse, cart)",
        NormVisionRng: "10 ft radius",
		IRvisionRng: "x1/2",
        tracking: "Not allowed",
        lostChance: "+35%",
        windSpeed: "3d8+36",
        minTemp: null,
        maxTemp: 20,
        notes: "Snowdrifts of up to 5 ft per hour may accumulate against buildings, walls, etc"
    },
    {
        name: "Snowstorm, heavy",
        precipDice: "2d8+2",
        duration: "4d6",
        durationUnit: "hours",
        movement: "x1/2 (foot, horse, cart)",
        NormVisionRng: "x3/4",
		IRvisionRng: "x1/2",
        tracking: "-40%",
        lostChance: "+20%",
        windSpeed: "3d10",
        minTemp: null,
        maxTemp: 25,
        notes: "Drifts of 1 foot per hour if wind speed > 20 mph"
    },
    {
        name: "Snowstorm, light",
        precipDice: "1d8",
        duration: "2d6",
        durationUnit: "hours",
        movement: "x3/4 (foot, horse, cart)",
        NormVisionRng: "x3/4",
		IRvisionRng: "x3/4",
        tracking: "-25%",
        lostChance: "+10%",
        windSpeed: "4d6",
        minTemp: null,
        maxTemp: 35,
        notes: "Drifts of 1 foot per hour if wind speed > 20 mph"
    },
    {
        name: "Sleetstorm",
        precipDice: "1d2",
        duration: "1d6",
        durationUnit: "hours",
        movement: "x3/4 foot, x1/2 horse, x1/2 cart",
        NormVisionRng: "Normal",
		IRvisionRng: "3/4",
        tracking: "-10%",
        lostChance: "+5%",
        windSpeed: "3d10",
        minTemp: 20,
        maxTemp: 35
    },
    {
        name: "Hailstorm",
        precipDice: "1d2",
        duration: "1d4",
        durationUnit: "hours",
        movement: "x3/4 (foot, horse, cart)",
        NormVisionRng: "2 ft. radius",
		IRvisionRng: "Normal",
        tracking: "-10%",
        lostChance: "+10%",
        windSpeed: "4d10",
        minTemp: 30,
        maxTemp: 65,
        notes: "Average hailstone diameter is 1/2 d4 inches. If stones are more than 1 inch in diameter, " +
               "assess 1 point of damage per 1/2 inch of diameter every turn for those AC6 or worse. Rings, " +
			   "bracers, etc., give no protection from this damage, but magic armor does"
    },
    {
        name: "Heavy Fog",
        precipDice: "None",
        duration: "1d12",
        durationUnit: "hours",
        movement: "Foot: x1/4, Horse: x1/4, Cart: x1/4",
        NormVisionRng: "2 ft. radius",
		IRvisionRng: "x1/2",
        tracking: "-60%",
        lostChance: "+50%",
        windSpeed: "1d20",
        minTemp: 30,
        maxTemp: 60
    },
    {
        name: "Light Fog",
        precipDice: "None",
        duration: "2d4",
        durationUnit: "hours",
        movement: "Foot: x1/2, Horse: x1/2, Cart: x1/2",
        NormVisionRng: "x1/4",
		IRvisionRng: "x3/4",
        tracking: "-30%",
        lostChance: "+30%",
        windSpeed: "1d10",
        minTemp: 25,
        maxTemp: 70
    },
    {
        name: "Mist",
        precipDice: "None",
        duration: "2d6",
        durationUnit: "hours",
        movement: "Normal",
        NormVisionRng: "Normal",
		IRvisionRng: "Normal",
        tracking: "-5%",
        lostChance: "Normal",
        windSpeed: "1d10"
    },
    {
        name: "Drizzle",
        precipDice: "1/4d4",
        duration: "1d10",
        durationUnit: "hours",
        movement: "Normal",
        NormVisionRng: "Normal",
		IRvisionRng: "Normal",
        tracking: "-1%/turn cumulative",
        lostChance: "Normal",
        windSpeed: "1d20"
    },
    {
        name: "Rainstorm, light",
        precipDice: "1d3",
        duration: "1d12",
        durationUnit: "hours",
        movement: "Normal",
        NormVisionRng: "Normal",
		IRvisionRng: "Normal",
        tracking: "-10%/hour* this differs from the PHB rules",
        lostChance: "+10% cumulative",
        windSpeed: "1d20",
        notes: "A drop in temperature to 30\u{B0}F or below after a storm may result in icy conditions, " +
				"affecting travel and dexterity"
    },
    {
        name: "Rainstorm, heavy",
        precipDice: "1d4+3",
        duration: "1d12",
        durationUnit: "hours",
        movement: "Foot: x3/4, Horse: normal, Cart: x3/4",
        NormVisionRng: "x3/4",
		IRvisionRng: "x3/4",
        tracking: "-10%/turn* this differs from the PHB rules",
        lostChance: "+10% cumulative",
        windSpeed: "2d12+10",
        notes: "A drop in temperature to 30\u{B0}F or below after a storm may result in icy conditions, " +
				"affecting travel and dexterity"
    },
    {
        name: "Thunderstorm",
        precipDice: "1d8",
        duration: "1d4",
        durationUnit: "hours",
        movement: "x1/2 (foot, horse, cart)",
        NormVisionRng: "x3/4",
		IRvisionRng: "x3/4",
        tracking: "-10% per Turn",
        lostChance: "+10% (+30% if horsed)",
        windSpeed: "4d10",
        notes: "Lightning strikes occur once every 10 minutes with a 1% chance of hitting the party, increased " +
		"to 10% if sheltering under trees. Damage is 6d6, with a saving throw allowed for half damage. A drop in " +
		"temperature to 30\u{B0}F or below after a storm may result in icy conditions, affecting travel and dexterity"
    },
    {
        name: "Tropical Storm",
        precipDice: "1d6",
        duration: "1d3",
        durationUnit: "days",
        movement: "Foot: x1/4, Horse: x1/4, Cart: not allowed",
        NormVisionRng: "x1/2",
		IRvisionRng: "x1/2",
        tracking: "Not allowed",
        lostChance: "+30%",
        windSpeed: "3d12",
        notes: "Every 3 turns, there's a 10% chance of gust damage if wind speed exceeds 40 mph. Damage is 1d6 " +
				"for every 10 mph over 40 mph"
    },
    {
        name: "Monsoon",
        precipDice: "1d8",
        duration: "d6+6",
        durationUnit: "days",
        movement: "Foot: x1/4, Horse: x1/4, Cart: not allowed",
        NormVisionRng: "x1/4",
		IRvisionRng: "x1/4",
        tracking: "Not allowed",
        lostChance: "+30%",
        windSpeed: "6d10",
        notes: "Every 3 turns, there's a 10% chance of gust damage if wind speed exceeds 40 mph. Damage is 1d6 " +
				"for every 10 mph over 40 mph"
    },
    {
        name: "Gale",
        precipDice: "1d8",
        duration: "1d3",
        durationUnit: "days",
        movement: "Foot: x1/4, Horse: x1/4, Cart: not allowed",
        NormVisionRng: "x1/4",
		IRvisionRng: "x1/4",
        tracking: "Not allowed",
        lostChance: "+20%",
        windSpeed: "6d8+40",
        notes: "Every 3 turns, there's a 10% chance of gust damage if wind speed exceeds 40 mph. Damage is 1d6 " +
				"for every 10 mph over 40 mph"
    },
    {
        name: "Hurricane or typhoon",
        precipDice: "1d10",
        duration: "1d4",
        durationUnit: "days",
        movement: "Foot: x1/4, Horse: x1/4, Cart: not allowed",
        NormVisionRng: "x1/4",
		IRvisionRng: "x1/4",
        tracking: "Not allowed",
        lostChance: "+30%",
        windSpeed: "7d10+70",
        notes: "Unprotected creatures suffer 1d6 wind damage every 3 turns, and buildings take 1d4 " +
				"structural damage each turn"
    }
],

highWindsTable: [
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
            onLand: "All travel slowed by 25%; torches will be blown out.",
            //atSea: "Sailing difficult; rowing impossible",
            atSea: "Strong Gale; sailing difficult; rowing impossible; check for damage every 6 hours:\n- 1% chance of capsizing\n- 5% chance of broken mast\n- 10% chance of broken beams\n- 20% chance of torn sail and/or fouled rigging\n- 10% chance of man overboard.",
            inAir: "Creatures eagle-size and below can't fly.",
            inBattle: "Missiles at 1/2 range and -1 to hit."
        }
    },
    {
        minSpeed: 55,
        maxSpeed: 72,
        effects: {
            onLand: "All travel slowed by 50%; torches and small fires will be blown out.",
            //atSea: "Minor ship damage (d4 structural points) may occur; wave height 3d6 ft.",
            atSea: "Storm; minor ship damage (d4 structural points); wave height d10+20 ft.; check for damage every 6 hours:\n- 20% chance of capsizing\n- 25% chance of broken mast\n- 35% chance of broken beams\n- 45% chance of torn sail and/or fouled rigging\n- 50% chance of man overboard.",
            inAir: "Man-sized creatures cannot fly.",
            inBattle: "Missiles at 1/4 range and -3 to hit."
        }
    },
    {
        minSpeed: 73,
        maxSpeed: 136,
        effects: {
            onLand: "Small trees are uprooted; all travel slowed by 75%; roofs may be torn off; torches and medium-sized fires will be blown out.",
            //atSea: "Ships are endangered (d10 structural damage) and blown off course; wave height d10+20 ft.",
            atSea: "Hurricane; ships are endangered (d10 structural damage) and blown off course; wave height d20+20 ft.; check for damage every 6 hours:\n- 40% chance of capsizing\n- 45% chance of broken mast\n- 50% chance of broken beams\n- 65% chance of torn sail and/or fouled rigging\n- 70% chance of man overboard.",
            inAir: "No creatures can fly, except those from the Elemental Plane of Air.",
            inBattle: "No missile fire permitted; all non-magical weapon attacks are -1 to hit; dexterity bonuses to AC cancelled."
        }
    },
    {
        minSpeed: 137,
        maxSpeed: 500,
        effects: {
            onLand: "Only strong stone buildings will be undamaged; travel is impossible; up to large trees are damaged or uprooted; roofs will be torn off; torches and large fires will be blown out.",
            atSea: "Ships are capsized and sunk; wave height d20+20 ft. or more.",
            inAir: "No creatures can fly, except those from the Elemental Plane of Air.",
            inBattle: "No missile fire permitted; all non-magical weapon attacks at -3 to hit; 20% chance per attack that any weapon will be torn from the wielder's grip by the wind; dexterity bonuses to AC cancelled."
        }
    }
],

    terrainEffects: {
        "Rough terrain or Hills": {
            precipAdj: 0,
            temperatureAdjustment: { day: 0, night: 0 },
            windSpeedAdjustment: [5, -5],
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
        "Forest, Sylvan": {
            precipAdj: -30,
            temperatureAdjustment: { day: 0, night: 0 },
            windSpeedAdjustment: -5,
            specialWeather: [],
            notes: "Influenced by Faerie, ensuring temperate conditions and minimal precipitation"
        },
        "Jungle": {
            precipAdj: 10,
            temperatureAdjustment: { day: 5, night: 5 },
            windSpeedAdjustment: -10,
            specialWeather: [
                { range: [1, 5], event: "Volcano" },
                { range: [6, 60], event: "Rain Forest Downpour" },
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
                { range: [26, 80], event: "Sun Shower" },
                { range: [81, 100], event: "Earthquake" }
            ],
            notes: ""
        },
        "Swamp or marsh, cold": {
            precipAdj: 5,
            temperatureAdjustment: { day: -5, night: -5 },
            windSpeedAdjustment: -5,
            specialWeather: [
                { range: [1, 25], event: "Quicksand" },
                { range: [26, 80], event: "Sun Shower" },
                { range: [81, 100], event: "Earthquake" }
            ],
            notes: ""
        },
        "Dust": {
            precipAdj: -25,
            temperatureAdjustment: { day: 10, night: -10 },
            windSpeedAdjustment: 0,
            specialWeather: [
                { range: [1, 40], event: "Flash Flood" },
                { range: [41, 70], event: "Duststorm" },
                { range: [71, 85], event: "Tornado or Cyclone" },
                { range: [86, 100], event: "Earthquake" }
            ],
            notes: "No fog, gale, or hurricane permitted."
        },
        "Plains": {
            precipAdj: 0,
            temperatureAdjustment: { day: 0, night: 0 },
            windSpeedAdjustment: 5,
            specialWeather: [
                { range: [1, 50], event: "Tornado or Cyclone" },
                { range: [51, 100], event: "Earthquake" }
            ],
            notes: "No monsoon or tropical storm permitted."
        },
        "Desert": {
            precipAdj: -30,
            temperatureAdjustment: { day: 10, night: -10 },
            windSpeedAdjustment: 5,
            specialWeather: [
                { range: [1, 25], event: "Flash Flood" },
                { range: [26, 50], event: "Sandstorm" },
                { range: [51, 65], event: "Oasis" },
                { range: [66, 85], event: "Mirage oasis" },
                { range: [86, 100], event: "Earthquake" }
            ],
            notes: "In the desert, there is a cumulative 2% chance per hour that a creature or character will become blinded "+
            "by the glare. The effect is equivalent to a Light spell cast on the creatures visage, and may be relieved with "+
            "a Cure Disease spell or a nights sleep. After a week of travel in the desert, the cumulative chance drops to "+
            "1% per hour, and after one month of continual exposure to these conditions, the possibility is entirely removed."+
            "No fog, mist, blizzard, monsoon, tropical storm, gale, or hurricane permitted."
        },
        "Mountains": {
            precipAdj: 0,
            temperatureAdjustment: { day: 0, night: 0 },
            windSpeedAdjustment: "dynamic",
            specialWeather: [
                { range: [1, 20], event: "Windstorm" },
                { range: [21, 50], event: "Rock Avalanche" },
                { range: [51, 75], event: "Snow Avalanche" },
                { range: [76, 80], event: "Volcano" },
                { range: [81, 100], event: "Earthquake" }
            ],
            notes: ""
        },
        "Seacoast, warm current": {
            precipAdj: 5,
            temperatureAdjustment: { day: 5, night: 5 },
            windSpeedAdjustment: 5,
            specialWeather: [
                { range: [1, 80], event: "Earthquake" },
                { range: [81, 94], event: "Tsunami" },
                { range: [95, 100], event: "Volcano, Undersea" }
            ],
            notes: "Duration of fog and mist doubled."
        },
        "Seacoast, cold current": {
            precipAdj: 5,
            temperatureAdjustment: { day: -5, night: -5 },
            windSpeedAdjustment: 5,
            specialWeather: [
                { range: [1, 80], event: "Earthquake" },
                { range: [81, 94], event: "Tsunami" },
                { range: [95, 100], event: "Volcano, Undersea" }
            ],
            notes: "Duration of fog and mist doubled."
        },
        "At sea, warm current": {
            precipAdj: 15,
            temperatureAdjustment: { day: 5, night: 5 },
            windSpeedAdjustment: 10,
            specialWeather: [
                { range: [1, 20], event: "Tsunami" },
                { range: [21, 40], event: "Volcano, Undersea" },
                { range: [41, 100], event: "Earthquake, Undersea" }
            ],
            notes: "Duration of fog and mist doubled."
        },
        "At sea, cold current": {
            precipAdj: 15,
            temperatureAdjustment: { day: -10, night: -10 },
            windSpeedAdjustment: 10,
            specialWeather: [
                { range: [1, 20], event: "Tsunami" },
                { range: [21, 40], event: "Volcano, Undersea" },
                { range: [41, 100], event: "Earthquake, Undersea" }
            ],
            notes: "Duration of fog and mist doubled."
        }
    },

    baselineData: {
        "Needfest": { baseDailyTemp: 30, dailyHighAdj: "d10", dailyLowAdj: "-d20", chanceOfPrecip: 46, skyConditions: { clear: [1, 23], partlyCloudy: [24, 50], cloudy: [51, 100] }, sunrise: "7:10", sunset: "4:35" },
        "Fireseek": { baseDailyTemp: 32, dailyHighAdj: "d10", dailyLowAdj: "-d20", chanceOfPrecip: 46, skyConditions: { clear: [1, 23], partlyCloudy: [24, 50], cloudy: [51, 100] }, sunrise: "7:21", sunset: "5:01" },
        "Readying": { baseDailyTemp: 34, dailyHighAdj: "d6+4", dailyLowAdj: "-(d10+4)", chanceOfPrecip: 40, skyConditions: { clear: [1, 25], partlyCloudy: [26, 50], cloudy: [51, 100] }, sunrise: "6:55", sunset: "5:36" },
        "Coldeven": { baseDailyTemp: 42, dailyHighAdj: "d8+4", dailyLowAdj: "-(d10+4)", chanceOfPrecip: 44, skyConditions: { clear: [1, 27], partlyCloudy: [28, 54], cloudy: [55, 100] }, sunrise: "6:12", sunset: "6:09" },
        "Growfest": { baseDailyTemp: 44, dailyHighAdj: "d8+4", dailyLowAdj: "-(d10+4)", chanceOfPrecip: 46, skyConditions: { clear: [1, 23], partlyCloudy: [24, 54], cloudy: [55, 100] }, sunrise: "5:50", sunset: "6:05" },
        "Planting": { baseDailyTemp: 52, dailyHighAdj: "d10+6", dailyLowAdj: "-(d8+4)", chanceOfPrecip: 42, skyConditions: { clear: [1, 20], partlyCloudy: [21, 55], cloudy: [56, 100] }, sunrise: "5:24", sunset: "6:39" },
        "Flocktime": { baseDailyTemp: 63, dailyHighAdj: "d10+6", dailyLowAdj: "-(d10+6)", chanceOfPrecip: 42, skyConditions: { clear: [1, 20], partlyCloudy: [21, 53], cloudy: [54, 100] }, sunrise: "4:45", sunset: "7:10" },
        "Wealsun": { baseDailyTemp: 71, dailyHighAdj: "d8+8", dailyLowAdj: "-(d6+6)", chanceOfPrecip: 36, skyConditions: { clear: [1, 20], partlyCloudy: [21, 60], cloudy: [61, 100] }, sunrise: "4:32", sunset: "7:32" },
        "Richfest": { baseDailyTemp: 73, dailyHighAdj: "d8+8", dailyLowAdj: "-(d6+4)", chanceOfPrecip: 36, skyConditions: { clear: [1, 20], partlyCloudy: [21, 60], cloudy: [61, 100] }, sunrise: "4:20", sunset: "7:20" },
        "Reaping": { baseDailyTemp: 77, dailyHighAdj: "d6+4", dailyLowAdj: "-(d6+6)", chanceOfPrecip: 33, skyConditions: { clear: [1, 22], partlyCloudy: [23, 62], cloudy: [63, 100] }, sunrise: "4:45", sunset: "7:29" },
        "Goodmonth": { baseDailyTemp: 75, dailyHighAdj: "d4+6", dailyLowAdj: "-(d6+6)", chanceOfPrecip: 33, skyConditions: { clear: [1, 25], partlyCloudy: [26, 60], cloudy: [61, 100] }, sunrise: "5:13", sunset: "6:57" },
        "Harvester": { baseDailyTemp: 68, dailyHighAdj: "d8+6", dailyLowAdj: "-(d8+6)", chanceOfPrecip: 33, skyConditions: { clear: [1, 33], partlyCloudy: [34, 54], cloudy: [55, 100] }, sunrise: "5:42", sunset: "6:10" },
        "Brewfest": { baseDailyTemp: 64, dailyHighAdj: "d8+6", dailyLowAdj: "-(d8+6)", chanceOfPrecip: 33, skyConditions: { clear: [1, 33], partlyCloudy: [34, 54], cloudy: [55, 100] }, sunrise: "5:49", sunset: "6:02" },
        "Patchwall": { baseDailyTemp: 57, dailyHighAdj: "d10+5", dailyLowAdj: "-(d10+5)", chanceOfPrecip: 36, skyConditions: { clear: [1, 35], partlyCloudy: [36, 60], cloudy: [61, 100] }, sunrise: "6:12", sunset: "5:21" },
        "Ready'reat": { baseDailyTemp: 46, dailyHighAdj: "d10+6", dailyLowAdj: "-(d10+4)", chanceOfPrecip: 40, skyConditions: { clear: [1, 20], partlyCloudy: [21, 50], cloudy: [51, 100] }, sunrise: "6:46", sunset: "4:45" },
        "Sunsebb": { baseDailyTemp: 33, dailyHighAdj: "d8+5", dailyLowAdj: "-d20", chanceOfPrecip: 43, skyConditions: { clear: [1, 25], partlyCloudy: [26, 50], cloudy: [51, 100] }, sunrise: "7:19", sunset: "4:36" }
        },
    
    precipitationTable: [
        { rollMin: 1, rollMax: 2, type: "Blizzard, heavy", tempMin: null, tempMax: 10, contChance: 5, rainbowChance: null, notAllowedIn: ["Desert"] },
        { rollMin: 3, rollMax: 5, type: "Blizzard", tempMin: null, tempMax: 20, contChance: 10, rainbowChance: null, notAllowedIn: ["Desert"] },
        { rollMin: 6, rollMax: 10, type: "Snowstorm, heavy", tempMin: null, tempMax: 25, contChance: 20, rainbowChance: null, notAllowedIn: [] },
        { rollMin: 11, rollMax: 20, type: "Snowstorm, light", tempMin: null, tempMax: 35, contChance: 25, rainbowChance: 1, notAllowedIn: [] },
        { rollMin: 21, rollMax: 25, type: "Sleetstorm", tempMin: null, tempMax: 35, contChance: 20, rainbowChance: null, notAllowedIn: [] },
        { rollMin: 26, rollMax: 27, type: "Hailstorm", tempMin: null, tempMax: 65, contChance: 10, rainbowChance: null, notAllowedIn: ["Desert", "Dust"] },
        { rollMin: 28, rollMax: 30, type: "Heavy Fog", tempMin: 32, tempMax: 60, contChance: 25, rainbowChance: 1, notAllowedIn: ["Desert", "Dust"] },
        { rollMin: 31, rollMax: 38, type: "Light Fog", tempMin: 32, tempMax: 70, contChance: 30, rainbowChance: 3, notAllowedIn: ["Desert"] },
        { rollMin: 39, rollMax: 40, type: "Mist", tempMin: 32, tempMax: null, contChance: 15, rainbowChance: 10, notAllowedIn: [] },
        { rollMin: 41, rollMax: 45, type: "Drizzle", tempMin: 32, tempMax: null, contChance: 20, rainbowChance: 5, notAllowedIn: [] },
        { rollMin: 46, rollMax: 60, type: "Rainstorm, light", tempMin: 32, tempMax: null, contChance: 45, rainbowChance: 15, notAllowedIn: [] },
        { rollMin: 61, rollMax: 70, type: "Rainstorm, heavy", tempMin: 32, tempMax: null, contChance: 30, rainbowChance: 20, notAllowedIn: [] },
        { rollMin: 71, rollMax: 84, type: "Thunderstorm", tempMin: 32, tempMax: null, contChance: 15, rainbowChance: 20, notAllowedIn: [] },
        { rollMin: 85, rollMax: 89, type: "Tropical Storm", tempMin: 75, tempMax: null, contChance: 20, rainbowChance: 10, notAllowedIn: ["Desert", "Plains"] },
        { rollMin: 90, rollMax: 94, type: "Monsoon", tempMin: 80, tempMax: null, contChance: 30, rainbowChance: 5, notAllowedIn: ["Desert", "Dust", "Plains"] },
        { rollMin: 95, rollMax: 97, type: "Gale", tempMin: 40, tempMax: null, contChance: 15, rainbowChance: 10, notAllowedIn: ["Desert"] },
        { rollMin: 98, rollMax: 99, type: "Hurricane or typhoon", tempMin: 80, tempMax: null, contChance: 20, rainbowChance: 5, notAllowedIn: ["Desert", "Dust"] },
        { rollMin: 100, rollMax: 100, type: "Special", tempMin: null, tempMax: null, contChance: 1, rainbowChance: null, notAllowedIn: [] }
        ],
        
    windChillTable: {
        5: {35: 33, 30: 27, 25: 21, 20: 16, 15: 12, 10: 7, 5: 1, 0: "-6", "-5": "-11", "-10": "-15", "-15": "-20", "-20": "-22"},
        10: {35: 21, 30: 16, 25: 9, 20: 2, 15: "-2", 10: "-9", 5: "-15", 0: "-22", "-5": "-27", "-10": "-31", "-15": "-37", "-20": "-43"},
        15: {35: 16, 30: 11, 25: 1, 20: "-6", 15: "-11", 10: "-18", 5: "-25", 0: "-33", "-5": "-40", "-10": "-45", "-15": "-51", "-20": "-58"},
        20: {35: 12, 30: 3, 25: "-4", 20: "-9", 15: "-17", 10: "-24", 5: "-32", 0: "-40", "-5": "-46", "-10": "-52", "-15": "-58", "-20": "-64"},
        25: {35: 7, 30: 0, 25: "-7", 20: "-15", 15: "-22", 10: "-29", 5: "-37", 0: "-45", "-5": "-52", "-10": "-58", "-15": "-65", "-20": "-72"},
        30: {35: 5, 30: "-2", 25: "-11", 20: "-18", 15: "-26", 10: "-33", 5: "-41", 0: "-49", "-5": "-56", "-10": "-63", "-15": "-70", "-20": "-78"},
        35: {35: 3, 30: "-4", 25: "-13", 20: "-20", 15: "-27", 10: "-35", 5: "-43", 0: "-52", "-5": "-60", "-10": "-67", "-15": "-75", "-20": "-82"},
        40: {35: 1, 30: "-4", 25: "-15", 20: "-22", 15: "-29", 10: "-36", 5: "-45", 0: "-54", "-5": "-62", "-10": "-69", "-15": "-76", "-20": "-83"},
        45: {35: 1, 30: "-6", 25: "-17", 20: "-24", 15: "-31", 10: "-38", 5: "-46", 0: "-55", "-5": "-63", "-10": "-70", "-15": "-77", "-20": "-84"},
        50: {35: 0, 30: "-7", 25: "-17", 20: "-24", 15: "-31", 10: "-38", 5: "-47", 0: "-56", "-5": "-64", "-10": "-71", "-15": "-78", "-20": "-85"},
        55: {35: "-1", 30: "-8", 25: "-19", 20: "-25", 15: "-33", 10: "-39", 5: "-48", 0: "-57", "-5": "-65", "-10": "-72", "-15": "-79", "-20": "-86"},
        60: {35: "-3", 30: "-10", 25: "-21", 20: "-27", 15: "-34", 10: "-40", 5: "-49", 0: "-58", "-5": "-66", "-10": "-73", "-15": "-80", "-20": "-87"}
        }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// UTILITY FUNCTIONS

// event.shiftKey
// event.altKey
// event.ctrlKey

/* document.addEventListener('keydown', function(event) {
    if (event.altKey && event.key === 'g') { // Ensure key detection is lowercase
        console.log("Alt+G was pressed");
        generateWeather();  // Call the generateWeather function
    }
});
 */
document.addEventListener('keydown', function(event) {
    if (event.shiftKey && event.key.toLowerCase() === 'g') {
        console.log("Shift+G was pressed");
        generateWeather();  // Call the generateWeather function
    }
});

// Function to call when the weather button is clicked
Hooks.once('ready', function() {
    // Is Simple Calendar loaded?
    if (window.SimpleCalendar) {
        console.log("ver 1.0.6");
        console.error('Simple Calendar is available: adding side button for weather.');
        addSidebarButton();
    } else {
        console.error('Simple Calendar is not available.');
    }
});

function addSidebarButton() {
    SimpleCalendar.api.addSidebarButton(
        "Generate Weather",
        "fa-cloud-sun",
        "generate-weather-button",
        false,
        generateWeatherOnClick
    );
}

function generateWeatherOnClick(event) {
    console.error('Weather generation triggered.');
    // weather generation function here
    //generateWeather();
    //requestWeatherSettings();
    generateWeather();
    
}

function getAllUserIDs() {
    const userIds = game.users.contents.map(user => user.id);
    console.log("User IDs:", userIds);
    return userIds;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// HOOKS INIT
Hooks.once('init', () => {
    game.settings.register('my-weather-module', 'useSimpleCalendar', {
        name: "Use Simple Calendar for Dates",
        hint: "Check this box to use Simple Calendar for date management instead of manual month selection.",
        scope: 'world',  // This setting is stored on a per-world basis.
        config: true,  // This setting provides a configuration UI.
        type: Boolean,
        default: false,
    });

    game.settings.register('dnd-weather', 'defaultMonth', {
        name: "Default Month",
        hint: "Set the default month if Simple Calendar is not used.",
        scope: 'world',
        config: true,
        type: String,
        choices: {
            "needfest": "Needfest",
            "fireseek": "Fireseek",
            "readying": "Readying",
            "coldeven": "Coldeven",
            "growfest": "Growfest",
            "planting": "Planting",
            "flocktime": "Flocktime",
            "wealsun":  "Wealsun",
            "richfest": "Richfest",
            "reaping":  "Reaping",
            "goodmonth": "Goodmonth",
            "harvester": "Harvester",
            "brewfest": "Brewfest",
            "patchwall": "Patchwall",
            "readyreat": "Readyreat",
            "sunsebb":  "Sunsebb"
            // Add other months as needed
        },
        default: "needfest",
    });

    game.settings.register('dnd-weather', 'defaultTerrain', {
        name: "Default Terrain",
        hint: "Select the default terrain type for weather conditions.",
        scope: 'world',
        config: true,
        type: String,
        choices: {
            "rough terrain or hills": "Rough terrain or hills",
            "forest": "Forest",
            "jungle": "Jungle",
            "swamp or march": "Swamp or marsh",
            "dust": "Dust",
            "plains": "Plains",
            "desert": "Desert",
            "mountains": "Mountains",
            "seacoast": "Seacoast",
            "at sea": "At sea",
            // Add other terrain types as needed
        },
        default: "plains",
    });
});

function applyWeatherSettings() {
    const useSimpleCalendar = game.settings.get('dnd-weather', 'useSimpleCalendar');
    const defaultMonth = game.settings.get('dnd-weather', 'defaultMonth');
    const defaultTerrain = game.settings.get('dnd-weather', 'defaultTerrain');

    console.log(`Using Simple Calendar: ${useSimpleCalendar}`);
    console.log(`Default Month: ${defaultMonth}`);
    console.log(`Default Terrain: ${defaultTerrain}`);
    // Use these settings to modify how weather is calculated or displayed
}

Hooks.on('renderSettingsConfig', (app, html, data) => {
    // You can use this to react to settings changes and update your module's behavior accordingly.
    if (game.settings.get('dnd-weather', 'useSimpleCalendar')) {
        // Hide or show elements based on this setting
        html.find('[name="defaultMonth"]').closest('.form-group').hide();
    } else {
        html.find('[name="defaultMonth"]').closest('.form-group').show();
    }
});

// Function to handle dice rolls
function rollDice(formula) {
    new Roll(formula).roll({async: false}).toMessage({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker(),
        flavor: "Rolling " + formula
    });
}

function calculateRelativeHumidity(tempFahrenheit) {
    // Helper function to convert Fahrenheit to Celsius
    function fahrenheitToCelsius(f) {
        return (f - 32) * 5 / 9;
    }

    // Convert temperature from Fahrenheit to Celsius
    let tempCelsius = fahrenheitToCelsius(tempFahrenheit);
    console.log(`Converted Temperature: ${tempCelsius}\u{B0}C from ${tempFahrenheit}\u{B0}F`);

    // Estimate dew point using a typical average relative humidity for simplicity
    let dewPointCelsius = tempCelsius - 10;
    console.log(`Estimated Dew Point: ${dewPointCelsius}\u{B0}C based on average conditions`);

    // Calculate the relative humidity using the Lawrence formula
    let relativeHumidity = 100 - 5 * (tempCelsius - dewPointCelsius);
    console.log(`Calculated Raw Relative Humidity: ${relativeHumidity}% before adjustment`);

    // Ensure humidity does not exceed 100% or fall below 0%
    relativeHumidity = Math.max(0, Math.min(100, relativeHumidity));
    console.log(`Adjusted Relative Humidity: ${relativeHumidity}% for display`);

    return relativeHumidity;
}

function updateWeatherDisplay() {
    let currentTempFahrenheit = GlobalWeatherConfig.dailyHighTemp;  // Use the module's temperature variable
    let humidityRealistic = calculateRelativeHumidity(currentTempFahrenheit);
    console.log(`Updated Weather Display with Current Temperature: ${currentTempFahrenheit}\u{B0}F and Calculated Humidity: ${humidityRealistic.toFixed(2)}%`);

    // Optionally update module's humidity display or store it in the config based on a flag
    GlobalWeatherConfig.humidityRealistic = humidityRealistic; // Save realistic humidity in global config
    if (document.getElementById('humidityDisplay')) { // Ensure element exists
        document.getElementById('humidityDisplay').textContent = `Humidity: ${humidityRealistic.toFixed(2)}%`;
        console.log(`Displayed Humidity on UI: ${humidityRealistic.toFixed(2)}%`);
    } else {
        console.log("Humidity display element not found, cannot update UI.");
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// STEP 1: DETERMINE TEMPERATURE FUNCTIONS
function calculateInitialDailyTemperatures(month, latitude, altitude, terrain, season) {
    const monthData = GlobalWeatherConfig.baselineData[month];
    console.log(`%cBase temperature for month ${month}: ${monthData.baseDailyTemp}\u{B0}F`, "color: green; font-weight: normal");

    // Calculate terrain adjustments
    const terrainAdjustment = GlobalWeatherConfig.terrainEffects[terrain]?.temperatureAdjustment || {day: 0, night: 0};

    // Calculate initial temperatures with terrain adjustment
    console.log(`terrain temp adjustments: ${terrainAdjustment.day}, ${terrainAdjustment.night}`);
    let dailyHigh = monthData.baseDailyTemp + evalDice(monthData.dailyHighAdj) + terrainAdjustment.day;
    let dailyLow = monthData.baseDailyTemp + evalDice(monthData.dailyLowAdj) + terrainAdjustment.night;

    // Apply latitude adjustment
    const latitudeAdjustment = (40 - latitude) * 2;
    dailyHigh += latitudeAdjustment;
    dailyLow += latitudeAdjustment;
    console.log(`%cLatitude adjustment = ${latitudeAdjustment} - High now: ${dailyHigh}\u{B0}F, Low now: ${dailyLow}\u{B0}F`, "font-weight: bold");

    // Apply altitude adjustment
    const altitudeAdjustment = -Math.floor(altitude / 1000) * 3;
    dailyHigh += altitudeAdjustment;
    dailyLow += altitudeAdjustment;
    console.log(`%cAltitude adjustment = ${altitudeAdjustment} - High now: ${dailyHigh}\u{B0}F, Low now: ${dailyLow}\u{B0}F`, "font-weight: bold");

    // Special case for "Forest, Sylvan"
    if (terrain === "Forest, Sylvan") {
        if (season === "Winter") {
            dailyLow = Math.round(monthData.baseDailyTemp + 0.25 * evalDice(monthData.dailyLowAdj));
        } else if (season === "Spring" || season === "Autumn") {
            dailyHigh = Math.round(monthData.baseDailyTemp + 0.25 * evalDice(monthData.dailyHighAdj));
            dailyLow = Math.round(monthData.baseDailyTemp + 0.5 * evalDice(monthData.dailyLowAdj));
        } else if (season === "Summer" || season === "Low Summer" || season === "High Summer") {
            dailyHigh = Math.round(monthData.baseDailyTemp + 0.5 * evalDice(monthData.dailyHighAdj));
            dailyLow = Math.round(monthData.baseDailyTemp + 0.5 * evalDice(monthData.dailyLowAdj));
        }

        if (dailyHigh < dailyLow) { // Ensure the high is always higher than the low
            let temp = dailyHigh;
            dailyHigh = dailyLow;
            dailyLow = temp;
        }

        console.log("Sylvan forest temperatures modified and rounded according to season.");
    }

    console.log(`%cFinal temperatures after all adjustments - High: ${dailyHigh}\u{B0}F, Low: ${dailyLow}\u{B0}F`, "color: orange; font-weight: bold");

    return { highTemp: dailyHigh, lowTemp: dailyLow };
}

function evalDice(diceExpression, returnMax = false) {
    if (!diceExpression || diceExpression.trim() === "None") {
        console.log("No dice expression provided or expression is 'None'.");
        return 0; // Handle cases where no dice roll is required or input is "None"
    }

    let result = 0;
    let negative = diceExpression.startsWith('-'); // Check for a negative sign at the beginning
    if (negative) {
        diceExpression = diceExpression.substring(1); // Remove the negative sign for easier parsing
    }

    // Attempt to parse fractional dice rolls first, e.g., "1/2d6"
    const fractionRegex = /(\d+)\/(\d+)d(\d+)/i;
    const fractionParts = diceExpression.match(fractionRegex);
    if (fractionParts) {
        const numerator = parseInt(fractionParts[1], 10);
        const denominator = parseInt(fractionParts[2], 10);
        const diceSides = parseInt(fractionParts[3], 10);
        if (returnMax) {
            // Return the adjusted maximum roll for fractional dice if returnMax is true
            result = Math.floor((numerator / denominator) * diceSides);
            console.log(`Maximum fractional result for ${numerator}/${denominator}d${diceSides} = ${result}`);
        } else {
            const diceRoll = Math.floor(Math.random() * diceSides) + 1;
            result = Math.floor((numerator / denominator) * diceRoll);
            console.log(`Rolling fractional dice ${numerator}/${denominator}d${diceSides}, single roll = ${diceRoll}, adjusted result = ${result}`);
        }
    } else {
        // Regular expression to parse standard dice notation, e.g., "1d6+2" or "d20"
        const regex = /(\d+)?d(\d+)([+-]?\d+)?/i;
        const parts = diceExpression.match(regex);
        if (parts) {
            const count = parseInt(parts[1] || 1, 10); // Default to 1 if no multiplier, e.g., "d20" is equivalent to "1d20"
            const sides = parseInt(parts[2], 10);
            const modifier = parseInt(parts[3] || 0, 10);

            if (returnMax) {
                // Calculate the maximum roll possible if returnMax is true
                result = count * sides + modifier;
                console.log(`Maximum result for ${count}d${sides} + ${modifier} = ${result}`);
            } else {
                // Roll each die and sum the results if returnMax is false
                for (let i = 0; i < count; i++) {
                    result += Math.floor(Math.random() * sides) + 1;
                }
                result += modifier;
                console.log(`Rolling ${count}d${sides} + ${modifier}, result = ${result}`);
            }
        } else {
            // Directly parse numbers or expressions not matching dice patterns
            result = parseInt(diceExpression, 10) || 0;
            console.log(`Expression is a direct number or unsupported format: ${diceExpression}, parsed result = ${result}`);
        }
    }

    if (negative) {
        result = -result; // Reapply negative if originally negative
        console.log(`Applying negative modifier, final result = ${result}`);
    }
    return result;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// STEP 2: DETERMINE SKY CONDITIONS
function determineSkyConditions(month) {
    const roll = Math.floor(Math.random() * 100) + 1;
    const d20roll = Math.floor(Math.random() * 20);
    const monthData = GlobalWeatherConfig.baselineData[month];
    const { clear, partlyCloudy, cloudy } = monthData.skyConditions;

    let skyCondition;
    if (roll <= clear[1]) skyCondition = "Clear";
    else if (roll <= partlyCloudy[1]) skyCondition = "Partly cloudy";
    else skyCondition = "Cloudy";

    return { skyCondition };
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// STEP 3: DETERMINE PRECIPITATION FUNCTIONS

function checkForPrecipitation(month, terrain) {
    const monthData = GlobalWeatherConfig.baselineData[month];
    const terrainEffect = GlobalWeatherConfig.terrainEffects[terrain];
    const rollForPrecip = Math.floor(Math.random() * 100) + 1;
    const precipChance = monthData.chanceOfPrecip + (terrainEffect.precipAdj || 0);

    console.log("Precipitation roll: ", rollForPrecip, "vs. precip chance: ", precipChance);

    if (rollForPrecip <= precipChance) {
        return { hasPrecipitation: true, type: "Determined by subsequent function" }; // type to be determined by another function
    } else {
        console.log("No precipitation today.");
        return { hasPrecipitation: false, type: "none" };
    }
}

// New function to reroll and adjust wind speed based on terrain
function rerollAndAdjustWindSpeed() {
    const windSpeedRoll = evalDice("d20"); // Assume d20 is a placeholder for your wind speed dice roll
    const terrainAdjustment = GlobalWeatherConfig.terrainEffects[GlobalWeatherConfig.terrain].windSpeedAdjustment || 0;
    GlobalWeatherConfig.windSpeed = Math.max(0, windSpeedRoll + terrainAdjustment); // Prevent negative wind speeds
    //console.log(`Wind speed after reroll and adjustment: ${GlobalWeatherConfig.windSpeed} mph`);
	console.log(`rerollAndAdjustWindSpeed(): Wind speed after reroll and adjustment: ${GlobalWeatherConfig.windSpeed} mph`);
}

function calculateWindSpeed(weatherName, terrainName, altitude) {
    console.log(`Starting wind speed calculation for weather: ${weatherName}, terrain: ${terrainName}, altitude: ${altitude}`);
    const terrainEffects = GlobalWeatherConfig.terrainEffects[terrainName] || GlobalWeatherConfig.terrainEffects['Plains'];
    const isRealisticWind = GlobalWeatherConfig.useRealisticWind;

    let baseWindSpeed, terrainAdjustment, totalWindSpeed;

    if (!weatherName || weatherName.toLowerCase() === "none") {
        baseWindSpeed = evalDice("d20-1"); // Roll d20-1 for general wind speed
        console.log(`Base wind speed for undefined or 'none' weather condition: ${baseWindSpeed}`);
        terrainAdjustment = handleTerrainAdjustment(terrainEffects, terrainName, altitude, isRealisticWind);
        totalWindSpeed = Math.max(baseWindSpeed + terrainAdjustment, 0); // Ensure non-negative wind speed
        console.log(`Final wind speed for 'none' weather in ${terrainName}: ${totalWindSpeed} mph`);
        return totalWindSpeed;
    }

    // Check if the weather type is from the special weather table
    const specialWeatherDetails = GlobalWeatherConfig.specialWeatherTable.find(item => item.phenomenon.toLowerCase() === weatherName.toLowerCase());
    if (specialWeatherDetails) {
        console.log(`Special weather details found for ${weatherName}:`, specialWeatherDetails);
        baseWindSpeed = evalDice(specialWeatherDetails.windSpeed); // Get wind speed for special weather
    } else {
        console.log(`Looking up standard weather table for ${weatherName}`);
        const weatherDetails = GlobalWeatherConfig.standardWeatherTable.find(item => item.name.toLowerCase() === weatherName.toLowerCase());
        if (!weatherDetails) {
            console.error("No weather details found for:", weatherName);
            return 0;
        }
        baseWindSpeed = evalDice(weatherDetails.windSpeed || "d20-1");
    }

    console.log(`Base wind speed from table for ${weatherName}: ${baseWindSpeed}`);
    terrainAdjustment = handleTerrainAdjustment(terrainEffects, terrainName, altitude, isRealisticWind);
    totalWindSpeed = Math.max(baseWindSpeed + terrainAdjustment, 0); // Ensure non-negative wind speed
    console.log(`Calculated wind speed for ${weatherName} in ${terrainName}: ${totalWindSpeed} mph`);
    return totalWindSpeed;
}

function handleTerrainAdjustment(terrainEffects, terrainName, altitude, isRealisticWind) {
    let adjustment = 0;
    if (terrainName === "Mountains" && terrainEffects.windSpeedAdjustment === "dynamic") {
        adjustment = isRealisticWind ? 10 + Math.floor(altitude / 1000) * 0.5 : Math.floor(altitude / 1000) * 5;
        console.log(`Dynamic wind speed adjustment for ${terrainName} at ${altitude} ft with realistic setting ${isRealisticWind}: ${adjustment}`);
        return adjustment;
    }
    adjustment = Array.isArray(terrainEffects.windSpeedAdjustment) ?
        terrainEffects.windSpeedAdjustment[Math.floor(Math.random() * terrainEffects.windSpeedAdjustment.length)] :
        terrainEffects.windSpeedAdjustment || 0;
    console.log(`Static or array-based wind speed adjustment for ${terrainName}: ${adjustment}`);
    return adjustment;
}

function calculateAltitudeAdjustment(altitude, terrain) {
    // Check if the terrain is 'Mountains' and adjust the wind speed based on altitude
    if (terrain === "Mountains") {
        const elevationFactor = Math.floor(altitude / 1000); // Divide altitude by 1000 and floor it to get increments of 1000 feet
        return 5 * elevationFactor; // Return additional wind speed of +5 mph per 1000 feet
    }
    return 0; // No adjustment if not in the Mountains
}

function adjustTemperatureForWindChill() {
    // Implement wind chill calculation here, modify temperatures based on wind speed and current temperature
}

function determinePrecipitationType(terrain, currentHighTemp) {
    let attempt = 0;
    const specialRoll = Math.floor(Math.random() * 100) + 1;
    console.log(`Rolled for special weather check: ${specialRoll}`);
    //if (specialRoll > 0) {
    if (specialRoll === 100) {
        console.log("Special weather triggered.");
        return { precipitationFlag: true, type: "special" };
    }

    while (attempt < 2) {
        const roll = Math.floor(Math.random() * 100) + 1;
        console.log(`Attempt ${attempt + 1}: Rolled for precipitation type: ${roll}`);

        for (const type of GlobalWeatherConfig.precipitationTable) {
            if (roll >= type.rollMin && roll <= type.rollMax) {
                if (type.notAllowedIn.includes(terrain) ||
                    (type.tempMin !== null && currentHighTemp < type.tempMin) ||
                    (type.tempMax !== null && currentHighTemp > type.tempMax)) {
                    console.log(`Excluding type ${type.type} due to restrictions (terrain: ${terrain}, temp: ${currentHighTemp}°F).`);
                    break; // Exit the for loop to allow for a second attempt
                }
                console.log(`Precipitation type determined: ${type.type}`);
                return { precipitationFlag: true, type: type };
            }
        }

        attempt++;
        if (attempt === 2) {
            console.log("No valid precipitation type found after second attempt, setting type to 'none'.");
            return { precipitationFlag: false, type: "none" };  // Return "none" when no suitable type is found
        }
    }
}

// High Winds Table
function getEffectsByWindSpeed(windSpeed) {
    for (let effect of windEffects) {
        let range = effect.windSpeedRange.split(" ")[0].split("-");
        let minSpeed = parseInt(range[0]);
        let maxSpeed = parseInt(range[1] || range[0]); // Handles open-ended ranges like "75+"

        if (windSpeed >= minSpeed && windSpeed <= maxSpeed) {
            console.log(`Effects for ${windSpeed} mph:`, effect.effects);
            return effect.effects;
        }
    }
    return "No specific effects for this wind speed.";
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// STEP 4
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/* function applyWeatherEffects(weatherType, terrainName, altitude) {
    const weatherTypeName = weatherType;
    console.log(`Applying weather effects for type: ${weatherTypeName}`);

    if (!weatherTypeName) {
        console.log("No specific weather effect found. Default effects will be applied.");
        return {
            windSpeed: calculateWindSpeed(weatherType, 'Plains', 0),  // Using default terrain if undefined
            precipitationAmount: 0,
            precipitationDuration: "0 hours"
        };
    }

    // Access the standard weather table from the global configuration
    const weatherDetails = GlobalWeatherConfig.standardWeatherTable.find(item => item.name === weatherTypeName) || {};
    console.log("Weather details found:", weatherDetails);

    // Determine wind speed using the calculated function
    console.log(`Inside applyWeatherEffects(), calculateWindSpeed() parameters = weatherType/terrainName/altitude = ${weatherType} ${terrainName} ${altitude}`);
    let totalWindSpeed = calculateWindSpeed(weatherType, terrainName, altitude);

    // Determine duration and precipitation if available
    let precipitationAmount = weatherDetails.precipDice ? evalDice(weatherDetails.precipDice) : 0;
    let precipitationDuration = weatherDetails.duration ? `${evalDice(weatherDetails.duration)} ${weatherDetails.durationUnit || "hours"}` : "0 hours";

    // Check for terrain-specific conditions and modify the duration if necessary
    const terrainDetails = GlobalWeatherConfig.terrainEffects[terrainName] || {};
    if (terrainDetails.notes && terrainDetails.notes.includes("Duration of fog and mist doubled.") &&
        (weatherTypeName === 'Fog' || weatherTypeName === 'Mist')) {
        const durationValue = weatherDetails.duration ? evalDice(weatherDetails.duration) : 0;
        const doubledDuration = durationValue * 2;
        precipitationDuration = `${doubledDuration} ${weatherDetails.durationUnit || "hours"}`;
        console.log(`Duration for ${weatherTypeName} doubled to: ${precipitationDuration}`);
    }

    console.log(`Wind speed adjusted for ${weatherTypeName}: ${totalWindSpeed} mph`);
    console.log(`Precipitation for ${weatherTypeName}: ${precipitationAmount} over ${precipitationDuration}`);

    return {
        windSpeed: Math.floor(totalWindSpeed),
        precipitationAmount: precipitationAmount,
        precipitationDuration: precipitationDuration
    };
}
 */
function applyWeatherEffects(weatherType, terrainName, altitude) {
    const weatherTypeName = weatherType;
    console.log(`Applying weather effects for type: ${weatherTypeName}`);

    if (!weatherTypeName) {
        console.log("No specific weather effect found. Default effects will be applied.");
        return {
            windSpeed: calculateWindSpeed(weatherType, 'Plains', 0),  // Using default terrain if undefined
            precipitationAmount: 0,
            precipitationDuration: "0 hours"
        };
    }
    
    // Access the standard weather table from the global configuration
    const weatherDetails = GlobalWeatherConfig.standardWeatherTable.find(item => item.name === weatherTypeName) || {};
    console.log("Weather details found:", weatherDetails);

    // Determine wind speed using the calculated function
    console.log(`Inside applyWeatherEffects(), calculateWindSpeed() parameters = weatherType/terrainName/altitude = ${weatherType} ${terrainName} ${altitude}`);
    let totalWindSpeed = calculateWindSpeed(weatherType, terrainName, altitude);

    // Determine duration and precipitation if available
    let precipitationAmount = weatherDetails.precipDice ? evalDice(weatherDetails.precipDice) : 0;
    let precipitationDuration = weatherDetails.duration ? evalDice(weatherDetails.duration) : 0;

    // Check for terrain-specific conditions and modify the duration if necessary
    const terrainDetails = GlobalWeatherConfig.terrainEffects[terrainName] || {};
    if (terrainDetails.notes && terrainDetails.notes.includes("Duration of fog and mist doubled.") &&
        (weatherTypeName === 'Fog' || weatherTypeName.includes('Fog') || weatherTypeName === 'Mist' || weatherTypeName.includes('Mist'))) {
        precipitationDuration *= 2;
        console.log(`Duration for ${weatherTypeName} doubled to: ${precipitationDuration} hours`);
    }
    let precipitationDurationString = `${precipitationDuration} ${weatherDetails.durationUnit || "hours"}`;

    console.log(`Wind speed adjusted for ${weatherTypeName}: ${totalWindSpeed} mph`);
    console.log(`Precipitation for ${weatherTypeName}: ${precipitationAmount} over ${precipitationDurationString}`);

    return {
        windSpeed: Math.floor(totalWindSpeed),
        precipitationAmount: precipitationAmount,
        precipitationDuration: precipitationDurationString
    };
}

function precipChanceOfContinuing(weatherEffect) {
    // More detailed logging to debug the issue
    console.log("precipChanceOfContinuing received weatherEffect, defined as: ", weatherEffect);
    if (!weatherEffect) {
        console.log("No weather effect provided to check continuation.");
        return;
    }

    if (typeof weatherEffect.contChance !== "number") {
        console.log(`Continuation chance is not properly defined for the weather type: ${weatherEffect.type}. Expected a number, got ${typeof weatherEffect.contChance}`);
        return;
    }

    // Roll percentile to see if weather continues
    const continuationRoll = Math.floor(Math.random() * 100) + 1;
    console.log("d100 roll for precip continuing = ", continuationRoll, " vs. weather chance of ", weatherEffect.contChance);

    if (continuationRoll <= weatherEffect.contChance) {
        // Weather continues, set global flag to TRUE and now determine if the type changes
        GlobalWeatherConfig.flags.precipContinues = true;
        console.log("precip continues flag set to: ", GlobalWeatherConfig.flags.precipContinues);
        console.log(`%cPrecipitation continues!`, "font-weight: bold");
        const changeTypeRoll = Math.floor(Math.random() * 10) + 1; // Roll d10 for type change
        console.log(`Change type roll d10 = ${changeTypeRoll}`, "font-weight: bold");

        if (changeTypeRoll === 1) {
            // Move up one line in Precipitation Occurrence Table
            console.log(`Weather continues with weather type 1 line up on Precip Occurrence Table: ${weatherEffect.type}`, "font-weight: bold");
            weatherEffect = adjustPrecipType(-1, weatherEffect);
        } else if (changeTypeRoll === 10) {
            // Move down one line in Precipitation Occurrence Table
            console.log(`Weather continues with weather type 1 line down on Precip Occurrence Table: ${weatherEffect.type}`, "font-weight: bold");
            weatherEffect = adjustPrecipType(1, weatherEffect);
        } else {
            // No change to weather type, schedule a continuation note for the next day in Simple Calendar
            console.log(`Weather continues with the same type: ${weatherEffect.type}`);
            scheduleContinuationNote(weatherEffect);
        }
        // Optionally, roll again for the new duration here or handle it in applyWeatherEffects
    } else {
        // Weather event ends, set global flag to false, 'none' and 0
        GlobalWeatherConfig.flags.precipContinues = false;
        GlobalWeatherConfig.continuingWeatherEvent = "none";
	    GlobalWeatherConfig.continuingWeatherEventDuration = 0;
        console.log(`Weather event ends after its initial duration of ${weatherEffect.duration}.`);
        // Optionally clear the current weather settings or set to a default weather
    }
    return weatherEffect;
}

function adjustPrecipType(change, weatherEffect) {
    // Find the current index of the weather type in the precipitation table
    let index = GlobalWeatherConfig.precipitationTable.findIndex(pt => pt.type === weatherEffect.type);
    console.log(`Current precipitation type index: ${index}, requested change: ${change}`);
    
    // Check if the new index is within the bounds of the precipitation table
    if (index !== -1 && (index + change >= 0) && (index + change < GlobalWeatherConfig.precipitationTable.length)) {
        // Update the precipitation type based on the calculated index change
        weatherEffect.type = GlobalWeatherConfig.precipitationTable[index + change].type;
        console.log(`Precipitation type adjusted to: ${weatherEffect.type}`);
        
        // Apply the new weather effects based on the updated type
        //applyWeatherEffects(weatherEffect.type);
    } else {
        console.log("Adjustment out of bounds or index not found. No change to precipitation type.");
    }
    return weatherEffect;  // Return the updated weather effect for chaining or further use
}

function formatFractions(text) {
    // Check if the text is undefined or not a string
    if (typeof text !== 'string') {
        console.log(`formatFractions was given a non-string input: ${text}`);
        return "No specific notes for this weather condition.";  // Default message or could return an empty string
    }
    // Replace fractions with their corresponding unicode characters
    return text.replace(/1\/2/g, '½').replace(/1\/4/g, '¼').replace(/3\/4/g, '¾');
}
        
async function displayWeatherConditions(weatherData, season, settings, onlyConsole = false) {
    const { latitude, altitude, terrain, month, year, day } = settings;
    // Using default objects for precipitationType and rainbow to safely access nested properties
    const {
        skyCondition = 'Not available', sunrise = 'Not available', sunset = 'Not available',
        highTemp = 'N/A', lowTemp = 'N/A', windChill = 'N/A', humidity = 'N/A',
        humidityEffects = 'No significant effects', // Default value if not set
        precipitationType = { type: 'None' }, precipitationAmount = 'None', precipitationDuration = 'None', precipitationDurationUnit = 'None',
        continues = 'No', rainbow = { hasRainbow: false, rainbowType: 'None' }, windSpeed = 0, windDirection = 'Not available',
        specialWeatherEvent = 'None', notes = 'No additional notes',
        recordDuration = GlobalWeatherConfig.tempRecordDuration
    } = weatherData;

    const windLabel = getWindSpeedLabel(windSpeed);  // Assume this function correctly labels the wind speed
    const windEffects = compileWindNotes(windSpeed); // This function should return 'None' if there are no effects
    
    // Correctly set continuing weather based on global flag
    const continuingWeather = GlobalWeatherConfig.precipContinues;
    const continuingWeatherType = GlobalWeatherConfig.continuingWeatherEvent;

    // Determining whether there are record temperatures
    const isRecordTemp = GlobalWeatherConfig.recordTemperatureType !== "none";
    const temperatureNote = isRecordTemp ? `${GlobalWeatherConfig.recordTemperatureType} for ${recordDuration} day(s): ` : '';
    //const temperatureNote = isRecordTemp ? `${GlobalWeatherConfig.recordTemperatureType}: ` : '';
    const displayedHighTemp = isRecordTemp ? `${temperatureNote}${highTemp}` : highTemp;
    const displayedLowTemp = isRecordTemp ? `${temperatureNote}${lowTemp}` : lowTemp;

    const dateDisplay = `${month} ${day}, ${year}`;
    if (GlobalWeatherConfig.useSimpleCalendar && SimpleCalendar.api.currentDateTime) {
        const currentDate = SimpleCalendar.api.currentDateTime();
        dateDisplay = `${currentDate.weekday}, ${currentDate.month} ${currentDate.day}, ${currentDate.year} CY`;
    }

    // Correcting how the phases are defined to properly create a string
    let lunaPhase = `${getMoonPhase("Luna", month, day)}`;
    let celenePhase = `${getMoonPhase("Celene", month, day)}`;
    let precipitationDisplay = specialWeatherEvent !== 'None' ? `Special Weather Phenomena: ${specialWeatherEvent}` : `Precipitation Type: ${precipitationType.type}`;
    //Precipitation Type: ${precipitationType.type}<br></br>
    
    let message = `
        <strong>Greyhawk Weather Report for ${dateDisplay}</strong><br>
        Season: ${season}<br>
        Month: ${GlobalWeatherConfig.calendarLabels[month] || month}<br>
        Latitude: ${latitude}<br>
        Terrain: ${terrain}<br>
        Altitude: ${altitude} feet<br>
        Sky Condition: ${skyCondition.skyCondition}<br>
        Sunrise: ${sunrise}<br>
        Sunset: ${sunset}<br>
        Phase of Luna: ${lunaPhase}<br>
        Phase of Celene: ${celenePhase}<br>
        High Temperature: ${displayedHighTemp}\u{B0}F<br>
        Low Temperature: ${displayedLowTemp}\u{B0}F<br>
        Wind Chill: ${windChill !== 'N/A' ? windChill + '°F' : 'N/A'}<br>
        Humidity: ${humidity}<br>
        Humidity Effects: ${humidityEffects}<br>
        ${precipitationDisplay}<br>
        Precipitation Amount: ${precipitationAmount !== 'None' ? precipitationAmount + ' inches' : 'N/A'}<br>
        Precipitation Duration: ${precipitationDuration !== 'None' ? precipitationDuration : 'N/A'}<br>
        Continuing Weather: ${continuingWeather ? 'Yes' : 'No'}<br>
        Continuing Weather Type: ${continuingWeather ? continuingWeatherType : 'None'}<br>
        Rainbow: ${rainbow.hasRainbow ? rainbow.rainbowType : 'None'}<br>
        Wind Speed: ${windLabel} (${windSpeed} mph)<br>
        Wind Direction: ${windDirection}<br>
        Wind Effects: ${windEffects}<br>
        Notes: ${notes !== 'No additional notes' ? notes : 'N/A'}
    `;

    console.log(message.replace(/<br>/g, "\n").replace(/<strong>|<\/strong>/g, "").replace(/\s+\n/g, "\n"));
    if (!onlyConsole && typeof ChatMessage === "function") {
        ChatMessage.create({ content: message, speaker: ChatMessage.getSpeaker({ alias: "Weather System" }) });
    } else {
        console.error("ChatMessage function not available. Ensure you are running this in the Foundry VTT environment.");
    }
}


async function generateWeather() {
    console.error("Starting weather generation for today.");

    try {
        const settings = await requestWeatherSettings();
        const season = determineSeason(settings.month);
        console.log(`Season determined as: ${season}`);

        let weatherData = {
            season: season,
            terrain: settings.terrain,
            latitude: settings.latitude,
            altitude: settings.altitude,
            highTemp: 0,
            lowTemp: 0,
            skyCondition: "Not available",
            precipitationType: "None",
            precipitationAmount: 0,
            precipitationDuration: 0,
            precipitationDurationUnit: "none",
            precipitationFlag: false,
            windSpeed: 0,
            windDirection: "Not available",
            sunrise: "Not available",
            sunset: "Not available",
            windChill: 0,
            humidity: 0,
            recordHigh: "N/A",
            recordLow: "N/A",
            rainbow: { hasRainbow: false, rainbowType: "None" },
            notes: "No additional notes"
        };

        console.log("Settings received:", settings);
        console.log("Initial weather data:", weatherData);

        console.log("%cBase temperature for month", "color: green; font-weight: bold");

        // Step 0: Determine if Record Temps Occur
        function determineTemperatureExtremes(monthlyBaseTemp, maxHigh, maxLow, terrain) {
            const roll = Math.floor(Math.random() * 100) + 1;  // Roll percentile
            console.log(`Random roll for temperature extremes: ${roll}`);
        
            if (terrain === "Forest, Sylvan") {
                console.log("No record temperatures for 'Forest, Sylvan' terrain.");
                return {
                    adjustedBaseTemp: monthlyBaseTemp,
                    extremeType: "none",
                    duration: 1
                };
            }
        
            let tempAdjustmentFactor = 0;  // Factor to adjust the base temperature
            // Reset global flags
            GlobalWeatherConfig.recordTemperatureType = "none";
            GlobalWeatherConfig.tempRecordLow = false;
            GlobalWeatherConfig.tempRecordHigh = false;
        
            if (roll === 1) {
                tempAdjustmentFactor = -3 * maxLow;
                GlobalWeatherConfig.recordTemperatureType = "Extreme record low";
                GlobalWeatherConfig.tempRecordLow = true;
            } else if (roll === 2) {
                tempAdjustmentFactor = -2 * maxLow;
                GlobalWeatherConfig.recordTemperatureType = "Severe record low";
                GlobalWeatherConfig.tempRecordLow = true;
            } else if (roll >= 3 && roll <= 4) {
                tempAdjustmentFactor = -maxLow;
                GlobalWeatherConfig.recordTemperatureType = "Record low";
                GlobalWeatherConfig.tempRecordLow = true;
            } else if (roll >= 97 && roll <= 98) {
                tempAdjustmentFactor = maxHigh;
                GlobalWeatherConfig.recordTemperatureType = "Record high";
                GlobalWeatherConfig.tempRecordHigh = true;
            } else if (roll === 99) {
                tempAdjustmentFactor = 2 * maxHigh;
                GlobalWeatherConfig.recordTemperatureType = "Severe record high";
                GlobalWeatherConfig.tempRecordHigh = true;
            } else if (roll === 100) {
                tempAdjustmentFactor = 3 * maxHigh;
                GlobalWeatherConfig.recordTemperatureType = "Extreme record high";
                GlobalWeatherConfig.tempRecordHigh = true;
            }
        
            console.log(`Record temperature type: ${GlobalWeatherConfig.recordTemperatureType}`);
            console.log(`Temperature adjustment factor: ${tempAdjustmentFactor}`);
        
            const adjustedBaseTemp = monthlyBaseTemp + tempAdjustmentFactor;
            console.log(`Adjusted base temperature: ${adjustedBaseTemp}°F`);
        
            const duration = tempAdjustmentFactor !== 0 ? determineDurationOfExtremes() : 1;
            console.log(`Duration of temperature extreme: ${duration} days`);
        
            // Update the duration global flag
            GlobalWeatherConfig.tempRecordDuration = duration;
        
            return {
                adjustedBaseTemp,
                extremeType: GlobalWeatherConfig.recordTemperatureType,
                duration
            };
        }
        
        function determineDurationOfExtremes() {
            const durationRoll = Math.floor(Math.random() * 20) + 1;
            console.log(`Roll for duration of extremes: ${durationRoll}`);
            if (durationRoll === 1) {
                return 1;
            } else if (durationRoll <= 3) {
                return 2;
            } else if (durationRoll <= 10) {
                return 3;
            } else if (durationRoll <= 14) {
                return 4;
            } else if (durationRoll <= 17) {
                return 5;
            } else if (durationRoll <= 19) {
                return 6;
            } else {
                return 7;
            }
        }
        
        // Example Usage
/*         const monthlyBaseTemp = 50;  // Example base temperature for a month
        const maxHigh = 10;  // Maximum possible high adjustment
        const maxLow = 10;  // Maximum possible low adjustment
        
        const temperatureExtremes = determineTemperatureExtremes(monthlyBaseTemp, maxHigh, maxLow, settings.terrain);
        console.log("Adjusted Base Temperature:", temperatureExtremes.adjustedBaseTemp);
        console.log("Type of Extreme:", temperatureExtremes.extremeType);
        console.log("Duration of Extreme Temperatures (days):", temperatureExtremes.duration); */
        
        //////////////////////////////////////////////////////////////////////////////////////////////////////
        function calculateRecordTemperatures(month, latitude, altitude, terrain, season) {
            const monthData = GlobalWeatherConfig.baselineData[month];
            console.log(`Base temperature for month ${month}: ${monthData.baseDailyTemp}°F`);
        
            let baseTemp = monthData.baseDailyTemp;
            console.log(`Starting temperature calculations for terrain: ${terrain} and season: ${season}`);
            
            let dailyHighAdjustment = evalDice(monthData.dailyHighAdj, true);
            let dailyLowAdjustment = evalDice(monthData.dailyLowAdj, true);
            console.log(`Daily high adjustment max: ${dailyHighAdjustment}`);
            console.log(`Daily low adjustment max: ${dailyLowAdjustment}`);
        
            let adjustment = 0;

            switch (GlobalWeatherConfig.recordTemperatureType) {
                case 'Extreme record high':
                    adjustment = 3 * dailyHighAdjustment;
                    console.log(`Applying Extreme record high adjustment: ${adjustment}`);
                    break;
                case 'Severe record high':
                    adjustment = 2 * dailyHighAdjustment;
                    console.log(`Applying Severe record high adjustment: ${adjustment}`);
                    break;
                case 'Record high':
                    adjustment = dailyHighAdjustment;
                    console.log(`Applying Record high adjustment: ${adjustment}`);
                    break;
                case 'Extreme record low':
                    adjustment = 3 * dailyLowAdjustment;  // Confirm this is correctly negative.
                    console.log(`Applying Extreme record low adjustment: ${adjustment}`);
                    break;
                case 'Severe record low':
                    adjustment = 2 * dailyLowAdjustment;  // Confirm this is correctly negative.
                    console.log(`Applying Severe record low adjustment: ${adjustment}`);
                    break;
                case 'Record low':
                    adjustment = dailyLowAdjustment;  // Confirm this is correctly negative.
                    console.log(`Applying Record low adjustment: ${adjustment}`);
                    break;
            }
            
            console.log(`Temperature adjustment based on record type '${GlobalWeatherConfig.recordTemperatureType}': ${adjustment}`);
            baseTemp += adjustment;
            console.log(`Adjusted base temperature after record type modification: ${baseTemp}°F`);
        
            const latitudeAdjustment = (40 - latitude) * 2;
            console.log(`Latitude adjustment for latitude ${latitude}: ${latitudeAdjustment}`);
            baseTemp += latitudeAdjustment;
        
            const altitudeAdjustment = -Math.floor(altitude / 1000) * 3;
            console.log(`Altitude adjustment for altitude ${altitude}: ${altitudeAdjustment}`);
            baseTemp += altitudeAdjustment;
        
            console.log(`Base temperature after all adjustments: ${baseTemp}°F`);
        
            let dailyHigh = baseTemp + evalDice(monthData.dailyHighAdj);
            let dailyLow = baseTemp + evalDice(monthData.dailyLowAdj);
        
            console.log(`Calculated daily high before terrain adjustments: ${dailyHigh}`);
            console.log(`Calculated daily low before terrain adjustments: ${dailyLow}`);
        
            console.log(`Final record temperatures - High: ${dailyHigh}°F, Low: ${dailyLow}°F`);
            
            return { highTemp: dailyHigh, lowTemp: dailyLow };
        }
/* 
        // Step 1: Determine Temperature Extremes and Adjustments
        console.log(`%cSTEP 1: DETERMINE TEMPERATURES`, "color: green; font-weight: bold");

        // Check if there is a record temperature event before proceeding
        if (GlobalWeatherConfig.recordTemperatureType !== 'none') {
            console.log(`%cRecord temperature day detected: ${GlobalWeatherConfig.recordTemperatureType}`, "color: red; font-weight: bold");
            const recordTemperatures = calculateRecordTemperatures(settings.month, settings.latitude, settings.altitude, settings.terrain, season);
            weatherData.highTemp = recordTemperatures.highTemp;
            weatherData.lowTemp = recordTemperatures.lowTemp;
        } else {
            const temperatures = await calculateInitialDailyTemperatures(settings.month, settings.latitude, settings.altitude, settings.terrain, season);
            weatherData.highTemp = temperatures.highTemp;
            weatherData.lowTemp = temperatures.lowTemp;
        }

        console.log("Temperatures determined:", weatherData.highTemp, weatherData.lowTemp);
 */

        // Step 1: Determine Temperature Extremes and Adjustments
        console.log(`%cSTEP 1: DETERMINE TEMPERATURES`, "color: green; font-weight: bold");

        // Check if the useRecordTemperatures flag is enabled
        console.log("recordTemperatures flag is ", GlobalWeatherConfig.useRecordTemperatures);
        if (GlobalWeatherConfig.useRecordTemperatures) {
            // Check if there is a record temperature event before proceeding
            if (GlobalWeatherConfig.recordTemperatureType !== 'none') {
                console.log(`%cRecord temperature day detected: ${GlobalWeatherConfig.recordTemperatureType}`, "color: red; font-weight: bold");
                const recordTemperatures = calculateRecordTemperatures(settings.month, settings.latitude, settings.altitude, settings.terrain, season);
                weatherData.highTemp = recordTemperatures.highTemp;
                weatherData.lowTemp = recordTemperatures.lowTemp;

                // Decrease the duration of the ongoing temperature extreme
                GlobalWeatherConfig.tempRecordDuration--;
                if (GlobalWeatherConfig.tempRecordDuration === 0) {
                    GlobalWeatherConfig.recordTemperatureType = 'none';
                }
            } else {
                const temperatures = await calculateInitialDailyTemperatures(settings.month, settings.latitude, settings.altitude, settings.terrain, season);
                weatherData.highTemp = temperatures.highTemp;
                weatherData.lowTemp = temperatures.lowTemp;

                // Determine if a new temperature extreme occurs
                const temperatureExtremes = determineTemperatureExtremes(temperatures.baseTemp, settings.maxHigh, settings.maxLow, settings.terrain);
                if (temperatureExtremes.extremeType !== 'none') {
                    GlobalWeatherConfig.recordTemperatureType = temperatureExtremes.extremeType;
                    GlobalWeatherConfig.tempRecordDuration = temperatureExtremes.duration;
                }
            }
        } else {
            // If useRecordTemperatures flag is not enabled, proceed with normal temperature calculations
            const temperatures = await calculateInitialDailyTemperatures(settings.month, settings.latitude, settings.altitude, settings.terrain, season);
            weatherData.highTemp = temperatures.highTemp;
            weatherData.lowTemp = temperatures.lowTemp;
        }

        console.log("Temperatures determined:", weatherData.highTemp, weatherData.lowTemp);

        // Step 2: Determine Sky Conditions
        console.log(`%cSTEP 2: DETERMINE SKY CONDITIONS`, "color: green; font-weight: bold");
        weatherData.skyCondition = await determineSkyConditions(settings.month);
        console.log("Sky conditions determined:", weatherData.skyCondition);

        // Initial check for continuing weather
        console.log(`%cCHECK FOR CONTINUING WEATHER`, "color: blue; font-weight: bold");
        if (GlobalWeatherConfig.precipContinues) {
            console.log(`Continuing weather detected: ${GlobalWeatherConfig.continuingWeatherEvent}`);
            weatherData.precipitationFlag = true;
            weatherData.precipitationType = { type: GlobalWeatherConfig.continuingWeatherEvent };

            // Recalculate the effects for the continuing weather
            const weatherEffects = applyWeatherEffects(weatherData.precipitationType.type, settings.terrain, settings.altitude);
            weatherData.precipitationAmount = weatherEffects.precipitationAmount;
            weatherData.precipitationDuration = weatherEffects.precipitationDuration;
            weatherData.windSpeed = weatherEffects.windSpeed;
            console.log(`Continuing weather effects: Amount: ${weatherData.precipitationAmount}, Duration: ${weatherData.precipitationDuration}, Wind Speed: ${weatherData.windSpeed}`);
        }

        // Step 3a: Check for Precipitation
        console.log(`%cSTEP 3a: DETERMINE IF PRECIP OCCURS`, "color: green; font-weight: bold");

        if (GlobalWeatherConfig.precipContinues) {
            weatherData.precipitationFlag = true;
            weatherData.precipitationType = { type: GlobalWeatherConfig.continuingWeatherEvent };
            console.log(`Continuing weather detected. Type: ${weatherData.precipitationType.type}`);
        } else {
            const precipitationCheck = await checkForPrecipitation(settings.month, settings.terrain);
            weatherData.precipitationFlag = precipitationCheck.hasPrecipitation;
            weatherData.precipitationType = precipitationCheck.type;
            console.log("Precipitation flag set to: ", weatherData.precipitationFlag);
            console.log("Precipitation type determined as: ", weatherData.precipitationType);
        }

        // Step 3b: Determine Precipitation Type if flag is true and there is no ongoing weather continuation
        console.log(`%cSTEP 3b: Determine precip type or if no precip, skip to wind speed only`, "color: green; font-weight: bold");

        if (weatherData.precipitationFlag && !GlobalWeatherConfig.precipContinues) {
            const precipTypeResult = determinePrecipitationType(settings.terrain, weatherData.highTemp);
            if (precipTypeResult.precipitationFlag) {
                if (precipTypeResult.type === "special") {
                    const specialWeatherData = determineSpecialWeather(settings.terrain);
                    console.log("specialWeatherData =", specialWeatherData);
                    if (specialWeatherData.type !== "none") {
                        const specialWeatherDetails = findSpecialWeatherData(specialWeatherData.type);
                        if (specialWeatherDetails) {
                            weatherData.precipitationType = { type: specialWeatherDetails.phenomenon };
                            weatherData.precipitationAmount = specialWeatherDetails.precipitation;
                            weatherData.precipitationDuration = `${evalDice(specialWeatherDetails.duration)} ${specialWeatherDetails.durationUnit}`;
                            weatherData.windSpeed = calculateWindSpeed(specialWeatherData.type, settings.terrain, settings.altitude);
                            console.log("Special weather effects applied:", weatherData.precipitationType.type, weatherData.precipitationAmount, weatherData.precipitationDuration, weatherData.windSpeed);
                        } else {
                            console.log("Special weather details not found for", specialWeatherData.type);
                        }
                    }
                } else {
                    weatherData.precipitationType = { type: precipTypeResult.type.type };
                    console.log("Precipitation type determined and flag:", weatherData.precipitationType.type, weatherData.precipitationFlag);

                    // Step 3c: Determine precip amount, duration, and wind speed if precip is still true
                    console.log(`%cSTEP 3c: DETERMINE PRECIP AMT, DURATION & WIND SPEED`, "color: green; font-weight: bold");
                    const weatherEffects = applyWeatherEffects(weatherData.precipitationType.type, settings.terrain, settings.altitude);
                    weatherData.precipitationAmount = weatherEffects.precipitationAmount;
                    weatherData.precipitationDuration = weatherEffects.precipitationDuration;
                    weatherData.windSpeed = weatherEffects.windSpeed; // Wind speed calculated here
                    console.log("Weather effects determined:", weatherData.precipitationAmount, weatherData.precipitationDuration, weatherData.windSpeed);
                }
            } else {
                console.log("Precipitation type is 'none', skipping related effects.");
                // Skip to calculating wind speed if no valid precipitation type was determined
                console.log(`%cSTEP 3d: No valid precip found, calculating wind speed`, "color: red; font-weight: bold");
                weatherData.windSpeed = calculateWindSpeed("none", settings.terrain, settings.altitude);
                console.log("Wind speed set to:", weatherData.windSpeed);
            }
        } else {
            // Directly calculate wind speed if no precipitation is anticipated
            console.log(`%cSTEP 3d: No precip found, calculating wind speed`, "color: red; font-weight: bold");
            const weatherType = "none";
            console.log("About to calculate wind speed with:", weatherType);
            weatherData.windSpeed = calculateWindSpeed(weatherType, settings.terrain, settings.altitude);
            console.log("Wind speed set to:", weatherData.windSpeed);
        }

        // Step 4: Update Heat and Humidity Effects
        console.log(`%cSTEP 4: CHECK FOR HUMIDITY`, "color: blue; font-weight: bold");
        if (weatherData.highTemp) {
            const { humidity, effectsDescription } = await updateHumidityAndEffects(weatherData.highTemp);
            weatherData.humidity = humidity;
            weatherData.humidityEffects = effectsDescription;
            console.log("Humidity and effects updated:", humidity, effectsDescription);
        } else {
            console.log("High temperature not set. Unable to update humidity and its effects.");
        }

        // Step 5: Wind Chill Calculation
        console.log(`%cSTEP 5: CALCULATE WIND CHILL`, "color: blue; font-weight: bold");
        weatherData.windChill = await applyWindChill(weatherData.lowTemp, weatherData.windSpeed, GlobalWeatherConfig.windChillTable);

        // Step 6: Rainbows Check
        console.log(`%cSTEP 6: RAINBOW CHECK`, "color: green; font-weight: bold");
        if (weatherData.precipitationType) {
            console.log("weatherData.precipitationType = ", weatherData.precipitationType.type);
            weatherData.rainbow = await checkForRainbows(weatherData.precipitationType.type);
        } else {
            console.log("No precipitation type set, skipping rainbow check.");
            weatherData.rainbow = { hasRainbow: false, rainbowType: "None" };
        }
        console.log("Rainbow check:", weatherData.rainbow);

        // Step 7: Wind Direction
        console.log(`%cSTEP 7: CHECK FOR WIND DIRECTION`, "color: green; font-weight: bold");
        weatherData.windDirection = await setPrevailingWindDirection(season);
        console.log("Wind direction determined:", weatherData.windDirection);

        // Step 8: Sunrise and Sunset Times
        console.log(`%cSTEP 8: DETERMINE SUNRISE/SUNSET`, "color: green; font-weight: bold");
        const sunTimes = adjustSunTimesForLatitude(settings.latitude, settings.month);
        weatherData.sunrise = sunTimes.sunrise;
        weatherData.sunset = sunTimes.sunset;
        console.log("Sunrise and sunset times:", sunTimes);

        // Step 8.5: Check for continuing weather before proceeding with new weather generation
        console.log(`%cSTEP 8.5: CHECK FOR CONTINUING WEATHER`, "color: green; font-weight: bold");

        console.log("Current GlobalWeatherConfig.continuingWeatherEvent:", GlobalWeatherConfig.continuingWeatherEvent);
        console.log("Current GlobalWeatherConfig.precipContinues:", GlobalWeatherConfig.precipContinues);
        console.log("Current GlobalWeatherConfig.continuingWeatherEventDuration:", GlobalWeatherConfig.continuingWeatherEventDuration);

        if (GlobalWeatherConfig.continuingWeatherEvent === weatherData.precipitationType.type || GlobalWeatherConfig.continuingWeatherEvent === "none") {
            const continuationResult = determineWeatherContinuation(weatherData.precipitationType.type);
            GlobalWeatherConfig.precipContinues = continuationResult.continues;
            GlobalWeatherConfig.continuingWeatherEvent = continuationResult.newWeatherType;
            GlobalWeatherConfig.continuingWeatherEventDuration = continuationResult.continuationChance;

            console.log("Updated GlobalWeatherConfig.continuingWeatherEvent:", GlobalWeatherConfig.continuingWeatherEvent);
            console.log("Updated GlobalWeatherConfig.precipContinues:", GlobalWeatherConfig.precipContinues);
            console.log("Updated GlobalWeatherConfig.continuingWeatherEventDuration:", GlobalWeatherConfig.continuingWeatherEventDuration);

            if (continuationResult.continues) {
                console.log(`Weather continues as ${continuationResult.newWeatherType}. Generate this weather?`);
            } else {
                console.log(`%cWeather does not continue`, "color: red; font-weight: bold");
            }
        }

        // Step 9: Compile notes
        console.log(`%cSTEP 9a: Compile weather notes`, "color: green; font-weight: bold");
        console.log("weatherData.notes is calling compileWeatherNotes with: ", weatherData.precipitationType.type, settings.terrain, GlobalWeatherConfig.month, GlobalWeatherConfig.day);
        weatherData.notes = compileWeatherNotes(weatherData.precipitationType.type, settings.terrain, GlobalWeatherConfig.month, GlobalWeatherConfig.day, weatherData.windChill, season, GlobalWeatherConfig.skyCondition);

        console.log(`%cSTEP 9b: Compile wind notes`, "color: green; font-weight: bold");
        weatherData.windEffects = compileWindNotes(weatherData.windSpeed);

        // Step 10: Display Weather Report
        console.log(`%cSTEP 10: COMPLETE WEATHER REPORT`, "color: green; font-weight: bold");
        if (!weatherData.precipitationType || typeof weatherData.precipitationType !== 'object') {
            console.log("Precipitation type is not properly set, using default values.");
            weatherData.precipitationType = { type: 'None' }; // Ensure it's always an object
        }
        
        await displayWeatherConditions(weatherData, season, settings);
        console.log("Weather data object: ", weatherData);

        // Step 11: Reset Data
        console.log(`%cSTEP 11: RESET DATA`, "color: green; font-weight: bold");
        resetWeatherData(GlobalWeatherConfig);
        console.log("Weather data reset.");
        // Advance the date if the option is enabled
        if (GlobalWeatherConfig.advanceDate) {
            advanceDate();
        }

    } catch (error) {
        console.error("An error occurred during weather generation:", error.message);
    }
}

function applySpecialWeatherEffects() {
    const terrain = GlobalWeatherConfig.terrain;
    const effects = GlobalWeatherConfig.terrainEffects[terrain];
    const roll = Math.floor(Math.random() * 100) + 1; // Roll from 1 to 100

    console.log(`Rolled for special weather: ${roll}`);
    
    // Determine the special weather event based on the roll and the defined probabilities
    const specialWeatherRanges = effects.specialWeather.split(',').map(range => {
        const parts = range.split(':');
        const bounds = parts[0].split('-');
        return {
            lowerBound: parseInt(bounds[0]),
            upperBound: parseInt(bounds[1] || bounds[0]),
            event: parts[1].trim()
        };
    });

    const foundEvent = specialWeatherRanges.find(range => roll >= range.lowerBound && roll <= range.upperBound);
    if (foundEvent) {
        console.log(`Special weather event triggered: ${foundEvent.event}`);
        triggerSpecialWeatherEvent(foundEvent.event);
    } else {
        console.log("No special weather event triggered.");
    }
}

function triggerSpecialWeatherEvent(event) {
    const specialEventDetails = GlobalWeatherConfig.specialWeatherTable.find(e => e.phenomenon === event);
    if (specialEventDetails) {
        console.log(`Applying special weather event: ${event}`);
        // You could expand this function to actually implement changes based on the event details.
        GlobalWeatherConfig.specialWeatherEvent = event;
        // More detailed application could be done here based on the event's properties.
    }
}

// new version
function applyWindChill(lowTemp, windSpeed, windChillTable) {
    let adjustedTemp = 'N/A';  // Default no wind chill adjustment
    if (lowTemp < 35) {
        const validWindSpeed = findClosestWindSpeed(windSpeed, windChillTable);  // Adjusted to pass windChillTable
        const windChillSubTable = windChillTable[validWindSpeed];  // Now directly using the passed table
        const validTemp = findClosestTemperature(lowTemp, windChillSubTable);  // Uses sub-table to find closest temp

        adjustedTemp = windChillSubTable[validTemp];
        console.log(`Wind chill adjusted temperature: ${adjustedTemp}\u{B0}F for low temp ${lowTemp}\u{B0}F with wind speed ${windSpeed} mph.`);
    } else {
        console.log("Temperature above 35\u{B0}F, no wind chill adjustment applied.");
    }
    return adjustedTemp;  // Return the adjusted temperature or 'N/A'
}

function findClosestWindSpeed(windSpeed) {
    const keys = Object.keys(GlobalWeatherConfig.windChillTable);
    console.log("Keys of windChillTable:", keys);  // Debugging: Check the keys being processed

    const windSpeeds = keys.map(Number).filter(num => !isNaN(num));  // Convert keys to numbers and filter out any NaN values
    console.log("Numerical wind speeds:", windSpeeds);  // Debugging: Check the converted numbers

    if (windSpeeds.length === 0) {
        console.error("No wind speeds available in the windChillTable.");
        return undefined; // or handle it another way, perhaps setting a default value
    }

    const closestSpeed = windSpeeds.reduce((prev, curr) => 
        Math.abs(curr - windSpeed) < Math.abs(prev - windSpeed) ? curr : prev
    );

    console.log(`Closest wind speed found for ${windSpeed} mph is ${closestSpeed} mph.`);
    return closestSpeed;
}

function findClosestTemperature(temp, subTable) {
    if (!subTable || Object.keys(subTable).length === 0) {
        console.error("findClosestTemperature was provided an empty or undefined subTable.");
        return undefined; // Handle error case or set a default value
    }

    const temperatures = Object.keys(subTable).map(Number).filter(num => !isNaN(num));
    if (temperatures.length === 0) {
        console.error("No valid temperature entries found in subTable.");
        return undefined; // Handle error case or set a default value
    }

    const closestTemp = temperatures.reduce((prev, curr) => 
        Math.abs(curr - temp) < Math.abs(prev - temp) ? curr : prev
    );

    console.log(`Closest temperature found for ${temp}°F is ${closestTemp}°F.`);
    return closestTemp;
}

function checkForRainbows(weatherType) {
    let x = weatherType;
    console.log("checkForRainbows() passed weatherType parameter = ", x);
    if (!weatherType) {
        console.log("No precipitation type provided.");
        return { hasRainbow: false, rainbowType: null };
    }

    // Special handling for Sun Shower, which has a specific rainbow chance defined outside the standard table
    if (weatherType.toLowerCase() === "Sun Shower") {
        console.log("Checking for rainbow after Sun Shower, with a 95% chance.");
        const roll = Math.floor(Math.random() * 100) + 1;
        if (roll <= 95) {  // 95% chance for a rainbow
            const rainbowType = determineRainbowType(Math.floor(Math.random() * 100) + 1);
            return { hasRainbow: true, rainbowType: rainbowType };
        } else {
            return { hasRainbow: false, rainbowType: "No rainbow" };
        }
    }

    const precipitationDetails = GlobalWeatherConfig.precipitationTable.find(p => p.type === weatherType);
    if (!precipitationDetails || precipitationDetails.rainbowChance === null) {
        console.log("This weather type does not support rainbow formation or details are missing.");
        return { hasRainbow: false, rainbowType: null };
    }

    console.log(`Checking for rainbow after ${weatherType} ends, with a chance of ${precipitationDetails.rainbowChance}%`);
    const roll = Math.floor(Math.random() * 100) + 1;
    if (roll <= precipitationDetails.rainbowChance) {
        const rainbowTypeRoll = Math.floor(Math.random() * 100) + 1;
        let rainbowType = determineRainbowType(rainbowTypeRoll);
        return { hasRainbow: true, rainbowType: rainbowType };
    } else {
        return { hasRainbow: false, rainbowType: "No rainbow" };
    }
}

function determineRainbowType(rainbowTypeRoll) {
    if (rainbowTypeRoll <= 89) {
        return "Single rainbow";
    } else if (rainbowTypeRoll <= 95) {
        return "Double rainbow (may be an omen)";
    } else if (rainbowTypeRoll <= 98) {
        return "Triple rainbow (almost certainly an omen)";
    } else if (rainbowTypeRoll === 99) {
        return "Bifrost bridge or clouds in the shape of a rain deity";
    } else {
        return "Rain deity or servant in sky";
    }
}

function setWindDirection() {
    const direction = ["South", "Southwest", "West", "Northwest", "North", "Northeast", "East", "Southeast"];
    const index = Math.floor(Math.random() * direction.length);
    GlobalWeatherConfig.windDirection = direction[index];

    console.log(`Wind direction: ${GlobalWeatherConfig.windDirection}`);
}

//Wind Direction Table: roll d20, wind blows from the direction shown
//  Direction   Fall    Winter  Spring  Summer
//  S           1        1      1-2     1-2
//  SW          2        2      3       3
//  W           3        3      4       4
//  NW          4-5      4-6    5       5
//  N           6-10     7-15   6       6
//  NE          11-17    16-17  7-8     7
//  E           18-19    18-19  9-13    8-14
//  SE          20       20     14-20   15-20

function setPrevailingWindDirection(season, roll = Math.floor(Math.random() * 20) + 1) {
    console.log("season is: ", season);
    const windChart = {
        "Winter": [1, 2, 3, 6, 15, 17, 19, 20],
        "Spring": [2, 3, 4, 5, 6, 8, 13, 20],
        "Summer": [2, 3, 4, 5, 6, 7, 14, 20], // Mapped both Low Summer and High Summer to "Summer"
        "Autumn": [1, 2, 3, 5, 10, 17, 19, 20]
    };
    const directions = ["South", "Southwest", "West", "Northwest", "North", "Northeast", "East", "Southeast"];

    // Check and map specific summer types to a generic "Summer" for the wind chart
    if (season === "Low Summer" || season === "High Summer") {
        season = "Summer";
    }

    if (!windChart[season]) {
        console.error(`Season '${season}' is not valid. Defaulting to 'Autumn'.`);
        season = "Autumn";
    }
    
    console.log(`Rolled a ${roll} for prevailing wind direction in ${season}.`);
    
    // Find the matching direction index
    let directionIndex = windChart[season].findIndex(rangeEnd => roll <= rangeEnd);
    directionIndex = directionIndex !== -1 ? directionIndex : directions.length - 1;

    const prevailingDirection = directions[directionIndex];
    console.log(`Prevailing wind direction for ${season}: ${prevailingDirection}`);

    return prevailingDirection;  // Return the direction instead of setting it globally
}

function calculateLatitude(type, value) {
    const baseLatitude = 35; // Greyhawk's latitude
    console.log(`Initial settings: Type=${type}, Value=${value}, Base latitude=${baseLatitude}`);

    let adjustedLatitude = baseLatitude; // Start with the base latitude of Greyhawk

    if (type === "milesNorth") {
        adjustedLatitude += Math.floor(value / 70); // For every 70 miles north, add 1 degree
        console.log(`Adjusted ${value} miles north, resulting in latitude: ${adjustedLatitude}`);
    } else if (type === "milesSouth") {
        adjustedLatitude -= Math.floor(value / 70); // For every 70 miles south, subtract 1 degree
        console.log(`Adjusted ${value} miles south, resulting in latitude: ${adjustedLatitude}`);
    } else {
        adjustedLatitude = parseInt(value, 10); // Assume direct latitude entry if not north or south
        console.log(`Direct latitude entry used, resulting in latitude: ${adjustedLatitude}`);
    }

    return adjustedLatitude;
}
// ${Object.keys(GlobalWeatherConfig.calendarLabels).map(month => `<option value="${month}" ${GlobalWeatherConfig.month === month ? 'selected' : ''}>${GlobalWeatherConfig.calendarLabels[month]}</option>`).join('')}

async function requestWeatherSettings() {
    return new Promise((resolve, reject) => {
        // Define monthDays and weekDays within the function scope
        const monthDays = {
            "Needfest": 7, "Fireseek": 28, "Readying": 28, "Coldeven": 28, "Growfest": 7,
            "Planting": 28, "Flocktime": 28, "Wealsun": 28, "Richfest": 7,
            "Reaping": 28, "Goodmonth": 28, "Harvester": 28, "Brewfest": 7,
            "Patchwall": 28, "Ready'reat": 28, "Sunsebb": 28
        };
        const weekDays = ["Starday", "Sunday", "Moonday", "Godsday", "Waterday", "Earthday", "Freeday"];

        const formHtml = `
            <form>
                <div>
                    <label for="useSimpleCalendar">Generate Simple Calendar Note:</label>
                    <input type="checkbox" id="useSimpleCalendar" name="useSimpleCalendar" ${GlobalWeatherConfig.useSimpleCalendar ? 'checked' : ''}>
                </div>
                <div>
                    <label for="useRealisticWind">Use Realistic Wind Speeds (Mountains):</label>
                    <input type="checkbox" id="useRealisticWind" name="useRealisticWind" ${GlobalWeatherConfig.useRealisticWind ? 'checked' : ''}>
                </div>
                <div>
                    <label for="enableSpecialWeather">Enable Special Weather Events:</label>
                    <input type="checkbox" id="enableSpecialWeather" name="enableSpecialWeather" ${GlobalWeatherConfig.specialWeather ? 'checked' : ''}>
                </div>
                <div>
                    <label for="advanceDate">Advance Date Each Time:</label>
                    <input type="checkbox" id="advanceDate" name="advanceDate" ${GlobalWeatherConfig.advanceDate ? 'checked' : ''}>
                </div>
                <div>
                    <label for="year">Year:</label>
                    <select id="year" name="year">
                        ${Array.from(new Array(38), (_, i) => GlobalWeatherConfig.year - 5 + i).map(year => `<option value="${year}" ${year === GlobalWeatherConfig.year ? 'selected' : ''}>${year}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label for="month">Month/Festival:</label>
                    <select id="month" name="month" onchange="updateDayOptions(this.value)">
                        ${Object.keys(monthDays).map(month => `<option value="${month}" ${GlobalWeatherConfig.month === month ? 'selected' : ''}>${month}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label for="day">Day:</label>
                    <select id="day" name="day" onchange="updateDayOfWeek(this)">
                        ${Array.from({ length: monthDays[GlobalWeatherConfig.month] }, (_, i) => `<option value="${i+1}" ${i+1 === GlobalWeatherConfig.day ? 'selected' : ''}>${i+1}</option>`).join('')}
                    </select>
                    <span id="dayOfWeek">${weekDays[(GlobalWeatherConfig.day-1) % 7]}</span>
                </div>
                <div>
                    <label for="terrain">Terrain:</label>
                    <select id="terrain" name="terrain">
                        ${Object.keys(GlobalWeatherConfig.terrainEffects).map(terrain => `<option value="${terrain}" ${terrain === GlobalWeatherConfig.terrain ? 'selected' : ''}>${terrain}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label for="altitude">Altitude (in thousands of feet):</label>
                    <input type="number" id="altitude" name="altitude" step="0.1" value="${GlobalWeatherConfig.altitude / 1000}" min="0" max="30">
                </div>
                <div>
                    <label for="latitudeType">Latitude Input Type:</label>
                    <select id="latitudeType" name="latitudeType">
                        <option value="latitude" selected>Direct Latitude</option>
                        <option value="milesNorth">Miles North of Greyhawk</option>
                        <option value="milesSouth">Miles South of Greyhawk</option>
                    </select>
                </div>
                <div>
                    <label for="latitude">Latitude or Distance:</label>
                    <input type="text" id="latitude" name="latitude" value="${GlobalWeatherConfig.latitude}">
                </div>
                <div>
                    <label for="continuingWeather">Continuing Weather:</label>
                    <select id="continuingWeather" name="continuingWeather">
                        <option value="none" ${GlobalWeatherConfig.continuingWeatherEvent === 'none' ? 'selected' : ''}>None</option>
                        ${GlobalWeatherConfig.precipitationTable.map(weather => `<option value="${weather.type}" ${GlobalWeatherConfig.continuingWeatherEvent === weather.type ? 'selected' : ''}>${weather.type}</option>`).join('')}
                    </select>
                </div>
            </form>
            <script>
                function updateDayOptions(selectedMonth) {
                    const monthDays = ${JSON.stringify(monthDays)};
                    const daysCount = monthDays[selectedMonth];
                    const daySelect = document.getElementById('day');
                    daySelect.innerHTML = '';
                    for (let i = 1; i <= daysCount; i++) {
                        daySelect.options[daySelect.options.length] = new Option(i, i);
                    }
                    updateDayOfWeek(daySelect);
                }
                function updateDayOfWeek(select) {
                    const weekDays = ${JSON.stringify(weekDays)};
                    const dayOfWeekLabel = document.getElementById('dayOfWeek');
                    dayOfWeekLabel.textContent = weekDays[(select.value - 1) % 7];
                }
                function calculateLatitude(type, distance) {
                    const baseLatitude = 35; // Greyhawk city is at 35 degrees latitude
                    const milesPerDegree = 70; // Approximate number of miles per degree of latitude
                    let calculatedLatitude;
                    if (type === "milesNorth") {
                        calculatedLatitude = baseLatitude + (distance / milesPerDegree);
                    } else if (type === "milesSouth") {
                        calculatedLatitude = baseLatitude - (distance / milesPerDegree);
                    } else {
                        calculatedLatitude = parseFloat(distance); // Assume direct latitude input
                    }
                    return Math.round(calculatedLatitude); // Round the latitude to the nearest whole number
                }
            </script>
        `;

        let dialog = new Dialog({
            title: "Enter Weather Settings",
            content: formHtml,
            buttons: {
                submit: {
                    label: "Submit",
                    callback: (html) => {
                        const settings = {
                            useSimpleCalendar: html.find('#useSimpleCalendar').is(':checked'),
                            useRealisticWind: html.find('#useRealisticWind').is(':checked'),
                            enableSpecialWeather: html.find('#enableSpecialWeather').is(':checked'),
                            advanceDate: html.find('#advanceDate').is(':checked'),
                            year: parseInt(html.find('#year').val(), 10),
                            month: html.find('#month').val(),
                            day: parseInt(html.find('#day').val(), 10),
                            terrain: html.find('#terrain').val(),
                            altitude: parseFloat(html.find('#altitude').val()) * 1000,
                            latitudeType: html.find('#latitudeType').val(),
                            latitudeInput: html.find('#latitude').val().trim(),
                            continuingWeather: html.find('#continuingWeather').val()
                        };

                        // Calculate adjusted latitude if needed
                        if (settings.latitudeType !== 'latitude' && settings.latitudeInput && !isNaN(settings.latitudeInput)) {
                            settings.latitude = calculateLatitude(settings.latitudeType, parseFloat(settings.latitudeInput));
                        } else {
                            settings.latitude = parseFloat(settings.latitudeInput); // Direct latitude input
                        }

                        // Update GlobalWeatherConfig with the new settings
                        GlobalWeatherConfig.useSimpleCalendar = settings.useSimpleCalendar;
                        GlobalWeatherConfig.useRealisticWind = settings.useRealisticWind;
                        GlobalWeatherConfig.specialWeather = settings.enableSpecialWeather;
                        GlobalWeatherConfig.advanceDate = settings.advanceDate;
                        GlobalWeatherConfig.year = settings.year;
                        GlobalWeatherConfig.month = settings.month;
                        GlobalWeatherConfig.day = settings.day;
                        GlobalWeatherConfig.terrain = settings.terrain;
                        GlobalWeatherConfig.altitude = settings.altitude;
                        GlobalWeatherConfig.latitude = settings.latitude;
                        GlobalWeatherConfig.continuingWeatherEvent = settings.continuingWeather;
                        GlobalWeatherConfig.precipContinues = settings.continuingWeather !== 'none';

                        // Log the updated settings for verification
                        console.log("Updated GlobalWeatherConfig:", GlobalWeatherConfig);
                        
                        resolve(settings);
                    }
                },
                cancel: {
                    label: "Cancel",
                    callback: () => {
                        reject(new Error("Weather setting update was canceled by the user."));
                    }
                }
            },
            default: "submit"
        });
        dialog.render(true);
    });
}



function updateGlobalWeatherConfig(month, terrain, altitude, latitude) {
    //GlobalWeatherConfig.year = year;
    GlobalWeatherConfig.month = month;
    //GlobalWeatherConfig.day = day;
    GlobalWeatherConfig.terrain = terrain;
    GlobalWeatherConfig.altitude = altitude;
    GlobalWeatherConfig.latitude = latitude;

    // Update terrain flags based on selected terrain
    updateTerrainFlags(terrain);

    // Add any additional logic to handle changes in configuration
    console.log("Global Weather Configuration Updated:", GlobalWeatherConfig);
}

function updateTerrainFlags(terrain) {
    switch (terrain) {
        case 'Rough terrain or hills':
        case 'Forest':
        case 'Jungle':
        case 'Swamp or marsh':
        case 'Dust':
        case 'Plains':
        case 'Desert':
        case 'Mountains':
        case 'Seacoast':
            GlobalWeatherConfig.flags.onLand = true;
            console.log("Terrain is land-based:", terrain, "Setting onLand flag to true.");
            break;
        case 'At sea':
            GlobalWeatherConfig.flags.atSea = true;
            console.log("Terrain is sea-based:", terrain, "Setting atSea flag to true.");
            break;
        default:
            console.log("Terrain does not match any predefined categories:", terrain);
            break;
    }

    console.log(`Terrain flags updated: onLand=${GlobalWeatherConfig.flags.onLand}, atSea=${GlobalWeatherConfig.flags.atSea}`);
}

function updateHumidityAndEffects(highTemp) {
    let effectsDescription = "Nothing significant."; // Default message
    let humidity = 0; // Default humidity value

    if (highTemp > 75) {
        humidity = evalDice("d100"); // Roll d100 for humidity percentage
        console.log("Rolling d100 for humidity percent =", humidity);

        let tempHumiditySum = highTemp + humidity;
        console.log(`Current Temperature: ${highTemp}\u{B0}F, Humidity: ${humidity}%, Humidity Sum: ${tempHumiditySum}`);

        // Determine the effects based on the sum of temperature and humidity
        if (tempHumiditySum >= 140 && tempHumiditySum <= 160) {
            effectsDescription = "Move Normal, AC 0, To hit 0, Dexterity -1, Vision Normal, Rest per hour: 2 turns, Spell failure chance: 5%";
        } else if (tempHumiditySum > 160 && tempHumiditySum <= 180) {
            effectsDescription = "Move x3/4, AC 0, To hit -1, Dexterity -1, Vision x3/4, Rest per hour: 3 turns, Spell failure chance: 10%";
        } else if (tempHumiditySum > 180 && tempHumiditySum <= 200) {
            effectsDescription = "Move x1/2, AC -1, To hit -2, Dexterity -2, Vision x1/2, Rest per hour: 4 turns, Spell failure chance: 15%";
        } else if (tempHumiditySum > 200) {
            effectsDescription = "Move x1/4, AC -2, To hit -3, Dexterity -3, Vision x1/4, Rest per hour: 5 turns, Spell failure chance: 20%";
        }
    } else {
        console.log("Temperature is not high enough for heat and humidity effects.");
    }

    console.log(effectsDescription);
    return { humidity, effectsDescription }; // Return both humidity and its effects
}

// new version
function adjustSunTimesForLatitude(latitude, month) {
    const monthData = GlobalWeatherConfig.baselineData[month];
    const baselineSunrise = monthData.sunrise;
    const baselineSunset = monthData.sunset;
    console.log("Baseline sunrise: ", baselineSunrise, " & sunset: ", baselineSunset);

    const latitudeDifference = latitude - 40;  // 40 degrees is presumably the baseline latitude
    const timeAdjustment = latitudeDifference * 2;  // 2 minutes per degree

    const sunriseDate = convertTimeToDate(baselineSunrise);
    const sunsetDate = convertTimeToDate(baselineSunset);

    sunriseDate.setMinutes(sunriseDate.getMinutes() + timeAdjustment);
    sunsetDate.setMinutes(sunsetDate.getMinutes() + timeAdjustment);

    const adjustedSunrise = `${sunriseDate.getHours().toString().padStart(2, '0')}:${sunriseDate.getMinutes().toString().padStart(2, '0')}`;
    const adjustedSunset = `${sunsetDate.getHours().toString().padStart(2, '0')}:${sunsetDate.getMinutes().toString().padStart(2, '0')}`;

    console.log(`Adjusted Sunrise Time: ${adjustedSunrise}, Adjusted Sunset Time: ${adjustedSunset}`);

    return { sunrise: adjustedSunrise, sunset: adjustedSunset };
}

function convertTimeToDate(timeString) {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return date;
}

// Helper function to convert time string to Date object
function convertTimeToDate(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return date;
}

function getWindSpeedLabel(mph) {
    if (mph >= 0 && mph <= 1) {
        return "Calm";
    } else if (mph >= 2 && mph <= 7) {
        return "Light Breeze";
    } else if (mph >= 8 && mph <= 18) {
        return "Moderate Breeze";
    } else if (mph >= 19 && mph <= 31) {
        return "Strong Breeze";
    } else if (mph >= 32 && mph <= 54) {
        return "Strong 'Gale'";
    } else if (mph >= 55 && mph <= 72) {
        return "Storm Winds";
    } else if (mph >= 73 && mph <= 136) {
        return "Hurricane Winds";
    } else {
        return "Unusually Strong Winds";
    }
}

function getWindEffects(windSpeed, terrain, altitude) {
    console.log("Checking wind effects for speed:", windSpeed, "at terrain:", terrain, "and altitude:", altitude);
    const highWindsTable = GlobalWeatherConfig.highWindsTable;

    for (const entry of highWindsTable) {
        if (terrain === entry.terrain && altitude >= entry.altitudeMin && altitude <= entry.altitudeMax) {
            if (windSpeed >= entry.minSpeed && windSpeed <= entry.maxSpeed) {
                return formatWindEffects(entry.effects, { onLand: GlobalWeatherConfig.flags.onLand, atSea: GlobalWeatherConfig.flags.atSea, inAir: GlobalWeatherConfig.flags.inAir, inBattle: GlobalWeatherConfig.flags.inBattle });
            }
        }
    }
    return "No significant wind effects.";
}

function formatWindEffects(effects, flags) {
    let effectsString = "";
    effectsString += flags.onLand ? `Land: ${effects.onLand}<br>` : "";
    effectsString += flags.atSea ? `Sea: ${effects.atSea}<br>` : "";
    effectsString += flags.inAir ? `Air: ${effects.inAir}<br>` : "";
    effectsString += flags.inBattle ? `Battle: ${effects.inBattle}<br>` : "";
    return effectsString || "No significant effects under current conditions.";
}

function getDayOfWeek(dayOfMonth) {
    const weekDays = ["Starday", "Sunday", "Moonday", "Godsday", "Waterday", "Earthday", "Freeday"];
    // Calculate zero-based index: (dayOfMonth - 1) % 7 ensures we wrap around every 7 days, starting from Starday.
    return weekDays[(dayOfMonth - 1) % 7];
}

async function fetchCalendarData() {
    const currentDate = SimpleCalendar.api.currentDateTime();
    const currentWeekday = SimpleCalendar.api.getCurrentWeekday().name;
    const currentSeason = SimpleCalendar.api.getCurrentSeason().name;
    const currentMonth = SimpleCalendar.api.getCurrentMonth().name;
    // Return a structured object with the necessary data
    return {
        year: currentDate.year,
        month: currentMonth,
        day: currentDate.day,
        weekday: currentWeekday,
        season: currentSeason
    };
}

async function addWeatherReportToSimpleCalendar() {
    // Get current date from Simple Calendar
    const currentDate = SimpleCalendar.api.currentDateTime();
    const weatherEffect = findWeatherEffect(GlobalWeatherConfig.initialWeatherEvent);
    const specialWeatherEffect = findSpecialWeatherEffect(GlobalWeatherConfig.specialWeatherEvent);
    const windLabel = getWindSpeedLabel(GlobalWeatherConfig.windSpeed);
    const currentMonth = SimpleCalendar.api.getCurrentMonth().name;
    const currentDay = SimpleCalendar.api.getCurrentDay().name;
    const currentSeason = SimpleCalendar.api.getCurrentSeason().name;
    const currentWeekday = SimpleCalendar.api.getCurrentWeekday().name;

    let rainbowDisplay = "No";
    if (GlobalWeatherConfig.flags.rainbow && GlobalWeatherConfig.flags.rainbowType) {
        rainbowDisplay = GlobalWeatherConfig.flags.rainbowType;
    }
    
    let highWindNotes = getWindEffects(GlobalWeatherConfig.windSpeed);

    // Create a summary of the weather conditions
    const weatherSummary = `
        Month: ${currentMonth}, Terrain: ${GlobalWeatherConfig.terrain}, Altitude: ${GlobalWeatherConfig.altitude} ft., Latitude: ${GlobalWeatherConfig.latitude}N°<br>
        Sunrise: ${GlobalWeatherConfig.adjustedSunrise}, Sunset: ${GlobalWeatherConfig.adjustedSunset}<br>
        High: ${GlobalWeatherConfig.dailyHighTemp}°F, Low: ${GlobalWeatherConfig.dailyLowTemp}°F, Wind Chill: ${GlobalWeatherConfig.temperature.effective}°F<br>
        Sky Condition: ${GlobalWeatherConfig.skyCondition}; ${windLabel} (${GlobalWeatherConfig.windSpeed} mph from ${GlobalWeatherConfig.windDirection})<br>
        Precipitation: ${GlobalWeatherConfig.precipType || "None"} for ${GlobalWeatherConfig.initialWeatherEventDuration}, Amount: ${GlobalWeatherConfig.precipAmount || "0"}<br> 
        Wind Notes: ${highWindNotes}<br> 
        Rainbow: ${rainbowDisplay}<br>`;

    // Generate formatted notes
    const standardNotes = weatherEffect ? "Standard Notes: " + formatFractions(weatherEffect.notes) : "";
    const specialNotes = specialWeatherEffect ? "Special Notes: " + formatFractions(specialWeatherEffect.notes) : "";
    const humidityNotes = GlobalWeatherConfig.humidityEffects;
        
    // Fetch the current date and time from Simple Calendar
    const currentDateTime = SimpleCalendar.api.currentDateTimeDisplay();
    const noteDate = `${currentDateTime.monthName} ${currentDateTime.day}${currentDateTime.daySuffix}, ${currentDateTime.year}`; // "Coldeven 11th, 568"


    // Date for note: Start and end on the same day, marked as all-day
    const startDate = {
        year: currentDate.year,
        month: currentDate.month, // Assumes zero-based indexing if necessary
        day: currentDate.day,
        hour: 0,
        minute: 0,
        seconds: 0
    };
    const endDate = {
        year: currentDate.year,
        month: currentDate.month,
        day: currentDate.day,
        hour: 23,
        minute: 59,
        seconds: 59
    };

    // Create note content incorporating weather details and notes
    //const noteContent = `Weather Report for ${noteDate}:\n${weatherSummary}\n${standardNotes}\n${specialNotes}`;
    const noteContent = `${weatherSummary}\n${standardNotes}\n${specialNotes}\n${humidityNotes}`;

    // Fetch all user IDs
    const usersToRemind = getAllUserIDs();  // Fetch all user IDs from the game

    // Ensure to add the condition check before trying to execute the addNote function
    if (GlobalWeatherConfig.useSimpleCalendar) {
        try {
            const newJournal = await SimpleCalendar.api.addNote(
                "Daily Weather Report",
                noteContent.trim(),
                startDate,
                endDate,
                true,  // allDay
                SimpleCalendar.api.NoteRepeat.Never, // does not repeat
                ['Weather'],  // categories
                "active",  // calendarId: use the active calendar
                null,  // no macro associated
                ['default'],  // visible to all users
                usersToRemind  // users to remind
            );
            if (newJournal) {
                console.log("Weather report added to Simple Calendar:", newJournal);
            } else {
                console.error("Failed to add weather report to Simple Calendar.");
            }
        } catch (error) {
            console.error("Error adding weather report to Simple Calendar:", error);
        }
    }
}

async function scheduleContinuationNote(weatherEffect) {
    // Check if Simple Calendar integration is enabled
    if (!GlobalWeatherConfig.useSimpleCalendar) {
        console.log("Simple Calendar integration is disabled. Skipping scheduleContinuationNote.");
        return; // Exit the function if Simple Calendar is not being used
    }
    const currentDate = SimpleCalendar.api.currentDateTime();
    const tomorrow = new Date(currentDate.year, currentDate.month - 1, currentDate.day + 1); // Adjust month for zero-based index
    const noteDate = {
        year: tomorrow.getFullYear(),
        month: tomorrow.getMonth() + 1, // Convert back to one-based index for Simple Calendar
        day: tomorrow.getDate(),
        hour: 0,
        minute: 0,
        seconds: 0
    };
    const endDate = { ...noteDate, hour: 23, minute: 59, seconds: 59 };

    const noteContent = `Weather continuation: Please roll for weather type "${weatherEffect.type}" for today.`;
    try {
        const newJournal = await SimpleCalendar.api.addNote(
            "Weather Continuation",
            noteContent,
            noteDate,
            endDate,
            true, // allDay
            SimpleCalendar.api.NoteRepeat.Never,
            ['Weather Continuation'], // Category
            "active", // calendarId: use the active calendar
            null, // no macro associated
            ['default'], // visible to all users
            getAllUserIDs() // users to remind
        );
        console.log(newJournal ? "Continuation weather report added to Simple Calendar." : "Failed to add continuation weather report.");
    } catch (error) {
        console.error("Error adding continuation weather report to Simple Calendar:", error);
    }
}

// new version
function resetWeatherData(weatherConfig) {
    console.log("resetWeatherEvents called");
    
    // Reset terrain flags
    const flags = weatherConfig.flags;
    flags.onLand = false;
    flags.atSea = false;
    flags.inAir = false;
    flags.inBattle = false;
    console.log("reset onLand flag = ", flags.onLand)
    console.log("reset atSea flag = ", flags.atSea)
    console.log("reset inAir flag =", flags.inAir);
    console.log("reset inBattle flag =", flags.inBattle);
    
    // Resetting event-specific details
    weatherConfig.initialWeatherEvent = "none";
    weatherConfig.initialWeatherEventDuration = 0;
    //weatherConfig.continuingWeatherEvent = "none";
    //weatherConfig.continuingWeatherEventDuration = 0;
	
	// Reset special weather event
	weatherConfig.specialWeather = false;
	weatherConfig.specialWeatherEvent = "none";
	weatherConfig.specialWeatherEventDuration = 0;

    // Resetting precipitation details
    weatherConfig.precipType = "none";
    weatherConfig.precipAmount = 0;

    // Resetting temperature specifics
    weatherConfig.dailyHighTemp = 0;
    weatherConfig.dailyLowTemp = 0;
    weatherConfig.temperature.effective = undefined;  // Reset effective temperature if used

    // Resetting wind details
    weatherConfig.windSpeed = 0;
    weatherConfig.windSpeedInitial = 0; // Ensure the initial wind speed is reset as well

    // Reset humidity and sky condition to default states
    weatherConfig.humidity = 0; // Reset humidity to a default or recalculated value
    weatherConfig.skyCondition = "clear"; // Reset sky condition to a default state

    // Log the reset to ensure it's traceable
    console.log("Weather event details and related configurations have been reset.");
}

function getPrecipitationDetails(weatherEffect) {
    // Handle cases where there is explicitly no precipitation or weather effect is undefined
    if (!weatherEffect || weatherEffect.type === "none" || weatherEffect.type === null) {
        console.log("No precipitation or weather effect is undefined.");
        return { precipitation: "No precipitation", duration: "No duration" };
    }

    // Attempt to find the weather effect in the standard or special weather tables
    let tableEntry = GlobalWeatherConfig.standardWeatherTable.find(entry => entry.name === weatherEffect.type);
    if (!tableEntry) {
        tableEntry = GlobalWeatherConfig.specialWeatherTable.find(entry => entry.phenomenon === weatherEffect.type);
    }

    // If no matching table entry is found, assume no precipitation
    if (!tableEntry) {
        console.log("No table entry found for weather type:", weatherEffect.type);
        return { precipitation: "No precipitation", duration: "No duration" };
    }

    // Calculate the precipitation amount and duration using evalDice
    const precipitation = tableEntry.precipDice 
        ? evalDice(tableEntry.precipDice) + " inches"  // Use precipDice if available, assume standard weather
        : evalDice(tableEntry.precipitation) + " inches";  // Use direct precipitation amount for special weather

    const duration = evalDice(tableEntry.duration) + " " + (tableEntry.durationUnit || "hours");

    return {
        precipitation: precipitation,
        duration: duration
    };
}

function determineSeason(month) {
    const seasons = {
        "Needfest": "Winter",
        "Fireseek": "Winter",
        "Readying": "Spring",
        "Coldeven": "Spring",
        "Growfest": "Spring",
        "Planting": "Low Summer",
        "Flocktime": "Low Summer",
        "Wealsun": "Low Summer",
        "Richfest": "High Summer",
        "Reaping": "High Summer",
        "Goodmonth": "High Summer",
        "Harvester": "High Summer",
        "Brewfest": "Autumn",
        "Patchwall": "Autumn",
        "Ready'reat": "Autumn",
        "Sunsebb": "Winter"
    };
    
    // Validate month and return the corresponding season, default to 'Unknown' if the month is not valid
    return seasons[month] || "Unknown";
}

function compileWeatherNotes(weatherType, terrain, month, day, temperature, season, skyCondition) {
    console.log(`Compiling weather notes for type: ${weatherType}, terrain: ${terrain}, month: ${month}, day: ${day}`);
    let notes = [];

    // Check standard weather table for extended details
    const weatherDetails = GlobalWeatherConfig.standardWeatherTable.find(item => item.name === weatherType);
    if (weatherDetails) {
        console.log(`Standard weather details found for ${weatherType}:`, weatherDetails);
        let detailsNotes = [
            weatherDetails.notes,
            `Movement Rate: ${weatherDetails.movement}`,
            `Range of Normal Vision: ${weatherDetails.NormVisionRng}`,
            `Range of IR Vision: ${weatherDetails.IRvisionRng}`,
            `Effect on Tracking: ${weatherDetails.tracking}`,
            `Chance of Getting Lost: ${weatherDetails.lostChance}`
        ].filter(detail => detail).join(". ");
        notes.push(detailsNotes);
    } else {
        console.log(`No standard weather details found for ${weatherType}.`);
    }

    // Check special weather table for extended details
    const specialWeatherDetails = GlobalWeatherConfig.specialWeatherTable.find(item => item.phenomenon === weatherType);
    if (specialWeatherDetails) {
        console.log(`Special weather details found for ${weatherType}:`, specialWeatherDetails);
        let specialNotes = [
            specialWeatherDetails.notes,
            `Precipitation: ${specialWeatherDetails.precipDice}`,
            `Duration: ${specialWeatherDetails.duration} ${specialWeatherDetails.durationUnit}`,
            `Area Effect: ${specialWeatherDetails.areaEffect}`,
            `Movement Rate: ${specialWeatherDetails.movement}`,
            `Range of Normal Vision: ${specialWeatherDetails.NormVisionRng}`,
            `Range of IR Vision: ${specialWeatherDetails.IRvisionRng}`,
            `Effect on Tracking: ${specialWeatherDetails.tracking}`,
            `Chance of Getting Lost: ${specialWeatherDetails.lostChance}`,
        ].filter(detail => detail).join("; ");
        notes.push(specialNotes);

        // Determine the cause of the weather if it's a special weather event
        if (Math.random() <= 0.9) { // 10% chance to check for extraordinary causes
            const cause = determineCauseOfWeatherPhenomenon();
            notes.push(`<br>Possible extraordinary cause of the weather: ${cause}`);
        }
    } else {
        console.log(`No special weather details found for ${weatherType}.`);
    }

    console.log(`Windchill temperature: ${temperature}°F, Sky condition:  ${skyCondition}, Weather type: ${weatherType}`);
     // Frostbite note
    if (temperature <= -40) {
        console.log(`Frostbite warning triggered at temperature: ${temperature}°F`);
        notes.push("At temperatures of -40 degrees F and below, frostbite will destroy an exposed body part in 10-30 minutes.");
    }

    // Snowblindness note - Only in winter season, clear skies, and no significant weather phenomenon
    if (season === 'Winter' && skyCondition.toLowerCase() === 'clear' && (weatherType === "none" || weatherType === null || weatherType === "undefined")) {
        console.log(`Snowblindness warning triggered during ${season}, with clear skies and no significant weather event.`);
        notes.push("On a sunny winter day, there is a cumulative 2% chance per hour that a character will become snowblind for d4 turns. " +
        "The effects of this are equivalent to a Light spell cast on the character's visage.");
    }

    
    // Check terrain effects table for notes
    const terrainNote = GlobalWeatherConfig.terrainEffects[terrain]?.notes;
    if (terrainNote) {
        console.log(`Terrain notes for ${terrain}: ${terrainNote}`);
        notes.push(terrainNote);
    } else {
        console.log(`No specific terrain notes for ${terrain}.`);
    }

    // Include lycanthrope activity based on moon phases
    const lycanthropeActivity = evaluateLycanthropeActivity(month, day);
    if (lycanthropeActivity !== 'Normal.') {
        console.log(`Lycanthrope activity noted: ${lycanthropeActivity}`);
        notes.push(`Lycanthrope Activity: ${lycanthropeActivity}`);
    } else {
        console.log(`No special lycanthrope activity for ${month} ${day}.`);
    }

    // Combine all notes into a single string
    const compiledNotes = notes.join(". ") || "No specific notes for current conditions.";
    console.log(`Compiled notes: ${compiledNotes}`);
    return compiledNotes;
}

function compileWindNotes(windSpeed) {
    // Locate the appropriate wind effects from the highWindsTable based on the wind speed
    const windEffects = GlobalWeatherConfig.highWindsTable.find(
        item => windSpeed >= item.minSpeed && windSpeed <= item.maxSpeed
    );

    // Extract the effects based on the environment (onLand, atSea, inAir, inBattle)
    let notes = [];
    if (windEffects) {
        if (windEffects.effects.onLand !== "No effect") notes.push(`<br>On Land: ${windEffects.effects.onLand}`);
        if (windEffects.effects.atSea !== "No effect") notes.push(`At Sea: ${windEffects.effects.atSea}`);
        if (windEffects.effects.inAir !== "No effect") notes.push(`In Air: ${windEffects.effects.inAir}`);
        if (windEffects.effects.inBattle !== "No effect") notes.push(`In Battle: ${windEffects.effects.inBattle}`);
    }

    // Check if there are any significant effects to note
    return notes.length > 0 ? notes.join("<br>") : "N/A";
}

const moonPhases = {
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
        "Sunsebb": {4: "1st quarter"},
    }
};

function getMoonPhase(moon, month, day) {
    const monthData = moonPhases[moon][month];
    const days = Object.keys(monthData).map(Number).sort((a, b) => a - b);
    
    for (let i = 0; i < days.length; i++) {
        if (day < days[i]) {
            const previousDay = i === 0 ? days[days.length - 1] : days[i - 1];
            const previousPhase = monthData[previousDay];
            return `${previousPhase}+`;
        } else if (day === days[i]) {
            return monthData[days[i]];
        }
    }

    // If no exact or earlier day found, return the last phase with a plus indicating the transition
    return `${monthData[days[days.length - 1]]}+`;
}

function evaluateLycanthropeActivity(month, day) {
    const lunaPhase = getMoonPhase('Luna', month, day);
    const celenePhase = getMoonPhase('Celene', month, day);

    const lycanthropeResponses = {
        normal: 'Normal.',
        heightened: 'Heightened.',
        maximum: 'Maximum.'
    };

    // Check for Midsummer's Night which is a special case (you need to define the exact date)
    if (month === 'Richfest' && day === 4) {
        return lycanthropeResponses.maximum;
    }

    // Determine activity based on Luna's phases
    if (lunaPhase.includes('Full')) {
        // If both moons are full
        if (celenePhase.includes('Full')) {
            return lycanthropeResponses.maximum;
        }
        // 90% affected by Luna
        return lycanthropeResponses.heightened;
    }

    // Additional 10% affected by Celene only
    if (celenePhase.includes('Full')) {
        return lycanthropeResponses.heightened;
    }

    // Normal activity for other phases
    return lycanthropeResponses.normal;
}

function determineSpecialWeather(terrain) {
    console.log(`Determining special weather for terrain: ${terrain}`);

    // Attempt to fetch the terrain-specific data from the global configuration
    const terrainData = GlobalWeatherConfig.terrainEffects[terrain];
    if (!terrainData || !terrainData.specialWeather || terrainData.specialWeather.length === 0) {
        console.log("No special weather configuration found or empty special weather list for terrain:", terrain);
        return { precipitationFlag: false, type: "none" };
    }

    // Log the special weather possibilities for debugging
    console.log(`Special weather options for ${terrain}:`, terrainData.specialWeather.map(sw => `${sw.range[0]}-${sw.range[1]}: ${sw.event}`).join(", "));

    // Roll for special weather determination
    const roll = Math.floor(Math.random() * 100) + 1;
    console.log(`Rolled for special weather check: ${roll}`);

    // Iterate over special weather options to find a match
    for (const option of terrainData.specialWeather) {
        console.log(`Checking if roll ${roll} is between ${option.range[0]} and ${option.range[1]} for ${option.event}`);
        if (roll >= option.range[0] && roll <= option.range[1]) {
            console.log(`Special weather type determined based on terrain and roll: ${option.event}`);
            GlobalWeatherConfig.specialWeatherEvent = option.event;  // Update the global setting
            return { precipitationFlag: true, type: option.event };
        }
    }

    // Default case if no specific event is matched
    console.log("No special weather type matched the roll, defaulting to generic special weather.");
    GlobalWeatherConfig.specialWeatherEvent = "generic special weather"; // Update the global event type
    return { precipitationFlag: true, type: "generic special weather" };
}

function findSpecialWeatherData(phenoName) {
    // Log the starting of the function and what it is looking for
    console.log(`Searching for special weather data for phenomenon: ${phenoName}`);

    // Access the global specialWeatherTable from the configuration
    const specialWeatherTable = GlobalWeatherConfig.specialWeatherTable;
    console.log(`Total special weather entries available: ${specialWeatherTable.length}`);

    // Find the matching weather phenomenon based on the name
    const weatherData = specialWeatherTable.find(weather => weather.phenomenon === phenoName);

    // Log the result of the search
    if (weatherData) {
        console.log(`Special weather data found for ${phenoName}:`, weatherData);
        return weatherData;
    } else {
        console.log(`No special weather data found for ${phenoName}.`);
        return null; // Return null if no matching phenomenon is found
    }
}

function determineCauseOfWeatherPhenomenon() {
    const rollForCause = Math.floor(Math.random() * 100) + 1;
    console.log(`Rolling for the cause of the weather phenomenon: ${rollForCause}`);

    if (rollForCause <= 30) {
        return "Elemental(s) or giant(s).";
    } else if (rollForCause <= 60) {
        return "Elemental(s) under NPC control.";
    } else if (rollForCause <= 90) {
        return "NPC or monster.";
    } else if (rollForCause <= 98) {
        return "Demons, devils, or creatures from the appropriate Elemental Plane.";
    } else if (rollForCause === 99) {
        return "A deity or his/her servants.";
    } else {
        return "A battle between two or more deities.";
    }
}

function determineWeatherContinuation(currentWeatherType) {
    const weatherDetails = GlobalWeatherConfig.precipitationTable.find(p => p.type === currentWeatherType);
    if (!weatherDetails) {
        console.log("Weather type not found in precipitation table:", currentWeatherType);
        // Reset the global weather continuation variables if the type isn't found
        GlobalWeatherConfig.continuingWeatherEvent = "none";
        GlobalWeatherConfig.continuingWeatherEventDuration = 0;
        return {
            continues: false,
            newWeatherType: "none",
            continuationChance: 0
        };
    }

    const continuationRoll = Math.floor(Math.random() * 100) + 1;
    console.log(`%cRolled for weather continuation: ${continuationRoll} vs weather: ${weatherDetails.type} continuation chance: ${weatherDetails.contChance}`, "color: blue; font-weight: bold");

    if (continuationRoll <= weatherDetails.contChance) {
        const changeTypeRoll = Math.floor(Math.random() * 10) + 1;
        console.log(`Roll for type of precipitation change: ${changeTypeRoll}`);

        let newWeatherType = currentWeatherType;
        if (changeTypeRoll === 1) {
            newWeatherType = moveUpOneLine(currentWeatherType);
            console.log(`Weather type moves up one line in the precipitation table to: ${newWeatherType}`);
        } else if (changeTypeRoll === 10) {
            newWeatherType = moveDownOneLine(currentWeatherType);
            console.log(`Weather type moves down one line in the precipitation table to: ${newWeatherType}`);
        }

        GlobalWeatherConfig.continuingWeatherEvent = newWeatherType;
        GlobalWeatherConfig.continuingWeatherEventDuration = determineDuration(newWeatherType);

        return {
            continues: true,
            newWeatherType: newWeatherType,
            continuationChance: weatherDetails.contChance
        };
    } else {
        // Reset the global weather continuation variables if the weather does not continue
        GlobalWeatherConfig.continuingWeatherEvent = "none";
        GlobalWeatherConfig.continuingWeatherEventDuration = 0;
        return {
            continues: false,
            newWeatherType: "none",
            continuationChance: weatherDetails.contChance
        };
    }
}

function determineDuration(weatherType) {
    const weatherDetails = GlobalWeatherConfig.standardWeatherTable.find(p => p.name === weatherType);
    if (!weatherDetails) {
        console.log("Weather type not found in standard weather table:", weatherType);
        return "unknown duration";
    }

    // Assuming weatherDetails has a duration field in dice notation
    const duration = evalDice(weatherDetails.duration);
    console.log(`Determined duration for weather type ${weatherType}: ${duration} ${weatherDetails.durationUnit || 'units'}`);

    return `${duration} ${weatherDetails.durationUnit || 'units'}`;
}

function moveUpOneLine(currentWeatherType) {
    const currentIndex = GlobalWeatherConfig.precipitationTable.findIndex(p => p.type === currentWeatherType);
    return currentIndex > 0 ? GlobalWeatherConfig.precipitationTable[currentIndex - 1].type : currentWeatherType;
}

function moveDownOneLine(currentWeatherType) {
    const currentIndex = GlobalWeatherConfig.precipitationTable.findIndex(p => p.type === currentWeatherType);
    return currentIndex < GlobalWeatherConfig.precipitationTable.length - 1 ? GlobalWeatherConfig.precipitationTable[currentIndex + 1].type : currentWeatherType;
}

function advanceDate() {
    const monthDays = {
        "Needfest": 7, "Fireseek": 28, "Readying": 28, "Coldeven": 28, "Growfest": 7,
        "Planting": 28, "Flocktime": 28, "Wealsun": 28, "Richfest": 7,
        "Reaping": 28, "Goodmonth": 28, "Harvester": 28, "Brewfest": 7,
        "Patchwall": 28, "Ready'reat": 28, "Sunsebb": 28
    };

    GlobalWeatherConfig.day += 1;
    if (GlobalWeatherConfig.day > monthDays[GlobalWeatherConfig.month]) {
        GlobalWeatherConfig.day = 1;
        const monthKeys = Object.keys(monthDays);
        const currentIndex = monthKeys.indexOf(GlobalWeatherConfig.month);
        if (currentIndex + 1 >= monthKeys.length) {
            GlobalWeatherConfig.month = monthKeys[0];
            GlobalWeatherConfig.year += 1;
        } else {
            GlobalWeatherConfig.month = monthKeys[currentIndex + 1];
        }
    }
    console.log("Date advanced to:", GlobalWeatherConfig.month, GlobalWeatherConfig.day, GlobalWeatherConfig.year);
}
Hooks.once('init', () => {
    // Existing settings
    console.log("Initializing weather module");

    game.settings.register('dnd-weather', 'useSimpleCalendar', {
        name: "Use Simple Calendar for Dates",
        hint: "Check this box to use Simple Calendar for date management instead of manual month selection.",
        scope: 'world',  // This setting is stored on a per-world basis.
        config: true,  // This setting provides a configuration UI.
        type: Boolean,
        default: false,
    });

    game.settings.register('dnd-weather', 'advanceDateEachTime', {
        name: "Advance Date Each Time",
        hint: "Check this box to automatically advance the date each time weather is generated.",
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
    });
/* 
    game.settings.register('dnd-weather', 'defaultMonth', {
        name: "Default Month",
        hint: "Set the default month if Simple Calendar is not used.",
        scope: 'world',
        config: true,
        type: String,
        choices: {
            "needfest": "Needfest",
            "fireseek": "Fireseek",
            "readying": "Readying",
            "coldeven": "Coldeven",
            "growfest": "Growfest",
            "planting": "Planting",
            "flocktime": "Flocktime",
            "wealsun":  "Wealsun",
            "richfest": "Richfest",
            "reaping":  "Reaping",
            "goodmonth": "Goodmonth",
            "harvester": "Harvester",
            "brewfest": "Brewfest",
            "patchwall": "Patchwall",
            "readyreat": "Readyreat",
            "sunsebb":  "Sunsebb"
        },
        default: "needfest",
    });

    game.settings.register('dnd-weather', 'defaultTerrain', {
        name: "Default Terrain",
        hint: "Select the default terrain type for weather conditions.",
        scope: 'world',
        config: true,
        type: String,
        choices: {
            "rough terrain or hills": "Rough terrain or Hills",
            "forest": "Forest",
            "forest, slyvan": "Forest, Sylvan",
            "jungle": "Jungle",
            "swamp or marsh": "Swamp or marsh",
            "swamp or marsh, cold": "Swamp or marsh, cold",
            "dust": "Dust",
            "plains": "Plains",
            "desert": "Desert",
            "mountains": "Mountains",
            "seacoast, warm current": "Seacoast, warm current",
            "seacoast, cold current": "Seacoast, cold current",
            "at sea, warm current": "At Sea, warm current",
            "at sea, cold current": "At Sea, cold current"
        },
        default: "plains",
    });
 */
    game.settings.register('dnd-weather', 'defaultYear', {
        name: "Default Year",
        hint: "Set the default year for weather generation.",
        scope: 'world',
        config: true,
        type: Number,
        default: 568,
    });

    /* game.settings.register('dnd-weather', 'defaultDay', {
        name: "Default Day",
        hint: "Set the default day if Simple Calendar is not used.",
        scope: 'world',
        config: true,
        type: Number,
        default: 1,
    });
 */
    game.settings.register('dnd-weather', 'defaultLatitude', {
        name: "Default Latitude",
        hint: "Set the default latitude for weather generation.",
        scope: 'world',
        config: true,
        type: Number,
        default: 32,
    });

    game.settings.register('dnd-weather', 'defaultAltitude', {
        name: "Default Altitude",
        hint: "Set the default altitude for weather generation (in feet).",
        scope: 'world',
        config: true,
        type: Number,
        default: 0,
    });
    // New settings
    game.settings.register('dnd-weather', 'useExtremeTemperatures', {
        name: "Use Record Temperatures",
        hint: "Check this box to include extreme temperatures in the weather generation.",
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
    });

    game.settings.register('dnd-weather', 'useSpecialWeather', {
        name: "Use Special Weather",
        hint: "Check this box to include special weather events in the weather generation.",
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
    });

    game.settings.register('dnd-weather', 'realisticWindSpeedInMountains', {
        name: "Realistic Wind Speed in Mountains",
        hint: "Check this box to use more realistic wind speeds for mountainous terrain.",
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
    });

    game.settings.register('dnd-weather', 'realisticHumidity', {
        name: "Realistic Humidity",
        hint: "Check this box to use a more realistic humidity calculation.",
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
    });

    game.settings.register('dnd-weather', 'addNotesToSimpleCalendar', {
        name: "Add Notes to Simple Calendar",
        hint: "Check this box to add weather notes to Simple Calendar.",
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
    });

    // Initialize the global flags
    useRecordTemperatures = game.settings.get('dnd-weather', 'useExtremeTemperatures');
    GlobalWeatherConfig.year = game.settings.get('dnd-weather', 'defaultYear');
    //GlobalWeatherConfig.month = game.settings.get('dnd-weather', 'defaultMonth');
    //GlobalWeatherConfig.day = game.settings.get('dnd-weather', 'defaultDay');
    GlobalWeatherConfig.latitude = game.settings.get('dnd-weather', 'defaultLatitude');
    GlobalWeatherConfig.altitude = game.settings.get('dnd-weather', 'defaultAltitude');
    GlobalWeatherConfig.terrain = game.settings.get('dnd-weather', 'defaultTerrain');
    GlobalWeatherConfig.advanceDate = game.settings.get('dnd-weather', 'advanceDateEachTime');
    GlobalWeatherConfig.useRealisticWind = game.settings.get('dnd-weather', 'realisticWindSpeedInMountains');

});

// Add a hook to update the flag when the setting changes
Hooks.on('renderSettingsConfig', (app, html, data) => {
    useRecordTemperatures = game.settings.get('dnd-weather', 'useExtremeTemperatures');
    GlobalWeatherConfig.year = game.settings.get('dnd-weather', 'defaultYear');
    //GlobalWeatherConfig.month = game.settings.get('dnd-weather', 'defaultMonth');
    //GlobalWeatherConfig.day = game.settings.get('dnd-weather', 'defaultDay');
    GlobalWeatherConfig.latitude = game.settings.get('dnd-weather', 'defaultLatitude');
    GlobalWeatherConfig.altitude = game.settings.get('dnd-weather', 'defaultAltitude');
    GlobalWeatherConfig.terrain = game.settings.get('dnd-weather', 'defaultTerrain');
    GlobalWeatherConfig.advanceDate = game.settings.get('dnd-weather', 'advanceDateEachTime');
    GlobalWeatherConfig.useSimpleCalendar = game.settings.get('dnd-weather', 'useSimpleCalendar');
    GlobalWeatherConfig.useRealisticWind = game.settings.get('dnd-weather', 'useRealisticWind');
    GlobalWeatherConfig.specialWeather = game.settings.get('dnd-weather', 'enableSpecialWeather');
});

