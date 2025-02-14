// Dice rolling utilities 
/**
 * Evaluates dice expressions in the format "XdY+Z" or "-XdY+Z"
 * where X is number of dice, Y is sides per die, and Z is modifier
 * @param {string} diceExpression - The dice expression to evaluate
 * @returns {number} The result of the dice roll
 */
export function evalDice(diceExpression) {
    console.log("DND-Weather | Evaluating dice expression:", diceExpression);
    
    if (!diceExpression || diceExpression.trim() === "None") {
        console.log("DND-Weather | Empty or None expression, returning 0");
        return 0;
    }

    let result = 0;
    let negative = diceExpression.startsWith('-');
    if (negative) {
        diceExpression = diceExpression.substring(1);
        console.log("DND-Weather | Negative expression detected, stripped to:", diceExpression);
    }

    // Handle fractional dice (e.g., "1/2d6")
    const fractionMatch = diceExpression.match(/(\d+)\/(\d+)d(\d+)/i);
    if (fractionMatch) {
        const [_, numerator, denominator, sides] = fractionMatch;
        const roll = Math.floor(Math.random() * parseInt(sides)) + 1;
        result = Math.floor((parseInt(numerator) / parseInt(denominator)) * roll);
        console.log(`DND-Weather | Fractional dice: ${numerator}/${denominator}d${sides}`);
        console.log(`DND-Weather | Base roll: ${roll}, Final result: ${negative ? -result : result}`);
        return negative ? -result : result;
    }

    // Handle standard dice notation (e.g., "1d6+2")
    const match = diceExpression.match(/(\d+)?d(\d+)([+-]\d+)?/i);
    if (match) {
        const count = parseInt(match[1] || 1);
        const sides = parseInt(match[2]);
        const modifier = parseInt(match[3] || 0);

        console.log(`DND-Weather | Parsed dice: ${count}d${sides}${modifier ? modifier : ''}`);
        
        let rolls = [];
        for (let i = 0; i < count; i++) {
            const roll = Math.floor(Math.random() * sides) + 1;
            rolls.push(roll);
            result += roll;
        }
        
        const baseResult = result;
        result += modifier;
        
        console.log(`DND-Weather | Individual rolls: [${rolls.join(', ')}]`);
        console.log(`DND-Weather | Base total: ${baseResult}`);
        console.log(`DND-Weather | Modifier: ${modifier}`);
        console.log(`DND-Weather | Final result: ${negative ? -result : result}`);
        
        return negative ? -result : result;
    }

    // Handle plain numbers
    const numericResult = parseInt(diceExpression);
    if (!isNaN(numericResult)) {
        console.log(`DND-Weather | Plain number: ${numericResult}`);
        return negative ? -numericResult : numericResult;
    }

    console.error(`DND-Weather | Invalid dice expression: ${diceExpression}`);
    return 0;
}

/**
 * Simulates rolling a single die
 * @param {number} sides - Number of sides on the die
 * @returns {number} Result of the roll
 */
export function rollDie(sides) {
    const result = Math.floor(Math.random() * sides) + 1;
    console.log(`DND-Weather | Rolling d${sides}: ${result}`);
    return result;
}

/**
 * Simulates rolling multiple dice
 * @param {number} count - Number of dice to roll
 * @param {number} sides - Number of sides per die
 * @returns {number[]} Array of roll results
 */
export function rollDice(count, sides) {
    console.log(`DND-Weather | Rolling ${count}d${sides}`);
    const rolls = Array(count).fill(0).map(() => rollDie(sides));
    console.log(`DND-Weather | Results: [${rolls.join(', ')}]`);
    return rolls;
}

/**
 * Simulates rolling percentile dice (d100)
 * @returns {number} Result between 1 and 100
 */
export function rollPercentile() {
    const result = rollDie(100);
    console.log(`DND-Weather | Rolling percentile: ${result}`);
    return result;
}