import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:app/providers/auth_provider.dart';
import 'package:app/providers/shipments_provider.dart';
import 'package:app/screens/customer_shipments_screen.dart';
import 'package:app/screens/profile_screen.dart';
import 'package:app/services/api_client.dart';
import 'package:app/services/shipments_service.dart';
import 'package:app/screens/shipment_details_screen.dart';

class CustomerDashboardScreen extends StatefulWidget {
  const CustomerDashboardScreen({Key? key}) : super(key: key);

  @override
  State<CustomerDashboardScreen> createState() =>
      _CustomerDashboardScreenState();
}

class _CustomerDashboardScreenState extends State<CustomerDashboardScreen> {
  int _selectedIndex = 0;

  static final List<Widget> _pages = <Widget>[
    const CustomerHomeScreen(),
    const CustomerShipmentsScreen(),
    const ProfileScreen(),
  ];

  final ShipmentsService _shipmentsService = ShipmentsService();

  Future<void> _showLogoutDialog() async {
    return showDialog<void>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Row(
            children: [
              Icon(
                Icons.logout,
                color: Theme.of(context).colorScheme.error,
                size: 24,
              ),
              const SizedBox(width: 8),
              Text(
                'Logout',
                style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
              ),
            ],
          ),
          content: Text(
            'Are you sure you want to logout?',
            style: GoogleFonts.poppins(),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(
                'Cancel',
                style: GoogleFonts.poppins(color: Colors.grey[600]),
              ),
            ),
            TextButton(
              onPressed: () async {
                Navigator.of(context).pop();
                final authProvider = Provider.of<AuthProvider>(
                  context,
                  listen: false,
                );
                final success = await authProvider.logout();
                if (success && mounted) {
                  Navigator.of(
                    context,
                  ).pushNamedAndRemoveUntil('/login', (route) => false);
                }
              },
              style: TextButton.styleFrom(
                foregroundColor: Theme.of(context).colorScheme.error,
              ),
              child: Text(
                'Logout',
                style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final shipmentsProvider = Provider.of<ShipmentsProvider>(context);
    final sentShipments = shipmentsProvider.sentShipments;
    return Scaffold(
      backgroundColor: const Color(0xFFF6F8FA),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                Icons.local_shipping,
                color: theme.colorScheme.primary,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Text(
              'E-Courier',
              style: TextStyle(
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.w700,
                fontSize: 22,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.notifications_outlined,
                color: Colors.grey[600],
                size: 20,
              ),
            ),
            onPressed: () {},
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(Icons.logout, color: Colors.grey[600], size: 20),
            ),
            onPressed: _showLogoutDialog,
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: SafeArea(
        child: IndexedStack(index: _selectedIndex, children: _pages),
      ),
      floatingActionButton: _selectedIndex == 0
          ? FloatingActionButton(
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (context) => RegisterShipmentDialog(),
                );
              },
              backgroundColor: theme.colorScheme.primary,
              child: const Icon(Icons.add),
            )
          : null,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: NavigationBar(
          selectedIndex: _selectedIndex,
          onDestinationSelected: (index) {
            setState(() {
              _selectedIndex = index;
            });
          },
          backgroundColor: Colors.white,
          elevation: 0,
          indicatorColor: theme.colorScheme.primary.withOpacity(0.1),
          labelBehavior: NavigationDestinationLabelBehavior.onlyShowSelected,
          destinations: [
            NavigationDestination(
              icon: Icon(Icons.home_outlined, color: Colors.grey[600]),
              selectedIcon: Icon(Icons.home, color: theme.colorScheme.primary),
              label: "Home",
            ),
            NavigationDestination(
              icon: Icon(
                Icons.local_shipping_outlined,
                color: Colors.grey[600],
              ),
              selectedIcon: Icon(
                Icons.local_shipping,
                color: theme.colorScheme.primary,
              ),
              label: "Shipments",
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline, color: Colors.grey[600]),
              selectedIcon: Icon(
                Icons.person,
                color: theme.colorScheme.primary,
              ),
              label: "Profile",
            ),
          ],
        ),
      ),
    );
  }
}

