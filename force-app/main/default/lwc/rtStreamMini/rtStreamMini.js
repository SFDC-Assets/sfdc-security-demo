import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { subscribe } from 'lightning/empApi';
import getPolicies from '@salesforce/apex/StreamMiniPolicyResolver.getPolicies';
import getTspPolicies from '@salesforce/apex/StreamMiniTspController.getPolicies';
import togglePolicy from '@salesforce/apex/StreamMiniTspController.togglePolicy';
import STREAMMINI_BADGES from '@salesforce/resourceUrl/StreamMiniBadges';

const CHANNELS = ['/event/ReportEventStream', '/event/ApiEventStream'];
const MAX_CARDS = 50;
const PAGE_SIZE = 5;
// NOTE: Any UI/behavioral change to Stream Mini must bump this build tag and update docs/STATUS.md + docs/streammini_card_contract.md.
export const streamMiniBuildTag = 'stream-mini-v4.74';
const TIME_MODE_STORAGE_KEY = 'streamMini.timeMode';
const VIEW_MODE_STORAGE_KEY = 'streamMini.viewMode';
const LANE_MODE_STORAGE_KEY = 'streamMini.laneMode';
const THEME_MODE_STORAGE_KEY = 'streamMini.themeMode';
const TSP_PANEL_STORAGE_KEY = 'streamMini.showTspPanel';
const INITIAL_FIELDS_VISIBLE = 7;
const INITIAL_ROWS_VISIBLE = 0;
const ROWS_INCREMENT = 6;
const TSP_POLICIES_PER_PAGE = 12;
const TSP_COLUMN_SIZE = 4;

function formatIso(iso) {
  if (!iso) return '';
  return iso.replace('T', ' ').replace('.000Z', '');
}

function badgeUrl(fileName) {
  return `${STREAMMINI_BADGES}/${fileName}`;
}

function jsonPillClass(showJson) {
  return showJson ? 'rtm-json-pill rtm-json-pill--active' : 'rtm-json-pill';
}

function splitDateTime(display) {
  if (!display || typeof display !== 'string') {
    return { date: '', time: '' };
  }
  const parts = display.trim().split(' ');
  if (parts.length >= 2) {
    return { date: parts[0], time: parts[1] };
  }
  return { date: display, time: '' };
}

// Static badge URLs; event badge swaps to Exported for export events, field/object/rows are section icons.
const FIELD_BADGE_URL = badgeUrl('Field.png');
const OBJECT_BADGE_URL = badgeUrl('Object.png');
const ROWS_BADGE_URL = badgeUrl('RowsProcessed.png');
const REPORT_EVENT_BADGE_URL = badgeUrl('ReportEvent.png');
const API_EVENT_BADGE_URL = badgeUrl('APIEvent.png');
const EXPORTED_BADGE_URL = badgeUrl('Exported.png');
const ALLOWED_BADGE_URL = badgeUrl('Allowed.png');
const BLOCKED_BADGE_URL = badgeUrl('Blocked.png');
const NOTIFIED_BADGE_URL = badgeUrl('Notified.png');
const HEADER_REPORT_BADGE_URL = REPORT_EVENT_BADGE_URL;
const HEADER_API_BADGE_URL = API_EVENT_BADGE_URL;
const TSP_API_BADGE_URL = API_EVENT_BADGE_URL;
const TSP_REPORT_BADGE_URL = REPORT_EVENT_BADGE_URL;
const TSP_API_BADGE_URL_GRAY = badgeUrl('ApiEventGray.png');
const TSP_REPORT_BADGE_URL_GRAY = badgeUrl('ReportEventGray.png');
const COPY_JSON_ICON_NORMAL = badgeUrl('copyjson_normal.png');
const COPY_JSON_ICON_HOVER = badgeUrl('copyjson_hover.png');
const COPY_JSON_ICON_COPIED = badgeUrl('copyjson_copied.png');

function isExportOperation(op, eventType) {
  if (op && /export/i.test(op)) return true;
  if (eventType && /export/i.test(eventType)) return true;
  return false;
}

function expandableClass(base, expanded) {
  return expanded ? `${base} expanded` : base;
}

function normalizePolicyOutcome(outcome) {
  if (!outcome) return 'allowed';
  const val = String(outcome).toLowerCase();
  if (val === 'block' || val === 'blocked') return 'blocked';
  if (val === 'notify' || val === 'notified') return 'notified';
  if (val === 'noaction' || val === 'allowed') return 'allowed';
  return 'allowed';
}

function policyBadgeForOutcome(outcome) {
  if (outcome === 'blocked') return badgeUrl('Blocked.png');
  if (outcome === 'notified') return badgeUrl('Notified.png');
  if (outcome === 'allowed') return ALLOWED_BADGE_URL;
  return null;
}

function timestampValue(rawTimestamp) {
  const val = Date.parse(rawTimestamp || '');
  return Number.isNaN(val) ? 0 : val;
}

function normalizeClient(rawClient, rawApplication) {
  const client = rawClient ? String(rawClient).trim() : '';
  const application = rawApplication ? String(rawApplication).trim() : '';
  let candidate = client || application;
  if (candidate && candidate.toLowerCase() === 'n/a') {
    candidate = '';
  }
  if (!candidate) return 'No Name';
  return candidate.endsWith('/') ? candidate.slice(0, -1) : candidate;
}

