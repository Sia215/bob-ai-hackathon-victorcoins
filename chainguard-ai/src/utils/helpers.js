export function getRiskBadgeClass(level) {
  const map = {
    Critical: 'badge-critical',
    High: 'badge-high',
    Medium: 'badge-medium',
    Low: 'badge-low',
    Normal: 'badge-normal',
    Warning: 'badge-warning',
  };
  return `badge ${map[level] || 'badge-neutral'}`;
}

export function getStatusBadgeClass(status) {
  const map = {
    Delayed: 'badge-high',
    'At Risk': 'badge-warning',
    'In Transit': 'badge-info',
    'On Time': 'badge-normal',
    Active: 'badge-info',
  };
  return `badge ${map[status] || 'badge-neutral'}`;
}

export function getSeverityIcon(level) {
  const icons = {
    Critical: '🔴',
    High: '🟠',
    Medium: '🟡',
    Low: '🟢',
    Normal: '🟢',
    Warning: '🟡',
  };
  return icons[level] || '⚪';
}

export function getDisruptionTypeIcon(type) {
  const icons = {
    'Weather Event': '🌀',
    'Port Strike': '⚓',
    'Road Closure': '🚧',
    Geopolitical: '🛡️',
  };
  return icons[type] || '⚠️';
}

export function getVehicleIcon(type) {
  const icons = {
    'Container Truck': '🚛',
    'Refrigerated Truck': '🧊',
    'Cargo Vessel': '🚢',
    'Rail Wagon': '🚂',
    'Cargo Plane': '✈️',
  };
  return icons[type] || '📦';
}

/** Simple markdown-like bold renderer for chat */
export function renderMarkdown(text) {
  if (!text) return '';
  return text
    .split('\n')
    .map((line) => {
      return line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    })
    .join('<br/>');
}
