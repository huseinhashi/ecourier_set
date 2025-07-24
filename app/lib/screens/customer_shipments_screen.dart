import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:app/providers/shipments_provider.dart';
import 'shipment_details_screen.dart';

class CustomerShipmentsScreen extends StatefulWidget {
  const CustomerShipmentsScreen({Key? key}) : super(key: key);

  @override
  State<CustomerShipmentsScreen> createState() =>
      _CustomerShipmentsScreenState();
}

class _CustomerShipmentsScreenState extends State<CustomerShipmentsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _statusFilter = 'all';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ShipmentsProvider>().fetchShipments();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final shipmentsProvider = Provider.of<ShipmentsProvider>(context);
    final isLoading = shipmentsProvider.isLoading;
    final error = shipmentsProvider.error;
    final sentShipments = shipmentsProvider.sentShipments;
    final receivedShipments = shipmentsProvider.receivedShipments;

    List<Shipment> filteredShipments =
        _tabController.index == 0 ? sentShipments : receivedShipments;
    final isSentTab = _tabController.index == 0;
    if (_statusFilter != 'all') {
      filteredShipments =
          filteredShipments.where((s) => s.status == _statusFilter).toList();
    }

    String _searchTerm = '';
    filteredShipments = filteredShipments
        .where((s) =>
            _searchTerm.isEmpty ||
            s.receiverName.toLowerCase().contains(_searchTerm.toLowerCase()) ||
            (s.senderName ?? '')
                .toLowerCase()
                .contains(_searchTerm.toLowerCase()) ||
            s.originCity.toLowerCase().contains(_searchTerm.toLowerCase()) ||
            s.destinationCity.toLowerCase().contains(_searchTerm.toLowerCase()))
        .toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
          child: Row(
            children: [
              Icon(Icons.local_shipping,
                  color: Theme.of(context).colorScheme.primary, size: 24),
              const SizedBox(width: 10),
              Text('My Shipments',
                  style: Theme.of(context)
                      .textTheme
                      .titleLarge
                      ?.copyWith(fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Sent'),
            Tab(text: 'Received'),
          ],
          onTap: (_) {
            context.read<ShipmentsProvider>().clearError();
            setState(() {});
          },
        ),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 16),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Search shipments...',
                    prefixIcon: const Icon(Icons.search),
                    contentPadding:
                        const EdgeInsets.symmetric(vertical: 0, horizontal: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide.none,
                    ),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  onChanged: (val) {
                    setState(() {
                      _searchTerm = val;
                    });
                  },
                ),
              ),
              const SizedBox(width: 12),
              DropdownButton<String>(
                value: _statusFilter,
                items: const [
                  DropdownMenuItem(value: 'all', child: Text('All')),
                  DropdownMenuItem(
                      value: 'Pending Pickup', child: Text('Pending Pickup')),
                  DropdownMenuItem(
                      value: 'Picked Up', child: Text('Picked Up')),
                  DropdownMenuItem(
                      value: 'Delivered', child: Text('Delivered')),
                ],
                onChanged: (value) {
                  if (value != null) {
                    context.read<ShipmentsProvider>().clearError();
                    setState(() => _statusFilter = value);
                  }
                },
                underline: Container(),
                style: const TextStyle(fontSize: 14, color: Colors.black),
                borderRadius: BorderRadius.circular(10),
              ),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async {
              context.read<ShipmentsProvider>().clearError();
              await context.read<ShipmentsProvider>().fetchShipments();
            },
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : error != null
                    ? Center(
                        child: Text(error,
                            style: const TextStyle(color: Colors.red)))
                    : filteredShipments.isEmpty
                        ? const Center(child: Text('No shipments found'))
                        : ListView.separated(
                            itemCount: filteredShipments.length,
                            separatorBuilder: (context, index) =>
                                const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final shipment = filteredShipments[index];
                              return Card(
                                elevation: 4,
                                margin: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 4),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14)),
                                child: ListTile(
                                  contentPadding: const EdgeInsets.symmetric(
                                      vertical: 14, horizontal: 18),
                                  title: Text(
                                    isSentTab
                                        ? 'To: ${shipment.receiverName}'
                                        : 'From: ${shipment.senderName ?? shipment.originCity}',
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16),
                                  ),
                                  subtitle: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          Chip(
                                            label: Text(shipment.status),
                                            backgroundColor: shipment.status ==
                                                    'Delivered'
                                                ? Colors.green[100]
                                                : shipment.status == 'Picked Up'
                                                    ? Colors.orange[100]
                                                    : Colors.grey[200],
                                            labelStyle: TextStyle(
                                              color:
                                                  shipment.status == 'Delivered'
                                                      ? Colors.green[800]
                                                      : shipment.status ==
                                                              'Picked Up'
                                                          ? Colors.orange[800]
                                                          : Colors.grey[800],
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Chip(
                                            label: Text(
                                                'Payment: ${shipment.paymentStatus}'),
                                            backgroundColor:
                                                shipment.paymentStatus == 'paid'
                                                    ? Colors.green[100]
                                                    : Colors.red[100],
                                            labelStyle: TextStyle(
                                              color: shipment.paymentStatus ==
                                                      'paid'
                                                  ? Colors.green[800]
                                                  : Colors.red[800],
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      isSentTab
                                          ? Text('From: ${shipment.originCity}')
                                          : Text(
                                              'To: ${shipment.destinationCity}'),
                                      if (shipment.price != null)
                                        Text('Price: ${shipment.price}'),
                                      if (shipment.weight != null)
                                        Text('Weight: ${shipment.weight} kg'),
                                    ],
                                  ),
                                  trailing: const Icon(Icons.chevron_right),
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) =>
                                            ShipmentDetailsScreen(
                                          shipmentId: shipment.id,
                                          isSent: isSentTab,
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              );
                            },
                          ),
          ),
        ),
      ],
    );
  }
}
