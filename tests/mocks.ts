import type { Page, Route } from '@playwright/test'

// ---------------------------------------------------------------------------
// This module intercepts every network call the app makes to external
// services (Harmony, the Giovanni Solr catalog, CMR, GES DISC, Earthdata
// Login, and the GSFC alerts feed) so that tests never depend on those
// services actually being reachable. All fixture data lives here.
// ---------------------------------------------------------------------------

export type FixtureVariable = {
  dataFieldId: string
  dataProductShortName: string
  dataProductVersion: string
  dataFieldShortName: string
  dataFieldAccessName: string
  dataFieldLongName: string
  dataProductLongName: string
  dataProductTimeInterval: string
  dataProductWest: number
  dataProductSouth: number
  dataProductEast: number
  dataProductNorth: number
  dataProductSpatialResolution: string
  dataProductBeginDateTime: string
  dataProductEndDateTime: string
  dataFieldKeywords: string[]
  dataFieldUnits: string
  dataProductDescriptionUrl: string
  dataFieldDescriptionUrl: string
  dataProductInstrumentShortName: string
  /** Facet value backing the Observations "All / Model / Observation / Reanalysis" filter. */
  dataProductObservation: 'Observation' | 'Model' | 'Reanalysis'
}

// ---------------------------------------------------------------------------
// Fixture variables — deterministic stand-ins for the real Giovanni catalog.
// ---------------------------------------------------------------------------

export const IMERG_FINAL: FixtureVariable = {
  dataFieldId: 'GPM_3IMERGDF_07_precipitation',
  dataProductShortName: 'GPM_3IMERGDF',
  dataProductVersion: '07',
  dataFieldShortName: 'precipitation',
  dataFieldAccessName: 'precipitation',
  dataFieldLongName: 'Daily mean precipitation rate (combined microwave-IR) estimate - Final Run',
  dataProductLongName: 'GPM IMERG Final Precipitation L3 1 day 0.1 degree x 0.1 degree V07',
  dataProductTimeInterval: 'daily',
  dataProductWest: -180,
  dataProductSouth: -90,
  dataProductEast: 180,
  dataProductNorth: 90,
  dataProductSpatialResolution: '0.1 deg.',
  dataProductBeginDateTime: '1998-01-01T00:00:00.000Z',
  dataProductEndDateTime: '2026-12-31T23:59:59.000Z',
  dataFieldKeywords: ['imerg', 'precipitation', 'rain', 'gpm', 'multi'],
  dataFieldUnits: 'mm/day',
  dataProductDescriptionUrl: 'https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGDF_07/summary',
  dataFieldDescriptionUrl: 'https://disc.gsfc.nasa.gov/information/glossary?glossary=precipitation',
  dataProductInstrumentShortName: 'MULTI',
  dataProductObservation: 'Observation',
}

export const IMERG_LATE: FixtureVariable = {
  dataFieldId: 'GPM_3IMERGDF_07_precipitationCal',
  dataProductShortName: 'GPM_3IMERGDF',
  dataProductVersion: '07',
  dataFieldShortName: 'precipitationCal',
  dataFieldAccessName: 'precipitationCal',
  dataFieldLongName: 'Precipitation rate (microwave-only) estimate - Late Run',
  dataProductLongName: 'GPM IMERG Final Precipitation L3 1 day 0.1 degree x 0.1 degree V07',
  dataProductTimeInterval: 'daily',
  dataProductWest: -180,
  dataProductSouth: -90,
  dataProductEast: 180,
  dataProductNorth: 90,
  dataProductSpatialResolution: '0.1 deg.',
  dataProductBeginDateTime: '1998-01-01T00:00:00.000Z',
  dataProductEndDateTime: '2026-12-31T23:59:59.000Z',
  dataFieldKeywords: ['imerg', 'precipitation', 'microwave'],
  dataFieldUnits: 'mm/day',
  dataProductDescriptionUrl: 'https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGDF_07/summary',
  dataFieldDescriptionUrl: 'https://disc.gsfc.nasa.gov/information/glossary?glossary=precipitation',
  dataProductInstrumentShortName: 'MULTI',
  dataProductObservation: 'Model',
}