function extractFieldsFromQuery(query) {
  if (!query) return [];
  const q = String(query);
  const match = q.match(/select([\s\S]+?)from/i);
  if (!match || !match[1]) {
    return [];
  }
  return match[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((full) => {
      const parts = full.split('.');
      return parts[parts.length - 1];
    });
}

function buildPolicyMeta(outcomeRaw, policyId, policyMap) {
  const normalizedOutcome = normalizePolicyOutcome(outcomeRaw);
  const policyName = policyId && policyMap && policyMap[policyId] ? policyMap[policyId] : null;
  const hasPolicySignal = !!(outcomeRaw || policyId);

  let policyPillText = null;
  let policyTitle = '';
  if (normalizedOutcome === 'blocked') {
    policyPillText = policyName || 'Blocked';
    policyTitle = policyName ? `Blocked by ${policyName}` : 'Blocked';
  } else if (normalizedOutcome === 'notified') {
    policyPillText = policyName || 'Notified';
    policyTitle = policyName ? `Notified by ${policyName}` : 'Notified';
  } else if (normalizedOutcome === 'allowed') {
    policyPillText = 'No TSP Action';
    if (hasPolicySignal && policyName) {
      policyTitle = `No TSP Action (allowed) by ${policyName}`;
    } else if (hasPolicySignal) {
      policyTitle = 'No TSP Action (policy outcome)';
    } else {
      policyTitle = 'No TSP Action (no TSP outcome)';
    }
  }

  const policyClassBase = 'pill pill-policy';
  let policyClass = null;
  if (normalizedOutcome === 'blocked') {
    policyClass = `${policyClassBase} pill-policy-block`;
  } else if (normalizedOutcome === 'notified') {
    policyClass = `${policyClassBase} pill-policy-notify`;
  } else if (normalizedOutcome === 'allowed') {
    policyClass = `${policyClassBase} pill-policy-allowed`;
  }

  const policyBadgeUrl = policyPillText ? policyBadgeForOutcome(normalizedOutcome) : null;
  const policyPillClass = policyPillText ? `${policyClass || policyClassBase} pill-policy-name` : null;
  const severityClass =
    normalizedOutcome === 'blocked'
      ? 'card--blocked'
      : normalizedOutcome === 'notified'
        ? 'card--notified'
        : 'card--allowed';

  return {
    policyOutcome: normalizedOutcome,
    policyId: policyId || null,
    policyName,
    policyFullName: policyName || policyPillText,
    policyShortName: policyPillText,
    policyDisplay: policyPillText,
    policyPillText,
    policyClass: policyClass || null,
    policyBadgeUrl,
    policyPillClass,
    policySeverityClass: severityClass,
    policyTitle
  };
}

function buildTimestampMeta(rawTimestamp, timeMode) {
  const { datetimeLabel, dateDisplay, timeDisplay } = formatTimestampParts(rawTimestamp, timeMode);
  return {
    rawTimestamp: rawTimestamp || '',
    rawTimestampValue: timestampValue(rawTimestamp),
    datetime: datetimeLabel,
    dateDisplay,
    timeDisplay
  };
}

function buildRowsState(recordsJsonString, payloadContext) {
  let allRows = [];
  let totalRowCount = 0;
  if (recordsJsonString) {
    try {
      const parsed = JSON.parse(recordsJsonString);
      const entitiesRaw =
        (payloadContext && (payloadContext.QueriedEntities || payloadContext.QueriedEntities)) || '';
      const entities = entitiesRaw
        ? entitiesRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const inferredType = entities.length ? entities[0] : '';

      if (Array.isArray(parsed.records) && parsed.records.length) {
        const rows = parsed.records;
        allRows = rows.map((r, idx) => {
          const type = (r && r.attributes && r.attributes.type) || inferredType || '';
          const id = (r && r.Id) || '';
          const label = id || type || '(row)';
          return { type, id, label, key: `${idx}-${id || type || 'row'}` };
        });
        totalRowCount = parsed.totalSize || allRows.length || 0;
      } else if (Array.isArray(parsed.rows) && parsed.rows.length) {
        allRows = parsed.rows.map((row, idx) => {
          const cells = Array.isArray(row.datacells) ? row.datacells : [];
          const id = cells.length ? cells[0] : '';
          const type = inferredType || '';
          const label = id || type || '(row)';
          return { type, id, label, key: `${idx}-${id || type || 'row'}` };
        });
        totalRowCount = parsed.totalSize || allRows.length || 0;
      }
    } catch (e) {
      allRows = [];
      totalRowCount = 0;
    }
  }
  const visibleRowCount = Math.min(INITIAL_ROWS_VISIBLE, totalRowCount);
  const remainingRowCount = Math.max(totalRowCount - visibleRowCount, 0);
  const visibleRows = decorateVisibleRows(allRows.slice(0, visibleRowCount), remainingRowCount);
  return {
    allRows,
    totalRowCount,
    visibleRowCount,
    visibleRows,
    visibleRowPairs: chunkRowsIntoPairs(visibleRows),
    remainingRowCount,
    showRows: totalRowCount > 0,
    hasRows: totalRowCount > 0
  };
}

function decorateVisibleRows(rows, remainingRowCount) {
  const list = rows || [];
  return list.map((row, idx) => ({
    ...row,
    isSecondRow: idx === 1,
    isThirdRow: idx === 2
  }));
}

function chunkRowsIntoPairs(rows) {
  const pairs = [];
  const list = rows || [];
  for (let i = 0; i < list.length; i += 2) {
    const slice = list.slice(i, i + 2);
    const keyParts = slice.map((r) => r.key || r.id || `${i}-${Math.random()}`);
    const key = keyParts.join('|') || `pair-${i}`;
    pairs.push({ key, rows: slice });
  }
  return pairs;
}

function withTitleActorClasses(card) {
  if (!card) return card;
  const titleEmphasis = card.titleEmphasis || 'none';
  const actorEmphasis = card.actorEmphasis || 'ip';

  let reportTitleClass = 'pill pill-report-name';
  let clientTitleClass = 'pill pill-client pill-client-title';
  let operationTitleClass = 'pill pill-operation-title';

  if (titleEmphasis === 'report') {
    reportTitleClass += ' rtm-title--emphasized';
    operationTitleClass += ' rtm-title--deemphasized';
    clientTitleClass += ' rtm-title--deemphasized';
  } else if (titleEmphasis === 'operation') {
    operationTitleClass += ' rtm-title--emphasized';
    reportTitleClass += ' rtm-title--deemphasized';
    clientTitleClass += ' rtm-title--deemphasized';
  }

  let userActorClass = 'pill pill-user';
  let ipActorClass = 'pill pill-ip';
  if (actorEmphasis === 'user') {
    userActorClass += ' rtm-actor--emphasized';
    ipActorClass += ' rtm-actor--deemphasized';
  } else {
    // default to IP emphasis
    ipActorClass += ' rtm-actor--emphasized';
    userActorClass += ' rtm-actor--deemphasized';
  }

  return {
    ...card,
    reportTitleClass,
    clientTitleClass,
    operationTitleClass,
    userActorClass,
    ipActorClass
  };
}

function buildReportCard(payload, policyMap, timeMode) {
  const channel = '/event/ReportEventStream';
  const policyMeta = buildPolicyMeta(payload.PolicyOutcome, payload.PolicyId || null, policyMap);
  let fieldList = [];
  if (payload.ColumnHeaders) {
    const trimmed = payload.ColumnHeaders.replace(/^\[/, '').replace(/\]$/, '');
    fieldList = trimmed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((full) => {
        const parts = full.split('.');
        return parts[parts.length - 1];
      });
  }
  const maxFields = INITIAL_FIELDS_VISIBLE;
  const fieldsVisibleCount = Math.min(fieldList.length, maxFields);
  const fieldsVisible = fieldList.slice(0, fieldsVisibleCount);
  const fieldsMore = Math.max(fieldList.length - fieldsVisibleCount, 0);

  const entitiesRaw = payload.QueriedEntities || '';
  const entitiesList = entitiesRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const maxObjects = 4;
  const objectsVisible = entitiesList.slice(0, maxObjects);
  const objectsMore = entitiesList.length > maxObjects ? entitiesList.length - maxObjects : 0;

  const rawTimestamp = payload.EventDate || payload.CreatedDate || '';
  const timestampMeta = buildTimestampMeta(rawTimestamp, timeMode);

  const recordsRaw = payload.Records || null;
  const recordsJsonString = recordsRaw
    ? typeof recordsRaw === 'string'
      ? recordsRaw
      : JSON.stringify(recordsRaw, null, 2)
    : '';
  const rowsState = buildRowsState(recordsJsonString, payload);
    const rowsProcessed = payload.RowsProcessed || payload.RowsReturned || null;
    const opLabel = payload.Operation || payload.EventType || '';
  const isExport = isExportOperation(opLabel, payload.EventType) || payload.ExportFileFormat;
  const eventBadgeUrl = isExport ? EXPORTED_BADGE_URL : REPORT_EVENT_BADGE_URL;
  const cardClass = `card rtm-card report-card ${policyMeta.policySeverityClass}`.trim();
  const jsonBaseClass = 'row api-json-expanded expandable';
  const recordsBaseClass = 'row records-expanded expandable';
  const rawJson = JSON.stringify(
    {
      channel,
      payload
    },
    null,
    2
  );

  return withTitleActorClasses({
    id: payload.EventIdentifier || `${channel}-${Date.now()}`,
    channel,
    eventType: 'report',
    eventStreamType: 'report',
    eventBadgeUrl,
    policyOutcome: policyMeta.policyOutcome,
    policyId: policyMeta.policyId,
    policyName: policyMeta.policyName,
    policyDisplay: policyMeta.policyPillText,
    policyPillText: policyMeta.policyPillText,
    policyTitle: policyMeta.policyTitle,
    policyClass: policyMeta.policyClass,
    policyBadgeUrl: policyMeta.policyBadgeUrl,
    policyPillClass: policyMeta.policyPillClass,
    policyPillDisplayClass: policyMeta.policyPillClass,
    policyFullName: policyMeta.policyFullName,
    policyShortName: policyMeta.policyShortName,
    showFullPolicyName: false,
    policySeverityClass: policyMeta.policySeverityClass,
    who: payload.Username || payload.UserId || '',
    sourceIp: payload.SourceIp,
    client: normalizeClient(payload.Client, payload.Application),
    operation: opLabel,
    name: payload.Name || payload.ReportId || '',
    reportName: payload.Name || payload.ReportId || '',
    isExport: !!payload.ExportFileFormat,
    exportFormat: payload.ExportFileFormat || '',
    exportLabel: payload.ExportFileFormat ? `EXPORT (${payload.ExportFileFormat})` : 'EXPORT',
    rowsProcessed: payload.RowsProcessed,
    rowsReturned: payload.RowsReturned,
    fields: fieldList,
    fieldsAll: fieldList,
    fieldsVisible,
    fieldsMore,
    fieldsVisibleCount,
    fieldsTotal: fieldList.length,
    numberOfColumns: parseInt(payload.NumberOfColumns, 10) || fieldList.length,
    records: rowsProcessed,
    recordsRaw,
    showRecords: false,
    rawJson,
    copyJsonIconUrl: COPY_JSON_ICON_NORMAL,
    showJson: false,
    jsonPillClass: jsonPillClass(false),
    jsonBaseClass,
    jsonClass: expandableClass(jsonBaseClass, false),
    recordsBaseClass,
    recordsClass: expandableClass(recordsBaseClass, false),
    recordsLabel: rowsProcessed ? `Records: ${rowsProcessed}` : null,
    recordsCount: rowsProcessed || null,
    recordsJsonString,
    allRows: rowsState.allRows,
    totalRowCount: rowsState.totalRowCount,
    visibleRowCount: rowsState.visibleRowCount,
    visibleRows: rowsState.visibleRows,
    remainingRowCount: rowsState.remainingRowCount,
    showRows: true,
    hasRows: rowsState.hasRows,
    operationLabel: opLabel,
    entities: entitiesList,
    entitiesShort:
      entitiesList.length > 3
        ? `${entitiesList.slice(0, 3).join(', ')} (+${entitiesList.length - 3} more)`
        : entitiesList.join(', '),
    objects: entitiesList,
    objectsVisible,
    objectsMore,
    cardClass,
    rawTimestamp,
    rawTimestampValue: timestampMeta.rawTimestampValue,
    datetime: timestampMeta.datetime,
    dateDisplay: timestampMeta.dateDisplay,
    timeDisplay: timestampMeta.timeDisplay,
    query: null,
    fullQuery: null,
    showQuery: false,
    queryBaseClass: 'row query-expanded expandable',
    queryClass: expandableClass('row query-expanded expandable', false),
    hasQuery: false,
    isReport: true,
    isApi: false,
    hasExpandedView: false,
    titleEmphasis: 'none',
    actorEmphasis: 'ip'
  });
}

function buildApiCard(payload, policyMap, timeMode) {
  const channel = '/event/ApiEventStream';
  const policyMeta = buildPolicyMeta(payload.PolicyOutcome, payload.PolicyId || null, policyMap);
  const fullQuery = payload.Query || '';
  const querySnippet = fullQuery.length > 140 ? `${fullQuery.slice(0, 140)}…` : fullQuery;
  const opParts = `${payload.ApiType || ''} ${payload.Operation || ''}`.trim();
  const rows = payload.RowsReturned || payload.RowsProcessed;
  const recordsRaw = payload.Records || null;
  const records = rows || null;
  const entitiesRaw = payload.QueriedEntities || '';
  const entitiesList = entitiesRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const maxObjectsApi = 4;
  const objectsVisibleApi = entitiesList.slice(0, maxObjectsApi);
  const objectsMoreApi = entitiesList.length > maxObjectsApi ? entitiesList.length - maxObjectsApi : 0;
  const clientLabel = normalizeClient(payload.Client, payload.Application);
  const fieldList = extractFieldsFromQuery(fullQuery);
  const maxFieldsApi = INITIAL_FIELDS_VISIBLE;
  const fieldsVisibleCount = Math.min(fieldList.length, maxFieldsApi);
  const apiFieldsVisible = fieldList.slice(0, fieldsVisibleCount);
  const apiFieldsMore = Math.max(fieldList.length - fieldsVisibleCount, 0);
  const rawTimestamp = payload.EventDate || payload.CreatedDate || '';
  const timestampMeta = buildTimestampMeta(rawTimestamp, timeMode);
  const baseClassName = 'card rtm-card api-card';
  const opLabel = opParts;
  const isExport = isExportOperation(opLabel, payload.EventType);
  const eventBadgeUrl = isExport ? EXPORTED_BADGE_URL : API_EVENT_BADGE_URL;
  const cardClass = `${baseClassName} ${policyMeta.policySeverityClass}`.trim();
  const jsonBaseClass = 'row api-json-expanded expandable';
  const recordsBaseClass = 'row records-expanded expandable';
  const queryBaseClass = 'row query-expanded expandable';
  const rawJson = JSON.stringify(
    {
      channel,
      payload
    },
    null,
    2
  );
  const recordsJsonString = recordsRaw
    ? typeof recordsRaw === 'string'
      ? recordsRaw
      : JSON.stringify(recordsRaw, null, 2)
    : '';
  const rowsState = buildRowsState(recordsJsonString, payload);

  return withTitleActorClasses({
    id: payload.EventIdentifier || `${channel}-${Date.now()}`,
    channel,
    eventType: 'api',
    eventStreamType: 'api',
    eventBadgeUrl,
    policyOutcome: policyMeta.policyOutcome,
    policyId: policyMeta.policyId,
    policyName: policyMeta.policyName,
    policyDisplay: policyMeta.policyPillText,
    policyPillText: policyMeta.policyPillText,
    policyTitle: policyMeta.policyTitle,
    policyClass: policyMeta.policyClass,
    policyBadgeUrl: policyMeta.policyBadgeUrl,
    policyPillClass: policyMeta.policyPillClass,
    policyPillDisplayClass: policyMeta.policyPillClass,
    policyFullName: policyMeta.policyFullName,
    policyShortName: policyMeta.policyShortName,
    showFullPolicyName: false,
    policySeverityClass: policyMeta.policySeverityClass,
    who: payload.Username || payload.UserId || '',
    reportName: null,
    op: opLabel,
    query: querySnippet,
    fullQuery,
    rowsProcessed: payload.RowsProcessed,
    rowsReturned: payload.RowsReturned,
    sourceIp: payload.SourceIp,
    rows,
    records,
    recordsRaw,
    isLarge: rows != null && rows >= 1000,
    entitiesShort:
      entitiesList.length > 3
        ? `${entitiesList.slice(0, 3).join(', ')} (+${entitiesList.length - 3} more)`
        : entitiesList.join(', '),
    client: clientLabel,
    fields: fieldList,
    fieldsAll: fieldList,
    fieldsVisible: apiFieldsVisible,
    fieldsMore: apiFieldsMore,
    fieldsVisibleCount,
    fieldsTotal: fieldList.length,
    objects: entitiesList,
    objectsVisible: objectsVisibleApi,
    objectsMore: objectsMoreApi,
    showQuery: false,
    showRecords: false,
    rawJson,
    copyJsonIconUrl: COPY_JSON_ICON_NORMAL,
    showJson: false,
    jsonPillClass: jsonPillClass(false),
    jsonBaseClass,
    jsonClass: expandableClass(jsonBaseClass, false),
    recordsBaseClass,
    recordsClass: expandableClass(recordsBaseClass, false),
    queryBaseClass,
    queryClass: expandableClass(queryBaseClass, false),
    recordsLabel: records ? `Records: ${records}` : null,
    recordsCount: records || null,
    recordsJsonString,
    allRows: rowsState.allRows,
    totalRowCount: rowsState.totalRowCount,
    visibleRowCount: rowsState.visibleRowCount,
    visibleRows: rowsState.visibleRows,
    remainingRowCount: rowsState.remainingRowCount,
    showRows: true,
    hasRows: rowsState.hasRows,
    cardClass,
    operation: opLabel,
    operationLabel: opLabel,
    rawTimestamp,
    rawTimestampValue: timestampMeta.rawTimestampValue,
    datetime: timestampMeta.datetime,
    dateDisplay: timestampMeta.dateDisplay,
    timeDisplay: timestampMeta.timeDisplay,
    hasQuery: !!fullQuery,
    isReport: false,
    isApi: true,
    hasExpandedView: false,
    titleEmphasis: 'none',
    actorEmphasis: 'ip'
  });
}


function formatTimestampParts(rawTimestamp, mode) {
  if (!rawTimestamp) {
    return { datetimeLabel: '', dateDisplay: '', timeDisplay: '' };
  }
  const d = new Date(rawTimestamp);
  if (Number.isNaN(d.getTime())) {
    const fallback = formatIso(rawTimestamp);
    const { date, time } = splitDateTime(fallback);
    return { datetimeLabel: fallback, dateDisplay: date, timeDisplay: time };
  }

  const pad = (num) => String(num).padStart(2, '0');

  const formatShortDate = (year, month, day) => {
    const yy = String(year).slice(-2);
    return `${pad(month)}/${pad(day)}/${yy}`;
  };

  if (mode === 'utc') {
    const yyyy = d.getUTCFullYear();
    const mm = pad(d.getUTCMonth() + 1);
    const dd = pad(d.getUTCDate());
    const hh = pad(d.getUTCHours());
    const min = pad(d.getUTCMinutes());
    const ss = pad(d.getUTCSeconds());
    const dateDisplay = formatShortDate(yyyy, mm, dd);
    const timeDisplay = `${hh}:${min}:${ss}`;
    return { datetimeLabel: `${dateDisplay} ${timeDisplay}`, dateDisplay, timeDisplay };
  }

  const dateDisplay = d.toLocaleDateString(undefined, {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit'
  });
  const timeDisplay = d.toLocaleTimeString(undefined, {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  return { datetimeLabel: `${dateDisplay} ${timeDisplay}`, dateDisplay, timeDisplay };
}

function paginate(cards) {
  const src = cards || [];
  const pages = [];
  for (let i = 0; i < src.length; i += PAGE_SIZE) {
    pages.push(src.slice(i, i + PAGE_SIZE));
  }
  return pages;
}

function pageAt(pages, index) {
  if (!pages.length) {
    return [];
  }
  const idx = Math.min(index, pages.length - 1);
  return pages[idx];
}

export default class RtStreamMini extends NavigationMixin(LightningElement) {
  @track reportCards = [];
  @track apiCards = [];
  @track counts = { report: 0, api: 0 };
  @track lastPayloadJson = null;
  @track tspPolicies = [];
  reportPageIndex = 0;
  apiPageIndex = 0;
  mixedPageIndex = 0;
  tspPageIndex = 0;
  policyMap = {};
  timeMode = 'local';
  viewMode = 'default'; // compact | default | verbose (plumbing only for now)
  laneMode = 'separate'; // separate | mixed
  themeMode = 'dark'; // dark | light
  showTspPanel = true;

  get buildTag() {
    return streamMiniBuildTag;
  }

  get fieldBadgeUrl() {
    return FIELD_BADGE_URL;
  }

  get objectBadgeUrl() {
    return OBJECT_BADGE_URL;
  }

  get rowsProcessedBadgeUrl() {
    return ROWS_BADGE_URL;
  }

  get headerReportBadgeUrl() {
    return HEADER_REPORT_BADGE_URL;
  }

  get headerApiBadgeUrl() {
    return HEADER_API_BADGE_URL;
  }

  get headerBlockedBadgeUrl() {
    return BLOCKED_BADGE_URL;
  }

  get headerNotifiedBadgeUrl() {
    return NOTIFIED_BADGE_URL;
  }

  get headerAllowedBadgeUrl() {
    return ALLOWED_BADGE_URL;
  }

  get tspSortedPolicies() {
    const list = this.tspPolicies || [];
    const weight = (type) => {
      if (type === 'API') return 0;
      if (type === 'REPORT') return 1;
      return 2;
    };
    return [...list].sort((a, b) => {
      const aW = weight(a.eventType);
      const bW = weight(b.eventType);
      if (aW !== bW) return aW - bW;
      return (a.name || '').localeCompare(b.name || '');
    });
  }

  get tspTotalPages() {
    const total = this.tspSortedPolicies.length;
    return Math.max(1, Math.ceil(total / TSP_POLICIES_PER_PAGE));
  }

  get tspColumns() {
    const start = this.tspPageIndex * TSP_POLICIES_PER_PAGE;
    const page = this.tspSortedPolicies.slice(start, start + TSP_POLICIES_PER_PAGE);
    const cols = [];
    for (let i = 0; i < page.length; i += TSP_COLUMN_SIZE) {
      const rows = page.slice(i, i + TSP_COLUMN_SIZE);
      const firstId = rows[0] && rows[0].id ? rows[0].id : `${this.tspPageIndex}-${i}`;
      cols.push({ key: `${this.tspPageIndex}-${firstId}`, rows });
    }
    return cols;
  }

  get hasTspPaging() {
    return this.tspTotalPages > 1;
  }

  get tspPageIndicator() {
    return `${this.tspPageIndex + 1} / ${this.tspTotalPages}`;
  }

  get isFirstTspPage() {
    return this.tspPageIndex <= 0;
  }

  get isLastTspPage() {
    return this.tspPageIndex >= this.tspTotalPages - 1;
  }

  isSecondRow(index) {
    return index === 1;
  }

  isThirdRow(index) {
    return index === 2;
  }

  get reportEventCount() {
    return this.counts.report || 0;
  }

  get apiEventCount() {
    return this.counts.api || 0;
  }

  get hasAnyEvents() {
    const reportTotal = (this.reportCards && this.reportCards.length) || 0;
    const apiTotal = (this.apiCards && this.apiCards.length) || 0;
    return reportTotal + apiTotal > 0;
  }

  get isSeparateMode() {
    return this.laneMode === 'separate';
  }

  get isMixedMode() {
    return this.laneMode === 'mixed';
  }

  get rootClass() {
    return `stream-mini-root rtm-root ${this.themeMode === 'light' ? 'rtm-theme--light' : 'rtm-theme--dark'}`;
  }

  get separateLaneButtonClass() {
    return `rtm-lane-toggle-pill${this.isSeparateMode ? ' rtm-lane-toggle-pill--active' : ''}`;
  }

  get mixedLaneButtonClass() {
    return `rtm-lane-toggle-pill${this.isMixedMode ? ' rtm-lane-toggle-pill--active' : ''}`;
  }

  get themeToggleLabel() {
    return this.themeMode === 'dark' ? 'Light' : 'Dark';
  }

  findCardById(id) {
    if (!id) return null;
    const all = [...(this.reportCards || []), ...(this.apiCards || [])];
    return all.find((c) => c.id === id) || null;
  }

  async connectedCallback() {
    this.restorePreferences();
    this.restoreTspPanelPreference();
    CHANNELS.forEach((channel) => {
      subscribe(channel, -1, (message) => this.handleMessage(channel, message));
    });

    try {
      const rows = await getPolicies();
      const map = {};
      (rows || []).forEach((r) => {
        const label = r.masterLabel || r.developerName || r.id;
        map[r.id] = label;
      });
      this.policyMap = map;
    } catch (e) {
      // silently ignore policy resolver errors
    }
    this.loadTspPolicies();
  }

  restorePreferences() {
    try {
      const storedTimeMode =
        typeof window !== 'undefined' &&
        window.localStorage &&
        window.localStorage.getItem(TIME_MODE_STORAGE_KEY);
      if (storedTimeMode === 'local' || storedTimeMode === 'utc') {
        this.timeMode = storedTimeMode;
      }
    } catch (e) {
      this.timeMode = 'local';
    }

    try {
      const storedViewMode =
        typeof window !== 'undefined' &&
        window.localStorage &&
        window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (storedViewMode === 'compact' || storedViewMode === 'default' || storedViewMode === 'verbose') {
        this.viewMode = storedViewMode;
      }
    } catch (e) {
      this.viewMode = 'default';
    }

    try {
      const storedLaneMode =
        typeof window !== 'undefined' &&
        window.localStorage &&
        window.localStorage.getItem(LANE_MODE_STORAGE_KEY);
      if (storedLaneMode === 'separate' || storedLaneMode === 'mixed') {
        this.laneMode = storedLaneMode;
      } else {
        this.laneMode = 'separate';
      }
    } catch (e) {
      this.laneMode = 'separate';
    }

    try {
      const storedThemeMode =
        typeof window !== 'undefined' &&
        window.localStorage &&
        window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
      if (storedThemeMode === 'dark' || storedThemeMode === 'light') {
        this.themeMode = storedThemeMode;
      } else {
        this.themeMode = 'dark';
      }
    } catch (e) {
      this.themeMode = 'dark';
    }

    this.persistViewMode();
  }

  restoreTspPanelPreference() {
    try {
      const stored =
        typeof window !== 'undefined' &&
        window.localStorage &&
        window.localStorage.getItem(TSP_PANEL_STORAGE_KEY);
      if (stored === 'true') {
        this.showTspPanel = true;
      } else if (stored === 'false') {
        this.showTspPanel = false;
      } else {
        this.showTspPanel = true;
      }
    } catch (e) {
      this.showTspPanel = true;
    }
  }

  applyTimeMode(cards) {
    return (cards || []).map((c) => {
      const rawTimestamp = c.rawTimestamp || c.when || '';
      const { datetimeLabel, dateDisplay, timeDisplay } = formatTimestampParts(rawTimestamp, this.timeMode);
      return {
        ...c,
        datetime: datetimeLabel,
        dateDisplay,
        timeDisplay,
        rawTimestamp,
        rawTimestampValue: timestampValue(rawTimestamp)
      };
    });
  }

  handleTimeModeChange(event) {
    const mode = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.mode : null;
    if (mode !== 'local' && mode !== 'utc') {
      return;
    }
    this.timeMode = mode;
    this.reportCards = this.applyTimeMode(this.reportCards);
    this.apiCards = this.applyTimeMode(this.apiCards);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TIME_MODE_STORAGE_KEY, mode);
      }
    } catch (e) {
      // ignore storage errors
    }
  }

  persistViewMode() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, this.viewMode);
      }
    } catch (e) {
      // ignore storage errors
    }
  }

  handleLaneModeChange(event) {
    const mode = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.mode : null;
    if (mode !== 'separate' && mode !== 'mixed') {
      return;
    }
    this.laneMode = mode;
    if (mode === 'mixed') {
      this.mixedPageIndex = 0;
    } else {
      this.reportPageIndex = 0;
      this.apiPageIndex = 0;
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LANE_MODE_STORAGE_KEY, mode);
      }
    } catch (e) {
      // ignore storage errors
    }
  }

  handleThemeModeToggle() {
    this.themeMode = this.themeMode === 'dark' ? 'light' : 'dark';
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(THEME_MODE_STORAGE_KEY, this.themeMode);
      }
    } catch (e) {
      // ignore storage errors
    }
  }

  get localTimeButtonClass() {
    return `rtm-time-toggle-pill${this.timeMode === 'local' ? ' rtm-time-toggle-pill--active' : ''}`;
  }

  get utcTimeButtonClass() {
    return `rtm-time-toggle-pill${this.timeMode === 'utc' ? ' rtm-time-toggle-pill--active' : ''}`;
  }

  handleMessage(channel, message) {
    try {
      const payload = (message && message.data && message.data.payload) || {};
      const isReport = channel === '/event/ReportEventStream';
      const card = isReport
        ? buildReportCard(payload, this.policyMap, this.timeMode)
        : buildApiCard(payload, this.policyMap, this.timeMode);

      if (isReport) {
        const next = [card, ...(this.reportCards || [])].slice(0, MAX_CARDS);
        this.reportCards = next;
        this.counts = { ...this.counts, report: this.counts.report + 1 };
        this.reportPageIndex = 0;
      } else {
        const next = [card, ...(this.apiCards || [])].slice(0, MAX_CARDS);
        this.apiCards = next;
        this.counts = { ...this.counts, api: this.counts.api + 1 };
        this.apiPageIndex = 0;
      }

      this.mixedPageIndex = 0;
      this.updateTspFiredCounts();

      const debugPayload = { channel, payload };
      this.lastPayloadJson = JSON.stringify(debugPayload, null, 2);
    } catch (e) {
      // swallow errors to avoid breaking the stream
    }
  }

  get mixedCards() {
    const all = [...(this.reportCards || []), ...(this.apiCards || [])];
    return all.sort((a, b) => {
      const diff = (b.rawTimestampValue || 0) - (a.rawTimestampValue || 0);
      if (diff !== 0) return diff;
      const bId = b.id || '';
      const aId = a.id || '';
      return bId.localeCompare(aId);
    });
  }

  get reportPages() {
    return paginate(this.reportCards);
  }

  get apiPages() {
    return paginate(this.apiCards);
  }

  get mixedPages() {
    return paginate(this.mixedCards);
  }

  get currentReportPage() {
    return pageAt(this.reportPages, this.reportPageIndex);
  }

  get currentApiPage() {
    return pageAt(this.apiPages, this.apiPageIndex);
  }

  get currentMixedPage() {
    return pageAt(this.mixedPages, this.mixedPageIndex);
  }

  get hasReportPrev() {
    return this.reportPageIndex > 0;
  }

  get hasReportNext() {
    return this.reportPageIndex < this.reportPages.length - 1;
  }

  get hasApiPrev() {
    return this.apiPageIndex > 0;
  }

  get hasApiNext() {
    return this.apiPageIndex < this.apiPages.length - 1;
  }

  get hasMixedPrev() {
    return this.mixedPageIndex > 0;
  }

  get hasMixedNext() {
    return this.mixedPageIndex < this.mixedPages.length - 1;
  }

  get reportPrevDisabled() {
    return !this.hasReportPrev;
  }

  get reportNextDisabled() {
    return !this.hasReportNext;
  }

  get apiPrevDisabled() {
    return !this.hasApiPrev;
  }

  get apiNextDisabled() {
    return !this.hasApiNext;
  }

  get mixedPrevDisabled() {
    return !this.hasMixedPrev;
  }

  get mixedNextDisabled() {
    return !this.hasMixedNext;
  }

  get reportPageIndexDisplay() {
    const total = this.reportPages.length || 1;
    return `${this.reportPageIndex + 1}/${total}`;
  }

  get apiPageIndexDisplay() {
    const total = this.apiPages.length || 1;
    return `${this.apiPageIndex + 1}/${total}`;
  }

  get mixedPageIndexDisplay() {
    const total = this.mixedPages.length || 1;
    return `${this.mixedPageIndex + 1}/${total}`;
  }

  get laneGroups() {
    if (this.isMixedMode) {
      return [
        {
          key: 'mixed',
          cards: this.currentMixedPage,
          pageDisplay: this.mixedPageIndexDisplay,
          prevDisabled: this.mixedPrevDisabled,
          nextDisabled: this.mixedNextDisabled,
          emptyMessage: 'No events yet.',
          label: null
        }
      ];
    }

    return [
      {
        key: 'api',
        cards: this.currentApiPage,
        pageDisplay: this.apiPageIndexDisplay,
        prevDisabled: this.apiPrevDisabled,
        nextDisabled: this.apiNextDisabled,
        emptyMessage: 'No API events yet.',
        label: this.isSeparateMode ? 'API Events' : null
      },
      {
        key: 'report',
        cards: this.currentReportPage,
        pageDisplay: this.reportPageIndexDisplay,
        prevDisabled: this.reportPrevDisabled,
        nextDisabled: this.reportNextDisabled,
        emptyMessage: 'No report events yet.',
        label: this.isSeparateMode ? 'Report Events' : null
      }
    ];
  }

  handleLanePrev(event) {
    const lane = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.lane : null;
    if (lane === 'report' && this.hasReportPrev) {
      this.reportPageIndex -= 1;
    } else if (lane === 'api' && this.hasApiPrev) {
      this.apiPageIndex -= 1;
    } else if (lane === 'mixed' && this.hasMixedPrev) {
      this.mixedPageIndex -= 1;
    }
  }

  handleLaneNext(event) {
    const lane = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.lane : null;
    if (lane === 'report' && this.hasReportNext) {
      this.reportPageIndex += 1;
    } else if (lane === 'api' && this.hasApiNext) {
      this.apiPageIndex += 1;
    } else if (lane === 'mixed' && this.hasMixedNext) {
      this.mixedPageIndex += 1;
    }
  }

  mutateCardsById(id, mutator) {
    const apply = (arr) => (arr || []).map((c) => (c.id === id ? mutator(c) : c));
    this.reportCards = apply(this.reportCards);
    this.apiCards = apply(this.apiCards);
  }

  resetCardViewState(card) {
    if (!card) return card;
    const fieldsTotal = card.fieldsTotal || (card.fieldsAll ? card.fieldsAll.length : 0);
    const fieldsVisibleCount = Math.min(INITIAL_FIELDS_VISIBLE, fieldsTotal);
    const fieldsVisible = (card.fieldsAll || []).slice(0, fieldsVisibleCount);
    const fieldsMore = Math.max(fieldsTotal - fieldsVisibleCount, 0);

    const totalRows = card.totalRowCount || (card.allRows ? card.allRows.length : 0);
    const visibleRowCount = Math.min(INITIAL_ROWS_VISIBLE, totalRows);
    const remainingRowCount = Math.max(totalRows - visibleRowCount, 0);
    const visibleRows = decorateVisibleRows((card.allRows || []).slice(0, visibleRowCount), remainingRowCount);
    const visibleRowPairs = chunkRowsIntoPairs(visibleRows);

    const queryBase = card.queryBaseClass || 'row query-expanded expandable';
    const jsonBase = card.jsonBaseClass || 'row api-json-expanded expandable';
    const basePolicyClass = card.policyPillClass || '';

    const updated = {
      ...card,
      fieldsVisibleCount,
      fieldsVisible,
      fieldsMore,
      showRows: true,
      hasRows: totalRows > 0,
      visibleRowCount,
      visibleRows,
      visibleRowPairs,
      remainingRowCount,
      showQuery: false,
      queryClass: expandableClass(queryBase, false),
      showJson: false,
      jsonClass: expandableClass(jsonBase, false),
      copyJsonIconUrl: COPY_JSON_ICON_NORMAL,
      jsonPillClass: jsonPillClass(false),
      showFullPolicyName: false,
      policyPillDisplayClass: basePolicyClass,
      titleEmphasis: 'none',
      actorEmphasis: 'ip'
    };
    const withClasses = withTitleActorClasses(updated);
    return { ...withClasses, hasExpandedView: this.computeHasExpanded(withClasses) };
  }

  computeHasExpanded(card) {
    if (!card) {
      return false;
    }
    const totalFields = card.fieldsTotal || (card.fieldsAll ? card.fieldsAll.length : 0);
    const visibleFields = card.fieldsVisibleCount || (card.fieldsVisible ? card.fieldsVisible.length : 0);
    const hasFieldExpansion = totalFields > 0 && visibleFields > Math.min(INITIAL_FIELDS_VISIBLE, totalFields);

    const totalRows = card.totalRowCount || (card.allRows ? card.allRows.length : 0);
    const visibleRows = card.visibleRowCount || (card.visibleRows ? card.visibleRows.length : 0);
    const initialRowsVisible = Math.min(INITIAL_ROWS_VISIBLE, totalRows);
    const hasRowExpansion = totalRows > 0 && visibleRows > initialRowsVisible;
    const hasQueryOpen = !!card.showQuery;
    const hasRawJsonOpen = !!card.showJson;
    const hasPolicyExpanded = !!card.showFullPolicyName;

    return (
      hasFieldExpansion ||
      hasRowExpansion ||
      hasQueryOpen ||
      hasRawJsonOpen ||
      hasPolicyExpanded
    );
  }

  get hasAnyExpandedCards() {
    const cards = [...(this.reportCards || []), ...(this.apiCards || [])];
    return cards.some((card) => card && card.hasExpandedView);
  }

  handleShowMoreFields(event) {
    const id = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.id : null;
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    if (!id) return;
    this.mutateCardsById(id, (c) => {
      if (!c.fieldsAll || !c.fieldsAll.length) return c;
      const increment = 6;
      const newVisibleCount = Math.min((c.fieldsVisibleCount || 0) + increment, c.fieldsTotal || c.fieldsAll.length);
      const visible = c.fieldsAll.slice(0, newVisibleCount);
      const remaining = Math.max((c.fieldsTotal || c.fieldsAll.length) - newVisibleCount, 0);
      const updated = {
        ...c,
        fieldsVisibleCount: newVisibleCount,
        fieldsVisible: visible,
        fieldsMore: remaining
      };
      return { ...updated, hasExpandedView: this.computeHasExpanded(updated) };
    });
  }

  handleShowMoreRows(event) {
    const id = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.id : null;
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    if (!id) return;
    this.mutateCardsById(id, (c) => {
      if (!c.allRows || !c.allRows.length) return c;
      const total = c.totalRowCount || c.allRows.length;
      const current = c.visibleRowCount || 0;
      if (current >= total) return c;
      const newCount = Math.min(current + ROWS_INCREMENT, total);
      const remainingRowCount = Math.max(total - newCount, 0);
      const visibleRows = decorateVisibleRows(c.allRows.slice(0, newCount), remainingRowCount);
      const visibleRowPairs = chunkRowsIntoPairs(visibleRows);
      const updated = {
        ...c,
        visibleRowCount: newCount,
        visibleRows,
        visibleRowPairs,
        remainingRowCount
      };
      return { ...updated, hasExpandedView: this.computeHasExpanded(updated) };
    });
  }

  handleShowRowsStart(event) {
    const id = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.id : null;
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    if (!id) return;
    this.mutateCardsById(id, (c) => {
      if (!c.allRows || !c.allRows.length) return c;
      const total = c.totalRowCount || c.allRows.length;
      const current = c.visibleRowCount || 0;
      if (current >= total) return c;
      const newCount = Math.min(current + ROWS_INCREMENT, total);
      const remainingRowCount = Math.max(total - newCount, 0);
      const visibleRows = decorateVisibleRows(c.allRows.slice(0, newCount), remainingRowCount);
      const visibleRowPairs = chunkRowsIntoPairs(visibleRows);
      const updated = {
        ...c,
        visibleRowCount: newCount,
        visibleRows,
        visibleRowPairs,
        remainingRowCount
      };
      return { ...updated, hasExpandedView: this.computeHasExpanded(updated) };
    });
  }

  handleResetCardView(event) {
    const id = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.id : null;
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    if (!id) return;
    this.mutateCardsById(id, (c) => this.resetCardViewState(c));
  }

  handleResetAllCards(event) {
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    const resetArray = (arr) => (arr || []).map((c) => this.resetCardViewState(c));
    this.reportCards = resetArray(this.reportCards);
    this.apiCards = resetArray(this.apiCards);
  }

  handleClearEvents() {
    this.reportCards = [];
    this.apiCards = [];
    this.counts = { report: 0, api: 0 };
    this.reportPageIndex = 0;
    this.apiPageIndex = 0;
    this.mixedPageIndex = 0;
    this.updateTspFiredCounts();
  }

  handleCopyQuery(event) {
    const id = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.id : null;
    if (!id) return;
    const card = this.findCardById(id);
    if (card && card.fullQuery) {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(card.fullQuery).catch(() => {});
      }
    }
  }

  handleToggleQuery(event) {
    const id = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.id : null;
    if (!id) return;
    const card = this.findCardById(id);
    if (!card || !card.hasQuery) {
      return;
    }
    this.mutateCardsById(id, (c) => {
      const showQuery = !c.showQuery;
      const base = c.queryBaseClass || 'row query-expanded expandable';
      const updated = {
        ...c,
        showQuery,
        queryClass: expandableClass(base, showQuery)
      };
      return { ...updated, hasExpandedView: this.computeHasExpanded(updated) };
    });
  }

  handleToggleFullJson(event) {
    const id = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.id : null;
    if (!id) return;

    this.mutateCardsById(id, (c) => {
      const showJson = !c.showJson;
      const base = c.jsonBaseClass || 'row api-json-expanded expandable';
      const updated = {
        ...c,
        showJson,
        jsonClass: expandableClass(base, showJson),
        jsonPillClass: jsonPillClass(showJson)
      };
      return { ...updated, hasExpandedView: this.computeHasExpanded(updated) };
    });
  }

  handleTogglePolicyName(event) {
    const id = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.id : null;
    if (!id) return;
    this.mutateCardsById(id, (c) => {
      const showFullPolicyName = !c.showFullPolicyName;
      const displayClass = `${c.policyPillClass || ''}${showFullPolicyName ? ' pill-policy-name--expanded' : ''}`.trim();
      const updated = { ...c, showFullPolicyName, policyPillDisplayClass: displayClass };
      return { ...updated, hasExpandedView: this.computeHasExpanded(updated) };
    });
  }

  handleToggleReportTitle(event) {
    const id = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.id : null;
    if (!id) return;
    this.mutateCardsById(id, (c) => {
      const nextEmphasis = c.titleEmphasis === 'report' ? 'none' : 'report';
      const updated = withTitleActorClasses({ ...c, titleEmphasis: nextEmphasis });
      return { ...updated, hasExpandedView: this.computeHasExpanded(updated) };
    });
  }

  handleToggleOperationTitle(event) {
    const id = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.id : null;
    if (!id) return;
    this.mutateCardsById(id, (c) => {
      const nextEmphasis = c.titleEmphasis === 'operation' ? 'none' : 'operation';
      const updated = withTitleActorClasses({ ...c, titleEmphasis: nextEmphasis });
      return { ...updated, hasExpandedView: this.computeHasExpanded(updated) };
    });
  }

  handleToggleUserActor(event) {
    const id = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.id : null;
    if (!id) return;
    this.mutateCardsById(id, (c) => {
      const nextEmphasis = c.actorEmphasis === 'user' ? 'ip' : 'user';
      const updated = withTitleActorClasses({ ...c, actorEmphasis: nextEmphasis });
      return { ...updated, hasExpandedView: this.computeHasExpanded(updated) };
    });
  }

  handleToggleIpActor(event) {
    const id = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.id : null;
    if (!id) return;
    this.mutateCardsById(id, (c) => {
      const updated = withTitleActorClasses({ ...c, actorEmphasis: 'ip' });
      return { ...updated, hasExpandedView: this.computeHasExpanded(updated) };
    });
  }

  handleCopyFullJson(event) {
    const id = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.id : null;
    if (!id) return;
    const card = this.findCardById(id);
    if (!card || !card.rawJson) return;
    const copyText = card.rawJson;
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(copyText)
        .then(() => {
          this.mutateCardsById(id, (c) => ({ ...c, copyJsonIconUrl: COPY_JSON_ICON_COPIED }));
          setTimeout(() => {
            this.mutateCardsById(id, (c) => ({ ...c, copyJsonIconUrl: COPY_JSON_ICON_NORMAL }));
          }, 1200);
        })
        .catch(() => {});
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = copyText;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      this.mutateCardsById(id, (c) => ({ ...c, copyJsonIconUrl: COPY_JSON_ICON_COPIED }));
      setTimeout(() => {
        this.mutateCardsById(id, (c) => ({ ...c, copyJsonIconUrl: COPY_JSON_ICON_NORMAL }));
      }, 1200);
    } catch (e) {
      // ignore
    }
    document.body.removeChild(textarea);
  }

  handleCopyJsonMouseEnter(event) {
    const id = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.id : null;
    if (!id) return;
    this.mutateCardsById(id, (c) => {
      const nextIcon = c.copyJsonIconUrl === COPY_JSON_ICON_COPIED ? COPY_JSON_ICON_COPIED : COPY_JSON_ICON_HOVER;
      return { ...c, copyJsonIconUrl: nextIcon };
    });
  }

  handleCopyJsonMouseLeave(event) {
    const id = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.id : null;
    if (!id) return;
    this.mutateCardsById(id, (c) => {
      const nextIcon = c.copyJsonIconUrl === COPY_JSON_ICON_COPIED ? COPY_JSON_ICON_COPIED : COPY_JSON_ICON_NORMAL;
      return { ...c, copyJsonIconUrl: nextIcon };
    });
  }

  handleNavigateToRow(event) {
    const cardId = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.cardId : null;
    const recordId = event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.recordId : null;
    const sobjectType =
      event.currentTarget && event.currentTarget.dataset ? event.currentTarget.dataset.sobjectType : null;
    if (!cardId || !recordId) return;
    const attributes = {
      recordId,
      actionName: 'view',
      objectApiName: sobjectType || undefined
    };
    this[NavigationMixin.GenerateUrl]({
      type: 'standard__recordPage',
      attributes
    })
      .then((url) => {
        if (url) {
          window.open(url, '_blank');
        }
      })
      .catch(() => {
        this[NavigationMixin.Navigate]({
          type: 'standard__recordPage',
          attributes
        });
      });
  }

  handleToggleTspPanel() {
    this.showTspPanel = !this.showTspPanel;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TSP_PANEL_STORAGE_KEY, this.showTspPanel ? 'true' : 'false');
      }
    } catch (e) {
      // ignore storage issues
    }
    if (this.showTspPanel && (!this.tspPolicies || !this.tspPolicies.length)) {
      this.loadTspPolicies();
    }
  }

  decorateTspRow(row) {
    if (!row) return row;
    const isApi = row.eventType === 'API';
    const isReport = row.eventType === 'REPORT';
    const typeIconUrl = isApi ? HEADER_API_BADGE_URL : isReport ? HEADER_REPORT_BADGE_URL : null;
    const typeLabel = isApi ? 'API' : isReport ? 'Report' : '';
    const toggleTitle = row.isActive
      ? 'Click to disable this policy'
      : 'Click to enable this policy';
    const eventBadgeUrl = row.isActive
      ? isApi
        ? TSP_API_BADGE_URL
        : isReport
          ? TSP_REPORT_BADGE_URL
          : null
      : isApi
        ? TSP_API_BADGE_URL_GRAY
        : isReport
          ? TSP_REPORT_BADGE_URL_GRAY
          : null;
    return {
      ...row,
      firedCount: row.firedCount || 0,
      isApi,
      isReport,
      typeIconUrl,
      typeLabel,
      eventBadgeUrl,
      nameClass: `rtm-tsp-name${row.isActive ? '' : ' rtm-tsp-name--disabled'}`,
      errorKey: row.id ? `${row.id}-error` : `error-${Math.random()}`,
      toggleTitle,
      buttonClass: `rtm-tsp-toggle-btn ${
        row.isActive ? 'rtm-tsp-toggle-btn--enabled' : 'rtm-tsp-toggle-btn--disabled'
      }`
    };
  }

  loadTspPolicies() {
    getTspPolicies()
      .then((data) => {
        this.tspPolicies = (data || []).map((row) =>
          this.decorateTspRow({
            id: row.id,
            name: row.name,
            eventType: row.eventType,
            isActive: row.isActive,
            firedCount: 0,
            isBusy: false,
            error: null
          })
        );
        this.tspPageIndex = 0;
        this.updateTspFiredCounts();
      })
      .catch(() => {
        this.tspPolicies = [];
      });
  }

  updateTspFiredCounts() {
    if (!this.tspPolicies || !this.tspPolicies.length) return;
    const counts = {};
    const allCards = [...(this.reportCards || []), ...(this.apiCards || [])];
    allCards.forEach((card) => {
      if (!card.policyId || !card.policyOutcome) return;
      counts[card.policyId] = (counts[card.policyId] || 0) + 1;
    });
    this.tspPolicies = this.tspPolicies.map((p) =>
      this.decorateTspRow({ ...p, firedCount: counts[p.id] || 0 })
    );
    this.clampTspPage();
  }

  clampTspPage() {
    const max = Math.max(0, this.tspTotalPages - 1);
    if (this.tspPageIndex > max) {
      this.tspPageIndex = max;
    }
    if (this.tspPageIndex < 0) {
      this.tspPageIndex = 0;
    }
  }

  handleTspPagePrev() {
    if (this.isFirstTspPage) return;
    this.tspPageIndex = Math.max(0, this.tspPageIndex - 1);
  }

  handleTspPageNext() {
    if (this.isLastTspPage) return;
    this.tspPageIndex = Math.min(this.tspTotalPages - 1, this.tspPageIndex + 1);
  }

  handleToggleTspActive(event) {
    const id = event.currentTarget.dataset.id;
    if (!id || !this.tspPolicies || !this.tspPolicies.length) return;
    const idx = this.tspPolicies.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const row = this.tspPolicies[idx];
    if (row.isBusy) return;

    const targetState = !row.isActive;
    const pendingRow = this.decorateTspRow({ ...row, isBusy: true, error: null });
    this.tspPolicies = [
      ...this.tspPolicies.slice(0, idx),
      pendingRow,
      ...this.tspPolicies.slice(idx + 1)
    ];

    togglePolicy({ policyId: id, enable: targetState })
      .then((updated) => {
        const nextRow = this.decorateTspRow({
          ...row,
          isActive: updated.isActive,
          isBusy: false,
          error: null
        });
        this.tspPolicies = [
          ...this.tspPolicies.slice(0, idx),
          nextRow,
          ...this.tspPolicies.slice(idx + 1)
        ];
      })
      .catch(() => {
        const errorRow = this.decorateTspRow({
          ...row,
          isBusy: false,
          error: 'Use Setup to change this policy.'
        });
        this.tspPolicies = [
          ...this.tspPolicies.slice(0, idx),
          errorRow,
          ...this.tspPolicies.slice(idx + 1)
        ];
      });
  }
}