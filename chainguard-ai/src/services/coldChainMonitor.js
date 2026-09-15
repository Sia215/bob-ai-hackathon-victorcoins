/**
 * Cold-chain monitoring service.
 * Classifies temperature excursions and maps to regulatory frameworks.
 */

export function classifyReading(reading) {
  const { currentTemp, minSafeTemp, maxSafeTemp } = reading;
  if (currentTemp < minSafeTemp || currentTemp > maxSafeTemp) {
    const deviation = currentTemp > maxSafeTemp
      ? currentTemp - maxSafeTemp
      : minSafeTemp - currentTemp;
    if (deviation >= 5 || (reading.excursionDuration && parseExcursionMinutes(reading.excursionDuration) > 240)) {
      return 'Critical';
    }
    return 'Warning';
  }
  return 'Normal';
}

function parseExcursionMinutes(duration) {
  if (!duration) return 0;
  const match = duration.match(/(\d+)h\s*(\d+)m/);
  if (match) return parseInt(match[1]) * 60 + parseInt(match[2]);
  return 0;
}

/**
 * Regulatory severity classification.
 * Maps a cold-chain reading against multiple real-world regulatory frameworks.
 *
 * Frameworks covered:
 *  - EU GMP Annex 15 (Pharmaceutical)
 *  - WHO PQS (Vaccines / Global Health)
 *  - FDA 21 CFR Part 211 (US Pharmaceutical)
 *  - IATA DGR Special Provision A152 (Dangerous Goods Air)
 *  - FSMA Sanitary Transport Rule (Food Safety – US)
 *
 * Returns an array of { framework, verdict, note }
 * verdict: 'pass' | 'watch' | 'breach'
 */
export function getRegulatorySeverity(reading) {
  const { currentTemp, minSafeTemp, maxSafeTemp, excursionDuration, cargoCategory } = reading;
  const excursionMins = parseExcursionMinutes(excursionDuration);
  const deviation = currentTemp > maxSafeTemp
    ? currentTemp - maxSafeTemp
    : currentTemp < minSafeTemp ? minSafeTemp - currentTemp : 0;
  const isExcursion = deviation > 0;

  const results = [];

  // --- EU GMP Annex 15 (Pharmaceuticals) ---
  // Requires documented MKT (Mean Kinetic Temperature) and excursion investigation
  // Any excursion >2°C for >30 min triggers mandatory investigation
  if (isPharmaceutical(reading)) {
    if (!isExcursion) {
      results.push({ framework: 'EU GMP Annex 15', verdict: 'pass', note: 'Within MKT compliance limits' });
    } else if (excursionMins > 0 && excursionMins <= 30 && deviation <= 2) {
      results.push({ framework: 'EU GMP Annex 15', verdict: 'watch', note: 'Minor excursion — MKT investigation recommended' });
    } else {
      results.push({ framework: 'EU GMP Annex 15', verdict: 'breach', note: 'Mandatory deviation report + batch quarantine required' });
    }
  }

  // --- WHO PQS / Vaccine Cold Chain (2–8°C tier) ---
  if (isVaccineOrBiologic(reading)) {
    if (!isExcursion) {
      results.push({ framework: 'WHO PQS E006', verdict: 'pass', note: 'Cold chain integrity maintained' });
    } else if (deviation > 0 && deviation <= 2 && excursionMins <= 60) {
      results.push({ framework: 'WHO PQS E006', verdict: 'watch', note: 'AEFI risk low — document and monitor' });
    } else {
      results.push({ framework: 'WHO PQS E006', verdict: 'breach', note: 'VVM discard threshold likely exceeded — quarantine batch' });
    }
  }

  // --- FDA 21 CFR Part 211.68 (US Pharma storage) ---
  if (isPharmaceutical(reading)) {
    if (!isExcursion) {
      results.push({ framework: 'FDA 21 CFR §211.68', verdict: 'pass', note: 'Temperature within USP labelled storage conditions' });
    } else if (deviation <= 5 && excursionMins <= 120) {
      results.push({ framework: 'FDA 21 CFR §211.68', verdict: 'watch', note: 'Notify QA — stability data review required' });
    } else {
      results.push({ framework: 'FDA 21 CFR §211.68', verdict: 'breach', note: 'Product hold required — FDA OOS investigation triggered' });
    }
  }

  // --- IATA DGR A152 (Lithium batteries, dangerous goods air freight) ---
  if (isDangerousGoods(reading)) {
    if (!isExcursion) {
      results.push({ framework: 'IATA DGR A152', verdict: 'pass', note: 'Thermal runaway risk within acceptable limits' });
    } else if (deviation > 0 && deviation <= 3) {
      results.push({ framework: 'IATA DGR A152', verdict: 'watch', note: 'Elevated temperature — notify cargo master' });
    } else {
      results.push({ framework: 'IATA DGR A152', verdict: 'breach', note: 'IMMEDIATE: Fire risk assessment — isolate cargo' });
    }
  }

  // --- FSMA Sanitary Transport (Food Safety) ---
  if (isFood(reading)) {
    if (!isExcursion) {
      results.push({ framework: 'FSMA Sanitary Transport', verdict: 'pass', note: 'Temperature log compliant with FDA rule' });
    } else if (deviation <= 3 && excursionMins <= 90) {
      results.push({ framework: 'FSMA Sanitary Transport', verdict: 'watch', note: 'Shipper notification required within 24h' });
    } else {
      results.push({ framework: 'FSMA Sanitary Transport', verdict: 'breach', note: 'Product rejection likely — consignee must refuse delivery' });
    }
  }

  // Fallback for unclassified cargo
  if (results.length === 0) {
    if (!isExcursion) {
      results.push({ framework: 'General Storage Standards', verdict: 'pass', note: 'Temperature nominal' });
    } else {
      results.push({ framework: 'General Storage Standards', verdict: deviation >= 5 ? 'breach' : 'watch', note: `Deviation of ${deviation.toFixed(1)}°C detected` });
    }
  }

  return results;
}

function isPharmaceutical(r) {
  const pharmaProducts = ['insulin', 'antiretroviral', 'vaccine', 'drug', 'pharma', 'medication'];
  const product = (r.product || '').toLowerCase();
  return pharmaProducts.some(p => product.includes(p));
}

function isVaccineOrBiologic(r) {
  const product = (r.product || '').toLowerCase();
  return product.includes('vaccine') || product.includes('biologics') || product.includes('insulin') || product.includes('antiretroviral');
}

function isDangerousGoods(r) {
  const product = (r.product || '').toLowerCase();
  return product.includes('battery') || product.includes('batteries') || product.includes('lithium') || product.includes('chemical');
}

function isFood(r) {
  const foodProducts = ['seafood', 'beef', 'mango', 'mangoes', 'coffee', 'food', 'fresh', 'frozen', 'perishable', 'soybean', 'agricultural'];
  const product = (r.product || '').toLowerCase();
  return foodProducts.some(p => product.includes(p));
}

export function getColdChainAlerts(coldChainReadings) {
  return coldChainReadings
    .map((r) => ({ ...r, computedSeverity: classifyReading(r) }))
    .filter((r) => r.computedSeverity !== 'Normal');
}

export function getColdChainSummary(coldChainReadings) {
  const critical = coldChainReadings.filter((r) => r.severity === 'Critical').length;
  const warning  = coldChainReadings.filter((r) => r.severity === 'Warning').length;
  const normal   = coldChainReadings.filter((r) => r.severity === 'Normal').length;
  return { critical, warning, normal, total: coldChainReadings.length };
}
