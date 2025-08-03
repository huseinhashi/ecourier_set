import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import 'package:app/providers/shipments_provider.dart';
import 'dart:convert';

class ScanScreen extends StatefulWidget {
  const ScanScreen({Key? key}) : super(key: key);

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  MobileScannerController cameraController = MobileScannerController();
  bool isProcessing = false;
  String? resultMessage;
  bool isFlashOn = false;
  CameraFacing cameraFacing = CameraFacing.back;

  @override
  void dispose() {
    cameraController.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) async {
    if (isProcessing) return;

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final String? qrCode = barcodes.first.rawValue;
    if (qrCode == null || qrCode.isEmpty) return;

    setState(() => isProcessing = true);

    final provider = Provider.of<ShipmentsProvider>(context, listen: false);
    
    // Try to parse QR code as JSON first (new format with full details)
    Map<String, dynamic>? qrData;
    String qrCodeId = qrCode;
    
    try {
      qrData = Map<String, dynamic>.from(jsonDecode(qrCode));
      qrCodeId = qrData['qrCodeId'] ?? qrCode;
    } catch (e) {
      // If not JSON, use the QR code as is (old format with just ID)
      qrCodeId = qrCode;
    }
    
    // Get shipment details from QR code
    final shipmentData = await provider.getShipmentFromQrCode(qrCodeId);
    
    setState(() {
      isProcessing = false;
    });

    if (shipmentData != null) {
      // Show confirmation dialog with shipment details
      _showShipmentConfirmationDialog(shipmentData, qrCodeId);
    } else {
      setState(() {
        resultMessage = provider.error ?? 'Failed to get shipment details';
      });

      await Future.delayed(const Duration(seconds: 2));
      setState(() {
        resultMessage = null;
      });
    }
  }

