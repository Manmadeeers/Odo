export interface RouteManeuver {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  beginShapeIndex: number;
  endShapeIndex: number;
  type: number;
}

export interface RouteLeg {
  distanceMeters: number;
  durationSeconds: number;
  encodedPolyline: string;
  maneuvers: RouteManeuver[];
}

export interface RoutePreview {
  distanceMeters: number;
  durationSeconds: number;
  polylinePrecision: 6;
  legs: RouteLeg[];
}
