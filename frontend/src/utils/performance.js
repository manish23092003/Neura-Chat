/**
 * Performance monitoring utilities.
 * All functions use performance.now() for high-resolution timing.
 * Metrics are collected in-memory and can be inspected from DevTools via
 * window.__NC_PERF or by calling getMetrics().
 */

// In-memory store for collected metrics
const store = {
    aiResponseTimes: [],
    runtimeStartupTimes: [],
    projectGenerationTimes: [],
    buildDurations: [],
    errors: [],
};

// Expose for DevTools inspection
if (typeof window !== 'undefined') {
    window.__NC_PERF = store;
}

/**
 * Record and return the elapsed time since `startTime` (from performance.now()).
 * @param {number} startTime — value from performance.now()
 * @param {string} [label]   — optional label for the log
 * @returns {number} elapsed milliseconds
 */
export const measureAiResponseTime = (startTime, label = 'AI Response') => {
    const elapsed = Math.round(performance.now() - startTime);
    store.aiResponseTimes.push({ elapsed, ts: Date.now(), label });
    if (import.meta.env.DEV) {
        console.info(`[⚡ Perf] ${label}: ${elapsed}ms`);
    }
    return elapsed;
};

/**
 * Record Lifo runtime startup duration.
 */
export const measureRuntimeStartup = (startTime, label = 'Runtime Boot') => {
    const elapsed = Math.round(performance.now() - startTime);
    store.runtimeStartupTimes.push({ elapsed, ts: Date.now(), label });
    if (import.meta.env.DEV) {
        console.info(`[⚡ Perf] ${label}: ${elapsed}ms`);
    }
    return elapsed;
};

/**
 * Record project generation time (from user prompt to file tree ready).
 */
export const measureProjectGeneration = (startTime) => {
    const elapsed = Math.round(performance.now() - startTime);
    store.projectGenerationTimes.push({ elapsed, ts: Date.now() });
    if (import.meta.env.DEV) {
        console.info(`[⚡ Perf] Project Generation: ${elapsed}ms`);
    }
    return elapsed;
};

/**
 * Record a frontend build duration.
 */
export const reportBuildDuration = (ms) => {
    store.buildDurations.push({ ms, ts: Date.now() });
};

/**
 * Log a performance-impacting error.
 */
export const reportPerfError = (context, error) => {
    store.errors.push({ context, message: error?.message || String(error), ts: Date.now() });
};

/**
 * Get a summary of all collected metrics.
 */
export const getMetrics = () => {
    const avg = (arr) =>
        arr.length === 0
            ? 0
            : Math.round(arr.reduce((s, v) => s + (v.elapsed ?? v.ms ?? 0), 0) / arr.length);

    return {
        ai: {
            count: store.aiResponseTimes.length,
            avgMs: avg(store.aiResponseTimes),
            lastMs: store.aiResponseTimes.at(-1)?.elapsed ?? null,
        },
        runtime: {
            count: store.runtimeStartupTimes.length,
            avgMs: avg(store.runtimeStartupTimes),
            lastMs: store.runtimeStartupTimes.at(-1)?.elapsed ?? null,
        },
        projectGeneration: {
            count: store.projectGenerationTimes.length,
            avgMs: avg(store.projectGenerationTimes),
        },
        errors: store.errors,
    };
};

/**
 * Simple debounce utility — returns a debounced version of `fn`.
 * @param {Function} fn
 * @param {number}   delay  ms
 */
export const debounce = (fn, delay) => {
    let timer = null;
    const debounced = (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
    debounced.cancel = () => clearTimeout(timer);
    return debounced;
};

/**
 * Throttle — ensure `fn` is called at most once per `limit` ms.
 */
export const throttle = (fn, limit) => {
    let lastCall = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastCall >= limit) {
            lastCall = now;
            fn(...args);
        }
    };
};