// Customer Home Screen
class CustomerHomeScreen extends StatelessWidget {
  const CustomerHomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final shipmentsProvider = Provider.of<ShipmentsProvider>(context);
    final sentShipments = shipmentsProvider.sentShipments;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Welcome Section
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  theme.colorScheme.primary,
                  theme.colorScheme.primary.withOpacity(0.8),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.waving_hand,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Welcome back!',
                            style: GoogleFonts.poppins(
                              fontSize: 20,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                          Text(
                            'Ready to ship something?',
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              color: Colors.white.withOpacity(0.9),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // // Quick Actions
          // Text(
          //   'Quick Actions',
          //   style: GoogleFonts.poppins(
          //     fontSize: 20,
          //     fontWeight: FontWeight.w600,
          //     color: const Color(0xFF1A3C3C),
          //   ),
          // ),
          // const SizedBox(height: 16),

          // Row(
          //   children: [
          //     Expanded(
          //       child: Container(
          //         padding: const EdgeInsets.all(20),
          //         decoration: BoxDecoration(
          //           color: Colors.white,
          //           borderRadius: BorderRadius.circular(16),
          //           boxShadow: [
          //             BoxShadow(
          //               color: Colors.black.withOpacity(0.05),
          //               blurRadius: 10,
          //               offset: const Offset(0, 2),
          //             ),
          //           ],
          //         ),
          //         child: Column(
          //           children: [
          //             Container(
          //               padding: const EdgeInsets.all(12),
          //               decoration: BoxDecoration(
          //                 color: theme.colorScheme.primary.withOpacity(0.1),
          //                 borderRadius: BorderRadius.circular(12),
          //               ),
          //               child: Icon(
          //                 Icons.add,
          //                 color: theme.colorScheme.primary,
          //                 size: 24,
          //               ),
          //             ),
          //             const SizedBox(height: 12),
          //             Text(
          //               'New Shipment',
          //               style: GoogleFonts.poppins(
          //                 fontSize: 14,
          //                 fontWeight: FontWeight.w600,
          //               ),
          //             ),
          //           ],
          //         ),
          //       ),
          //     ),
          //     const SizedBox(width: 16),
          //     Expanded(
          //       child: Container(
          //         padding: const EdgeInsets.all(20),
          //         decoration: BoxDecoration(
          //           color: Colors.white,
          //           borderRadius: BorderRadius.circular(16),
          //           boxShadow: [
          //             BoxShadow(
          //               color: Colors.black.withOpacity(0.05),
          //               blurRadius: 10,
          //               offset: const Offset(0, 2),
          //             ),
          //           ],
          //         ),
          //         child: Column(
          //           children: [
          //             Container(
          //               padding: const EdgeInsets.all(12),
          //               decoration: BoxDecoration(
          //                 color: theme.colorScheme.secondary.withOpacity(0.1),
          //                 borderRadius: BorderRadius.circular(12),
          //               ),
          //               child: Icon(
          //                 Icons.search,
          //                 color: theme.colorScheme.secondary,
          //                 size: 24,
          //               ),
          //             ),
          //             const SizedBox(height: 12),
          //             Text(
          //               'Track Package',
          //               style: GoogleFonts.poppins(
          //                 fontSize: 14,
          //                 fontWeight: FontWeight.w600,
          //               ),
          //             ),
          //           ],
          //         ),
          //       ),
          //     ),
          //   ],
          // ),
          const SizedBox(height: 24),

          // Recent Shipments
          Text(
            'Recent Shipments',
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1A3C3C),
            ),
          ),
          const SizedBox(height: 16),
          sentShipments.isEmpty
              ? Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Icon(
                        Icons.inbox_outlined,
                        size: 48,
                        color: Colors.grey[400],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No shipments yet',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: Colors.grey[600],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Create your first shipment to get started',
                        style: TextStyle(fontSize: 14, color: Colors.grey[500]),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                )
              : Column(
                  children: [
                    for (final shipment in sentShipments.take(3))
                      Card(
                        elevation: 4,
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                            vertical: 14,
                            horizontal: 18,
                          ),
                          title: Text(
                            'To: ${shipment.receiverName}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Chip(
                                    label: Text(shipment.status),
                                    backgroundColor:
                                        shipment.status == 'Delivered'
                                        ? Colors.green[100]
                                        : shipment.status == 'Picked Up'
                                        ? Colors.orange[100]
                                        : Colors.grey[200],
                                    labelStyle: TextStyle(
                                      color: shipment.status == 'Delivered'
                                          ? Colors.green[800]
                                          : shipment.status == 'Picked Up'
                                          ? Colors.orange[800]
                                          : Colors.grey[800],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Chip(
                                    label: Text(
                                      'Payment: ${shipment.paymentStatus}',
                                    ),
                                    backgroundColor:
                                        shipment.paymentStatus == 'paid'
                                        ? Colors.green[100]
                                        : Colors.red[100],
                                    labelStyle: TextStyle(
                                      color: shipment.paymentStatus == 'paid'
                                          ? Colors.green[800]
                                          : Colors.red[800],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text('From: ${shipment.originCity}'),
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
                                builder: (context) => ShipmentDetailsScreen(
                                  shipmentId: shipment.id,
                                  isSent: true,
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                  ],
                ),
        ],
      ),
    );
  }
}

class RegisterShipmentDialog extends StatefulWidget {
  @override
  State<RegisterShipmentDialog> createState() => _RegisterShipmentDialogState();
}

class _RegisterShipmentDialogState extends State<RegisterShipmentDialog> {
  final _formKey = GlobalKey<FormState>();
  final _receiverNameController = TextEditingController();
  final _receiverPhoneController = TextEditingController();
  final _receiverAddressController = TextEditingController();
  final _originCityController = TextEditingController();
  final _destinationCityController = TextEditingController();
  final ShipmentsService _shipmentsService = ShipmentsService();

