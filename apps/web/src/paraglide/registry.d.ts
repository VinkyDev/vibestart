export type RelativeTimeFormatUnit = "year" | "years" | "quarter" | "quarters" | "month" | "months" | "week" | "weeks" | "day" | "days" | "hour" | "hours" | "minute" | "minutes" | "second" | "seconds";
/**
 * @typedef {"year" | "years" | "quarter" | "quarters" | "month" | "months" | "week" | "weeks" | "day" | "days" | "hour" | "hours" | "minute" | "minutes" | "second" | "seconds"} RelativeTimeFormatUnit
 */
/**
 * @param {import("./runtime.js").Locale} locale
 * @param {unknown} input
 * @param {Intl.PluralRulesOptions} [options]
 * @returns {string}
 */
export declare function plural(locale: import("./runtime.js").Locale, input: unknown, options?: Intl.PluralRulesOptions): string;
/**
 * @param {import("./runtime.js").Locale} locale
 * @param {unknown} input
 * @param {Intl.NumberFormatOptions} [options]
 * @returns {string}
 */
export declare function number(locale: import("./runtime.js").Locale, input: unknown, options?: Intl.NumberFormatOptions): string;
/**
 * @param {import("./runtime.js").Locale} locale
 * @param {unknown} input
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export declare function datetime(locale: import("./runtime.js").Locale, input: unknown, options?: Intl.DateTimeFormatOptions): string;
/**
 * @param {import("./runtime.js").Locale} locale
 * @param {unknown} input
 * @param {Intl.RelativeTimeFormatOptions & { unit: RelativeTimeFormatUnit }} options
 * @returns {string}
 */
export declare function relativetime(locale: import("./runtime.js").Locale, input: unknown, options: Intl.RelativeTimeFormatOptions & {
    unit: RelativeTimeFormatUnit;
}): string;
