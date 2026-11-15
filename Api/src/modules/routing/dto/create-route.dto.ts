import { z } from 'zod';

const routeLocationSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lon: z.number().finite().min(-180).max(180),
});

export const createRouteSchema = z.object({
  locations: z.array(routeLocationSchema).min(2).max(25),
});

export type CreateRouteDto = z.infer<typeof createRouteSchema>;
