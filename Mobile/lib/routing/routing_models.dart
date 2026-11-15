class RoutePoint {
  const RoutePoint({required this.latitude, required this.longitude});

  final double latitude;
  final double longitude;

  Map<String, double> toJson() => {'lat': latitude, 'lon': longitude};
}

class RouteManeuver {
  const RouteManeuver({
    required this.instruction,
    required this.distanceMeters,
    required this.durationSeconds,
    required this.beginShapeIndex,
    required this.endShapeIndex,
    required this.type,
  });

  factory RouteManeuver.fromJson(Map<String, dynamic> json) {
    return RouteManeuver(
      instruction: json['instruction'] as String,
      distanceMeters: json['distanceMeters'] as int,
      durationSeconds: json['durationSeconds'] as int,
      beginShapeIndex: json['beginShapeIndex'] as int,
      endShapeIndex: json['endShapeIndex'] as int,
      type: json['type'] as int,
    );
  }

  final String instruction;
  final int distanceMeters;
  final int durationSeconds;
  final int beginShapeIndex;
  final int endShapeIndex;
  final int type;
}

class RouteLeg {
  const RouteLeg({
    required this.distanceMeters,
    required this.durationSeconds,
    required this.encodedPolyline,
    required this.maneuvers,
  });

  factory RouteLeg.fromJson(Map<String, dynamic> json) {
    return RouteLeg(
      distanceMeters: json['distanceMeters'] as int,
      durationSeconds: json['durationSeconds'] as int,
      encodedPolyline: json['encodedPolyline'] as String,
      maneuvers: (json['maneuvers'] as List<dynamic>)
          .map((item) => RouteManeuver.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
    );
  }

  final int distanceMeters;
  final int durationSeconds;
  final String encodedPolyline;
  final List<RouteManeuver> maneuvers;
}

class RoutePreview {
  const RoutePreview({
    required this.distanceMeters,
    required this.durationSeconds,
    required this.polylinePrecision,
    required this.legs,
  });

  factory RoutePreview.fromJson(Map<String, dynamic> json) {
    return RoutePreview(
      distanceMeters: json['distanceMeters'] as int,
      durationSeconds: json['durationSeconds'] as int,
      polylinePrecision: json['polylinePrecision'] as int,
      legs: (json['legs'] as List<dynamic>)
          .map((item) => RouteLeg.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
    );
  }

  final int distanceMeters;
  final int durationSeconds;
  final int polylinePrecision;
  final List<RouteLeg> legs;
}
