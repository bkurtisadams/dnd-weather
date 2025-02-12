// Time calculation helpers
export function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

export function getSeason(date) {
    const day = getDayOfYear(date);
    
    if (day < 79 || day >= 355) return 'Winter';
    if (day < 171) return 'Spring';
    if (day < 264) return 'Summer';
    return 'Autumn';
}

export function isDaytime(date) {
    const hours = date.getHours();
    // Simple daytime calculation - could be made more sophisticated with latitude
    return hours >= 6 && hours < 18;
}

export function getTimeOfDay(date) {
    const hours = date.getHours();
    if (hours >= 0 && hours < 6) return 'Night';
    if (hours >= 6 && hours < 12) return 'Morning';
    if (hours >= 12 && hours < 18) return 'Afternoon';
    return 'Evening';
}

export function getMoonPhase(date) {
    // Simplified moon phase calculation
    // In a real implementation, this would use proper astronomical calculations
    const days = Math.floor(date.getTime() / (24 * 60 * 60 * 1000));
    const phase = days % 30;
    
    if (phase === 0) return 'New Moon';
    if (phase < 7) return 'Waxing Crescent';
    if (phase === 7) return 'First Quarter';
    if (phase < 14) return 'Waxing Gibbous';
    if (phase === 15) return 'Full Moon';
    if (phase < 22) return 'Waning Gibbous';
    if (phase === 22) return 'Last Quarter';
    return 'Waning Crescent';
}