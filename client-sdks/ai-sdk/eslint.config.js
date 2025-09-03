import { createConfig } from '@internal/lint/eslint';

const config = await createConfig();

/** @type {import("eslint").Linter.Config[]} */
export default [...config.map(conf => ({ ...conf, ignores: [...(conf.ignores || []), '**/vitest.perf.config.ts'] }))];
