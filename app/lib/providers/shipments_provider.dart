import 'package:flutter/material.dart';
import 'package:app/services/shipments_service.dart';

class Shipment {
  final String id;
  final String status;
  final String paymentStatus;
  final String receiverName;
  final String receiverPhone;
  final String receiverAddress;
  final String originCity;
  final String destinationCity;
  final double? price;
  final DateTime createdAt;
  final String? senderName;
  final double? weight;
  final String? qrCodeImage; // <-- Add this

  Shipment({
    required this.id,
    required this.status,
    required this.paymentStatus,
    required this.receiverName,
    required this.receiverPhone,
    required this.receiverAddress,
    required this.originCity,
    required this.destinationCity,
    this.price,
    required this.createdAt,
    this.senderName,
    this.weight,
    this.qrCodeImage,
  });

  /// Use this for customer shipments (flat city fields)
  factory Shipment.fromJson(Map<String, dynamic> json) {
    String getString(dynamic value) => value?.toString() ?? '';
    double? getDouble(dynamic value) =>
        value == null ? null : double.tryParse(value.toString());
    DateTime getDateTime(dynamic value) => value == null
        ? DateTime.now()
        : DateTime.tryParse(value.toString()) ?? DateTime.now();
    String? getSenderName(dynamic sender) {
      if (sender == null) return null;
      if (sender is Map && sender['name'] != null)
        return sender['name'].toString();
      return null;
    }

    return Shipment(
      id: getString(json['_id'] ?? json['id']),
      status: getString(json['status']),
      paymentStatus: getString(json['paymentStatus']),
      receiverName: getString(json['receiver']?['name']),
      receiverPhone: getString(json['receiver']?['phone']),
      receiverAddress: getString(json['receiver']?['address']),
      originCity: getString(json['originCity']?['name'] ?? json['originCity']),
      destinationCity: getString(
          json['destinationCity']?['name'] ?? json['destinationCity']),
      price: getDouble(json['price']),
      createdAt: getDateTime(json['createdAt']),
      senderName: getSenderName(json['sender']),
      weight: getDouble(json['weight']),
      qrCodeImage: json['qrCodeImage'] as String?,
    );
  }

  /// Use this for courier shipments (nested city fields)
  factory Shipment.fromCourierJson(Map<String, dynamic> json) {
    String getString(dynamic value) => value?.toString() ?? '';
    double? getDouble(dynamic value) =>
        value == null ? null : double.tryParse(value.toString());
    DateTime getDateTime(dynamic value) => value == null
        ? DateTime.now()
        : DateTime.tryParse(value.toString()) ?? DateTime.now();
    String? getSenderName(dynamic sender) {
      if (sender == null) return null;
      if (sender is Map && sender['name'] != null)
        return sender['name'].toString();
      return null;
    }

    // Handle nested city objects
    String getCityName(dynamic city) {
      if (city == null) return '';
      if (city is Map && city['name'] != null) return city['name'].toString();
      return city.toString();
    }

    return Shipment(
      id: getString(json['_id'] ?? json['id']),
      status: getString(json['status']),
      paymentStatus: getString(json['paymentStatus']),
      receiverName: getString(json['receiver']?['name']),
      receiverPhone: getString(json['receiver']?['phone']),
      receiverAddress: getString(json['receiver']?['address']),
      originCity: getCityName(json['originCity']),
      destinationCity: getCityName(json['destinationCity']),
      price: getDouble(json['price']),
      createdAt: getDateTime(json['createdAt']),
      senderName: getSenderName(json['sender']),
      weight: getDouble(json['weight']),
      qrCodeImage: json['qrCodeImage'] as String?,
    );
  }
}

class ShipmentsProvider extends ChangeNotifier {
  final ShipmentsService _shipmentsService = ShipmentsService();

  List<Shipment> _sentShipments = [];
  List<Shipment> _receivedShipments = [];
  List<Shipment> _courierShipments = [];
  bool _isLoading = false;
  String? _error;

  List<Shipment> get sentShipments => _sentShipments;
  List<Shipment> get receivedShipments => _receivedShipments;
  List<Shipment> get courierShipments => _courierShipments;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void clearErrorAfterShown() {
    _error = null;
    notifyListeners();
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    clearError();
    _error = error;
    notifyListeners();
  }

