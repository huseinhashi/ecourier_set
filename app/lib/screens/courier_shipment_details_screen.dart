import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:app/providers/shipments_provider.dart';

class CourierShipmentDetailsScreen extends StatefulWidget {
  final Shipment shipment;
  final VoidCallback? onUpdated;

  const CourierShipmentDetailsScreen({
    Key? key,
    required this.shipment,
    this.onUpdated,
  }) : super(key: key);

  @override
  State<CourierShipmentDetailsScreen> createState() =>
      _CourierShipmentDetailsScreenState();
}

class _CourierShipmentDetailsScreenState
    extends State<CourierShipmentDetailsScreen> {
  late Shipment shipment;
  bool isLoading = false;
  String? error;
  List<Map<String, dynamic>> hubs = [];

  @override
  void initState() {
    super.initState();
    shipment = widget.shipment;
    if (_canSetHub()) _fetchHubs();
  }

  bool _canSetWeight() => shipment.weight == null;
  bool _canSetHub() => shipment.status == "At Destination Hub";
  bool _canUpdateStatus() => shipment.status != "Delivered";

  Future<void> _fetchHubs() async {
    setState(() => isLoading = true);
    try {
      final provider = Provider.of<ShipmentsProvider>(context, listen: false);
      hubs = await provider.fetchHubs();
    } catch (e) {
      error = "Failed to fetch hubs";
    }
    setState(() => isLoading = false);
  }

  Future<void> _setWeightDialog() async {
    final controller = TextEditingController();
    final result = await showDialog<double>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Set Weight"),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: "Weight (kg)"),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Cancel")),
          ElevatedButton(
            onPressed: () {
              final val = double.tryParse(controller.text);
              if (val != null && val > 0) {
                Navigator.pop(context, val);
              }
            },
            child: const Text("Set"),
          ),
        ],
      ),
    );
    if (result != null) {
      setState(() => isLoading = true);
      try {
        final provider = Provider.of<ShipmentsProvider>(context, listen: false);
        final success = await provider.setWeightAndPrice(shipment.id, result);
        if (success) {
          shipment = provider.courierShipments
              .firstWhere((s) => s.id == shipment.id, orElse: () => shipment);
          widget.onUpdated?.call();
        }
      } catch (e) {
        error = "Failed to set weight";
      }
      setState(() => isLoading = false);
    }
  }

  Future<void> _updateStatusDialog() async {
    final isSameCity = shipment.originCity == shipment.destinationCity;
    final currentStatus = shipment.status;
    List<String> allowedStatuses = [];
    String? requiredHubStatus;
    String? hubCityId;
    if (isSameCity) {
      // Only one courier, can deliver only if picked up
      if (currentStatus == "In Transit") {
        allowedStatuses = ["Delivered"];
      }
    } else {
      // Two couriers
      // Courier A: Picked Up -> At Origin Hub
      if (currentStatus == "Picked Up") {
        allowedStatuses = ["At Origin Hub"];
        requiredHubStatus = "At Origin Hub";
        hubCityId = shipment.originCity;
      }
      // Courier B: At Destination Hub -> Out for Delivery
      if (currentStatus == "At Destination Hub") {
        allowedStatuses = ["Out for Delivery"];
      }
      // Courier B: Out for Delivery -> Delivered
      if (currentStatus == "Out for Delivery") {
        allowedStatuses = ["Delivered"];
      }
    }
    if (allowedStatuses.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('No status updates allowed at this stage.')),
      );
      return;
    }
    String? selectedStatus;
    String? selectedHubId;
    List<Map<String, dynamic>> filteredHubs = [];
    if (requiredHubStatus != null && hubCityId != null) {
      setState(() => isLoading = true);
      final provider = Provider.of<ShipmentsProvider>(context, listen: false);
      filteredHubs = await provider.fetchHubsByCity(hubCityId);
      setState(() => isLoading = false);
    }
    await showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text("Update Status"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: selectedStatus,
                items: allowedStatuses
                    .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                    .toList(),
                onChanged: (val) => setDialogState(() => selectedStatus = val),
                decoration: const InputDecoration(labelText: "Status"),
              ),
              if (selectedStatus == requiredHubStatus &&
                  filteredHubs.isNotEmpty)
                DropdownButtonFormField<String>(
                  value: selectedHubId,
                  items: filteredHubs
                      .map((hub) => DropdownMenuItem<String>(
                          value: hub['_id'] as String,
                          child: Text(hub['name'])))
                      .toList(),
                  onChanged: (val) => setDialogState(() => selectedHubId = val),
                  decoration: InputDecoration(
                    labelText: requiredHubStatus == "At Origin Hub"
                        ? "Origin Hub"
                        : "Destination Hub",
                  ),
                ),
            ],
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text("Cancel")),
            ElevatedButton(
              onPressed: selectedStatus == null ||
                      (selectedStatus == requiredHubStatus &&
                          (selectedHubId == null || selectedHubId!.isEmpty))
                  ? null
                  : () async {
                      setState(() => isLoading = true);
                      try {
                        final provider = Provider.of<ShipmentsProvider>(context,
                            listen: false);
                        final success = await provider.updateShipmentStatus(
                          shipment.id,
                          selectedStatus!,
                          hubId: selectedStatus == requiredHubStatus
                              ? selectedHubId
                              : null,
                        );
                        if (success) {
                          shipment = provider.courierShipments.firstWhere(
                              (s) => s.id == shipment.id,
                              orElse: () => shipment);
                          widget.onUpdated?.call();
                          Navigator.pop(context);
                        }
                      } catch (e) {
                        error = "Failed to update status";
                      }
                      setState(() => isLoading = false);
                    },
              child: const Text("Update"),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text("Shipment Details"),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: IconThemeData(color: theme.colorScheme.primary),
      ),
      backgroundColor: const Color(0xFFF6F8FA),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Card(
                elevation: 4,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18)),
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(Icons.local_shipping,
                                color: theme.colorScheme.primary, size: 28),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Text(
                              'Shipment to ${shipment.receiverName}',
                              style: theme.textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: theme.colorScheme.primary),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          _StatusChip(
                            label: shipment.status,
                            color: shipment.status == 'Delivered'
                                ? Colors.green
                                : shipment.status == 'At Destination Hub'
                                    ? Colors.blue
                                    : shipment.status == 'In Transit'
                                        ? Colors.orange
                                        : Colors.grey,
                          ),
                          const SizedBox(width: 8),
                          _StatusChip(
                            label: 'Payment: ${shipment.paymentStatus}',
                            color: shipment.paymentStatus == 'paid'
                                ? Colors.green
                                : Colors.red,
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Divider(),
                      const SizedBox(height: 8),
                      Text('Route',
                          style: theme.textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.location_city,
                              color: theme.colorScheme.primary, size: 20),
                          const SizedBox(width: 8),
                          Text('From: ${shipment.originCity}'),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.flag,
                              color: theme.colorScheme.secondary, size: 20),
                          const SizedBox(width: 8),
                          Text('To: ${shipment.destinationCity}'),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Divider(),
                      const SizedBox(height: 8),
                      Text('Sender Information',
                          style: theme.textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      if (shipment.senderName != null) ...[
                        Row(
                          children: [
                            Icon(Icons.person_outline,
                                color: theme.colorScheme.primary, size: 20),
                            const SizedBox(width: 8),
                            Text(shipment.senderName!),
                          ],
                        ),
                        if (shipment.senderPhone != null) ...[
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.phone,
                                  color: theme.colorScheme.primary, size: 20),
                              const SizedBox(width: 8),
                              Text(shipment.senderPhone!),
                            ],
                          ),
                        ],
                        if (shipment.senderAddress != null) ...[
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.location_on,
                                  color: theme.colorScheme.primary, size: 20),
                              const SizedBox(width: 8),
                              Expanded(child: Text(shipment.senderAddress!)),
                            ],
                          ),
                        ],
                      ] else ...[
                        Text('Sender information not available',
                            style: TextStyle(color: Colors.grey[600])),
                      ],
                      const SizedBox(height: 16),
                      Divider(),
                      const SizedBox(height: 8),
                      Text('Receiver Information',
                          style: theme.textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.person_outline,
                              color: theme.colorScheme.primary, size: 20),
                          const SizedBox(width: 8),
                          Text(shipment.receiverName),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.phone,
                              color: theme.colorScheme.primary, size: 20),
                          const SizedBox(width: 8),
                          Text(shipment.receiverPhone),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.location_on,
                              color: theme.colorScheme.primary, size: 20),
                          const SizedBox(width: 8),
                          Expanded(child: Text(shipment.receiverAddress)),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Divider(),
                      const SizedBox(height: 8),
                      if (shipment.price != null)
                        Text('Price: ${shipment.price}',
                            style: theme.textTheme.bodyLarge),
                      if (shipment.weight != null)
                        Text('Weight: ${shipment.weight} kg',
                            style: theme.textTheme.bodyLarge),
                      const SizedBox(height: 24),
                      if (_canSetWeight())
                        ElevatedButton.icon(
                          icon: const Icon(Icons.scale),
                          onPressed: _setWeightDialog,
                          label: const Text("Set Weight"),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: theme.colorScheme.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                                vertical: 14, horizontal: 24),
                            textStyle: const TextStyle(
                                fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ),
                      if (_canUpdateStatus())
                        ElevatedButton.icon(
                          icon: const Icon(Icons.edit),
                          onPressed: _updateStatusDialog,
                          label: const Text("Update Status"),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: theme.colorScheme.secondary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                                vertical: 14, horizontal: 24),
                            textStyle: const TextStyle(
                                fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ),
                      if (error != null) ...[
                        const SizedBox(height: 16),
                        Text(error!, style: const TextStyle(color: Colors.red)),
                      ],
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
