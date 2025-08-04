import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:app/providers/auth_provider.dart';
import 'package:app/providers/shipments_provider.dart';
import 'package:app/screens/courier_shipment_details_screen.dart';
// Remove this line:
// import 'package:qr_code_scanner/qr_code_scanner.dart';
import 'scanScreen.dart';

class CourierDashboardScreen extends StatefulWidget {
  const CourierDashboardScreen({Key? key}) : super(key: key);

  @override
  State<CourierDashboardScreen> createState() => _CourierDashboardScreenState();
}

class _CourierDashboardScreenState extends State<CourierDashboardScreen> {
  int _selectedIndex = 0;

  static final List<Widget> _pages = <Widget>[
    CourierHomeScreen(),
    const ScanScreen(),
    const CourierProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(child: _pages[_selectedIndex]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home), label: "Home"),
          NavigationDestination(
              icon: Icon(Icons.qr_code_scanner), label: "Scan"),
          NavigationDestination(icon: Icon(Icons.person), label: "Profile"),
        ],
      ),
    );
  }
}

// Rest of your existing code remains the same...
class CourierHomeScreen extends StatefulWidget {
  @override
  State<CourierHomeScreen> createState() => _CourierHomeScreenState();
}

class _CourierHomeScreenState extends State<CourierHomeScreen> {
  String _searchTerm = '';
  String _statusFilter = 'all';
  @override
  void initState() {
    super.initState();
    final shipmentsProvider =
        Provider.of<ShipmentsProvider>(context, listen: false);
    shipmentsProvider.clearError(); // Clear errors on screen load
    shipmentsProvider.fetchCourierShipments();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    Provider.of<ShipmentsProvider>(context, listen: false).clearError();
  }

