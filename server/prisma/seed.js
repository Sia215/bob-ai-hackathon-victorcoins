import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding CHAINguard database...')

  // ─── USERS ───────────────────────────────────────────────────────────────
  await prisma.user.createMany({
    data: [
      { email: 'admin@chainguard.ai', name: 'Arjun Sharma', role: 'admin' },
      { email: 'ops@chainguard.ai', name: 'Priya Nair', role: 'operator' },
      { email: 'analyst@chainguard.ai', name: 'Rahul Mehta', role: 'analyst' },
    ],
    skipDuplicates: true,
  })

  // ─── CARRIERS ────────────────────────────────────────────────────────────
  const carriers = await Promise.all([
    prisma.carrier.upsert({ where: { carrierCode: 'GATI' }, update: {}, create: { carrierCode: 'GATI', name: 'Gati Logistics', type: 'ROAD', reliabilityScore: 0.88, activeShipments: 6 } }),
    prisma.carrier.upsert({ where: { carrierCode: 'BDART' }, update: {}, create: { carrierCode: 'BDART', name: 'Blue Dart Express', type: 'AIR', reliabilityScore: 0.95, activeShipments: 5 } }),
    prisma.carrier.upsert({ where: { carrierCode: 'MAERSK' }, update: {}, create: { carrierCode: 'MAERSK', name: 'Maersk India', type: 'SEA', reliabilityScore: 0.92, activeShipments: 4 } }),
    prisma.carrier.upsert({ where: { carrierCode: 'INDIGO' }, update: {}, create: { carrierCode: 'INDIGO', name: 'IndiGo Cargo', type: 'AIR', reliabilityScore: 0.91, activeShipments: 3 } }),
    prisma.carrier.upsert({ where: { carrierCode: 'TIRAIL' }, update: {}, create: { carrierCode: 'TIRAIL', name: 'TransIndia Rail', type: 'RAIL', reliabilityScore: 0.85, activeShipments: 4 } }),
    prisma.carrier.upsert({ where: { carrierCode: 'DUBFRT' }, update: {}, create: { carrierCode: 'DUBFRT', name: 'Dubai Freight Co', type: 'SEA', reliabilityScore: 0.89, activeShipments: 3 } }),
    prisma.carrier.upsert({ where: { carrierCode: 'SINGMR' }, update: {}, create: { carrierCode: 'SINGMR', name: 'Singapore Maritime', type: 'SEA', reliabilityScore: 0.93, activeShipments: 3 } }),
    prisma.carrier.upsert({ where: { carrierCode: 'ATLEX' }, update: {}, create: { carrierCode: 'ATLEX', name: 'Atlantic Express', type: 'SEA', reliabilityScore: 0.87, activeShipments: 2 } }),
  ])

  const [gati, blueDart, maersk, indigo, transIndia, dubaiFrt, singMar, atlEx] = carriers

  // ─── ROUTES ──────────────────────────────────────────────────────────────
  const routeRecords = await Promise.all([
    prisma.route.upsert({ where: { routeCode: 'RT-MUM-DEL' }, update: {}, create: { routeCode: 'RT-MUM-DEL', name: 'Mumbai–Delhi NH48', origin: 'Mumbai', destination: 'Delhi', distanceKm: 1422, durationHrs: 24, riskLevel: 'MEDIUM' } }),
    prisma.route.upsert({ where: { routeCode: 'RT-CHE-ROT' }, update: {}, create: { routeCode: 'RT-CHE-ROT', name: 'Chennai–Rotterdam Sea', origin: 'Chennai', destination: 'Rotterdam', distanceKm: 12400, durationHrs: 336, riskLevel: 'HIGH' } }),
    prisma.route.upsert({ where: { routeCode: 'RT-PUN-DXB' }, update: {}, create: { routeCode: 'RT-PUN-DXB', name: 'Pune–Dubai Air', origin: 'Pune', destination: 'Dubai', distanceKm: 2600, durationHrs: 6, riskLevel: 'LOW' } }),
    prisma.route.upsert({ where: { routeCode: 'RT-BLR-HYD' }, update: {}, create: { routeCode: 'RT-BLR-HYD', name: 'Bangalore–Hyderabad NH44', origin: 'Bangalore', destination: 'Hyderabad', distanceKm: 568, durationHrs: 9, riskLevel: 'LOW' } }),
    prisma.route.upsert({ where: { routeCode: 'RT-MUM-CHE' }, update: {}, create: { routeCode: 'RT-MUM-CHE', name: 'Mumbai–Chennai Coastal', origin: 'Mumbai', destination: 'Chennai', distanceKm: 1338, durationHrs: 20, riskLevel: 'MEDIUM' } }),
    prisma.route.upsert({ where: { routeCode: 'RT-DEL-KOL' }, update: {}, create: { routeCode: 'RT-DEL-KOL', name: 'Delhi–Kolkata Rail', origin: 'Delhi', destination: 'Kolkata', distanceKm: 1472, durationHrs: 26, riskLevel: 'LOW' } }),
    prisma.route.upsert({ where: { routeCode: 'RT-MUM-SIN' }, update: {}, create: { routeCode: 'RT-MUM-SIN', name: 'Mumbai–Singapore Sea', origin: 'Mumbai', destination: 'Singapore', distanceKm: 4700, durationHrs: 168, riskLevel: 'MEDIUM' } }),
    prisma.route.upsert({ where: { routeCode: 'RT-JNPT-FEL' }, update: {}, create: { routeCode: 'RT-JNPT-FEL', name: 'JNPT–Felixstowe Sea', origin: 'JNPT Mumbai', destination: 'Felixstowe UK', distanceKm: 11900, durationHrs: 312, riskLevel: 'HIGH' } }),
    prisma.route.upsert({ where: { routeCode: 'RT-AMD-DEL' }, update: {}, create: { routeCode: 'RT-AMD-DEL', name: 'Ahmedabad–Delhi NH48', origin: 'Ahmedabad', destination: 'Delhi', distanceKm: 935, durationHrs: 15, riskLevel: 'LOW' } }),
    prisma.route.upsert({ where: { routeCode: 'RT-CHE-SIN' }, update: {}, create: { routeCode: 'RT-CHE-SIN', name: 'Chennai–Singapore Sea', origin: 'Chennai', destination: 'Singapore', distanceKm: 3800, durationHrs: 144, riskLevel: 'MEDIUM' } }),
    prisma.route.upsert({ where: { routeCode: 'RT-KOL-DXB' }, update: {}, create: { routeCode: 'RT-KOL-DXB', name: 'Kolkata–Dubai Air', origin: 'Kolkata', destination: 'Dubai', distanceKm: 4500, durationHrs: 8, riskLevel: 'LOW' } }),
    prisma.route.upsert({ where: { routeCode: 'RT-DEL-MUM' }, update: {}, create: { routeCode: 'RT-DEL-MUM', name: 'Delhi–Mumbai Rail', origin: 'Delhi', destination: 'Mumbai', distanceKm: 1384, durationHrs: 22, riskLevel: 'LOW' } }),
    prisma.route.upsert({ where: { routeCode: 'RT-HYD-MUM' }, update: {}, create: { routeCode: 'RT-HYD-MUM', name: 'Hyderabad–Mumbai NH65', origin: 'Hyderabad', destination: 'Mumbai', distanceKm: 711, durationHrs: 11, riskLevel: 'MEDIUM' } }),
    prisma.route.upsert({ where: { routeCode: 'RT-MUM-LON' }, update: {}, create: { routeCode: 'RT-MUM-LON', name: 'Mumbai–London Air', origin: 'Mumbai', destination: 'London', distanceKm: 7200, durationHrs: 10, riskLevel: 'LOW' } }),
    prisma.route.upsert({ where: { routeCode: 'RT-CHE-MUM' }, update: {}, create: { routeCode: 'RT-CHE-MUM', name: 'Chennai–Mumbai Rail', origin: 'Chennai', destination: 'Mumbai', distanceKm: 1279, durationHrs: 24, riskLevel: 'LOW' } }),
    prisma.route.upsert({ where: { routeCode: 'RT-PUN-BLR' }, update: {}, create: { routeCode: 'RT-PUN-BLR', name: 'Pune–Bangalore NH48', origin: 'Pune', destination: 'Bangalore', distanceKm: 840, durationHrs: 13, riskLevel: 'LOW' } }),
    prisma.route.upsert({ where: { routeCode: 'RT-COC-COL' }, update: {}, create: { routeCode: 'RT-COC-COL', name: 'Kochi–Colombo Sea', origin: 'Kochi', destination: 'Colombo', distanceKm: 640, durationHrs: 48, riskLevel: 'LOW' } }),
    prisma.route.upsert({ where: { routeCode: 'RT-JNPT-SHA' }, update: {}, create: { routeCode: 'RT-JNPT-SHA', name: 'JNPT–Shanghai Sea', origin: 'JNPT Mumbai', destination: 'Shanghai', distanceKm: 6500, durationHrs: 216, riskLevel: 'MEDIUM' } }),
    prisma.route.upsert({ where: { routeCode: 'RT-NAG-DEL' }, update: {}, create: { routeCode: 'RT-NAG-DEL', name: 'Nagpur–Delhi NH44', origin: 'Nagpur', destination: 'Delhi', distanceKm: 1127, durationHrs: 18, riskLevel: 'MEDIUM' } }),
    prisma.route.upsert({ where: { routeCode: 'RT-AMD-MUM' }, update: {}, create: { routeCode: 'RT-AMD-MUM', name: 'Ahmedabad–Mumbai NH48', origin: 'Ahmedabad', destination: 'Mumbai', distanceKm: 530, durationHrs: 8, riskLevel: 'LOW' } }),
  ])

  // Route alternatives
  await prisma.routeAlternative.createMany({
    skipDuplicates: true,
    data: [
      { routeId: routeRecords[0].id, name: 'Mumbai–Delhi via Jaipur', distanceKm: 1510, durationHrs: 27, riskLevel: 'LOW', costMultiplier: 1.08, reason: 'Avoids NH48 congestion near Ahmedabad' },
      { routeId: routeRecords[0].id, name: 'Mumbai–Delhi Rail Express', distanceKm: 1384, durationHrs: 22, riskLevel: 'LOW', costMultiplier: 0.85, reason: 'Rajdhani rail option – lower cost, slightly slower' },
      { routeId: routeRecords[1].id, name: 'Chennai–Rotterdam via Cape of Good Hope', distanceKm: 16800, durationHrs: 432, riskLevel: 'LOW', costMultiplier: 1.35, reason: 'Avoids Red Sea / Suez Canal tensions' },
      { routeId: routeRecords[1].id, name: 'Chennai–Rotterdam Air Freight', distanceKm: 8500, durationHrs: 14, riskLevel: 'LOW', costMultiplier: 3.5, reason: 'Emergency air alternative for critical cargo' },
      { routeId: routeRecords[4].id, name: 'Mumbai–Chennai via Pune', distanceKm: 1385, durationHrs: 21, riskLevel: 'LOW', costMultiplier: 1.05, reason: 'Avoids coastal flooding risk in monsoon' },
      { routeId: routeRecords[7].id, name: 'JNPT–Felixstowe via Cape Route', distanceKm: 16200, durationHrs: 408, riskLevel: 'LOW', costMultiplier: 1.3, reason: 'Cape of Good Hope bypass for Red Sea risk' },
      { routeId: routeRecords[12].id, name: 'Hyderabad–Mumbai via Solapur', distanceKm: 740, durationHrs: 12, riskLevel: 'LOW', costMultiplier: 1.07, reason: 'Alternate if NH65 encounters road closure' },
      { routeId: routeRecords[18].id, name: 'Nagpur–Delhi via Agra Expressway', distanceKm: 1180, durationHrs: 19, riskLevel: 'LOW', costMultiplier: 1.06, reason: 'Expressway option avoiding NH44 bottleneck' },
    ],
  })

  // ─── FLEET ASSETS ────────────────────────────────────────────────────────
  const now = new Date()
  const fleetData = [
    { assetCode: 'TR-GATI-001', assetType: 'TRUCK', subtype: 'REEFER', currentLocation: 'Mumbai', latitude: 19.076, longitude: 72.877, capacity: 15, utilization: 0.87, status: 'ACTIVE', carrierId: gati.id },
    { assetCode: 'TR-GATI-002', assetType: 'TRUCK', subtype: 'CONTAINER', currentLocation: 'Delhi', latitude: 28.704, longitude: 77.102, capacity: 20, utilization: 0.0, status: 'IDLE', carrierId: gati.id },
    { assetCode: 'TR-GATI-003', assetType: 'TRUCK', subtype: 'FLATBED', currentLocation: 'Pune', latitude: 18.52, longitude: 73.856, capacity: 18, utilization: 0.55, status: 'ACTIVE', carrierId: gati.id },
    { assetCode: 'VS-MAERSK-001', assetType: 'VESSEL', subtype: 'CONTAINER', currentLocation: 'JNPT Mumbai', latitude: 18.948, longitude: 72.938, capacity: 5000, utilization: 0.72, status: 'ACTIVE', carrierId: maersk.id },
    { assetCode: 'VS-MAERSK-002', assetType: 'VESSEL', subtype: 'BULK', currentLocation: 'Chennai Port', latitude: 13.083, longitude: 80.287, capacity: 8000, utilization: 0.0, status: 'IDLE', carrierId: maersk.id },
    { assetCode: 'VS-SING-001', assetType: 'VESSEL', subtype: 'CONTAINER', currentLocation: 'Singapore', latitude: 1.264, longitude: 103.82, capacity: 6000, utilization: 0.65, status: 'ACTIVE', carrierId: singMar.id },
    { assetCode: 'VS-ATL-001', assetType: 'VESSEL', subtype: 'CONTAINER', currentLocation: 'Red Sea', latitude: 20.0, longitude: 38.5, capacity: 7000, utilization: 0.0, status: 'STRANDED', carrierId: atlEx.id },
    { assetCode: 'AC-BDART-001', assetType: 'AIRCRAFT', subtype: 'FREIGHTER', currentLocation: 'Mumbai BOM', latitude: 19.089, longitude: 72.868, capacity: 45, utilization: 0.91, status: 'ACTIVE', carrierId: blueDart.id },
    { assetCode: 'AC-INDIGO-001', assetType: 'AIRCRAFT', subtype: 'BELLY', currentLocation: 'Delhi IGI', latitude: 28.556, longitude: 77.1, capacity: 20, utilization: 0.78, status: 'ACTIVE', carrierId: indigo.id },
    { assetCode: 'AC-INDIGO-002', assetType: 'AIRCRAFT', subtype: 'BELLY', currentLocation: 'Bangalore BLR', latitude: 13.199, longitude: 77.706, capacity: 20, utilization: 0.0, status: 'MAINTENANCE', carrierId: indigo.id },
    { assetCode: 'RL-TIRL-001', assetType: 'RAIL', subtype: 'CONTAINER', currentLocation: 'Delhi', latitude: 28.64, longitude: 77.22, capacity: 800, utilization: 0.62, status: 'ACTIVE', carrierId: transIndia.id },
    { assetCode: 'RL-TIRL-002', assetType: 'RAIL', subtype: 'REEFER', currentLocation: 'Kolkata', latitude: 22.572, longitude: 88.363, capacity: 500, utilization: 0.48, status: 'ACTIVE', carrierId: transIndia.id },
    { assetCode: 'TR-GATI-004', assetType: 'TRUCK', subtype: 'REEFER', currentLocation: 'Bangalore', latitude: 12.971, longitude: 77.594, capacity: 12, utilization: 0.0, status: 'IDLE', carrierId: gati.id },
    { assetCode: 'VS-DXB-001', assetType: 'VESSEL', subtype: 'CONTAINER', currentLocation: 'Dubai Port', latitude: 25.04, longitude: 55.14, capacity: 4500, utilization: 0.58, status: 'ACTIVE', carrierId: dubaiFrt.id },
    { assetCode: 'TR-GATI-005', assetType: 'TRUCK', subtype: 'CONTAINER', currentLocation: 'Nagpur', latitude: 21.145, longitude: 79.082, capacity: 20, utilization: 0.93, status: 'ACTIVE', carrierId: gati.id },
  ]

  const fleetAssets = []
  for (const f of fleetData) {
    const asset = await prisma.fleetAsset.upsert({ where: { assetCode: f.assetCode }, update: {}, create: f })
    fleetAssets.push(asset)
  }

  // ─── SHIPMENTS ───────────────────────────────────────────────────────────
  const d = (days) => new Date(Date.now() + days * 86400000)
  const dp = (days) => new Date(Date.now() - days * 86400000)

  const shipmentData = [
    // Cold-chain pharmaceutical
    { shipmentCode: 'SHP-001', origin: 'Mumbai', destination: 'Delhi', originLat: 19.076, originLng: 72.877, destinationLat: 28.704, destinationLng: 77.102, carrierId: gati.id, cargoType: 'Pharmaceuticals', priority: 'CRITICAL', status: 'IN_TRANSIT', estimatedDeparture: dp(1), estimatedArrival: d(1), weight: 800, value: 45.0, isColdChain: true, delayHours: 6 },
    { shipmentCode: 'SHP-002', origin: 'Chennai', destination: 'Rotterdam', originLat: 13.083, originLng: 80.287, destinationLat: 51.924, destinationLng: 4.48, carrierId: maersk.id, cargoType: 'Automotive Parts', priority: 'HIGH', status: 'AT_RISK', estimatedDeparture: dp(8), estimatedArrival: d(6), weight: 22000, value: 320.0, isColdChain: false, delayHours: 48 },
    { shipmentCode: 'SHP-003', origin: 'Pune', destination: 'Dubai', originLat: 18.52, originLng: 73.856, destinationLat: 25.204, destinationLng: 55.27, carrierId: blueDart.id, cargoType: 'Electronics', priority: 'HIGH', status: 'IN_TRANSIT', estimatedDeparture: dp(1), estimatedArrival: d(1), weight: 350, value: 125.0, isColdChain: false, delayHours: 0 },
    { shipmentCode: 'SHP-004', origin: 'Bangalore', destination: 'Hyderabad', originLat: 12.971, originLng: 77.594, destinationLat: 17.385, destinationLng: 78.486, carrierId: gati.id, cargoType: 'Perishables', priority: 'CRITICAL', status: 'DELAYED', estimatedDeparture: dp(2), estimatedArrival: d(0), weight: 500, value: 18.0, isColdChain: true, delayHours: 12 },
    { shipmentCode: 'SHP-005', origin: 'Mumbai', destination: 'Chennai', originLat: 19.076, originLng: 72.877, destinationLat: 13.083, destinationLng: 80.287, carrierId: transIndia.id, cargoType: 'Textiles', priority: 'MEDIUM', status: 'IN_TRANSIT', estimatedDeparture: dp(1), estimatedArrival: d(2), weight: 3200, value: 28.0, isColdChain: false, delayHours: 0 },
    { shipmentCode: 'SHP-006', origin: 'Delhi', destination: 'Kolkata', originLat: 28.704, originLng: 77.102, destinationLat: 22.572, destinationLng: 88.363, carrierId: transIndia.id, cargoType: 'Industrial Machinery', priority: 'MEDIUM', status: 'PENDING', estimatedDeparture: d(1), estimatedArrival: d(3), weight: 8500, value: 95.0, isColdChain: false, delayHours: 0 },
    { shipmentCode: 'SHP-007', origin: 'JNPT Mumbai', destination: 'Singapore', originLat: 18.948, originLng: 72.938, destinationLat: 1.264, destinationLng: 103.82, carrierId: singMar.id, cargoType: 'Consumer Goods', priority: 'MEDIUM', status: 'IN_TRANSIT', estimatedDeparture: dp(3), estimatedArrival: d(4), weight: 18000, value: 210.0, isColdChain: false, delayHours: 0 },
    { shipmentCode: 'SHP-008', origin: 'JNPT Mumbai', destination: 'Felixstowe UK', originLat: 18.948, originLng: 72.938, destinationLat: 51.964, destinationLng: 1.351, carrierId: atlEx.id, cargoType: 'Garments', priority: 'HIGH', status: 'AT_RISK', estimatedDeparture: dp(10), estimatedArrival: d(3), weight: 14000, value: 185.0, isColdChain: false, delayHours: 72 },
    { shipmentCode: 'SHP-009', origin: 'Ahmedabad', destination: 'Delhi', originLat: 23.02, originLng: 72.57, destinationLat: 28.704, destinationLng: 77.102, carrierId: gati.id, cargoType: 'Chemical Raw Materials', priority: 'LOW', status: 'IN_TRANSIT', estimatedDeparture: dp(1), estimatedArrival: d(1), weight: 4200, value: 22.0, isColdChain: false, delayHours: 0 },
    { shipmentCode: 'SHP-010', origin: 'Chennai', destination: 'Singapore', originLat: 13.083, originLng: 80.287, destinationLat: 1.264, destinationLng: 103.82, carrierId: maersk.id, cargoType: 'IT Equipment', priority: 'HIGH', status: 'IN_TRANSIT', estimatedDeparture: dp(2), estimatedArrival: d(4), weight: 1200, value: 280.0, isColdChain: false, delayHours: 0 },
    { shipmentCode: 'SHP-011', origin: 'Kolkata', destination: 'Dubai', originLat: 22.572, originLng: 88.363, destinationLat: 25.204, destinationLng: 55.27, carrierId: indigo.id, cargoType: 'Seafood', priority: 'CRITICAL', status: 'IN_TRANSIT', estimatedDeparture: dp(1), estimatedArrival: d(0), weight: 180, value: 32.0, isColdChain: true, delayHours: 3 },
    { shipmentCode: 'SHP-012', origin: 'Delhi', destination: 'Mumbai', originLat: 28.704, originLng: 77.102, destinationLat: 19.076, destinationLng: 72.877, carrierId: transIndia.id, cargoType: 'Medical Devices', priority: 'CRITICAL', status: 'DELAYED', estimatedDeparture: dp(3), estimatedArrival: dp(1), weight: 650, value: 78.0, isColdChain: false, delayHours: 36 },
    { shipmentCode: 'SHP-013', origin: 'Hyderabad', destination: 'Mumbai', originLat: 17.385, originLng: 78.486, destinationLat: 19.076, destinationLng: 72.877, carrierId: gati.id, cargoType: 'Food Products', priority: 'HIGH', status: 'AT_RISK', estimatedDeparture: dp(2), estimatedArrival: d(1), weight: 2800, value: 41.0, isColdChain: true, delayHours: 18 },
    { shipmentCode: 'SHP-014', origin: 'Mumbai', destination: 'London', originLat: 19.076, originLng: 72.877, destinationLat: 51.509, destinationLng: -0.118, carrierId: blueDart.id, cargoType: 'Diamonds & Jewellery', priority: 'CRITICAL', status: 'IN_TRANSIT', estimatedDeparture: dp(1), estimatedArrival: d(1), weight: 12, value: 950.0, isColdChain: false, delayHours: 0 },
    { shipmentCode: 'SHP-015', origin: 'Chennai', destination: 'Mumbai', originLat: 13.083, originLng: 80.287, destinationLat: 19.076, destinationLng: 72.877, carrierId: transIndia.id, cargoType: 'Steel Coils', priority: 'LOW', status: 'IN_TRANSIT', estimatedDeparture: dp(1), estimatedArrival: d(2), weight: 42000, value: 55.0, isColdChain: false, delayHours: 0 },
    { shipmentCode: 'SHP-016', origin: 'Pune', destination: 'Bangalore', originLat: 18.52, originLng: 73.856, destinationLat: 12.971, destinationLng: 77.594, carrierId: gati.id, cargoType: 'Auto Components', priority: 'MEDIUM', status: 'PENDING', estimatedDeparture: d(1), estimatedArrival: d(2), weight: 1800, value: 62.0, isColdChain: false, delayHours: 0 },
    { shipmentCode: 'SHP-017', origin: 'JNPT Mumbai', destination: 'Shanghai', originLat: 18.948, originLng: 72.938, destinationLat: 31.23, destinationLng: 121.47, carrierId: maersk.id, cargoType: 'Cotton Bales', priority: 'MEDIUM', status: 'IN_TRANSIT', estimatedDeparture: dp(4), estimatedArrival: d(5), weight: 30000, value: 88.0, isColdChain: false, delayHours: 0 },
    { shipmentCode: 'SHP-018', origin: 'Nagpur', destination: 'Delhi', originLat: 21.145, originLng: 79.082, destinationLat: 28.704, destinationLng: 77.102, carrierId: gati.id, cargoType: 'Oranges (Fresh)', priority: 'HIGH', status: 'AT_RISK', estimatedDeparture: dp(2), estimatedArrival: d(0), weight: 1200, value: 8.5, isColdChain: true, delayHours: 22 },
    { shipmentCode: 'SHP-019', origin: 'Ahmedabad', destination: 'Mumbai', originLat: 23.02, originLng: 72.57, destinationLat: 19.076, destinationLng: 72.877, carrierId: gati.id, cargoType: 'Pharmaceuticals', priority: 'HIGH', status: 'IN_TRANSIT', estimatedDeparture: dp(1), estimatedArrival: d(0), weight: 420, value: 67.0, isColdChain: true, delayHours: 4 },
    { shipmentCode: 'SHP-020', origin: 'Kochi', destination: 'Colombo', originLat: 9.931, originLng: 76.267, destinationLat: 6.927, destinationLng: 79.861, carrierId: dubaiFrt.id, cargoType: 'Spices', priority: 'MEDIUM', status: 'IN_TRANSIT', estimatedDeparture: dp(1), estimatedArrival: d(1), weight: 2200, value: 35.0, isColdChain: false, delayHours: 0 },
    { shipmentCode: 'SHP-021', origin: 'Delhi', destination: 'Mumbai', originLat: 28.704, originLng: 77.102, destinationLat: 19.076, destinationLng: 72.877, carrierId: blueDart.id, cargoType: 'Blood Samples', priority: 'CRITICAL', status: 'IN_TRANSIT', estimatedDeparture: dp(0), estimatedArrival: d(0), weight: 50, value: 5.0, isColdChain: true, delayHours: 0 },
    { shipmentCode: 'SHP-022', origin: 'Mumbai', destination: 'Delhi', originLat: 19.076, originLng: 72.877, destinationLat: 28.704, destinationLng: 77.102, carrierId: gati.id, cargoType: 'Consumer Electronics', priority: 'HIGH', status: 'PENDING', estimatedDeparture: d(2), estimatedArrival: d(4), weight: 900, value: 145.0, isColdChain: false, delayHours: 0 },
    { shipmentCode: 'SHP-023', origin: 'Chennai', destination: 'Rotterdam', originLat: 13.083, originLng: 80.287, destinationLat: 51.924, destinationLng: 4.48, carrierId: maersk.id, cargoType: 'Leather Goods', priority: 'MEDIUM', status: 'IN_TRANSIT', estimatedDeparture: dp(5), estimatedArrival: d(9), weight: 5800, value: 92.0, isColdChain: false, delayHours: 24 },
    { shipmentCode: 'SHP-024', origin: 'Bangalore', destination: 'Hyderabad', originLat: 12.971, originLng: 77.594, destinationLat: 17.385, destinationLng: 78.486, carrierId: gati.id, cargoType: 'Vaccines', priority: 'CRITICAL', status: 'IN_TRANSIT', estimatedDeparture: dp(0), estimatedArrival: d(0), weight: 120, value: 85.0, isColdChain: true, delayHours: 0 },
    { shipmentCode: 'SHP-025', origin: 'JNPT Mumbai', destination: 'Felixstowe UK', originLat: 18.948, originLng: 72.938, destinationLat: 51.964, destinationLng: 1.351, carrierId: atlEx.id, cargoType: 'Handicrafts', priority: 'LOW', status: 'DELAYED', estimatedDeparture: dp(12), estimatedArrival: d(1), weight: 9000, value: 48.0, isColdChain: false, delayHours: 96 },
    { shipmentCode: 'SHP-026', origin: 'Mumbai', destination: 'Chennai', originLat: 19.076, originLng: 72.877, destinationLat: 13.083, destinationLng: 80.287, carrierId: gati.id, cargoType: 'Cement', priority: 'LOW', status: 'PENDING', estimatedDeparture: d(3), estimatedArrival: d(5), weight: 50000, value: 12.0, isColdChain: false, delayHours: 0 },
    { shipmentCode: 'SHP-027', origin: 'Hyderabad', destination: 'Mumbai', originLat: 17.385, originLng: 78.486, destinationLat: 19.076, destinationLng: 72.877, carrierId: blueDart.id, cargoType: 'Biotech Reagents', priority: 'CRITICAL', status: 'IN_TRANSIT', estimatedDeparture: dp(0), estimatedArrival: d(0), weight: 80, value: 220.0, isColdChain: true, delayHours: 0 },
    { shipmentCode: 'SHP-028', origin: 'Delhi', destination: 'Kolkata', originLat: 28.704, originLng: 77.102, destinationLat: 22.572, destinationLng: 88.363, carrierId: transIndia.id, cargoType: 'FMCG', priority: 'MEDIUM', status: 'IN_TRANSIT', estimatedDeparture: dp(2), estimatedArrival: d(1), weight: 12000, value: 58.0, isColdChain: false, delayHours: 8 },
    { shipmentCode: 'SHP-029', origin: 'Pune', destination: 'Dubai', originLat: 18.52, originLng: 73.856, destinationLat: 25.204, destinationLng: 55.27, carrierId: indigo.id, cargoType: 'Processed Food', priority: 'MEDIUM', status: 'PENDING', estimatedDeparture: d(1), estimatedArrival: d(2), weight: 600, value: 28.0, isColdChain: true, delayHours: 0 },
    { shipmentCode: 'SHP-030', origin: 'Nagpur', destination: 'Delhi', originLat: 21.145, originLng: 79.082, destinationLat: 28.704, destinationLng: 77.102, carrierId: gati.id, cargoType: 'Coal', priority: 'LOW', status: 'IN_TRANSIT', estimatedDeparture: dp(1), estimatedArrival: d(2), weight: 80000, value: 9.0, isColdChain: false, delayHours: 0 },
  ]

  const shipments = []
  for (const s of shipmentData) {
    const shipment = await prisma.shipment.upsert({ where: { shipmentCode: s.shipmentCode }, update: {}, create: s })
    shipments.push(shipment)
  }

  // ─── FLEET ASSIGNMENTS ───────────────────────────────────────────────────
  await prisma.fleetAssignment.createMany({
    skipDuplicates: true,
    data: [
      { assetId: fleetAssets[0].id, shipmentId: shipments[0].id, status: 'ACTIVE' },
      { assetId: fleetAssets[2].id, shipmentId: shipments[4].id, status: 'ACTIVE' },
      { assetId: fleetAssets[3].id, shipmentId: shipments[6].id, status: 'ACTIVE' },
      { assetId: fleetAssets[7].id, shipmentId: shipments[2].id, status: 'ACTIVE' },
      { assetId: fleetAssets[8].id, shipmentId: shipments[10].id, status: 'ACTIVE' },
      { assetId: fleetAssets[10].id, shipmentId: shipments[5].id, status: 'ACTIVE' },
      { assetId: fleetAssets[11].id, shipmentId: shipments[27].id, status: 'ACTIVE' },
      { assetId: fleetAssets[14].id, shipmentId: shipments[17].id, status: 'ACTIVE' },
    ],
  })

  // ─── DISRUPTIONS ─────────────────────────────────────────────────────────
  const disruptions = await Promise.all([
    prisma.disruption.upsert({ where: { disruptionCode: 'DIS-001' }, update: {}, create: { disruptionCode: 'DIS-001', name: 'Mumbai Flash Floods', type: 'WEATHER', description: 'Severe flooding due to IMD red alert rainfall. Multiple roads closed including parts of Eastern Express Highway and NH48.', location: 'Mumbai', latitude: 19.076, longitude: 72.877, radiusKm: 80, severity: 'HIGH', status: 'ACTIVE', startTime: dp(1), expectedEndTime: d(2) } }),
    prisma.disruption.upsert({ where: { disruptionCode: 'DIS-002' }, update: {}, create: { disruptionCode: 'DIS-002', name: 'Delhi Winter Smog', type: 'WEATHER', description: 'Severe smog reduces visibility below 200m at IGI Airport. Departures delayed by 3-8 hours.', location: 'Delhi', latitude: 28.704, longitude: 77.102, radiusKm: 60, severity: 'MEDIUM', status: 'ACTIVE', startTime: dp(3), expectedEndTime: d(3) } }),
    prisma.disruption.upsert({ where: { disruptionCode: 'DIS-003' }, update: {}, create: { disruptionCode: 'DIS-003', name: 'Chennai Port Strike', type: 'PORT_STRIKE', description: 'Dock workers union strike at Chennai Port (Kamarajar Port). Container handling suspended. Backlog of 120+ vessels.', location: 'Chennai', latitude: 13.083, longitude: 80.287, radiusKm: 30, severity: 'CRITICAL', status: 'ACTIVE', startTime: dp(2), expectedEndTime: d(5) } }),
    prisma.disruption.upsert({ where: { disruptionCode: 'DIS-004' }, update: {}, create: { disruptionCode: 'DIS-004', name: 'Rajasthan NH48 Landslide', type: 'ROAD_CLOSURE', description: 'Rockslide near Udaipur blocks NH48 completely. Diversion adds 3 hours. Recovery expected in 2 days.', location: 'Udaipur, Rajasthan', latitude: 24.585, longitude: 73.712, radiusKm: 40, severity: 'HIGH', status: 'ACTIVE', startTime: dp(1), expectedEndTime: d(2) } }),
    prisma.disruption.upsert({ where: { disruptionCode: 'DIS-005' }, update: {}, create: { disruptionCode: 'DIS-005', name: 'Red Sea Shipping Tensions', type: 'GEOPOLITICAL', description: 'Houthi attacks on commercial shipping in Red Sea. Insurance surcharges 200%. Most carriers rerouting via Cape of Good Hope.', location: 'Red Sea / Gulf of Aden', latitude: 14.0, longitude: 42.5, radiusKm: 800, severity: 'CRITICAL', status: 'ACTIVE', startTime: dp(30), expectedEndTime: d(90) } }),
    prisma.disruption.upsert({ where: { disruptionCode: 'DIS-006' }, update: {}, create: { disruptionCode: 'DIS-006', name: 'Cyclone Asna - Gujarat Coast', type: 'WEATHER', description: 'Cyclone Asna making landfall near Porbandar. Wind speed 120 km/h. Port operations suspended at Mundra and Kandla.', location: 'Gujarat Coast', latitude: 21.64, longitude: 69.6, radiusKm: 300, severity: 'CRITICAL', status: 'MONITORING', startTime: dp(0), expectedEndTime: d(3) } }),
    prisma.disruption.upsert({ where: { disruptionCode: 'DIS-007' }, update: {}, create: { disruptionCode: 'DIS-007', name: 'Kolkata Port Congestion', type: 'PORT_STRIKE', description: 'Severe congestion at Syama Prasad Mookerjee Port, Kolkata. Average dwell time 12 days. Equipment shortage.', location: 'Kolkata', latitude: 22.572, longitude: 88.363, radiusKm: 20, severity: 'MEDIUM', status: 'ACTIVE', startTime: dp(7), expectedEndTime: d(7) } }),
    prisma.disruption.upsert({ where: { disruptionCode: 'DIS-008' }, update: {}, create: { disruptionCode: 'DIS-008', name: 'NH44 Accident - Hyderabad Outskirts', type: 'ACCIDENT', description: 'Multiple-vehicle pile-up on NH44 near Zaheerabad. Road partially blocked. Traffic diverted.', location: 'Zaheerabad, Telangana', latitude: 17.68, longitude: 77.6, radiusKm: 15, severity: 'MEDIUM', status: 'ACTIVE', startTime: new Date(Date.now() - 6 * 3600000), expectedEndTime: new Date(Date.now() + 8 * 3600000) } }),
  ])

  // ─── DISRUPTION–SHIPMENT LINKS ────────────────────────────────────────────
  // DIS-001 Mumbai floods → affects SHP-001 (Mumbai–Delhi), SHP-007 (JNPT), SHP-008 (JNPT), SHP-019 (AMD–MUM), SHP-022 (MUM–DEL)
  // DIS-002 Delhi smog → affects SHP-003 (Pune–Dubai air), SHP-021 (DEL–MUM air), SHP-012 (DEL–MUM rail)
  // DIS-003 Chennai strike → affects SHP-002 (CHE–ROT), SHP-010 (CHE–SIN), SHP-023 (CHE–ROT), SHP-015 (CHE–MUM)
  // DIS-004 NH48 landslide → affects SHP-009 (AMD–DEL)
  // DIS-005 Red Sea → affects SHP-008 (JNPT–Felixstowe), SHP-025 (JNPT–Felixstowe), SHP-002 (CHE–ROT), SHP-023 (CHE–ROT)
  // DIS-006 Cyclone Gujarat → affects SHP-019 (AMD–MUM), SHP-009 (AMD–DEL)
  // DIS-007 Kolkata congestion → affects SHP-006 (DEL–KOL), SHP-028 (DEL–KOL)
  // DIS-008 NH44 accident → affects SHP-013 (HYD–MUM), SHP-004 (BLR–HYD)
  await prisma.disruptionShipment.createMany({
    skipDuplicates: true,
    data: [
      { disruptionId: disruptions[0].id, shipmentId: shipments[0].id },
      { disruptionId: disruptions[0].id, shipmentId: shipments[6].id },
      { disruptionId: disruptions[0].id, shipmentId: shipments[7].id },
      { disruptionId: disruptions[0].id, shipmentId: shipments[18].id },
      { disruptionId: disruptions[0].id, shipmentId: shipments[21].id },
      { disruptionId: disruptions[1].id, shipmentId: shipments[2].id },
      { disruptionId: disruptions[1].id, shipmentId: shipments[20].id },
      { disruptionId: disruptions[1].id, shipmentId: shipments[11].id },
      { disruptionId: disruptions[2].id, shipmentId: shipments[1].id },
      { disruptionId: disruptions[2].id, shipmentId: shipments[9].id },
      { disruptionId: disruptions[2].id, shipmentId: shipments[22].id },
      { disruptionId: disruptions[2].id, shipmentId: shipments[14].id },
      { disruptionId: disruptions[3].id, shipmentId: shipments[8].id },
      { disruptionId: disruptions[4].id, shipmentId: shipments[7].id },
      { disruptionId: disruptions[4].id, shipmentId: shipments[24].id },
      { disruptionId: disruptions[4].id, shipmentId: shipments[1].id },
      { disruptionId: disruptions[4].id, shipmentId: shipments[22].id },
      { disruptionId: disruptions[5].id, shipmentId: shipments[18].id },
      { disruptionId: disruptions[5].id, shipmentId: shipments[8].id },
      { disruptionId: disruptions[6].id, shipmentId: shipments[5].id },
      { disruptionId: disruptions[6].id, shipmentId: shipments[27].id },
      { disruptionId: disruptions[7].id, shipmentId: shipments[12].id },
      { disruptionId: disruptions[7].id, shipmentId: shipments[3].id },
    ],
  })

  // ─── SHIPMENT EVENTS ─────────────────────────────────────────────────────
  await prisma.shipmentEvent.createMany({
    data: [
      { shipmentId: shipments[0].id, eventType: 'DEPARTED', description: 'Shipment departed Mumbai Cold Storage Hub', location: 'Mumbai', timestamp: dp(1) },
      { shipmentId: shipments[0].id, eventType: 'DELAY', description: 'Delayed at Vasai toll naka due to flooding – 6 hour hold', location: 'Vasai, Maharashtra', timestamp: new Date(Date.now() - 8 * 3600000) },
      { shipmentId: shipments[1].id, eventType: 'DEPARTED', description: 'Container loaded at Chennai Port, vessel MSC MAYA', location: 'Chennai', timestamp: dp(8) },
      { shipmentId: shipments[1].id, eventType: 'DISRUPTION', description: 'Port worker strike at Chennai – vessel departure delayed 48h', location: 'Chennai Port', timestamp: dp(2) },
      { shipmentId: shipments[2].id, eventType: 'DEPARTED', description: 'Air cargo loaded on Blue Dart BDA 412 MUM-DXB', location: 'Mumbai BOM', timestamp: dp(1) },
      { shipmentId: shipments[3].id, eventType: 'DEPARTED', description: 'Cold truck departed Bangalore Produce Market', location: 'Bangalore', timestamp: dp(2) },
      { shipmentId: shipments[3].id, eventType: 'ALERT', description: 'Temperature excursion detected: 14.2°C (limit: 8°C)', location: 'NH44, near Chitradurga', timestamp: new Date(Date.now() - 5 * 3600000) },
      { shipmentId: shipments[7].id, eventType: 'DEPARTED', description: 'Container vessel MV ATLANTIC WARRIOR departed JNPT', location: 'JNPT Mumbai', timestamp: dp(10) },
      { shipmentId: shipments[7].id, eventType: 'DISRUPTION', description: 'Vessel rerouting around Red Sea – adding 5 days to transit', location: 'Indian Ocean', timestamp: dp(5) },
      { shipmentId: shipments[11].id, eventType: 'DEPARTED', description: 'Medical devices loaded on Rajdhani Express', location: 'Delhi Hazrat Nizamuddin', timestamp: dp(3) },
      { shipmentId: shipments[11].id, eventType: 'DELAY', description: 'Train held at Bhopal yard – signal failure', location: 'Bhopal', timestamp: dp(1) },
      { shipmentId: shipments[12].id, eventType: 'DEPARTED', description: 'Cold truck departed Hyderabad Food Park', location: 'Hyderabad', timestamp: dp(2) },
      { shipmentId: shipments[12].id, eventType: 'DISRUPTION', description: 'NH44 accident near Zaheerabad causing significant delay', location: 'Zaheerabad', timestamp: new Date(Date.now() - 4 * 3600000) },
      { shipmentId: shipments[13].id, eventType: 'DEPARTED', description: 'High-value cargo (diamonds) loaded under security escort', location: 'Mumbai BOM', timestamp: dp(1) },
      { shipmentId: shipments[23].id, eventType: 'DEPARTED', description: 'Vaccine shipment departed Bangalore BioPharma Hub', location: 'Bangalore', timestamp: new Date(Date.now() - 4 * 3600000) },
    ],
  })

  // ─── COLD CHAIN READINGS ─────────────────────────────────────────────────
  // SHP-001 (Pharma, 2-8°C), SHP-004 (Perishables, 0-4°C), SHP-011 (Seafood, -18 to -22°C),
  // SHP-013 (Food, 2-6°C), SHP-018 (Oranges, 4-8°C), SHP-019 (Pharma, 2-8°C),
  // SHP-021 (Blood, 2-6°C), SHP-024 (Vaccines, 2-8°C), SHP-027 (Biotech, -80 to -60°C), SHP-029 (Processed Food, 0-4°C)
  const coldChainReadings = []
  const coldShipments = [
    { idx: 0, min: 2, max: 8, base: 5, hasExcursion: true, excursionAt: 7 },   // SHP-001
    { idx: 3, min: 0, max: 4, base: 2, hasExcursion: true, excursionAt: 4 },   // SHP-004
    { idx: 10, min: -22, max: -18, base: -20, hasExcursion: false, excursionAt: -1 }, // SHP-011
    { idx: 12, min: 2, max: 6, base: 4, hasExcursion: true, excursionAt: 5 },  // SHP-013
    { idx: 17, min: 4, max: 8, base: 6, hasExcursion: true, excursionAt: 10 }, // SHP-018
    { idx: 18, min: 2, max: 8, base: 4, hasExcursion: false, excursionAt: -1 }, // SHP-019
    { idx: 20, min: 2, max: 6, base: 4, hasExcursion: false, excursionAt: -1 }, // SHP-021
    { idx: 23, min: 2, max: 8, base: 5, hasExcursion: false, excursionAt: -1 }, // SHP-024
    { idx: 26, min: -80, max: -60, base: -70, hasExcursion: false, excursionAt: -1 }, // SHP-027
    { idx: 28, min: 0, max: 4, base: 2, hasExcursion: false, excursionAt: -1 }, // SHP-029
  ]

  for (const cs of coldShipments) {
    for (let i = 11; i >= 0; i--) {
      const hoursAgo = i
      const variation = (Math.random() - 0.5) * 1.5
      let temp = cs.base + variation
      if (cs.hasExcursion && i === cs.excursionAt) {
        temp = cs.max + 2 + Math.random() * 3
      }
      coldChainReadings.push({
        shipmentId: shipments[cs.idx].id,
        timestamp: new Date(Date.now() - hoursAgo * 3600000),
        temperature: Math.round(temp * 10) / 10,
        humidity: Math.round((55 + Math.random() * 20) * 10) / 10,
        safeMinTemp: cs.min,
        safeMaxTemp: cs.max,
        batteryLevel: Math.round((95 - i * 2 + Math.random() * 3) * 10) / 10,
        sensorStatus: 'ACTIVE',
      })
    }
  }
  await prisma.coldChainReading.createMany({ data: coldChainReadings })

  // ─── COLD CHAIN ALERTS ────────────────────────────────────────────────────
  await prisma.coldChainAlert.createMany({
    data: [
      { shipmentId: shipments[0].id, alertType: 'TEMP_HIGH', severity: 'WARNING', temperature: 9.4, duration: 25, description: 'Temperature rose to 9.4°C (limit 8°C) for 25 min near Vasai toll, likely door opening during customs inspection', createdAt: new Date(Date.now() - 3 * 3600000) },
      { shipmentId: shipments[3].id, alertType: 'TEMP_HIGH', severity: 'CRITICAL', temperature: 14.2, duration: 45, description: 'Critical excursion: Temperature reached 14.2°C for 45 minutes. Cargo integrity at risk. Requires immediate inspection.', createdAt: new Date(Date.now() - 5 * 3600000) },
      { shipmentId: shipments[12].id, alertType: 'TEMP_HIGH', severity: 'WARNING', temperature: 7.8, duration: 15, description: 'Temperature briefly exceeded limit (6°C) during loading in Hyderabad', createdAt: new Date(Date.now() - 6 * 3600000) },
      { shipmentId: shipments[17].id, alertType: 'TEMP_HIGH', severity: 'CRITICAL', temperature: 11.5, duration: 60, description: 'Refrigeration unit failure on truck TR-GATI-005. Temperature soared to 11.5°C. Cargo spoilage risk for fresh oranges.', createdAt: new Date(Date.now() - 2 * 3600000) },
      { shipmentId: shipments[10].id, alertType: 'BATTERY_LOW', severity: 'WARNING', temperature: null, duration: null, description: 'IoT sensor battery at 12%. Risk of sensor blackout within 4 hours', createdAt: new Date(Date.now() - 1 * 3600000) },
    ],
  })

  // ─── RISK ASSESSMENTS ────────────────────────────────────────────────────
  const riskData = [
    { shipmentId: shipments[0].id, score: 72, level: 'HIGH', disruptionScore: 22, delayScore: 12, priorityScore: 20, routeScore: 10, coldChainScore: 8, carrierScore: 0, explanation: 'High risk: Active Mumbai floods disruption affecting route. Pharma cold-chain with temperature excursion detected. Shipment delayed 6h.' },
    { shipmentId: shipments[1].id, score: 85, level: 'CRITICAL', disruptionScore: 28, delayScore: 20, priorityScore: 15, routeScore: 14, coldChainScore: 0, carrierScore: 8, explanation: 'Critical: Chennai port strike causing 48h delay. Red Sea tensions add alternative routing risk. High-value automotive cargo.' },
    { shipmentId: shipments[2].id, score: 32, level: 'LOW', disruptionScore: 8, delayScore: 0, priorityScore: 15, routeScore: 5, coldChainScore: 0, carrierScore: 4, explanation: 'Low risk: Minor Delhi smog disruption at origin. Blue Dart has 95% reliability. No cold chain concerns.' },
    { shipmentId: shipments[3].id, score: 90, level: 'CRITICAL', disruptionScore: 20, delayScore: 16, priorityScore: 20, routeScore: 12, coldChainScore: 15, carrierScore: 7, explanation: 'Critical: Active NH44 accident blocking route. Critical temperature excursion (14.2°C). Perishable cargo integrity at serious risk.' },
    { shipmentId: shipments[4].id, score: 28, level: 'LOW', disruptionScore: 0, delayScore: 0, priorityScore: 10, routeScore: 8, coldChainScore: 0, carrierScore: 10, explanation: 'Low risk: No active disruptions. On schedule. Rail transit with good carrier performance.' },
    { shipmentId: shipments[5].id, score: 42, level: 'MEDIUM', disruptionScore: 18, delayScore: 0, priorityScore: 10, routeScore: 6, coldChainScore: 0, carrierScore: 8, explanation: 'Medium risk: Kolkata port congestion expected to cause delays upon arrival. Otherwise stable.' },
    { shipmentId: shipments[6].id, score: 38, level: 'MEDIUM', disruptionScore: 15, delayScore: 0, priorityScore: 10, routeScore: 8, coldChainScore: 0, carrierScore: 5, explanation: 'Medium risk: Mumbai flooding may cause port delays. Singapore Maritime has solid track record.' },
    { shipmentId: shipments[7].id, score: 88, level: 'CRITICAL', disruptionScore: 30, delayScore: 20, priorityScore: 15, routeScore: 15, coldChainScore: 0, carrierScore: 8, explanation: 'Critical: Active Red Sea tensions and Mumbai floods both affecting this shipment. Already 72h delayed. Cape rerouting needed.' },
    { shipmentId: shipments[8].id, score: 45, level: 'MEDIUM', disruptionScore: 20, delayScore: 0, priorityScore: 5, routeScore: 10, coldChainScore: 0, carrierScore: 10, explanation: 'Medium risk: NH48 landslide on direct route. Diversions available. Low priority cargo.' },
    { shipmentId: shipments[9].id, score: 55, level: 'MEDIUM', disruptionScore: 22, delayScore: 0, priorityScore: 15, routeScore: 8, coldChainScore: 0, carrierScore: 10, explanation: 'Medium risk: Chennai port strike may affect discharge. IT equipment with high value warrants monitoring.' },
    { shipmentId: shipments[10].id, score: 65, level: 'HIGH', disruptionScore: 0, delayScore: 5, priorityScore: 20, routeScore: 8, coldChainScore: 12, carrierScore: 20, explanation: 'High risk: Seafood cold-chain with sensor battery critical (12%). Minor delay. Perishable cargo cannot afford sensor loss.' },
    { shipmentId: shipments[11].id, score: 78, level: 'HIGH', disruptionScore: 12, delayScore: 20, priorityScore: 20, routeScore: 6, coldChainScore: 0, carrierScore: 20, explanation: 'High risk: Critical medical devices delayed 36h. Delhi smog causing further air freight delays at destination.' },
    { shipmentId: shipments[12].id, score: 80, level: 'CRITICAL', disruptionScore: 20, delayScore: 18, priorityScore: 15, coldChainScore: 12, routeScore: 10, carrierScore: 5, explanation: 'Critical: NH44 accident blocking route. Cold chain excursion. Food products with 18h delay highly at risk.' },
    { shipmentId: shipments[13].id, score: 20, level: 'LOW', disruptionScore: 0, delayScore: 0, priorityScore: 20, routeScore: 0, coldChainScore: 0, carrierScore: 0, explanation: 'Low risk: High-value diamonds on schedule with Blue Dart (95% reliability). Security escort assigned.' },
    { shipmentId: shipments[17].id, score: 82, level: 'CRITICAL', disruptionScore: 0, delayScore: 18, priorityScore: 15, routeScore: 12, coldChainScore: 15, carrierScore: 22, explanation: 'Critical: Refrigeration unit failure on carrier truck. Temperature excursion 11.5°C. Fresh oranges risk total spoilage. Immediate action required.' },
    { shipmentId: shipments[18].id, score: 55, level: 'MEDIUM', disruptionScore: 20, delayScore: 5, priorityScore: 15, routeScore: 5, coldChainScore: 5, carrierScore: 5, explanation: 'Medium risk: Cyclone Asna and Mumbai floods active. Pharma cold chain minor delay (4h). Needs monitoring.' },
    { shipmentId: shipments[20].id, score: 40, level: 'MEDIUM', disruptionScore: 12, delayScore: 0, priorityScore: 20, routeScore: 5, coldChainScore: 3, carrierScore: 0, explanation: 'Medium risk: Delhi smog affecting air freight delays. Blood samples must arrive within time window.' },
    { shipmentId: shipments[22].id, score: 60, level: 'HIGH', disruptionScore: 22, delayScore: 15, priorityScore: 10, routeScore: 8, coldChainScore: 0, carrierScore: 5, explanation: 'High risk: Chennai port strike and Red Sea both impacting this sea shipment. 24h delay accumulated.' },
    { shipmentId: shipments[24].id, score: 68, level: 'HIGH', disruptionScore: 25, delayScore: 20, priorityScore: 5, routeScore: 10, coldChainScore: 0, carrierScore: 8, explanation: 'High risk: Red Sea tensions primary concern. Atlantic Express vessel stranded. 96h delay and increasing.' },
    { shipmentId: shipments[27].id, score: 35, level: 'LOW', disruptionScore: 15, delayScore: 5, priorityScore: 10, routeScore: 5, coldChainScore: 0, carrierScore: 0, explanation: 'Low-medium risk: Kolkata congestion may cause delay upon arrival. On track otherwise.' },
  ]

  await prisma.riskAssessment.createMany({ data: riskData })

  // ─── RECOMMENDATIONS ─────────────────────────────────────────────────────
  await prisma.recommendation.createMany({
    data: [
      { shipmentId: shipments[7].id, recommendationType: 'REROUTE', title: 'Reroute SHP-008 via Cape of Good Hope', reason: 'Red Sea tensions causing 72h delay and insurance surcharge of 200%. Cape route adds 5 days but eliminates security risk.', priority: 'CRITICAL', estimatedImpact: 'Reduces security risk to near-zero. Cost increase: ₹8.2L. Arrival shift: +5 days' },
      { shipmentId: shipments[3].id, recommendationType: 'COLD_CHAIN_ALERT', title: 'Emergency inspection for SHP-004 cold chain breach', reason: 'Temperature reached 14.2°C for 45 minutes. Perishables (0-4°C) likely compromised. Quality assessment mandatory before delivery.', priority: 'CRITICAL', estimatedImpact: 'Prevents delivery of spoiled goods. Potential insurance claim: ₹18L' },
      { shipmentId: shipments[17].id, recommendationType: 'FLEET_REDEPLOY', title: 'Replace truck TR-GATI-005 for SHP-018', reason: 'Refrigeration unit failure causing temperature excursion. Fresh oranges will be unsellable within 6 hours at 11.5°C.', priority: 'CRITICAL', estimatedImpact: 'Saves ₹8.5L cargo. Replacement truck TR-GATI-002 (IDLE, Delhi) available for relay' },
      { shipmentId: shipments[1].id, recommendationType: 'CARRIER_CHANGE', title: 'Switch SHP-002 to air freight for critical components', reason: 'Chennai port strike and Red Sea tensions mean 14+ day additional delay. Client SLA breach imminent.', priority: 'HIGH', estimatedImpact: 'Air freight cost: ₹45L additional. SLA penalty avoided: ₹120L. Net saving: ₹75L' },
      { shipmentId: shipments[11].id, recommendationType: 'PRIORITY_ACTION', title: 'Escalate SHP-012 medical device delay to operations head', reason: 'Critical medical devices 36h delayed on rail. Hospital supply chain critically impacted. Alternative dispatch needed.', priority: 'HIGH', estimatedImpact: 'Dispatching partial shipment via Blue Dart Air could restore supply within 8 hours' },
      { shipmentId: shipments[24].id, recommendationType: 'REROUTE', title: 'Reroute SHP-025 via Felixstowe Air', reason: 'Atlantic Express vessel stranded in Red Sea. 96h delay and rising. Handicrafts have seasonal deadlines.', priority: 'HIGH', estimatedImpact: 'Air freight cost premium: ₹12L. Avoids missing festive season window worth ₹48L' },
      { shipmentId: shipments[0].id, recommendationType: 'PRIORITY_ACTION', title: 'Monitor SHP-001 temperature continuously – Mumbai floods', reason: 'Pharmaceutical shipment delayed in flood-affected area. Temperature sensor showing borderline readings.', priority: 'HIGH', estimatedImpact: 'Early intervention prevents ₹45L pharma cargo loss' },
      { shipmentId: shipments[12].id, recommendationType: 'REROUTE', title: 'Reroute SHP-013 via NH361 bypassing NH44 accident', reason: 'NH44 accident near Zaheerabad adds 3+ hours. Cold chain food products cannot sustain extended delays.', priority: 'HIGH', estimatedImpact: 'NH361 via Bidar adds only 45km but restores delivery schedule' },
      { shipmentId: null, recommendationType: 'FLEET_REDEPLOY', title: 'Redeploy VS-ATL-001 from Red Sea to safer waters', reason: 'Atlantic Express vessel stranded in active conflict zone. Insurance liability and crew safety at risk.', priority: 'CRITICAL', estimatedImpact: 'Crew safety paramount. Cargo transfer to VS-SING-001 feasible at Colombo waypoint' },
      { shipmentId: shipments[10].id, recommendationType: 'COLD_CHAIN_ALERT', title: 'Replace IoT sensor on SHP-011 before battery failure', reason: 'Sensor battery at 12%, estimated 4h to failure. Seafood cargo (-18°C) compliance requires continuous monitoring.', priority: 'HIGH', estimatedImpact: 'Sensor replacement at Dubai Airport transit point. Compliance maintained.' },
      { shipmentId: shipments[5].id, recommendationType: 'PRIORITY_ACTION', title: 'Pre-clear SHP-006 at Kolkata Port – beat congestion', reason: 'Kolkata port congestion averaging 12-day dwell. Pre-clearance documentation submission can reduce to 3 days.', priority: 'MEDIUM', estimatedImpact: 'Saves 9 days dwell. Value: ₹95L cargo reaches customer faster' },
      { shipmentId: shipments[9].id, recommendationType: 'REROUTE', title: 'Reroute SHP-010 Chennai–Singapore via Colombo transshipment', reason: 'Chennai port strike may delay direct sailing. Colombo transshipment adds 1 day but bypasses strike impact.', priority: 'MEDIUM', estimatedImpact: 'Adds 1 day, costs ₹2.8L more, but avoids unpredictable strike duration' },
    ],
  })

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { type: 'COLD_CHAIN_BREACH', title: 'Critical Temperature Excursion – SHP-004', message: 'Temperature reached 14.2°C on SHP-004 (Perishables, BLR–HYD). Immediate inspection required.', severity: 'CRITICAL', entityType: 'SHIPMENT', entityId: shipments[3].id, isRead: false },
      { type: 'COLD_CHAIN_BREACH', title: 'Refrigeration Failure – SHP-018', message: 'Truck TR-GATI-005 refrigeration unit failed. SHP-018 (Oranges) at 11.5°C – spoilage imminent.', severity: 'CRITICAL', entityType: 'SHIPMENT', entityId: shipments[17].id, isRead: false },
      { type: 'DISRUPTION_NEW', title: 'New Disruption: Chennai Port Strike', message: 'DIS-003: Dock workers strike at Chennai Port. 4 shipments affected. Expected resolution: 5 days.', severity: 'CRITICAL', entityType: 'DISRUPTION', entityId: disruptions[2].id, isRead: false },
      { type: 'DISRUPTION_UPDATE', title: 'Red Sea Tensions – Vessel Stranded', message: 'DIS-005: VS-ATL-001 stranded in Red Sea. SHP-008 and SHP-025 now CRITICAL status.', severity: 'CRITICAL', entityType: 'DISRUPTION', entityId: disruptions[4].id, isRead: false },
      { type: 'DELAY_ALERT', title: 'SHP-012 Medical Devices – 36h Delay', message: 'Critical medical devices on Delhi–Mumbai rail delayed 36 hours. Hospital supply chain impacted.', severity: 'HIGH', entityType: 'SHIPMENT', entityId: shipments[11].id, isRead: false },
      { type: 'COLD_CHAIN_BREACH', title: 'Battery Critical – SHP-011 Sensor', message: 'IoT sensor battery at 12% on SHP-011 (Seafood, KOL–DXB). Sensor blackout in ~4 hours.', severity: 'HIGH', entityType: 'SHIPMENT', entityId: shipments[10].id, isRead: false },
      { type: 'DISRUPTION_NEW', title: 'Mumbai Flash Floods – NH48 Impacted', message: 'DIS-001: Flash floods in Mumbai affecting 5 shipments on Mumbai routes. Expect 8-24h delays.', severity: 'HIGH', entityType: 'DISRUPTION', entityId: disruptions[0].id, isRead: true },
      { type: 'RECOMMENDATION', title: 'Action Required: Reroute SHP-008', message: 'AI recommends rerouting SHP-008 via Cape of Good Hope to avoid Red Sea security risk.', severity: 'HIGH', entityType: 'SHIPMENT', entityId: shipments[7].id, isRead: false },
    ],
  })

  console.log('✅ Seed complete!')
  console.log(`   ${carriers.length} carriers`)
  console.log(`   ${shipments.length} shipments`)
  console.log(`   ${disruptions.length} disruptions`)
  console.log(`   ${fleetAssets.length} fleet assets`)
  console.log(`   ${routeRecords.length} routes`)
  console.log(`   ${coldChainReadings.length} cold chain readings`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
