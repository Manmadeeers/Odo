import 'routing_models.dart';

List<RoutePoint> decodePolyline6(String encoded) {
  const precisionFactor = 1000000.0;
  final points = <RoutePoint>[];
  var index = 0;
  var latitude = 0;
  var longitude = 0;

  while (index < encoded.length) {
    final decodedLatitude = _decodeValue(encoded, index);
    index = decodedLatitude.nextIndex;
    latitude += decodedLatitude.delta;

    if (index >= encoded.length) {
      throw const FormatException('Incomplete encoded polyline');
    }

    final decodedLongitude = _decodeValue(encoded, index);
    index = decodedLongitude.nextIndex;
    longitude += decodedLongitude.delta;

    points.add(
      RoutePoint(
        latitude: latitude / precisionFactor,
        longitude: longitude / precisionFactor,
      ),
    );
  }

  return List.unmodifiable(points);
}

({int delta, int nextIndex}) _decodeValue(String encoded, int startIndex) {
  var index = startIndex;
  var result = 0;
  var shift = 0;
  var byte = 0;

  do {
    if (index >= encoded.length) {
      throw const FormatException('Incomplete encoded polyline');
    }

    byte = encoded.codeUnitAt(index++) - 63;
    if (byte < 0 || byte > 63 || shift > 60) {
      throw const FormatException('Invalid encoded polyline');
    }
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20);

  final delta = (result & 1) == 1 ? ~(result >> 1) : result >> 1;
  return (delta: delta, nextIndex: index);
}