  @override
  Widget build(BuildContext context) {
    final shipmentsProvider = Provider.of<ShipmentsProvider>(context);
    final assignedShipments = shipmentsProvider.courierShipments;
    final isLoading = shipmentsProvider.isLoading;
    final error = shipmentsProvider.error;
    final theme = Theme.of(context);

    // Filtering
    List filteredShipments = assignedShipments.where((shipment) {
      final matchesSearch = _searchTerm.isEmpty ||
          shipment.receiverName
              .toLowerCase()
              .contains(_searchTerm.toLowerCase()) ||
          shipment.originCity
              .toLowerCase()
              .contains(_searchTerm.toLowerCase()) ||
          shipment.destinationCity
              .toLowerCase()
              .contains(_searchTerm.toLowerCase());
      final matchesStatus =
          _statusFilter == 'all' || shipment.status == _statusFilter;
      return matchesSearch && matchesStatus;
    }).toList();

    return RefreshIndicator(
      onRefresh: () async {
        shipmentsProvider.clearError();
        await shipmentsProvider.fetchCourierShipments();
      },
      child: isLoading
          ? const Center(child: CircularProgressIndicator())
          : error != null
              ? Center(
                  child:
                      Text(error!, style: const TextStyle(color: Colors.red)))
              : Container(
                  color: const Color(0xFFF6F8FA),
                  child: Column(
                    children: [
                      // Header
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color:
                                    theme.colorScheme.primary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(Icons.local_shipping,
                                  color: theme.colorScheme.primary, size: 24),
                            ),
                            const SizedBox(width: 12),
                            Text('My Shipments',
                                style: theme.textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: theme.colorScheme.primary)),
                          ],
                        ),
                      ),
                      // Search and filter
                      Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 20, vertical: 4),
                        child: Row(
                          children: [
                            Expanded(
                              child: TextField(
                                decoration: InputDecoration(
                                  hintText: 'Search shipments...',
                                  prefixIcon: const Icon(Icons.search),
                                  contentPadding: const EdgeInsets.symmetric(
                                      vertical: 0, horizontal: 12),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    borderSide: BorderSide.none,
                                  ),
                                  filled: true,
                                  fillColor: Colors.white,
                                ),
                                onChanged: (val) =>
                                    setState(() => _searchTerm = val),
                              ),
                            ),
                            const SizedBox(width: 12),
                            DropdownButton<String>(
                              value: _statusFilter,
                              items: const [
                                DropdownMenuItem(
                                    value: 'all', child: Text('All')),
                                DropdownMenuItem(
                                    value: 'Pending Pickup',
                                    child: Text('Pending Pickup')),
                                DropdownMenuItem(
                                    value: 'Picked Up',
                                    child: Text('Picked Up')),
                                DropdownMenuItem(
                                    value: 'At Origin Hub',
                                    child: Text('At Origin Hub')),
                                DropdownMenuItem(
                                    value: 'In Transit',
                                    child: Text('In Transit')),
                                DropdownMenuItem(
                                    value: 'At Destination Hub',
                                    child: Text('At Destination Hub')),
                                DropdownMenuItem(
                                    value: 'Out for Delivery',
                                    child: Text('Out for Delivery')),
                                DropdownMenuItem(
                                    value: 'Delivered',
                                    child: Text('Delivered')),
                              ],
                              onChanged: (val) =>
                                  setState(() => _statusFilter = val!),
                              underline: Container(),
                              style: const TextStyle(
                                  fontSize: 14, color: Colors.black),
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Expanded(
                        child: filteredShipments.isEmpty
                            ? const Center(child: Text('No assigned shipments'))
                            : ListView.separated(
                                padding: const EdgeInsets.all(20),
                                itemCount: filteredShipments.length,
                                separatorBuilder: (_, __) =>
                                    const SizedBox(height: 16),
                                itemBuilder: (context, index) {
                                  final shipment = filteredShipments[index];
                                  return Card(
                                    elevation: 4,
                                    margin: EdgeInsets.zero,
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(16)),
                                    child: InkWell(
                                      borderRadius: BorderRadius.circular(16),
                                      onTap: () async {
                                        shipmentsProvider.clearError();
                                        await Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) =>
                                                CourierShipmentDetailsScreen(
                                              shipment: shipment,
                                              onUpdated: () {
                                                shipmentsProvider.clearError();
                                                shipmentsProvider
                                                    .fetchCourierShipments();
                                              },
                                            ),
                                          ),
                                        );
                                        shipmentsProvider.clearError();
                                      },
                                      child: Padding(
                                        padding: const EdgeInsets.symmetric(
                                            vertical: 18, horizontal: 20),
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Icon(Icons.local_shipping,
                                                    color: theme
                                                        .colorScheme.primary,
                                                    size: 28),
                                                const SizedBox(width: 10),
                                                Expanded(
                                                  child: Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      Text(
                                                        'To: ${shipment.receiverName}',
                                                        style: const TextStyle(
                                                            fontWeight:
                                                                FontWeight.bold,
                                                            fontSize: 17),
                                                      ),
                                                      if (shipment.senderName != null) ...[
                                                        const SizedBox(height: 4),
                                                        Text(
                                                          'From: ${shipment.senderName}',
                                                          style: TextStyle(
                                                            fontSize: 14,
                                                            color: Colors.grey[600],
                                                          ),
                                                        ),
                                                      ],
                                                    ],
                                                  ),
                                                ),
                                                Icon(Icons.chevron_right,
                                                    color: Colors.grey[500])
                                              ],
                                            ),
                                            const SizedBox(height: 10),
                                            Row(
                                              children: [
                                                _StatusChip(
                                                  label: shipment.status,
                                                  color: shipment.status ==
                                                          'Delivered'
                                                      ? Colors.green
                                                      : shipment.status ==
                                                              'At Destination Hub'
                                                          ? Colors.blue
                                                          : shipment.status ==
                                                                  'In Transit'
                                                              ? Colors.orange
                                                              : Colors.grey,
                                                ),
                                                const SizedBox(width: 8),
                                                _StatusChip(
                                                  label:
                                                      'Payment: ${shipment.paymentStatus}',
                                                  color:
                                                      shipment.paymentStatus ==
                                                              'paid'
                                                          ? Colors.green
                                                          : Colors.red,
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 8),
                                            Row(
                                              children: [
                                                Icon(Icons.location_on,
                                                    color: theme
                                                        .colorScheme.primary,
                                                    size: 18),
                                                const SizedBox(width: 4),
                                                Text(
                                                    'From: ${shipment.originCity}',
                                                    style: const TextStyle(
                                                        fontSize: 14)),
                                              ],
                                            ),
                                            Row(
                                              children: [
                                                Icon(Icons.flag,
                                                    color: theme
                                                        .colorScheme.secondary,
                                                    size: 18),
                                                const SizedBox(width: 4),
                                                Text(
                                                    'To: ${shipment.destinationCity}',
                                                    style: const TextStyle(
                                                        fontSize: 14)),
                                              ],
                                            ),
                                            if (shipment.price != null)
                                              Padding(
                                                padding: const EdgeInsets.only(
                                                    top: 4),
                                                child: Text(
                                                    'Price: ${shipment.price}',
                                                    style: const TextStyle(
                                                        fontSize: 14)),
                                              ),
                                            if (shipment.weight != null)
                                              Padding(
                                                padding: const EdgeInsets.only(
                                                    top: 2),
                                                child: Text(
                                                    'Weight: ${shipment.weight} kg',
                                                    style: const TextStyle(
                                                        fontSize: 14)),
                                              ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
                      ),
                    ],
                  ),
                ),
    );
  }
}

