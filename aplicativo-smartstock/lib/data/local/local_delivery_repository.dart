import 'dart:convert';

import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

import '../../domain/delivery_repository.dart';
import '../../domain/models.dart';

class LocalDeliveryRepository extends DeliveryRepository {
  Database? _database;

  @override
  bool get supportsProofPhotos => true;

  Future<Database> get _db async => _database ??= await openDatabase(
    join(await getDatabasesPath(), 'smartstock_delivery.db'),
    version: 1,
    onCreate: (db, version) async {
      await db.execute('''CREATE TABLE deliveries(
            id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL
          )''');
      await db.execute('''CREATE TABLE delivery_events(
            id TEXT PRIMARY KEY, delivery_id TEXT NOT NULL, status TEXT NOT NULL,
            note TEXT, created_at TEXT NOT NULL, synced INTEGER NOT NULL DEFAULT 0
          )''');
    },
  );

  @override
  Future<void> initialize() async {
    final db = await _db;
    final count =
        Sqflite.firstIntValue(
          await db.rawQuery('SELECT COUNT(*) FROM deliveries'),
        ) ??
        0;
    if (count == 0) await _seed(db);
  }

  @override
  Future<AppUser> login(String email, String password) async {
    if (email.trim().isEmpty || password.trim().isEmpty) {
      throw Exception('Informe e-mail e senha para entrar.');
    }
    return AppUser(id: 'driver-001', name: 'Marcos Silva', email: email.trim());
  }

  @override
  Future<List<Delivery>> getDeliveries() async {
    final db = await _db;
    final rows = await db.query('deliveries', orderBy: 'updated_at DESC');
    final deliveries = rows
        .map(
          (row) => _deliveryFromJson(
            jsonDecode(row['payload']! as String) as Map<String, dynamic>,
          ),
        )
        .toList();
    deliveries.sort((a, b) => a.sequence.compareTo(b.sequence));
    return deliveries;
  }

  @override
  Future<List<DeliveryEvent>> getEvents(String deliveryId) async {
    final db = await _db;
    final rows = await db.query(
      'delivery_events',
      where: 'delivery_id = ?',
      whereArgs: [deliveryId],
      orderBy: 'created_at DESC',
    );
    return rows
        .map(
          (row) => DeliveryEvent(
            id: row['id']! as String,
            deliveryId: row['delivery_id']! as String,
            status: DeliveryStatus.values.byName(row['status']! as String),
            note: row['note'] as String?,
            createdAt: DateTime.parse(row['created_at']! as String),
          ),
        )
        .toList();
  }

  @override
  Future<void> updateDelivery(Delivery delivery, {String? eventNote}) async {
    final db = await _db;
    final now = DateTime.now();
    await db.transaction((txn) async {
      await txn.insert('deliveries', {
        'id': delivery.id,
        'payload': jsonEncode(_deliveryToJson(delivery)),
        'updated_at': now.toIso8601String(),
      }, conflictAlgorithm: ConflictAlgorithm.replace);
      await txn.insert('delivery_events', {
        'id': '${delivery.id}-${now.microsecondsSinceEpoch}',
        'delivery_id': delivery.id,
        'status': delivery.status.name,
        'note': eventNote,
        'created_at': now.toIso8601String(),
        'synced': 0,
      });
    });
  }

  @override
  Future<int> pendingSyncCount() async {
    final db = await _db;
    return Sqflite.firstIntValue(
          await db.rawQuery(
            'SELECT COUNT(*) FROM delivery_events WHERE synced = 0',
          ),
        ) ??
        0;
  }

