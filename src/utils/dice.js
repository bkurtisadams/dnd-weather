// Dice rolling utilities 
/**
 * Evaluates dice expressions in the format "XdY+Z" or "-XdY+Z"
 * where X is number of dice, Y is sides per die, and Z is modifier
 * @param {string} diceExpression - The dice expression to evaluate
 * @returns {number} The result of the dice roll
 */
export function evalDice(diceExpression) {
    if (!diceExpression || diceExpression.trim() === "None") {
        return 0;
    }

    let result = 0;
    let negative = diceExpression.startsWith('-');
    if (negative) {
        diceExpression = diceExpression.substring(1);
    }

    // Handle fractional dice (e.g., "1/2d6")
    const fractionMatch = diceExpression.match(/(\d+)\/(\d+)d(\d+)/i);
    if (fractionMatch) {
        const [_, numerator, denominator, sides] = fractionMatch;
        const roll = Math.floor(Math.random() * parseInt(sides)) + 1;
        result = Math.floor((parseInt(numerator) / parseInt(denominator)) * roll);
        console.log(`Rolling fractional dice ${numerator}/${denominator}d${sides}, roll = ${roll}, result = ${result}`);
        return negative ? -result : result;
    }

    // Handle standard dice notation (e.g., "1d6+2")
    const match = diceExpression.match(/(\d+)?d(\d+)([+-]\d+)?/i);
    if (match) {
        const count = parseInt(match[1] || 1);
        const sides = parseInt(match[2]);
        const modifier = parseInt(match[3] || 0);

        for (let i = 0; i < count; i++) {
            result += Math.floor(Math.random() * sides) + 1;
        }
        result += modifier;
        console.log(`Rolling ${count}d${sides}${modifier ? modifier : ''}, result = ${result}`);
        return negative ? -result : result;
    }

    // Handle plain numbers
    const numericResult = parseInt(diceExpression);
    if (!isNaN(numericResult)) {
        return negative ? -numericResult : numericResult;
    }

    console.error(`Invalid dice expression: ${diceExpression}`);
    return 0;
}

/**
 * Simulates rolling a single die
 * @param {number} sides - Number of sides on the die
 * @returns {number} Result of the roll
 */
export function rollDie(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

/**
 * Simulates rolling multiple dice
 * @param {number} count - Number of dice to roll
 * @param {number} sides - Number of sides per die
 * @returns {number[]} Array of roll results
 */
export function rollDice(count, sides) {
    return Array(count).fill(0).map(() => rollDie(sides));
}

/**
 * Simulates rolling percentile dice (d100)
 * @returns {number} Result between 1 and 100
 */
export function rollPercentile() {
    return rollDie(100);
}