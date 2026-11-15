import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import type { CreateRouteDto } from './dto/create-route.dto.js';
import type { RoutePreview } from './routing.types.js';

const valhallaManeuverSchema = z.object({
  instruction: z.string(),
  length: z.number().nonnegative(),
  time: z.number().nonnegative(),
  begin_shape_index: z.number().int().nonnegative(),
  end_shape_index: z.number().int().nonnegative(),
  type: z.number().int().nonnegative(),
});

const valhallaSummarySchema = z.object({
  length: z.number().nonnegative(),
  time: z.number().nonnegative(),
});

const valhallaRouteSchema = z.object({
  trip: z.object({
    summary: valhallaSummarySchema,
    legs: z.array(
      z.object({
        summary: valhallaSummarySchema,
        shape: z.string().min(1),
        maneuvers: z.array(valhallaManeuverSchema),
      }),
    ),
  }),
});

@Injectable()
export class RoutingService {
  private readonly valhallaUrl: string;
  private readonly timeoutMs: number;

  constructor(configService: ConfigService) {
    this.valhallaUrl = configService
      .getOrThrow<string>('VALHALLA_URL')
      .replace(/\/$/, '');
    this.timeoutMs = configService.getOrThrow<number>('VALHALLA_TIMEOUT_MS');
  }

  async createPreview(input: CreateRouteDto): Promise<RoutePreview> {
    let response: Response;

    try {
      response = await fetch(`${this.valhallaUrl}/route`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locations: input.locations,
          costing: 'bicycle',
          units: 'kilometers',
          language: 'en-US',
          directions_type: 'instructions',
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error: unknown) {
      if (this.isTimeout(error)) {
        throw new GatewayTimeoutException(
          'The routing service took too long to respond',
        );
      }
      throw new BadGatewayException('The routing service is unavailable');
    }

    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const message = this.readValhallaError(body);
      if (response.status >= 400 && response.status < 500) {
        throw new BadRequestException(message);
      }
      throw new BadGatewayException('The routing service could not respond');
    }

    const parsed = valhallaRouteSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadGatewayException(
        'The routing service returned an invalid response',
      );
    }

    return {
      distanceMeters: this.kilometersToMeters(parsed.data.trip.summary.length),
      durationSeconds: Math.round(parsed.data.trip.summary.time),
      polylinePrecision: 6,
      legs: parsed.data.trip.legs.map((leg) => ({
        distanceMeters: this.kilometersToMeters(leg.summary.length),
        durationSeconds: Math.round(leg.summary.time),
        encodedPolyline: leg.shape,
        maneuvers: leg.maneuvers.map((maneuver) => ({
          instruction: maneuver.instruction,
          distanceMeters: this.kilometersToMeters(maneuver.length),
          durationSeconds: Math.round(maneuver.time),
          beginShapeIndex: maneuver.begin_shape_index,
          endShapeIndex: maneuver.end_shape_index,
          type: maneuver.type,
        })),
      })),
    };
  }

  private kilometersToMeters(kilometers: number): number {
    return Math.round(kilometers * 1000);
  }

  private isTimeout(error: unknown): boolean {
    return (
      error instanceof Error &&
      (error.name === 'TimeoutError' || error.name === 'AbortError')
    );
  }

  private readValhallaError(body: unknown): string {
    if (body && typeof body === 'object') {
      for (const key of ['error', 'error_message', 'status_message']) {
        const value = Reflect.get(body, key);
        if (typeof value === 'string' && value.trim()) {
          return value;
        }
      }
    }
    return 'A bicycle route could not be calculated for these locations';
  }
}