class CourierProfileScreen extends StatelessWidget {
  const CourierProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.userData;
    final theme = Theme.of(context);

    if (user == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Modern SliverAppBar with gradient
          SliverAppBar(
            expandedHeight: 220,
            floating: false,
            pinned: true,
            backgroundColor: Colors.transparent,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      theme.colorScheme.primary,
                      theme.colorScheme.primary.withOpacity(0.8),
                      const Color(0xFF2196F3),
                    ],
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 40),
                      // Courier Badge & Avatar
                      Stack(
                        alignment: Alignment.center,
                        children: [
                          Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.2),
                                  blurRadius: 20,
                                  offset: const Offset(0, 10),
                                ),
                              ],
                            ),
                            child: CircleAvatar(
                              radius: 50,
                              backgroundColor: Colors.white,
                              child: Text(
                                (user['name'] ?? 'U')
                                    .substring(0, 1)
                                    .toUpperCase(),
                                style: TextStyle(
                                  color: theme.colorScheme.primary,
                                  fontSize: 40,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                          // Courier Badge
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.green[500],
                                shape: BoxShape.circle,
                                border:
                                    Border.all(color: Colors.white, width: 3),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.2),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: const Icon(
                                Icons.delivery_dining,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        user['name'] ?? 'Courier',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Profile Content
          SliverToBoxAdapter(
            child: Container(
              color: const Color(0xFFF8F9FA),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    const SizedBox(height: 20),

                    // Edit Profile Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: authProvider.isLoading
                            ? null
                            : () => _showEditProfileDialog(context, authProvider, user),
                        icon: const Icon(Icons.edit_outlined),
                        label: const Text('Edit Profile'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: theme.colorScheme.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          textStyle: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 2,
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Profile Information Cards
                    _buildInfoCard(
                      context,
                      icon: Icons.person_outline,
                      title: 'Full Name',
                      value: user['name'] ?? 'Not provided',
                    ),

                    const SizedBox(height: 16),

                    _buildInfoCard(
                      context,
                      icon: Icons.phone_outlined,
                      title: 'Phone Number',
                      value: user['phone'] ?? 'Not provided',
                    ),

                    const SizedBox(height: 16),

                    _buildInfoCard(
                      context,
                      icon: Icons.location_on_outlined,
                      title: 'Address',
                      value: user['address'] ?? 'Not provided',
                    ),

                    const SizedBox(height: 16),

                    // Logout Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: authProvider.isLoading
                            ? null
                            : () async {
                                final success = await authProvider.logout();
                                if (success && context.mounted) {
                                  Navigator.of(context).pushNamedAndRemoveUntil(
                                      '/login', (route) => false);
                                }
                              },
                        icon: authProvider.isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                      Colors.white),
                                ),
                              )
                            : const Icon(Icons.logout_outlined),
                        label: Text(authProvider.isLoading
                            ? 'Logging out...'
                            : 'Logout'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red[500],
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          textStyle: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 2,
                        ),
                      ),
                    ),

                    if (authProvider.error != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red[50],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red[200]!),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.error_outline, color: Colors.red[600]),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                authProvider.error!,
                                style: TextStyle(color: Colors.red[700]),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    BuildContext context, {
    required IconData icon,
    required String value,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String value,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: Theme.of(context).colorScheme.primary,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(
    BuildContext context, {
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 18),
      label: Text(
        label,
        style: const TextStyle(fontSize: 13),
      ),
      style: OutlinedButton.styleFrom(
        foregroundColor: color,
        side: BorderSide(color: color.withOpacity(0.3)),
        padding: const EdgeInsets.symmetric(vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }

  void _showEditProfileDialog(BuildContext context, AuthProvider authProvider, Map<String, dynamic> user) {
    final nameController = TextEditingController(text: user['name'] ?? '');
    final phoneController = TextEditingController(text: user['phone'] ?? '');
    final addressController = TextEditingController(text: user['address'] ?? '');
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();
    
    bool showCurrentPassword = false;
    bool showNewPassword = false;
    bool showConfirmPassword = false;
    bool isUpdating = false;
    String? errorMessage;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: const Text('Edit Profile'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Error message display
                    if (errorMessage != null) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red[50],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red[200]!),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.error_outline, color: Colors.red[600], size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                errorMessage!,
                                style: TextStyle(color: Colors.red[700], fontSize: 14),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    
                    // Name field
                    TextField(
                      controller: nameController,
                      decoration: const InputDecoration(
                        labelText: 'Full Name',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Phone field
                    TextField(
                      controller: phoneController,
                      decoration: const InputDecoration(
                        labelText: 'Phone Number',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 16),
                    
                    // Address field
                    TextField(
                      controller: addressController,
                      decoration: const InputDecoration(
                        labelText: 'Address',
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 24),
                    
                    // Password section
                    const Text(
                      'Password (Optional)',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Leave blank if you don\'t want to change your password',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Current password
                    TextField(
                      controller: currentPasswordController,
                      obscureText: !showCurrentPassword,
                      decoration: InputDecoration(
                        labelText: 'Current Password',
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          icon: Icon(showCurrentPassword ? Icons.visibility_off : Icons.visibility),
                          onPressed: () => setState(() => showCurrentPassword = !showCurrentPassword),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // New password
                    TextField(
                      controller: newPasswordController,
                      obscureText: !showNewPassword,
                      decoration: InputDecoration(
                        labelText: 'New Password',
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          icon: Icon(showNewPassword ? Icons.visibility_off : Icons.visibility),
                          onPressed: () => setState(() => showNewPassword = !showNewPassword),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Confirm password
                    TextField(
                      controller: confirmPasswordController,
                      obscureText: !showConfirmPassword,
                      decoration: InputDecoration(
                        labelText: 'Confirm New Password',
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          icon: Icon(showConfirmPassword ? Icons.visibility_off : Icons.visibility),
                          onPressed: () => setState(() => showConfirmPassword = !showConfirmPassword),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: isUpdating ? null : () => Navigator.of(context).pop(),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: isUpdating ? null : () async {
                    // Clear previous error
                    setState(() => errorMessage = null);
                    
                    // Validate password fields
                    if (newPasswordController.text.isNotEmpty) {
                      if (currentPasswordController.text.isEmpty) {
                        setState(() => errorMessage = 'Current password is required when changing password');
                        return;
                      }
                      if (newPasswordController.text != confirmPasswordController.text) {
                        setState(() => errorMessage = 'New passwords do not match');
                        return;
                      }
                      if (newPasswordController.text.length < 8) {
                        setState(() => errorMessage = 'Password must be at least 8 characters');
                        return;
                      }
                    }
                    
                    setState(() => isUpdating = true);
                    
                    final success = await authProvider.updateProfile(
                      name: nameController.text.trim(),
                      phone: phoneController.text.trim(),
                      address: addressController.text.trim(),
                      currentPassword: currentPasswordController.text.isNotEmpty ? currentPasswordController.text : null,
                      newPassword: newPasswordController.text.isNotEmpty ? newPasswordController.text : null,
                    );
                    
                    if (success && context.mounted) {
                      Navigator.of(context).pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Profile updated successfully')),
                      );
                    } else if (context.mounted) {
                      setState(() {
                        isUpdating = false;
                        errorMessage = authProvider.error ?? 'Failed to update profile';
                      });
                    }
                  },
                  child: isUpdating
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Update Profile'),
                ),
              ],
            );
          },
        );
      },
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
