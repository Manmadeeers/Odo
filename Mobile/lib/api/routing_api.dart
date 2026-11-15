import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import '../routing/routing_models.dart';
import 'api_exception.dart';

class RoutingApi {
  RoutingApi({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<RoutePreview> preview({
    required String accessToken,
    required List<RoutePoint> locations,
  }) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}/routes/preview');

    late http.Response response;
    try {
      response = await _client
          .post(
            uri,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $accessToken',
            },
            body: jsonEncode({
              'locations': locations.map((point) => point.toJson()).toList(),
            }),
          )
          .timeout(const Duration(seconds: 20));
    } on SocketException {
      throw const ApiException(
        0,
        'Unable to reach Odo. Check your connection and try again.',
      );
    } on TimeoutException {
      throw const ApiException(
        0,
        'Odo took too long to calculate the route. Please try again.',
      );
    } on FormatException {
      throw const ApiException(0, 'The Odo server address is invalid.');
    } catch (error) {
      if (error is ApiException) rethrow;
      throw const ApiException(
        0,
        'Unable to reach Odo. Check your connection and try again.',
      );
    }

    final decoded = _decodeBody(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(response.statusCode, _errorMessage(decoded));
    }
    if (decoded is! Map<String, dynamic>) {
      throw const ApiException(0, 'The Odo server returned an invalid route.');
    }

    try {
      return RoutePreview.fromJson(decoded);
    } on Object {
      throw const ApiException(0, 'The Odo server returned an invalid route.');
    }
  }

  Object? _decodeBody(String body) {
    if (body.isEmpty) return null;
    try {
      return jsonDecode(body);
    } on FormatException {
      return null;
    }
  }

  String _errorMessage(Object? body) {
    if (body is Map<String, dynamic>) {
      final message = body['message'];
      if (message is List) return message.join('. ');
      if (message is String && message.isNotEmpty) return message;

      final error = body['error'];
      if (error is String && error.isNotEmpty) return error;
    }
    return 'Unable to calculate a bicycle route';
  }
}
