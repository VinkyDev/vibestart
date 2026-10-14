/* eslint-disable */

/**
 * @typedef {"year" | "years" | "quarter" | "quarters" | "month" | "months" | "week" | "weeks" | "day" | "days" | "hour" | "hours" | "minute" | "minutes" | "second" | "seconds"} RelativeTimeFormatUnit
 */

/**
 * Selects the plural category of "input - options.offset". The offset
 * comes from ICU MessageFormat 1 "{count, plural, offset:1 ...}" and does not
 * change exact matches like "=0", which compare the input itself.
 *
 * @param {import("./runtime.js").Locale} locale
 * @param {unknown} input
 * @param {Intl.PluralRulesOptions & { offset?: unknown }} [options]
 * @returns {string}
 */
export function plural(locale, input, options) {
	return new Intl.PluralRules(locale, options).select(Number(input) - Number(options?.offset ?? 0))
};

/**
 * @param {import("./runtime.js").Locale} locale
 * @param {unknown} input
 * @param {Intl.NumberFormatOptions} [options]
 * @returns {string}
 */
export function number(locale, input, options) {
	return new Intl.NumberFormat(locale, options).format(Number(input))
};

/**
 * Formats "#" in ICU MessageFormat 1 plurals: the number "input - options.offset",
 * formatted like number(). The offset comes from "{count, plural, offset:1 ...}".
 * An input that is not a finite number (or a numeric string) is displayed as is,
 * without subtracting the offset.
 *
 * @param {import("./runtime.js").Locale} locale
 * @param {unknown} input
 * @param {{ offset?: unknown }} [options]
 * @returns {string}
 */
export function icuPound(locale, input, options) {
	const value = typeof input === "number" ? input : typeof input === "string" && input.trim() !== "" ? Number(input) : NaN
	if (!Number.isFinite(value)) return String(input)
	return number(locale, value - Number(options?.offset ?? 0))
};

/**
 * @param {import("./runtime.js").Locale} locale
 * @param {unknown} input
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function datetime(locale, input, options) {
	return new Intl.DateTimeFormat(locale, options).format(new Date(/** @type {string} */ (input)))
};

/**
 * @param {import("./runtime.js").Locale} locale
 * @param {unknown} input
 * @param {Intl.RelativeTimeFormatOptions & { unit: RelativeTimeFormatUnit }} options
 * @returns {string}
 */
export function relativetime(locale, input, options) {
	const { unit, ...intlOptions } = options;
	return new Intl.RelativeTimeFormat(locale, intlOptions).format(Number(input), unit);
};