import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TEAM_ID, PROJECT_ID, BUILD_ID } from './utils/constants.js';
import { CloudDeployer } from './index.js';

vi.mock('./utils/auth.js', () => ({
  getAuthEntrypoint: vi.fn().mockReturnValue('// Mock auth entrypoint'),
}));

vi.mock('./utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('./utils/constants.js', () => ({
  MASTRA_DIRECTORY: 'src/mastra',
  BUILD_ID: 'test-build-id',
  PROJECT_ID: 'test-project-id',
  TEAM_ID: 'test-team-id',
  LOG_REDIS_URL: 'redis://localhost:6379',
  LOCAL: false,
  BUILD_URL: '',
  BUSINESS_JWT_TOKEN: '',
  USER_IP_ADDRESS: '',
  PROJECT_ENV_VARS: {},
  PROJECT_ROOT: '/project',
  safelyParseJson: vi.fn((json: string) => {
    try {
      return JSON.parse(json);
    } catch {
      return {};
    }
  }),
}));

describe('CloudDeployer Server Runtime', () => {
  let deployer: CloudDeployer;

  beforeEach(() => {
    deployer = new CloudDeployer();
  });

  describe('Server Entry Code Generation', () => {
    it('should generate valid server initialization code', () => {
      // @ts-ignore - accessing private method for testing
      const entry = deployer.getEntry();

      // Validate it's valid JavaScript/TypeScript
      expect(() => {
        // Basic syntax validation - check for unmatched brackets
        const openBrackets = (entry.match(/\{/g) || []).length;
        const closeBrackets = (entry.match(/\}/g) || []).length;
        expect(openBrackets).toBe(closeBrackets);

        const openParens = (entry.match(/\(/g) || []).length;
        const closeParens = (entry.match(/\)/g) || []).length;
        expect(openParens).toBe(closeParens);
      }).not.toThrow();
    });

    it('should handle environment variables correctly', () => {
      // @ts-ignore - accessing private method for testing
      const entry = deployer.getEntry();

      // Check environment variable handling
      expect(entry).toContain(
        'process.env.RUNNER_START_TIME ? new Date(process.env.RUNNER_START_TIME).getTime() : Date.now()',
      );
      expect(entry).toContain("process.env.CI !== 'true'");
      expect(entry).toContain('process.env.BUSINESS_API_RUNNER_LOGS_ENDPOINT');
      expect(entry).toContain('process.env.BUSINESS_JWT_TOKEN');
      expect(entry).toContain('process.env.MASTRA_STORAGE_URL && process.env.MASTRA_STORAGE_AUTH_TOKEN');
    });

    it('should setup logging correctly', () => {
      // @ts-ignore - accessing private method for testing
      const entry = deployer.getEntry();

      // Verify logger setup
      expect(entry).toContain('const logger = new PinoLogger({');
      expect(entry).toContain("name: 'MastraCloud'");
      expect(entry).toContain("level: 'debug'");
      expect(entry).toContain('const existingLogger = mastra?.getLogger()');
      expect(entry).toContain('new MultiLogger([logger, existingLogger])');
      expect(entry).toContain('mastra.setLogger({ logger: combinedLogger })');
    });

    it('should configure HTTP transport when endpoint is provided', () => {
      // @ts-ignore - accessing private method for testing
      const entry = deployer.getEntry();

      expect(entry).toContain('new HttpTransport({');
      expect(entry).toContain('url: process.env.BUSINESS_API_RUNNER_LOGS_ENDPOINT');
      expect(entry).toContain("Authorization: 'Bearer ' + process.env.BUSINESS_JWT_TOKEN");
    });

    it('should setup storage and vector stores correctly', () => {
      // @ts-ignore - accessing private method for testing
      const entry = deployer.getEntry();

      // Check storage initialization
      expect(entry).toContain('if (mastra?.storage) {');
      expect(entry).toContain('mastra.storage.init()');

      // Check LibSQL setup
      expect(entry).toContain('const storage = new LibSQLStore({');
      expect(entry).toContain('url: process.env.MASTRA_STORAGE_URL');
      expect(entry).toContain('authToken: process.env.MASTRA_STORAGE_AUTH_TOKEN');

      expect(entry).toContain('const vector = new LibSQLVector({');
      expect(entry).toContain('connectionUrl: process.env.MASTRA_STORAGE_URL');

      expect(entry).toContain('await storage.init()');
      expect(entry).toContain('mastra?.setStorage(storage)');
      expect(entry).toContain('mastra?.memory?.setStorage(storage)');
      expect(entry).toContain('mastra?.memory?.setVector(vector)');
    });

    it('should register hooks for generation and evaluation', () => {
      // @ts-ignore - accessing private method for testing
      const entry = deployer.getEntry();

      expect(entry).toContain('registerHook(AvailableHooks.ON_GENERATION');
      expect(entry).toContain('evaluate({');
      expect(entry).toContain('agentName,');
      expect(entry).toContain('input,');
      expect(entry).toContain('metric,');
      expect(entry).toContain('output,');
      expect(entry).toContain('runId,');
      expect(entry).toContain('globalRunId: runId,');
      expect(entry).toContain('instructions,');

      expect(entry).toContain('registerHook(AvailableHooks.ON_EVALUATION');
      expect(entry).toContain('await mastra.storage.insert({');
      expect(entry).toContain('tableName: MastraStorage.TABLE_EVALS');
    });

    it('should create node server with correct configuration', () => {
      // @ts-ignore - accessing private method for testing
      const entry = deployer.getEntry();

      expect(entry).toContain(
        'await createNodeServer(mastra, { playground: false, swaggerUI: false, tools: getToolExports(tools) });',
      );
    });

    it('should include readiness logging with correct metadata', () => {
      // @ts-ignore - accessing private method for testing
      const entry = deployer.getEntry();

      // Check server starting log
      expect(entry).toContain('console.log(JSON.stringify({');
      expect(entry).toContain('message: "Server starting"');
      expect(entry).toContain("operation: 'builder.createNodeServer'");
      expect(entry).toContain('type: "READINESS"');

      // Check server started log
      expect(entry).toContain('message: "Server started"');
      expect(entry).toContain('operation_durationMs: Date.now() - createNodeServerStartTime');

      // Check runner initialized log
      expect(entry).toContain('message: "Runner Initialized"');
      expect(entry).toContain('durationMs: Date.now() - startTime');

      // Check metadata is included
      expect(entry).toContain(`teamId: "${TEAM_ID}"`);
      expect(entry).toContain(`projectId: "${PROJECT_ID}"`);
      expect(entry).toContain(`buildId: "${BUILD_ID}"`);
    });

    it('should include auth entrypoint', () => {
      // @ts-ignore - accessing private method for testing
      const entry = deployer.getEntry();

      expect(entry).toContain('// Mock auth entrypoint');
    });

    it('should handle success entrypoint', () => {
      // @ts-ignore - accessing private method for testing
      const entry = deployer.getEntry();

      // The successEntrypoint should be included but we don't have its content mocked
      // Just verify the structure is complete
      expect(entry).toMatch(/console\.log\(JSON\.stringify\(\{[\s\S]*?\}\)\);[\s\S]*$/);
    });
  });

  describe('Runtime Error Scenarios', () => {
    it('should handle missing mastra instance gracefully', () => {
      // @ts-ignore - accessing private method for testing
      const entry = deployer.getEntry();

      // Check optional chaining for mastra
      expect(entry).toContain('mastra?.getLogger()');
      expect(entry).toContain('mastra?.storage');
      expect(entry).toContain('mastra?.setStorage');
      expect(entry).toContain('mastra?.memory?.setStorage');
      expect(entry).toContain('mastra?.memory?.setVector');
    });

    it('should skip HTTP transport in CI environment', () => {
      // @ts-ignore - accessing private method for testing
      const entry = deployer.getEntry();

      expect(entry).toContain("if (process.env.CI !== 'true') {");
      expect(entry).toContain('if (process.env.BUSINESS_API_RUNNER_LOGS_ENDPOINT) {');
    });

    it('should only setup cloud storage when credentials are present', () => {
      // @ts-ignore - accessing private method for testing
      const entry = deployer.getEntry();

      expect(entry).toContain('if (process.env.MASTRA_STORAGE_URL && process.env.MASTRA_STORAGE_AUTH_TOKEN) {');
    });
  });
});
