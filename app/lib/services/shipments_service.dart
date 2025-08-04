import 'package:dio/dio.dart';
import 'package:app/services/api_client.dart';

class ShipmentsService {
  final ApiClient _apiClient = ApiClient();

  // Create a new shipment (customer)
  Future<Map<String, dynamic>> createShipment({
    required String receiverName,
    required String receiverPhone,
    required String receiverAddress,
    required String originCity,
    required String destinationCity,
    String? receiverUserId,
  }) async {
    return await _apiClient.request(
      method: 'POST',
      path: '/shipments',
      data: {
        'receiver': receiverUserId != null
            ? {'userId': receiverUserId}
            : {
                'name': receiverName,
                'phone': receiverPhone,
                'address': receiverAddress,
              },
        'originCity': originCity,
        'destinationCity': destinationCity,
      },
    );
  }

  // Get all shipments for the current customer
  Future<Map<String, dynamic>> getCustomerShipments() async {
    return await _apiClient.request(
      method: 'GET',
      path: '/shipments/customer',
    );
  }

  // Get a single shipment by ID
  Future<Map<String, dynamic>> getShipmentById(String id) async {
    return await _apiClient.request(
      method: 'GET',
      path: '/shipments/$id',
    );
  }

  // Process payment for a shipment
  Future<Map<String, dynamic>> processPayment(String shipmentId) async {
    return await _apiClient.request(
      method: 'POST',
      path: '/shipments/mark-paid',
      data: {'shipmentId': shipmentId},
    );
  }

  // Fetch all customers (for receiver dropdown)
  Future<Map<String, dynamic>> fetchCustomers() async {
    return await _apiClient.request(
      method: 'GET',
      path: '/users/customers',
    );
  }

  // Fetch all cities (for city dropdowns)
  Future<Map<String, dynamic>> fetchCities() async {
    return await _apiClient.request(
      method: 'GET',
      path: '/cities',
    );
  }

  // Get all shipments assigned to the current courier
  Future<Map<String, dynamic>> getCourierShipments() async {
    return await _apiClient.request(
      method: 'GET',
      path: '/shipments/courier',
    );
  }

  // Set weight and price for a shipment
  Future<Map<String, dynamic>> setWeightAndPrice(
      String shipmentId, double weight) async {
    return await _apiClient.request(
      method: 'POST',
      path: '/shipments/set-weight',
      data: {
        'shipmentId': shipmentId,
        'weight': weight,
      },
    );
  }

  // Update shipment status (optionally with hub)
  Future<Map<String, dynamic>> updateShipmentStatus(
      String shipmentId, String status,
      {String? hubId}) async {
    return await _apiClient.request(
      method: 'POST',
      path: '/shipments/update-status',
      data: {
        'shipmentId': shipmentId,
        'status': status,
        if (hubId != null) 'hubId': hubId,
      },
    );
  }

  // Fetch all hubs
  Future<Map<String, dynamic>> getHubs() async {
    return await _apiClient.request(
      method: 'GET',
      path: '/hubs',
    );
  }

  // Fetch hubs for a specific city
  Future<Map<String, dynamic>> getHubsByCity(String cityId) async {
    return await _apiClient.request(
      method: 'GET',
      path: '/hubs/city/$cityId',
    );
  }

  // Get shipment details from QR code (courier)
  Future<Map<String, dynamic>> getShipmentFromQrCode(String qrCodeId) async {
    return await _apiClient.request(
      method: 'POST',
      path: '/shipments/qr-details',
      data: {'qrCodeId': qrCodeId},
    );
  }

  // Get basic shipment info regardless of pickup status
  Future<Map<String, dynamic>> getShipmentBasicInfo(String qrCodeId) async {
    return await _apiClient.request(
      method: 'POST',
      path: '/shipments/basic-info',
      data: {'qrCodeId': qrCodeId},
    );
  }

  // Scan shipment by QR code (courier)
  Future<Map<String, dynamic>> scanPickup(String qrCodeId) async {
    return await _apiClient.request(
      method: 'POST',
      path: '/shipments/scan-pickup',
      data: {'qrCodeId': qrCodeId},
    );
  }
}