export const NLDAS_HUMIDITY: FixtureVariable = {
  dataFieldId: 'NLDAS_FORA0125_H_002_SPFH2m',
  dataProductShortName: 'NLDAS_FORA0125_H',
  dataProductVersion: '2.0',
  dataFieldShortName: 'SPFH2m',
  dataFieldAccessName: 'SPFH2m',
  dataFieldLongName: '2-meter above ground Specific humidity',
  dataProductLongName: 'NLDAS Primary Forcing Data L4 Hourly 0.125 x 0.125 degree V2.0',
  dataProductTimeInterval: 'hourly',
  dataProductWest: -125,
  dataProductSouth: 25,
  dataProductEast: -67,
  dataProductNorth: 53,
  dataProductSpatialResolution: '0.125 deg.',
  dataProductBeginDateTime: '1979-01-01T00:00:00.000Z',
  dataProductEndDateTime: '2026-12-31T23:59:59.000Z',
  dataFieldKeywords: ['nldas', 'humidity', 'specific humidity'],
  dataFieldUnits: 'kg/kg',
  dataProductDescriptionUrl: 'https://disc.gsfc.nasa.gov/datasets/NLDAS_FORA0125_H_2.0/summary',
  dataFieldDescriptionUrl: 'https://disc.gsfc.nasa.gov/information/glossary?glossary=humidity',
  dataProductInstrumentShortName: 'MODEL',
  dataProductObservation: 'Reanalysis',
}

export const AEROSOL_OPTICAL_DEPTH: FixtureVariable = {
  dataFieldId: 'MOD08_M3_6_1_Aerosol_Optical_Depth_Land_Ocean_Mean',
  dataProductShortName: 'MOD08_M3',
  dataProductVersion: '6.1',
  dataFieldShortName: 'Aerosol_Optical_Depth_Land_Ocean_Mean',
  dataFieldAccessName: 'Aerosol_Optical_Depth_Land_Ocean_Mean',
  dataFieldLongName: 'Aerosol Optical Depth Land Ocean Mean',
  dataProductLongName: 'MODIS Terra Atmosphere Monthly Global Product',
  dataProductTimeInterval: 'monthly',
  dataProductWest: -180,
  dataProductSouth: -90,
  dataProductEast: 180,
  dataProductNorth: 90,
  dataProductSpatialResolution: '1 deg.',
  dataProductBeginDateTime: '2000-03-01T00:00:00.000Z',
  dataProductEndDateTime: '2026-12-31T23:59:59.000Z',
  dataFieldKeywords: ['aerosol', 'optical depth'],
  dataFieldUnits: 'none',
  dataProductDescriptionUrl: 'https://disc.gsfc.nasa.gov/datasets/MOD08_M3_6_1/summary',
  dataFieldDescriptionUrl: 'https://disc.gsfc.nasa.gov/information/glossary?glossary=aerosol',
  dataProductInstrumentShortName: 'MODIS',
  dataProductObservation: 'Observation',
}

export const FIXTURE_VARIABLES: FixtureVariable[] = [
  IMERG_FINAL,
  IMERG_LATE,
  NLDAS_HUMIDITY,
  AEROSOL_OPTICAL_DEPTH,
]

const FACET_FIELD_NAMES = [
  'dataProductObservation',
  'dataFieldDiscipline',
  'dataFieldMeasurement',
  'dataProductPlatformInstrument',
  'dataProductSpatialResolution',
  'dataProductTimeInterval',
  'dataFieldWavelength',
  'dataFieldDepth',
  'specialFeatures',
  'dataFieldTags',
]

// ---------------------------------------------------------------------------
// Fake CMR collection concept IDs — keyed by "<shortName>_<version>".
// Concept IDs must end with "-GES_DISC" to trigger the app's GES DISC-only
// dataset-metadata lookup path.
// ---------------------------------------------------------------------------

function entryIdFor(v: FixtureVariable) {
  return `${v.dataProductShortName}_${v.dataProductVersion}`
}

function conceptIdFor(v: FixtureVariable) {
  return `C-MOCK-${v.dataProductShortName}-${v.dataProductVersion}-GES_DISC`
}

function variableByConceptId(conceptId: string): FixtureVariable | undefined {
  return FIXTURE_VARIABLES.find(v => conceptIdFor(v) === conceptId)
}

function variableByEntryId(entryId: string): FixtureVariable | undefined {
  return FIXTURE_VARIABLES.find(v => entryIdFor(v) === entryId)
}

// ---------------------------------------------------------------------------
// Harmony job lifecycle state (per-test, reset by installApiMocks()).
// ---------------------------------------------------------------------------