  Future<void> fetchShipments() async {
    try {
      _setLoading(true);
      clearError();
      final response = await _shipmentsService.getCustomerShipments();
      print('ShipmentsProvider response: $response');
      final data = response['data'] ?? response;
      if (data['success']) {
        final List<dynamic> sentData = data['sent'] ?? [];
        final List<dynamic> receivedData = data['received'] ?? [];
        _sentShipments = sentData.map((e) => Shipment.fromJson(e)).toList();
        _receivedShipments =
            receivedData.map((e) => Shipment.fromJson(e)).toList();
      } else {
        _setError(data['message'] ?? 'Failed to load shipments');
      }
    } catch (e) {
      _setError('Error loading shipments: $e');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> fetchCourierShipments() async {
    try {
      _setLoading(true);
      clearError();
      final response = await _shipmentsService.getCourierShipments();
      final data = response['data'] ?? response;
      if (data['success'] == true) {
        final asA = (data['asCourierA'] as List?) ?? [];
        final asB = (data['asCourierB'] as List?) ?? [];
        print('Courier shipments response: $response');
        print('asA: $asA');
        print('asB: $asB');
        _courierShipments = [
          ...asA.map((e) => Shipment.fromCourierJson(e)),
          ...asB.map((e) => Shipment.fromCourierJson(e)),
        ];
      } else {
        _setError(data['message'] ?? 'Failed to load shipments');
      }
    } catch (e) {
      _setError('Error loading shipments: $e');
    } finally {
      _setLoading(false);
    }
    notifyListeners();
  }

  Future<bool> createShipment({
    required String receiverName,
    required String receiverPhone,
    required String receiverAddress,
    required String originCity,
    required String destinationCity,
    String? receiverUserId,
  }) async {
    try {
      _setLoading(true);
      clearError();
      final response = await _shipmentsService.createShipment(
        receiverName: receiverName,
        receiverPhone: receiverPhone,
        receiverAddress: receiverAddress,
        originCity: originCity,
        destinationCity: destinationCity,
        receiverUserId: receiverUserId,
      );
      if (response['success']) {
        await fetchShipments();
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to create shipment');
        return false;
      }
    } catch (e) {
      _setError('Error creating shipment: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<Shipment?> fetchShipmentById(String id) async {
    try {
      _setLoading(true);
      clearError();
      final response = await _shipmentsService.getShipmentById(id);
      if (response['success']) {
        return Shipment.fromJson(response['data']);
      } else {
        _setError(response['message'] ?? 'Failed to load shipment');
        return null;
      }
    } catch (e) {
      _setError('Error loading shipment: $e');
      return null;
    } finally {
      _setLoading(false);
    }
  }

  // Payment processing
  Future<bool> processPayment(String shipmentId) async {
    try {
      _setLoading(true);
      clearError();
      final response = await _shipmentsService.processPayment(shipmentId);
      if (response['success']) {
        await fetchShipments();
        return true;
      } else {
        _setError(response['message'] ?? 'Payment failed');
        return false;
      }
    } catch (e) {
      _setError('Error processing payment: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> setWeightAndPrice(String shipmentId, double weight) async {
    try {
      _setLoading(true);
      clearError();
      final response =
          await _shipmentsService.setWeightAndPrice(shipmentId, weight);
      if (response['success'] == true) {
        await fetchCourierShipments();
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to set weight');
        return false;
      }
    } catch (e) {
      _setError('Error setting weight: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> updateShipmentStatus(String shipmentId, String status,
      {String? hubId}) async {
    try {
      _setLoading(true);
      clearError();
      final response = await _shipmentsService
          .updateShipmentStatus(shipmentId, status, hubId: hubId);
      if (response['success'] == true) {
        await fetchCourierShipments();
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to update status');
        return false;
      }
    } catch (e) {
      _setError('Error updating status: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<List<Map<String, dynamic>>> fetchHubs() async {
    try {
      final response = await _shipmentsService.getHubs();
      if (response['success'] == true) {
        return List<Map<String, dynamic>>.from(response['data']);
      }
    } catch (_) {}
    return [];
  }

  Future<List<Map<String, dynamic>>> fetchHubsByCity(String cityId) async {
    try {
      final response = await _shipmentsService.getHubsByCity(cityId);
      if (response['success'] == true) {
        return List<Map<String, dynamic>>.from(response['data']);
      }
    } catch (_) {}
    return [];
  }

  Future<bool> scanPickup(String qrCodeId) async {
    try {
      _setLoading(true);
      clearError();
      final response = await _shipmentsService.scanPickup(qrCodeId);
      if (response['success'] == true) {
        await fetchCourierShipments();
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to scan pickup');
        return false;
      }
    } catch (e) {
      _setError('Error scanning pickup: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }
}
