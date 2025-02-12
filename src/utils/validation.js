// Input validation helpers
export function validateLatitude(latitude) {
    if (typeof latitude !== 'number') return false;
    return latitude >= -90 && latitude <= 90;
}

export function validateElevation(elevation) {
    if (typeof elevation !== 'number') return false;
    return elevation >= -1000 && elevation <= 30000;
}

export function validateTerrain(terrain) {
    const validTerrains = [
        'plains', 'forest', 'hills', 'mountains', 
        'desert', 'coastal', 'ocean', 'arctic',
        'swamp', 'urban', 'underdark', 'tropical'
    ];
    return validTerrains.includes(terrain.toLowerCase());
}

export function validateTemperature(temp) {
    if (typeof temp !== 'number') return false;
    return temp >= -100 && temp <= 150;
}

export function validateWindSpeed(speed) {
    if (typeof speed !== 'number') return false;
    return speed >= 0 && speed <= 200;
}

export function validateHumidity(humidity) {
    if (typeof humidity !== 'number') return false;
    return humidity >= 0 && humidity <= 100;
}

export function validateDateRange(startDate, endDate) {
    if (!(startDate instanceof Date) || !(endDate instanceof Date)) return false;
    return startDate <= endDate;
}