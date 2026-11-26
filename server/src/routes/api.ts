import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { SYNTHETIC_TEST_CASES } from '../../../shared/syntheticDataset';
import type { ProviderHealthStatus } from '../../../shared/types';
import type { ServerConfig } from '../config/env';
import { createAiProvider } from '../services/aiProvider';
import { analyzeMessageHybrid } from '../services/hybridAnalysisService';
import { synthesizeSpeech, translateSafetyContent } from '../services/speechTranslationService';
import {
  validateAnalyzeRequest,
  validateTranslateRequest,
  validateTtsRequest,
} from '../utils/validators';

export function createApiRouter(config: ServerConfig): Router {
  const router = Router();
  const aiProvider = createAiProvider(config);

  router.get('/health', (_req, res) => {
    const firestoreConfigured = fs.existsSync(
      path.resolve(process.cwd(), 'firebase-applet-config.json')
    );
    const mysqlSchemaAvailable = fs.existsSync(
      path.resolve(process.cwd(), 'server/src/database/mysql_schema.sql')
    );

    const status: ProviderHealthStatus = {
      status: 'ok',
      activeProvider: aiProvider.isConfigured() ? aiProvider.name : 'rules_fallback',
      aiConfigured: aiProvider.isConfigured(),
      ruleEngineReady: true,
      firestoreEnabled: firestoreConfigured,
      mysqlSchemaAvailable,
      timestamp: new Date().toISOString(),
    };

    res.json(status);
  });

  router.get('/test-cases', (_req, res) => {
    res.json({
      count: SYNTHETIC_TEST_CASES.length,
      cases: SYNTHETIC_TEST_CASES,
    });
  });

  router.post('/analyze', async (req, res) => {
    const validation = validateAnalyzeRequest(req.body);
    if (!validation.valid || !validation.payload) {
      return res.status(400).json({
        code: validation.code || 'VALIDATION_ERROR',
        error: validation.error || 'Invalid request payload.',
      });
    }

    try {
      const result = await analyzeMessageHybrid(validation.payload, aiProvider);
      return res.json(result);
    } catch (error) {
      console.error('Analysis route error:', error);
      return res.status(500).json({
        code: 'ANALYSIS_ERROR',
        error: 'Unable to complete analysis right now. Please try local offline check.',
      });
    }
  });

  router.post('/translate', async (req, res) => {
    const validation = validateTranslateRequest(req.body);
    if (!validation.valid || !validation.payload) {
      return res.status(400).json({
        code: validation.code || 'VALIDATION_ERROR',
        error: validation.error || 'Invalid translation payload.',
      });
    }

    try {
      const translated = await translateSafetyContent(validation.payload, config);
      return res.json(translated);
    } catch (error) {
      console.error('Translation route error:', error);
      return res.status(503).json({
        code: 'TRANSLATION_UNAVAILABLE',
        error: 'Live AI translation is temporarily unavailable.',
      });
    }
  });

  router.post('/tts', async (req, res) => {
    const validation = validateTtsRequest(req.body);
    if (!validation.valid || !validation.payload) {
      return res.status(400).json({
        code: validation.code || 'VALIDATION_ERROR',
        error: validation.error || 'Invalid speech payload.',
      });
    }

    try {
      const audio = await synthesizeSpeech(validation.payload, config);
      return res.json(audio);
    } catch (error) {
      console.error('TTS route error:', error);
      return res.status(503).json({
        code: 'TTS_UNAVAILABLE',
        error: 'Live neural speech synthesis is temporarily unavailable.',
      });
    }
  });

  return router;
}