  List<Map<String, dynamic>> _cities = [];
  String? _selectedOriginCityId;
  String? _selectedDestinationCityId;
  bool _loadingDropdowns = true;

  @override
  void initState() {
    super.initState();
    _fetchDropdownData();
  }

  Future<void> _fetchDropdownData() async {
    setState(() => _loadingDropdowns = true);
    try {
      final citiesResp = await _shipmentsService.fetchCities();
      setState(() {
        _cities =
            (citiesResp['data'] as List?)
                ?.map((e) => Map<String, dynamic>.from(e))
                .toList() ??
            [];
        _loadingDropdowns = false;
      });
    } catch (e) {
      setState(() => _loadingDropdowns = false);
    }
  }

  @override
  void dispose() {
    _receiverNameController.dispose();
    _receiverPhoneController.dispose();
    _receiverAddressController.dispose();
    _originCityController.dispose();
    _destinationCityController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final shipmentsProvider = Provider.of<ShipmentsProvider>(context);
    final sentShipments = shipmentsProvider.sentShipments;
    final theme = Theme.of(context);
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      backgroundColor: Colors.white,
      child: SingleChildScrollView(
        child: Container(
          padding: const EdgeInsets.all(24),
          constraints: const BoxConstraints(maxWidth: 400),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        Icons.local_shipping,
                        color: theme.colorScheme.primary,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Register New Shipment',
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                if (_loadingDropdowns)
                  const Center(child: CircularProgressIndicator())
                else ...[
                  Text(
                    'Receiver',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _receiverNameController,
                    decoration: const InputDecoration(
                      labelText: 'Receiver Name',
                      prefixIcon: Icon(Icons.person),
                    ),
                    validator: (value) =>
                        value == null || value.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _receiverPhoneController,
                    decoration: const InputDecoration(
                      labelText: 'Receiver Phone',
                      prefixIcon: Icon(Icons.phone),
                    ),
                    validator: (value) =>
                        value == null || value.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _receiverAddressController,
                    decoration: const InputDecoration(
                      labelText: 'Receiver Address',
                      prefixIcon: Icon(Icons.location_on),
                    ),
                    validator: (value) =>
                        value == null || value.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Route',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _selectedOriginCityId,
                    items: _cities
                        .map(
                          (city) => DropdownMenuItem<String>(
                            value: city['_id'] as String,
                            child: Text(city['name'] ?? ''),
                          ),
                        )
                        .toList(),
                    onChanged: (value) =>
                        setState(() => _selectedOriginCityId = value),
                    decoration: const InputDecoration(
                      labelText: 'Origin City',
                      prefixIcon: Icon(Icons.location_city),
                    ),
                    validator: (value) =>
                        value == null || value.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _selectedDestinationCityId,
                    items: _cities
                        .map(
                          (city) => DropdownMenuItem<String>(
                            value: city['_id'] as String,
                            child: Text(city['name'] ?? ''),
                          ),
                        )
                        .toList(),
                    onChanged: (value) =>
                        setState(() => _selectedDestinationCityId = value),
                    decoration: const InputDecoration(
                      labelText: 'Destination City',
                      prefixIcon: Icon(Icons.location_city),
                    ),
                    validator: (value) =>
                        value == null || value.isEmpty ? 'Required' : null,
                  ),
                  if (shipmentsProvider.error != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8.0),
                      child: Text(
                        shipmentsProvider.error!,
                        style: const TextStyle(color: Colors.red),
                      ),
                    ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: const Text('Cancel'),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: theme.colorScheme.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 32,
                            vertical: 14,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          textStyle: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        onPressed: shipmentsProvider.isLoading
                            ? null
                            : () async {
                                // Extra null/empty checks for required fields
                                if (_selectedOriginCityId == null ||
                                    _selectedOriginCityId!.isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'Please select an origin city.',
                                      ),
                                    ),
                                  );
                                  return;
                                }
                                if (_selectedDestinationCityId == null ||
                                    _selectedDestinationCityId!.isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'Please select a destination city.',
                                      ),
                                    ),
                                  );
                                  return;
                                }
                                if (_formKey.currentState!.validate()) {
                                  final success = await shipmentsProvider
                                      .createShipment(
                                        receiverName: _receiverNameController
                                            .text
                                            .trim(),
                                        receiverPhone: _receiverPhoneController
                                            .text
                                            .trim(),
                                        receiverAddress:
                                            _receiverAddressController.text
                                                .trim(),
                                        originCity: _selectedOriginCityId ?? '',
                                        destinationCity:
                                            _selectedDestinationCityId ?? '',
                                        receiverUserId: null,
                                      );
                                  if (success && mounted) {
                                    Navigator.of(context).pop();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'Shipment registered successfully!',
                                        ),
                                      ),
                                    );
                                  }
                                }
                              },
                        child: shipmentsProvider.isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Register'),
                      ),
                    ],
                  ),
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
