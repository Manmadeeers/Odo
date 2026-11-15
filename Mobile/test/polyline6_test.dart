import 'package:flutter_test/flutter_test.dart';
import 'package:odo_mobile/routing/polyline6.dart';

void main() {
  test('decodes Valhalla polylines with six decimal places of precision', () {
    final points = decodePolyline6('??A@');

    expect(points, hasLength(2));
    expect(points[0].latitude, 0);
    expect(points[0].longitude, 0);
    expect(points[1].latitude, 0.000001);
    expect(points[1].longitude, -0.000001);
  });

  test('rejects an incomplete encoded polyline', () {
    expect(() => decodePolyline6('?'), throwsFormatException);
  });
}
