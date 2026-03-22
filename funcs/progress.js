/**
 * Generates a premium progress bar string.
 * @param {number} percentage - 0 to 100
 * @param {number} size - bar width
 * @returns {string}
 */
function getProgressBar(percentage, size = 15) {
    const filled = Math.round((size * percentage) / 100);
    const empty = size - filled;
    // Premium characters: █ (filled), ░ (empty)
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `\`[${bar}]\` *${percentage.toFixed(1)}%*`;
}

module.exports = { getProgressBar };