type MockJob = {
  variable?: FixtureVariable
  format: string
  bboxWSEN?: [number, number, number, number]
  pointLngLat?: [number, number]
  timeStart?: string
  timeEnd?: string
  createdAt: number
  pollCount: number
  canceled: boolean
  forceFail: boolean
}

/** Mutable state a test can tweak mid-run (e.g. to simulate a hung request). */
export const mockState = {
  /** When true, Harmony job-status polls never resolve — used by the cancel test. */
  hangJobPolls: false,
}

let mockJobs = new Map<string, MockJob>()
let jobCounter = 0

function resetMockState() {
  mockJobs = new Map()
  jobCounter = 0
  mockState.hangJobPolls = false
}

// ---------------------------------------------------------------------------
// Solr catalog search
// ---------------------------------------------------------------------------

function parseSolrQuery(q: string): { type: 'ids'; ids: string[] } | { type: 'keyword'; keyword: string } | { type: 'all' } {
  const idMatches = [...q.matchAll(/dataFieldId:"([^"]+)"/g)].map(m => m[1])
  if (idMatches.length) return { type: 'ids', ids: idMatches }
  const kwMatch = q.match(/dataFieldKeywordsText:\(([^)]*)\)/)
  if (kwMatch) return { type: 'keyword', keyword: kwMatch[1] }
  return { type: 'all' }
}

function matchesKeyword(v: FixtureVariable, keyword: string): boolean {
  const haystack = [v.dataFieldLongName, v.dataProductLongName, v.dataFieldShortName, v.dataProductShortName, ...v.dataFieldKeywords]
    .join(' ')
    .toLowerCase()
  return haystack.includes(keyword)
}

function buildCatalogResponse(url: URL) {
  const q = url.searchParams.get('q') ?? ''
  const parsed = parseSolrQuery(q)

  let docs: FixtureVariable[]
  if (parsed.type === 'ids') {
    docs = FIXTURE_VARIABLES.filter(v => parsed.ids.includes(v.dataFieldId))
  } else if (parsed.type === 'keyword') {
    const keyword = parsed.keyword.toLowerCase().trim()
    // Bug reproduction: plural "aerosols" intentionally returns nothing, matching
    // the real backend's known pluralization bug (Bug 2 in variable-selection.spec.ts).
    docs = keyword === 'aerosols' ? [] : FIXTURE_VARIABLES.filter(v => matchesKeyword(v, keyword))
  } else {
    docs = FIXTURE_VARIABLES
  }

  const facetFields: Record<string, (string | number)[]> = {}
  for (const field of FACET_FIELD_NAMES) facetFields[field] = []

  // Populate the "Observations" All/Model/Observation/Reanalysis filter from the
  // full fixture catalog (Solr facet counts reflect the whole corpus, not just
  // the currently-filtered docs, so the radio group is always available).
  const observationCounts = new Map<string, number>()
  for (const v of FIXTURE_VARIABLES) {
    observationCounts.set(v.dataProductObservation, (observationCounts.get(v.dataProductObservation) ?? 0) + 1)
  }
  facetFields['dataProductObservation'] = [...observationCounts.entries()].flatMap(([term, count]) => [term, count])

  return {
    response: { numFound: docs.length, start: 0, docs },
    facet_counts: { facet_fields: facetFields },
  }
}

function buildKeywordTermsResponse() {
  const terms: (string | number)[] = []
  const counts = new Map<string, number>()
  for (const v of FIXTURE_VARIABLES) {
    for (const kw of v.dataFieldKeywords) {
      counts.set(kw, (counts.get(kw) ?? 0) + 1)
    }
  }
  for (const [kw, count] of counts) {
    terms.push(kw, count)
  }
  return { terms: { dataFieldKeywords: terms } }
}

// ---------------------------------------------------------------------------
// Harmony request parsing helpers
// ---------------------------------------------------------------------------

function parseBbox(subsetParams: string[]): [number, number, number, number] | undefined {
  let west: number | undefined, east: number | undefined, south: number | undefined, north: number | undefined
  for (const s of subsetParams) {
    const latMatch = s.match(/^lat\(([-.\d]+):([-.\d]+)\)$/)
    const lonMatch = s.match(/^lon\(([-.\d]+):([-.\d]+)\)$/)
    if (latMatch) { south = parseFloat(latMatch[1]); north = parseFloat(latMatch[2]) }
    if (lonMatch) { west = parseFloat(lonMatch[1]); east = parseFloat(lonMatch[2]) }
  }
  if (west === undefined || east === undefined || south === undefined || north === undefined) return undefined
  return [west, south, east, north]
}

