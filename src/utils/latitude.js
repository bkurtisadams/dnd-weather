// src/utils/latitude.js
/**
 * Utility functions for Oerth latitude calculations
 * 70 miles (2 1/3 hexes) = 1 degree latitude
 */

export const MILES_PER_LATITUDE = 70;
export const HEXES_PER_LATITUDE = 2.333; // 2 1/3 hexes

export function hexesToLatitude(hexes) {
    return hexes / HEXES_PER_LATITUDE;
}

export function milesToLatitude(miles) {
    return miles / MILES_PER_LATITUDE;
}

export function latitudeToHexes(latitude) {
    return latitude * HEXES_PER_LATITUDE;
}

export function latitudeToMiles(latitude) {
    return latitude * MILES_PER_LATITUDE;
}