  Future<void> _seed(Database db) async {
    final deliveries = <Delivery>[
      Delivery(
        id: 'd1',
        orderNumber: 'SS-1042',
        customerName: 'Mercado Oliveira',
        phone: '11987654321',
        address: 'Rua das Acácias, 142',
        neighborhood: 'Centro',
        city: 'São Paulo - SP',
        sequence: 1,
        status: DeliveryStatus.onRoute,
        scheduledAt: DateTime.now(),
        notes: 'Receber pela entrada lateral.',
        items: const [
          DeliveryItem(name: 'Café Premium 500 g', quantity: 6),
          DeliveryItem(name: 'Açúcar Refinado 1 kg', quantity: 12),
        ],
      ),
      Delivery(
        id: 'd2',
        orderNumber: 'SS-1048',
        customerName: 'Padaria Pão Quente',
        phone: '11976543210',
        address: 'Av. Brasil, 890',
        neighborhood: 'Jardins',
        city: 'São Paulo - SP',
        sequence: 2,
        status: DeliveryStatus.pending,
        scheduledAt: DateTime.now(),
        notes: 'Falar com Ana no caixa.',
        items: const [
          DeliveryItem(name: 'Leite Integral 1 L', quantity: 24),
          DeliveryItem(name: 'Biscoito Integral 200 g', quantity: 10),
        ],
      ),
      Delivery(
        id: 'd3',
        orderNumber: 'SS-1051',
        customerName: 'Restaurante Sabor Caseiro',
        phone: '11991234567',
        address: 'Rua do Comércio, 55',
        neighborhood: 'Vila Nova',
        city: 'São Paulo - SP',
        sequence: 3,
        status: DeliveryStatus.pending,
        scheduledAt: DateTime.now(),
        notes: 'Estacionar na vaga de carga.',
        items: const [DeliveryItem(name: 'Óleo de Soja 900 ml', quantity: 18)],
      ),
      Delivery(
        id: 'd4',
        orderNumber: 'SS-1039',
        customerName: 'Empório Verde',
        phone: '11995550011',
        address: 'Alameda das Flores, 320',
        neighborhood: 'Moema',
        city: 'São Paulo - SP',
        sequence: 4,
        status: DeliveryStatus.delivered,
        scheduledAt: DateTime.now(),
        notes: '',
        receiverName: 'Carla Mendes',
        items: const [DeliveryItem(name: 'Granola 1 kg', quantity: 4)],
      ),
    ];
    final batch = db.batch();
    for (final delivery in deliveries) {
      batch.insert('deliveries', {
        'id': delivery.id,
        'payload': jsonEncode(_deliveryToJson(delivery)),
        'updated_at': DateTime.now().toIso8601String(),
      });
    }
    await batch.commit(noResult: true);
  }

  Map<String, dynamic> _deliveryToJson(Delivery d) => {
    'id': d.id,
    'orderNumber': d.orderNumber,
    'customerName': d.customerName,
    'phone': d.phone,
    'address': d.address,
    'neighborhood': d.neighborhood,
    'city': d.city,
    'sequence': d.sequence,
    'status': d.status.name,
    'scheduledAt': d.scheduledAt.toIso8601String(),
    'notes': d.notes,
    'receiverName': d.receiverName,
    'failureReason': d.failureReason,
    'proofPath': d.proofPath,
    'items': d.items
        .map((item) => {'name': item.name, 'quantity': item.quantity})
        .toList(),
  };

  Delivery _deliveryFromJson(Map<String, dynamic> json) => Delivery(
    id: json['id'] as String,
    orderNumber: json['orderNumber'] as String,
    customerName: json['customerName'] as String,
    phone: json['phone'] as String,
    address: json['address'] as String,
    neighborhood: json['neighborhood'] as String,
    city: json['city'] as String,
    sequence: json['sequence'] as int,
    status: DeliveryStatus.values.byName(json['status'] as String),
    scheduledAt: DateTime.parse(json['scheduledAt'] as String),
    notes: json['notes'] as String,
    receiverName: json['receiverName'] as String?,
    failureReason: json['failureReason'] as String?,
    proofPath: json['proofPath'] as String?,
    items: (json['items'] as List<dynamic>)
        .map(
          (item) => DeliveryItem(
            name: item['name'] as String,
            quantity: item['quantity'] as int,
          ),
        )
        .toList(),
  );
}
