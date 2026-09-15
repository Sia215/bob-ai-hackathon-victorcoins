import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'

// Convert lat/lng to 3D sphere coordinates
function latLngToVec3(lat, lng, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  )
}

// Create arc points between two lat/lng positions
function createArcPoints(from, to, segments = 50, height = 0.3) {
  const start = latLngToVec3(from[0], from[1])
  const end   = latLngToVec3(to[0], to[1])
  const points = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const point = new THREE.Vector3().lerpVectors(start, end, t)
    // Elevate the arc
    const elevation = Math.sin(Math.PI * t) * height
    point.normalize().multiplyScalar(1 + elevation)
    points.push(point)
  }
  return points
}

// Globe sphere
function Globe() {
  const meshRef = useRef()
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.05
  })
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhongMaterial
        color="#0a1628"
        emissive="#0d2040"
        emissiveIntensity={0.3}
        shininess={10}
        wireframe={false}
      />
    </mesh>
  )
}

// Grid lines on globe
function GlobeGrid() {
  const ref = useRef()
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05
  })

  const lines = useMemo(() => {
    const lineGroup = []
    // Latitude lines
    for (let lat = -75; lat <= 75; lat += 15) {
      const pts = []
      for (let lng = 0; lng <= 360; lng += 5) {
        pts.push(latLngToVec3(lat, lng - 180, 1.001))
      }
      lineGroup.push({ pts, key: `lat-${lat}` })
    }
    // Longitude lines
    for (let lng = 0; lng < 360; lng += 30) {
      const pts = []
      for (let lat = -90; lat <= 90; lat += 5) {
        pts.push(latLngToVec3(lat, lng - 180, 1.001))
      }
      lineGroup.push({ pts, key: `lng-${lng}` })
    }
    return lineGroup
  }, [])

  return (
    <group ref={ref}>
      {lines.map(({ pts, key }) => {
        const geo = new THREE.BufferGeometry().setFromPoints(pts)
        return (
          <line key={key} geometry={geo}>
            <lineBasicMaterial color="#1e3a5f" transparent opacity={0.3} />
          </line>
        )
      })}
    </group>
  )
}

// Shipment arc
function ShipmentArc({ from, to, color, onClick }) {
  const ref = useRef()
  const points = useMemo(() => createArcPoints(from, to), [from, to])

  useFrame((state) => {
    if (ref.current) {
      // Animate dash offset for moving arc effect
      ref.current.material.dashOffset -= 0.005
    }
  })

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points)
    return g
  }, [points])

  return (
    <line ref={ref} geometry={geo} onClick={onClick}>
      <lineBasicMaterial color={color} transparent opacity={0.8} linewidth={2} />
    </line>
  )
}

// Hub dot
function HubDot({ lat, lng, label, color = '#06b6d4', size = 0.015 }) {
  const pos = latLngToVec3(lat, lng, 1.01)
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime()
      ref.current.scale.setScalar(1 + Math.sin(t * 2) * 0.15)
    }
  })
  return (
    <mesh ref={ref} position={pos}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

// Disruption pulse sphere
function DisruptionSphere({ lat, lng, severity }) {
  const pos = latLngToVec3(lat, lng, 1.015)
  const ref = useRef()
  const color = severity === 'Critical' ? '#ef4444' : '#f97316'

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime()
      const s = 1 + Math.sin(t * 3) * 0.4
      ref.current.scale.setScalar(s)
      ref.current.material.opacity = 0.6 + Math.sin(t * 3) * 0.3
    }
  })

  return (
    <mesh ref={ref} position={pos}>
      <sphereGeometry args={[0.025, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} />
    </mesh>
  )
}

