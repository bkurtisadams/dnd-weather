// Temperature calculation tests 
// @vitest
import { describe, it, expect, beforeEach } from 'vitest';
import { WindSystem } from '../src/subsystems/WindSystem';

describe('WindSystem', () => {
  let windSystem;

  beforeEach(() => {
    windSystem = new WindSystem();
  });

  describe('Base Wind Generation', () => {
    it('should generate wind speed within valid ranges', () => {
      const result = windSystem.generateWindSpeed();
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(74); // Max normal wind speed
    });

    it('should generate consistent wind based on seed', () => {
      const seed = 'test-seed';
      const speed1 = windSystem.generateWindSpeed(seed);
      const speed2 = windSystem.generateWindSpeed(seed);
      expect(speed1).toBe(speed2);
    });
  });

  describe('Terrain Modifications', () => {
    it('should apply correct terrain wind modifiers', () => {
      const baseSpeed = 20;
      const terrainTypes = {
        'rough terrain': 5,
        'forest': -5,
        'jungle': -10,
        'swamp': -5,
        'plains': 5,
        'desert': 5,
        'mountains': 5, // per 1000ft
        'seacoast': 5,
        'at sea': 10
      };

      for (const [terrain, modifier] of Object.entries(terrainTypes)) {
        const adjusted = windSystem.applyTerrainModifier(baseSpeed, terrain);
        expect(adjusted).toBe(baseSpeed + modifier);
      }
    });

    it('should handle mountain elevation wind speed increases', () => {
      const baseSpeed = 20;
      const elevation = 3000; // 3000ft
      const expectedIncrease = 15; // +5 per 1000ft

      const adjusted = windSystem.applyTerrainModifier(baseSpeed, 'mountains', elevation);
      expect(adjusted).toBe(baseSpeed + expectedIncrease);
    });
  });

  describe('Wind Effects', () => {
    it('should determine correct wind effects based on speed', () => {
      const testCases = [
        { 
          speed: 0, 
          effects: ['No effect']
        },
        { 
          speed: 25, 
          effects: ['All travel slowed by 25%', 'torches will be blown out']
        },
        { 
          speed: 35, 
          effects: [
            'All travel slowed by 50%', 
            'torches and small fires will be blown out',
            'flying becomes dangerous'
          ]
        },
        { 
          speed: 65, 
          effects: [
            'Small trees are uprooted',
            'All travel slowed by 75%',
            'roofs may be torn off',
            'No missile fire permitted'
          ]
        },
        { 
          speed: 80, 
          effects: [
            'Only strong stone buildings undamaged',
            'travel is impossible'
          ]
        }
      ];

      testCases.forEach(({ speed, effects }) => {
        const result = windSystem.getWindEffects(speed);
        effects.forEach(effect => {
          expect(result).toContain(effect);
        });
      });
    });

    it('should calculate flight risks correctly', () => {
      const testCases = [
        { 
          speed: 40,
          creatureSize: 'eagle',
          weight: 100,
          expected: true 
        },
        { 
          speed: 30,
          creatureSize: 'dragon',
          weight: 2000,
          expected: false
        },
        { 
          speed: 60,
          creatureSize: 'any',
          weight: 500,
          expected: true
        }
      ];

      testCases.forEach(({ speed, creatureSize, weight, expected }) => {
        const result = windSystem.checkFlightRisk(speed, creatureSize, weight);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Combat Modifications', () => {
    it('should calculate correct missile fire penalties', () => {
      const testCases = [
        { speed: 20, expected: { range: 1, toHit: 0 } },
        { speed: 35, expected: { range: 0.5, toHit: -1 } },
        { speed: 50, expected: { range: 0.5, toHit: -3 } },
        { speed: 65, expected: { range: 0, toHit: -1 } }
      ];

      testCases.forEach(({ speed, expected }) => {
        const result = windSystem.calculateMissileModifiers(speed);
        expect(result.rangeMultiplier).toBe(expected.range);
        expect(result.toHitModifier).toBe(expected.toHit);
      });
    });

    it('should determine weapon grip risks', () => {
      const baseSpeed = 75;
      const result = windSystem.calculateWeaponGripRisk(baseSpeed);
      expect(result).toBe(0.2); // 20% chance per attack
    });
  });

  describe('Wind Direction', () => {
    it('should generate valid wind directions', () => {
      const validDirections = [
        'North', 'Northeast', 'East', 'Southeast',
        'South', 'Southwest', 'West', 'Northwest'
      ];

      const direction = windSystem.generateWindDirection();
      expect(validDirections).toContain(direction);
    });

    it('should respect seasonal prevailing winds', () => {
      const testCases = [
        { 
          season: 'fall',
          expected: ['North', 'Northeast']
        },
        { 
          season: 'winter',
          expected: ['North', 'Northeast']
        },
        { 
          season: 'spring',
          expected: ['East', 'Southeast']
        },
        { 
          season: 'summer',
          expected: ['East', 'Southeast']
        }
      ];

      testCases.forEach(({ season, expected }) => {
        const direction = windSystem.generateWindDirection(season);
        expect(expected).toContain(direction);
      });
    });
  });

  describe('Special Wind Events', () => {
    it('should handle tornado calculations', () => {
      const testCases = [
        { terrain: 'plains', chance: 0.5 },
        { terrain: 'desert', chance: 0 },
        { terrain: 'mountains', chance: 0 }
      ];

      testCases.forEach(({ terrain, chance }) => {
        const result = windSystem.calculateTornadoChance(terrain);
        expect(result).toBe(chance);
      });
    });

    it('should calculate structure damage from high winds', () => {
      const testCases = [
        { 
          speed: 45,
          buildingType: 'wooden',
          expected: { chance: 0.3, damage: 'd4' }
        },
        { 
          speed: 65,
          buildingType: 'stone',
          expected: { chance: 0.1, damage: 'd10' }
        }
      ];

      testCases.forEach(({ speed, buildingType, expected }) => {
        const result = windSystem.calculateStructureDamage(speed, buildingType);
        expect(result.chance).toBe(expected.chance);
        expect(result.damageDice).toBe(expected.damage);
      });
    });
  });
}