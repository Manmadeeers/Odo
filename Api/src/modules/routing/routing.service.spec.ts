import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoutingService } from './routing.service.js';

const valhallaResponse = {
  trip: {
    summary: { length: 5.42, time: 1180.4 },
    legs: [
      {
        summary: { length: 5.42, time: 1180.4 },
        shape: '??A@',
        maneuvers: [
          {
            instruction: 'Cycle north',
            length: 0.12,
            time: 30.2,
            begin_shape_index: 0,
            end_shape_index: 1,
            type: 1,
          },
        ],
      },
    ],
  },
};

function createService(): RoutingService {
  const configService = {
    getOrThrow: vi.fn((key: string) => {
      if (key === 'VALHALLA_URL') return 'http://valhalla:8002/';
      if (key === 'VALHALLA_TIMEOUT_MS') return 5000;
      throw new Error(`Unexpected configuration key: ${key}`);
    }),
  } as unknown as ConfigService;

  return new RoutingService(configService);
}

describe('RoutingService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests a bicycle route and normalizes the Valhalla response', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify(valhallaResponse), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const service = createService();

    const route = await service.createPreview({
      locations: [
        { lat: 53.9006, lon: 27.559 },
        { lat: 53.9111, lon: 27.5733 },
      ],
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://valhalla:8002/route',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          locations: [
            { lat: 53.9006, lon: 27.559 },
            { lat: 53.9111, lon: 27.5733 },
          ],
          costing: 'bicycle',
          units: 'kilometers',
          language: 'en-US',
          directions_type: 'instructions',
        }),
      }),
    );
    expect(route).toEqual({
      distanceMeters: 5420,
      durationSeconds: 1180,
      polylinePrecision: 6,
      legs: [
        {
          distanceMeters: 5420,
          durationSeconds: 1180,
          encodedPolyline: '??A@',
          maneuvers: [
            {
              instruction: 'Cycle north',
              distanceMeters: 120,
              durationSeconds: 30,
              beginShapeIndex: 0,
              endShapeIndex: 1,
              type: 1,
            },
          ],
        },
      ],
    });
  });

  it('turns Valhalla input errors into bad requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ error: 'No path could be found' }), {
          status: 400,
        }),
      ),
    );

    await expect(
      createService().createPreview({
        locations: [
          { lat: 53.9, lon: 27.5 },
          { lat: 53.91, lon: 27.6 },
        ],
      }),
    ).rejects.toEqual(new BadRequestException('No path could be found'));
  });

  it('reports timeouts separately from other upstream failures', async () => {
    const timeout = new Error('timed out');
    timeout.name = 'TimeoutError';
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(timeout));

    await expect(
      createService().createPreview({
        locations: [
          { lat: 53.9, lon: 27.5 },
          { lat: 53.91, lon: 27.6 },
        ],
      }),
    ).rejects.toBeInstanceOf(GatewayTimeoutException);

    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockRejectedValue(new Error('connection refused')),
    );

    await expect(
      createService().createPreview({
        locations: [
          { lat: 53.9, lon: 27.5 },
          { lat: 53.91, lon: 27.6 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
