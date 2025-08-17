import 'package:flutter/material.dart';
import 'package:app/providers/shipments_provider.dart';
import 'package:app/services/api_client.dart';
import 'package:provider/provider.dart';

class ShipmentDetailsScreen extends StatefulWidget {
  final String shipmentId;
  final bool isSent;
  const ShipmentDetailsScreen({
    Key? key,
    required this.shipmentId,
    required this.isSent,
  }) : super(key: key);

  @override
  State<ShipmentDetailsScreen> createState() => _ShipmentDetailsScreenState();
}

class _ShipmentDetailsScreenState extends State<ShipmentDetailsScreen> {
  Shipment? shipment;
  bool isLoading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ShipmentsProvider>().clearError();
    });
    _fetchDetails();
  }

  Future<void> _fetchDetails() async {
    final provider = context.read<ShipmentsProvider>();
    final result = await provider.fetchShipmentById(widget.shipmentId);
    if (!mounted) return;
    setState(() {
      shipment = result;
      isLoading = false;
      error = provider.error;
    });
    if (provider.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.error!), backgroundColor: Colors.red),
      );
      provider.clearErrorAfterShown();
    }
  }

  @override
  Widget build(BuildContext context) {
    final shipmentsProvider = Provider.of<ShipmentsProvider>(context);
    final theme = Theme.of(context);
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Shipment Details')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (shipment == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Shipment Details')),
        body: Center(child: Text(error ?? 'Shipment not found')),
      );
    }
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.local_shipping, color: theme.colorScheme.primary),
            const SizedBox(width: 10),
            const Text('Shipment Details'),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: IconThemeData(color: theme.colorScheme.primary),
      ),
      backgroundColor: const Color(0xFFF6F8FA),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Card(
          elevation: 4,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.local_shipping,
                      color: theme.colorScheme.primary,
                      size: 28,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Text(
                        widget.isSent
                            ? 'To: ${shipment!.receiverName}'
                            : 'From: ${shipment!.originCity}',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.primary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    _StatusChip(
                      label: shipment!.status,
                      color: shipment!.status == 'Delivered'
                          ? Colors.green
                          : shipment!.status == 'Picked Up'
                          ? Colors.orange
                          : Colors.grey,
                    ),
                    const SizedBox(width: 8),
                    _StatusChip(
                      label: 'Payment: ${shipment!.paymentStatus}',
                      color: shipment!.paymentStatus == 'paid'
                          ? Colors.green
                          : Colors.red,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Divider(),
                Text(
                  widget.isSent ? 'Receiver Info' : 'Sender Info',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                if (widget.isSent) ...[
                  Text('Name: ${shipment!.receiverName}'),
                  Text('Phone: ${shipment!.receiverPhone}'),
                  Text('Address: ${shipment!.receiverAddress}'),
                ] else ...[
                  if (shipment!.senderName != null)
                    Text('Name: ${shipment!.senderName}'),
                  if (shipment!.senderPhone != null)
                    Text('Phone: ${shipment!.senderPhone}'),
                  if (shipment!.senderAddress != null)
                    Text('Address: ${shipment!.senderAddress}'),
                  if (shipment!.senderName == null &&
                      shipment!.senderPhone == null &&
                      shipment!.senderAddress == null)
                    Text('From: ${shipment!.originCity}'),
                ],
                const SizedBox(height: 16),
                Text(
                  'Route',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Text('From: ${shipment!.originCity}'),
                Text('To: ${shipment!.destinationCity}'),
                const SizedBox(height: 16),
                if (shipment!.price != null)
                  Text(
                    'Price: ${shipment!.price}',
                    style: theme.textTheme.bodyLarge,
                  ),
                if (shipment!.weight != null)
                  Text(
                    'Weight: ${shipment!.weight} kg',
                    style: theme.textTheme.bodyLarge,
                  ),
                const SizedBox(height: 16),
                Text('Created: ${shipment!.createdAt.toLocal()}'),
                const SizedBox(height: 24),
                if (widget.isSent &&
                    shipment!.paymentStatus != 'paid' &&
                    shipment!.price != null &&
                    shipment!.status == 'Pending Pickup')
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: shipmentsProvider.isLoading
                          ? null
                          : () async {
                              shipmentsProvider.clearError();
                              final success = await shipmentsProvider
                                  .processPayment(shipment!.id);
                              if (!mounted) return;
                              if (success) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'Payment processed successfully!',
                                    ),
                                    backgroundColor: Colors.green,
                                  ),
                                );
                                Navigator.pop(context);
                              } else {
                                // Show error message from provider or default message
                                final errorMessage = shipmentsProvider.error ?? 'Payment failed. Please try again.';
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(errorMessage),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                                shipmentsProvider.clearErrorAfterShown();
                              }
                            },
                      child: shipmentsProvider.isLoading
                          ? const CircularProgressIndicator()
                          : const Text('Process Payment'),
                    ),
                  ),
                if (shipment!.qrCodeImage != null &&
                    shipment!.qrCodeImage!.isNotEmpty)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 16),
                      Text('QR Code', style: theme.textTheme.titleMedium),
                      const SizedBox(height: 8),
                      GestureDetector(
                        onTap: () {
                          showDialog(
                            context: context,
                            builder: (_) => Dialog(
                              child: InteractiveViewer(
                                child: Image.network(
                                  '${ApiClient.baseUrl}/${shipment!.qrCodeImage}',
                                  fit: BoxFit.contain,
                                ),
                              ),
                            ),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade300),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Image.network(
                            '${ApiClient.baseUrl}/${shipment!.qrCodeImage}',
                            width: 120,
                            height: 120,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final Color color;
  const _StatusChip({required this.label, required this.color});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w600,
          fontSize: 13,
        ),
      ),
    );
  }
}