function parseTime(subsetParams: string[]): { start?: string; end?: string } {
  for (const s of subsetParams) {
    const match = s.match(/^time\("([^"]+)":"([^"]+)"\)$/)
    if (match) return { start: match[1], end: match[2] }
  }
  return {}
}

function bboxIntersects(a: [number, number, number, number], b: [number, number, number, number]): boolean {
  const [aWest, aSouth, aEast, aNorth] = a
  const [bWest, bSouth, bEast, bNorth] = b
  return aWest <= bEast && aEast >= bWest && aSouth <= bNorth && aNorth >= bSouth
}

// ---------------------------------------------------------------------------
// Fixture time-series CSV
// ---------------------------------------------------------------------------

const FIXTURE_TS_VALUES = [3.2, 4.5, 2.1, 5.8, 1.9, 6.4, 2.8, 4.0, 3.5, 5.1]

function buildCsvFixture(job: MockJob): string {
  const variable = job.variable
  const lines = [
    `variable,${variable?.dataFieldId ?? 'unknown'}`,
    `units,${variable?.dataFieldUnits ?? ''}`,
    `Timestamp (UTC),value`,
  ]
  const start = job.timeStart ? new Date(job.timeStart) : new Date('2025-03-01T00:00:00Z')
  const end = job.timeEnd ? new Date(job.timeEnd) : new Date('2025-03-05T00:00:00Z')

  let day = new Date(start)
  let i = 0
  while (day.getTime() <= end.getTime() && i < 30) {
    lines.push(`${day.toISOString()},${FIXTURE_TS_VALUES[i % FIXTURE_TS_VALUES.length]}`)
    day = new Date(day.getTime() + 24 * 3600 * 1000)
    i++
  }
  if (i === 0) {
    lines.push(`${start.toISOString()},${FIXTURE_TS_VALUES[0]}`)
  }
  return lines.join('\n') + '\n'
}

async function buildGeoTiffFixture(job: MockJob): Promise<ArrayBuffer> {
  const { writeArrayBuffer } = await import('geotiff')
  const width = 20
  const height = 20
  const data = new Float32Array(width * height)
  const noData = -9999
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const isNoData = row < 2 && col < 2
      data[row * width + col] = isNoData ? noData : 1 + (col / width) * 9 + (row / height) * 3
    }
  }
  const metadata: Record<string, unknown> = { height, width, GDAL_NODATA: String(noData) }
  const bbox = job.bboxWSEN ?? [-125, 24, -66, 50]
  const [west, south, east, north] = bbox
  metadata.ModelPixelScale = [(east - west) / width, (north - south) / height, 0]
  metadata.ModelTiepoint = [0, 0, 0, west, north, 0]
  return writeArrayBuffer(data, metadata as any)
}

// ---------------------------------------------------------------------------
// Harmony capabilities fixture
// ---------------------------------------------------------------------------

function buildCapabilitiesResponse(conceptId: string) {
  const variable = variableByConceptId(conceptId)
  return {
    conceptId,
    shortName: variable?.dataProductShortName ?? 'MOCK',
    summary: {
      subsetting: { bbox: true, dimension: true, shape: true, temporal: true, variable: true },
      reprojection: { supported: false, supportedProjections: [], interpolationMethods: [] },
      averaging: { time: true, area: true },
      concatenation: false,
      outputFormats: ['text/csv', 'image/tiff', 'image/png', 'image/jpeg'],
    },
    services: [
      {
        name: 'mock/harmony-service',
        href: '',
        capabilities: {
          subsetting: { temporal: true, variable: true, bbox: true },
          outputFormats: ['text/csv', 'image/tiff', 'image/png', 'image/jpeg'],
          averaging: { time: true, area: true },
        },
      },
    ],
    variables: [],
    capabilitiesVersion: '3',
    configuredOutputFormats: [
      { key: 'text/csv', label: 'CSV', description: 'Download data in CSV format', isGiovanniFormat: true },
      { key: 'image/tiff', label: 'GEOTIFF', description: 'Download data in GEOTIFF format', isGiovanniFormat: true },
    ],
  }
}

// ---------------------------------------------------------------------------
// Route installer
// ---------------------------------------------------------------------------