// HUBS
const HUBS = [
  { lat: 19.0760,  lng: 72.8777,   label: 'Mumbai',      color: '#06b6d4' },
  { lat: 28.6139,  lng: 77.2090,   label: 'Delhi',       color: '#06b6d4' },
  { lat: 13.0827,  lng: 80.2707,   label: 'Chennai',     color: '#06b6d4' },
  { lat: 22.5726,  lng: 88.3639,   label: 'Kolkata',     color: '#06b6d4' },
  { lat: 12.9716,  lng: 77.5946,   label: 'Bengaluru',   color: '#06b6d4' },
  { lat: 25.2048,  lng: 55.2708,   label: 'Dubai',       color: '#a855f7' },
  { lat: 1.3521,   lng: 103.8198,  label: 'Singapore',   color: '#a855f7' },
  { lat: 51.9244,  lng: 4.4777,    label: 'Rotterdam',   color: '#f59e0b' },
  { lat: 31.2304,  lng: 121.4737,  label: 'Shanghai',    color: '#f59e0b' },
  { lat: 34.0522,  lng: -118.2437, label: 'Los Angeles', color: '#f59e0b' },
  { lat: 51.5074,  lng: -0.1278,   label: 'London',      color: '#f59e0b' },
]

// Fallback mock routes when API is unavailable
const FALLBACK_ROUTES = [
  { from: [19.0760, 72.8777], to: [25.2048, 55.2708], risk: 'Low' },
  { from: [25.2048, 55.2708], to: [51.9244, 4.4777],  risk: 'Medium' },
  { from: [19.0760, 72.8777], to: [1.3521,  103.8198], risk: 'High' },
  { from: [1.3521,  103.8198], to: [31.2304, 121.4737], risk: 'Low' },
  { from: [13.0827, 80.2707], to: [1.3521,  103.8198], risk: 'Critical' },
  { from: [28.6139, 77.2090], to: [51.9244,  4.4777],  risk: 'Low' },
  { from: [31.2304, 121.4737], to: [34.0522, -118.2437], risk: 'Medium' },
]

const FALLBACK_DISRUPTIONS = [
  { lat: 19.0760, lng: 72.8777, severity: 'Critical' },
  { lat: 1.3521,  lng: 103.8198, severity: 'High' },
]

const RISK_ARC_COLOR = { Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#22c55e' }

function Scene({ shipments, disruptions }) {
  const routes = useMemo(() => {
    if (shipments && shipments.length > 0) {
      return shipments.slice(0, 30).map(s => ({
        from: s.originCoords || [19.0760, 72.8777],
        to:   s.destCoords   || [25.2048, 55.2708],
        risk: s.riskLevel || 'Low',
        id:   s.id,
      }))
    }
    return FALLBACK_ROUTES
  }, [shipments])

  const dispZones = useMemo(() => {
    if (disruptions && disruptions.length > 0) {
      return disruptions.filter(d => d.lat && d.lng).map(d => ({
        lat:      d.lat,
        lng:      d.lng,
        severity: d.severity,
      }))
    }
    return FALLBACK_DISRUPTIONS
  }, [disruptions])

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} color="#4488ff" />
      <pointLight position={[-5, -5, 5]} intensity={0.3} color="#ffffff" />

      <Globe />
      <GlobeGrid />

      {/* Shipment arcs */}
      {routes.map((r, i) => (
        <ShipmentArc
          key={i}
          from={r.from}
          to={r.to}
          color={RISK_ARC_COLOR[r.risk] || '#22c55e'}
        />
      ))}

      {/* Hub dots */}
      {HUBS.map(h => (
        <HubDot key={h.label} lat={h.lat} lng={h.lng} label={h.label} color={h.color} />
      ))}

      {/* Disruption zones */}
      {dispZones.map((d, i) => (
        <DisruptionSphere key={i} lat={d.lat} lng={d.lng} severity={d.severity} />
      ))}
    </>
  )
}

export default function LogisticsGlobe({ shipments, disruptions, height = '500px' }) {
  return (
    <div style={{ width: '100%', height, background: '#030b1a' }} className="rounded-xl overflow-hidden border border-[#1e293b]">
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#030b1a']} />
        <Stars radius={200} depth={60} count={3000} factor={3} fade />
        <Suspense fallback={null}>
          <Scene shipments={shipments} disruptions={disruptions} />
        </Suspense>
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={1.5}
          maxDistance={5}
          autoRotate={false}
          zoomSpeed={0.5}
        />
      </Canvas>
    </div>
  )
}