  void _showShipmentConfirmationDialog(Map<String, dynamic> shipmentData, String qrCode) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Shipment Details'),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildDetailRow('Status', shipmentData['status'] ?? 'N/A'),
                _buildDetailRow('Payment Status', shipmentData['paymentStatus'] ?? 'N/A'),
                if (shipmentData['price'] != null)
                  _buildDetailRow('Price', '\$${shipmentData['price']}'),
                if (shipmentData['weight'] != null)
                  _buildDetailRow('Weight', '${shipmentData['weight']} kg'),
                const Divider(),
                const Text('Sender Information', style: TextStyle(fontWeight: FontWeight.bold)),
                _buildDetailRow('Name', shipmentData['sender']?['name'] ?? 'N/A'),
                _buildDetailRow('Phone', shipmentData['sender']?['phone'] ?? 'N/A'),
                _buildDetailRow('Address', shipmentData['sender']?['address'] ?? 'N/A'),
                const Divider(),
                const Text('Receiver Information', style: TextStyle(fontWeight: FontWeight.bold)),
                _buildDetailRow('Name', shipmentData['receiver']?['name'] ?? 'N/A'),
                _buildDetailRow('Phone', shipmentData['receiver']?['phone'] ?? 'N/A'),
                _buildDetailRow('Address', shipmentData['receiver']?['address'] ?? 'N/A'),
                const Divider(),
                const Text('Route Information', style: TextStyle(fontWeight: FontWeight.bold)),
                _buildDetailRow('From', shipmentData['originCity']?['name'] ?? 'N/A'),
                _buildDetailRow('To', shipmentData['destinationCity']?['name'] ?? 'N/A'),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.of(context).pop();
                await _confirmPickup(qrCode);
              },
              child: const Text('Confirm Pickup'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(
            child: Text(value),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmPickup(String qrCode) async {
    setState(() => isProcessing = true);

    final provider = Provider.of<ShipmentsProvider>(context, listen: false);
    final success = await provider.scanPickup(qrCode);

    setState(() {
      resultMessage = success
          ? 'Shipment picked up successfully!'
          : (provider.error ?? 'Failed to pick up shipment');
    });

    await Future.delayed(const Duration(seconds: 2));

    setState(() {
      isProcessing = false;
      resultMessage = null;
    });
  }

  void _toggleFlash() async {
    await cameraController.toggleTorch();
    setState(() {
      isFlashOn = !isFlashOn;
    });
  }

  void _switchCamera() async {
    await cameraController.switchCamera();
    setState(() {
      cameraFacing = cameraFacing == CameraFacing.back
          ? CameraFacing.front
          : CameraFacing.back;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan QR Code'),
        backgroundColor: Colors.black,
        iconTheme: const IconThemeData(color: Colors.white),
        titleTextStyle: const TextStyle(color: Colors.white, fontSize: 20),
        actions: [
          IconButton(
            onPressed: _toggleFlash,
            icon: Icon(
              isFlashOn ? Icons.flash_on : Icons.flash_off,
              color: Colors.white,
            ),
          ),
          IconButton(
            onPressed: _switchCamera,
            icon: Icon(
              cameraFacing == CameraFacing.front
                  ? Icons.camera_front
                  : Icons.camera_rear,
              color: Colors.white,
            ),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: cameraController,
            onDetect: _onDetect,
          ),
          // Custom scan overlay
          Container(
            decoration: ShapeDecoration(
              shape: QrScannerOverlayShape(
                borderColor: Theme.of(context).colorScheme.primary,
                borderRadius: 10,
                borderLength: 30,
                borderWidth: 10,
                cutOutSize: 250,
              ),
            ),
          ),
          // Processing overlay
          if (isProcessing || resultMessage != null)
            Container(
              color: Colors.black54,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (isProcessing)
                      const CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    if (resultMessage != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        margin: const EdgeInsets.symmetric(horizontal: 32),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          resultMessage!,
                          style: const TextStyle(
                            color: Colors.black,
                            fontSize: 18,
                            fontWeight: FontWeight.w500,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ]
                  ],
                ),
              ),
            ),
          // Instructions at the bottom
          Positioned(
            bottom: 100,
            left: 0,
            right: 0,
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 32),
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'Point your camera at a QR code to scan',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Custom overlay shape for the scanning area
class QrScannerOverlayShape extends ShapeBorder {
  final Color borderColor;
  final double borderWidth;
  final Color overlayColor;
  final double borderRadius;
  final double borderLength;
  final double cutOutSize;

  const QrScannerOverlayShape({
    this.borderColor = Colors.white,
    this.borderWidth = 3.0,
    this.overlayColor = const Color.fromRGBO(0, 0, 0, 80),
    this.borderRadius = 0,
    this.borderLength = 40,
    this.cutOutSize = 250,
  });

  @override
  EdgeInsetsGeometry get dimensions => const EdgeInsets.all(10);

  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) {
    return Path()
      ..fillType = PathFillType.evenOdd
      ..addPath(getOuterPath(rect), Offset.zero);
  }

  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) {
    Path getLeftTopPath(Rect rect) {
      return Path()
        ..moveTo(rect.left, rect.bottom)
        ..lineTo(rect.left, rect.top + borderRadius)
        ..quadraticBezierTo(
            rect.left, rect.top, rect.left + borderRadius, rect.top)
        ..lineTo(rect.right, rect.top);
    }

    return getLeftTopPath(rect)
      ..lineTo(rect.right, rect.bottom)
      ..lineTo(rect.left, rect.bottom)
      ..lineTo(rect.left, rect.top);
  }

  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {
    final width = rect.width;
    final height = rect.height;
    final cutOutWidth = cutOutSize < width ? cutOutSize : width - borderWidth;
    final cutOutHeight =
        cutOutSize < height ? cutOutSize : height - borderWidth;

    final backgroundPaint = Paint()
      ..color = overlayColor
      ..style = PaintingStyle.fill;

    final boxPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;

    final cutOutRect = Rect.fromLTWH(
      rect.left + (width - cutOutWidth) / 2 + borderWidth,
      rect.top + (height - cutOutHeight) / 2 + borderWidth,
      cutOutWidth - borderWidth * 2,
      cutOutHeight - borderWidth * 2,
    );

    canvas
      ..saveLayer(rect, backgroundPaint)
      ..drawRect(rect, backgroundPaint)
      ..drawRRect(
        RRect.fromRectAndRadius(
          cutOutRect,
          Radius.circular(borderRadius),
        ),
        backgroundPaint..blendMode = BlendMode.clear,
      )
      ..restore();

    // Draw corner borders
    final path = Path()
      // Top left
      ..moveTo(cutOutRect.left - borderLength, cutOutRect.top)
      ..lineTo(cutOutRect.left, cutOutRect.top)
      ..lineTo(cutOutRect.left, cutOutRect.top + borderLength)
      // Top right
      ..moveTo(cutOutRect.right + borderLength, cutOutRect.top)
      ..lineTo(cutOutRect.right, cutOutRect.top)
      ..lineTo(cutOutRect.right, cutOutRect.top + borderLength)
      // Bottom right
      ..moveTo(cutOutRect.right, cutOutRect.bottom - borderLength)
      ..lineTo(cutOutRect.right, cutOutRect.bottom)
      ..lineTo(cutOutRect.right - borderLength, cutOutRect.bottom)
      // Bottom left
      ..moveTo(cutOutRect.left + borderLength, cutOutRect.bottom)
      ..lineTo(cutOutRect.left, cutOutRect.bottom)
      ..lineTo(cutOutRect.left, cutOutRect.bottom - borderLength);

    canvas.drawPath(path, boxPaint);
  }

  @override
  ShapeBorder scale(double t) {
    return QrScannerOverlayShape(
      borderColor: borderColor,
      borderWidth: borderWidth,
      overlayColor: overlayColor,
    );
  }
}