export async function installApiMocks(page: Page): Promise<void> {
  resetMockState()

  await page.route('**/*', async (route: Route) => {
    const request = route.request()
    const urlStr = request.url()
    let url: URL
    try {
      url = new URL(urlStr)
    } catch {
      return route.continue()
    }

    // 1. GSFC alerts feed
    if (urlStr.includes('disc.gsfc.nasa.gov/api/alerts')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) })
    }

    // 2. Earthdata Login (EDL) OAuth proxy
    if (urlStr.includes('terra-earthdata-oauth')) {
      if (urlStr.includes('/callback')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'mock-terra-token' }) })
      }
      if (urlStr.includes('/user')) {
        const authHeader = request.headers()['authorization'] ?? ''
        if (authHeader.startsWith('Bearer ') && authHeader.length > 'Bearer '.length) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ user: { uid: 'testuser', first_name: 'Test', last_name: 'User' } }),
          })
        }
        return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthorized' }) })
      }
      return route.continue()
    }

    // 3. Giovanni Solr catalog search (proxied through the harmony-proxy Lambda)
    if (urlStr.includes('giovanni.gsfc.nasa.gov/giovanni/daac-bin/catalogServices.pl')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(buildCatalogResponse(url)) })
    }

    // 4. Giovanni keyword terms (also proxied through harmony-proxy)
    if (urlStr.includes('aesir_proxy.pl/terms')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(buildKeywordTermsResponse()) })
    }

    // 5. Giovanni configured-variables allowlist
    if (urlStr.includes('configured-variables')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ configured_variables: FIXTURE_VARIABLES.map(v => v.dataFieldId) }),
      })
    }

    // 6. CMR collection lookup (resolves the Harmony collection concept ID)
    if (urlStr.includes('cmr.earthdata.nasa.gov/search/collections.umm_json')) {
      const entryId = url.searchParams.get('entry_id') ?? ''
      const variable = variableByEntryId(entryId)
      if (!variable) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              meta: { 'concept-id': conceptIdFor(variable) },
              umm: {
                ShortName: variable.dataProductShortName,
                Version: variable.dataProductVersion,
                EntryTitle: variable.dataProductLongName,
              },
            },
          ],
        }),
      })
    }

    // 7. CMR UMM-Var search (only used for non-Giovanni output formats)
    if (urlStr.includes('cmr.earthdata.nasa.gov/search/variables.umm_json')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) })
    }

    // 8. GES DISC dataset metadata (subsetting dimensions)
    if (urlStr.includes('disc.gsfc.nasa.gov/api/metadata/dataset/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ services: { subset: [{ dimensions: [] }] } }),
      })
    }

    // 9. Harmony capabilities
    if (url.pathname.endsWith('/capabilities') || url.pathname === '/capabilities') {
      const conceptId = url.searchParams.get('collectionId') ?? ''
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(buildCapabilitiesResponse(conceptId)) })
    }

    // 10. Harmony job creation — GET .../{conceptId}/ogc-api-coverages/1.0.0/collections/.../coverage/rangeset
    const createJobMatch = url.pathname.match(/^\/([^/]+)\/ogc-api-coverages\/1\.0\.0\/collections\//)
    if (createJobMatch) {
      const conceptId = createJobMatch[1]
      const variable = variableByConceptId(conceptId)
      const subsetParams = url.searchParams.getAll('subset')
      const bboxWSEN = parseBbox(subsetParams)
      const { start: timeStart, end: timeEnd } = parseTime(subsetParams)
      const pointParam = url.searchParams.get('point')
      const format = url.searchParams.get('format') ?? 'text/csv'

      let forceFail = false
      if (variable && bboxWSEN) {
        const variableBbox: [number, number, number, number] = [
          variable.dataProductWest, variable.dataProductSouth, variable.dataProductEast, variable.dataProductNorth,
        ]
        forceFail = !bboxIntersects(bboxWSEN, variableBbox)
      }

      const jobId = `mock-job-${++jobCounter}`
      const job: MockJob = {
        variable,
        format,
        bboxWSEN,
        pointLngLat: pointParam ? (pointParam.split(',').map(Number) as [number, number]) : undefined,
        timeStart,
        timeEnd,
        createdAt: Date.now(),
        pollCount: 0,
        canceled: false,
        forceFail,
      }
      mockJobs.set(jobId, job)

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobID: jobId,
          status: 'running',
          message: 'The job is being processed',
          progress: 0,
          createdAt: new Date(job.createdAt).toISOString(),
          updatedAt: new Date(job.createdAt).toISOString(),
          dataExpiration: new Date(job.createdAt + 7 * 24 * 3600 * 1000).toISOString(),
          request: urlStr,
          numInputGranules: 1,
          links: [],
        }),
      })
    }

    // 11. Harmony job cancel — .../jobs/{id}/cancel
    const cancelMatch = url.pathname.match(/\/jobs\/([^/]+)\/cancel$/)
    if (cancelMatch) {
      const job = mockJobs.get(cancelMatch[1])
      if (job) job.canceled = true
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobID: cancelMatch[1],
          status: 'canceled',
          message: 'The job was canceled',
          progress: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dataExpiration: new Date().toISOString(),
          request: urlStr,
          numInputGranules: 1,
          links: [],
        }),
      })
    }

    // 12. Harmony job status poll — .../jobs/{id}
    const statusMatch = url.pathname.match(/\/jobs\/([^/]+)$/)
    if (statusMatch) {
      const jobId = statusMatch[1]
      const job = mockJobs.get(jobId)

      // Don't hang polls for a job that has already been canceled — the app needs a
      // subsequent poll response to learn about the cancellation and remove the plot.
      if (mockState.hangJobPolls && !job?.canceled) {
        // Never resolve — simulates a Harmony request that hangs indefinitely,
        // giving the test a window to click "Cancel".
        return new Promise(() => {})
      }

      if (!job) {
        return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Job not found' }) })
      }

      job.pollCount++

      if (job.canceled) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            jobID: jobId, status: 'canceled', message: 'The job was canceled', progress: 0,
            createdAt: new Date(job.createdAt).toISOString(), updatedAt: new Date().toISOString(),
            dataExpiration: new Date().toISOString(), request: urlStr, numInputGranules: 1, links: [],
          }),
        })
      }

      if (job.pollCount < 2) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            jobID: jobId, status: 'running', message: 'The job is being processed', progress: job.pollCount * 40,
            createdAt: new Date(job.createdAt).toISOString(), updatedAt: new Date().toISOString(),
            dataExpiration: new Date().toISOString(), request: urlStr, numInputGranules: 1, links: [],
          }),
        })
      }

      if (job.forceFail) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            jobID: jobId, status: 'failed', message: 'No matching data found for the given spatial and temporal constraints.', progress: 100,
            createdAt: new Date(job.createdAt).toISOString(), updatedAt: new Date().toISOString(),
            dataExpiration: new Date().toISOString(), request: urlStr, numInputGranules: 0,
            errors: [{ url: urlStr, message: 'No matching data found for the given spatial and temporal constraints.' }],
            links: [],
          }),
        })
      }

      const dataType = job.format.includes('tiff') ? 'image/tiff' : 'text/csv'
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobID: jobId, status: 'successful', message: 'The job has completed successfully', progress: 100,
          createdAt: new Date(job.createdAt).toISOString(), updatedAt: new Date().toISOString(),
          dataExpiration: new Date(job.createdAt + 7 * 24 * 3600 * 1000).toISOString(), request: urlStr, numInputGranules: 1,
          links: [
            {
              title: 'Data',
              href: `https://lpo4uv7f0h.execute-api.us-east-1.amazonaws.com/default/harmony-link-proxy?jobId=${jobId}`,
              rel: 'data',
              type: dataType,
              bbox: job.bboxWSEN,
              temporal: job.timeStart ? { start: job.timeStart, end: job.timeEnd ?? job.timeStart } : undefined,
            },
          ],
        }),
      })
    }

    // 13. Harmony link-proxy — fetches the actual CSV / GeoTIFF payload for a job's data link
    if (urlStr.includes('harmony-link-proxy')) {
      const jobId = url.searchParams.get('jobId') ?? ''
      const job = mockJobs.get(jobId)
      if (job?.format.includes('tiff')) {
        const tiff = await buildGeoTiffFixture(job)
        return route.fulfill({ status: 200, contentType: 'image/tiff', body: Buffer.from(tiff) })
      }
      return route.fulfill({ status: 200, contentType: 'text/csv', body: job ? buildCsvFixture(job) : '' })
    }

    // Anything else (local dev server assets, fonts, map tiles, Plotly CDN, etc.) passes through.
    return route.continue()
  })
}
