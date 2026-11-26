import { describe, it, expect } from 'vitest';
import { createAirQualityTools } from './tools';

describe('createAirQualityTools', () => {
  it('executes get_live_aqi and search_knowledge_base tools cleanly', async () => {
    const tools = createAirQualityTools();
    const runAqi = tools.get_live_aqi.execute;
    const runKb = tools.search_knowledge_base.execute;
    expect(runAqi).toBeDefined();
    expect(runKb).toBeDefined();
    if (!runAqi || !runKb) return;

    const aqiRes = await runAqi(
      { city: 'New Delhi' },
      { toolCallId: 't1', messages: [], context: {} },
    );
    expect(aqiRes).toMatchObject({ city: 'New Delhi' });

    const kbRes = await runKb(
      { query: 'ventilation 2 pm', persona: 'family' },
      { toolCallId: 't2', messages: [], context: {} },
    );
    expect(kbRes).toHaveProperty('citations');
  });
});
