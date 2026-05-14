import { AppElementsWire } from "./app-elements.js";
import type { TraverseDirection } from "./navigation-planner.js";

const VINEXT_PREVIOUS_NEXT_URL_HISTORY_STATE_KEY = "__vinext_previousNextUrl";
const VINEXT_HISTORY_INDEX_HISTORY_STATE_KEY = "__vinext_historyIndex";
const VINEXT_BFCACHE_IDS_HISTORY_STATE_KEY = "__vinext_bfcacheIds";

type HistoryStateRecord = {
  [key: string]: unknown;
};

export type BfcacheIdMap = Readonly<Record<string, string>>;

export type HistoryTraversalIntent = {
  direction: TraverseDirection;
  historyState: unknown;
  targetHistoryIndex: number | null;
};

function cloneHistoryState(state: unknown): HistoryStateRecord {
  if (!state || typeof state !== "object") {
    return {};
  }

  const nextState: HistoryStateRecord = {};
  for (const [key, value] of Object.entries(state)) {
    nextState[key] = value;
  }
  return nextState;
}

export function createHistoryStateWithPreviousNextUrl(
  state: unknown,
  previousNextUrl: string | null,
  bfcacheIds?: BfcacheIdMap | null,
): HistoryStateRecord | null {
  return createHistoryStateWithNavigationMetadata(state, { bfcacheIds, previousNextUrl });
}

export function createHistoryStateWithNavigationMetadata(
  state: unknown,
  metadata: {
    bfcacheIds?: BfcacheIdMap | null;
    previousNextUrl: string | null;
    traversalIndex?: number | null;
  },
): HistoryStateRecord | null {
  const nextState = cloneHistoryState(state);

  if (metadata.previousNextUrl === null) {
    delete nextState[VINEXT_PREVIOUS_NEXT_URL_HISTORY_STATE_KEY];
  } else {
    nextState[VINEXT_PREVIOUS_NEXT_URL_HISTORY_STATE_KEY] = metadata.previousNextUrl;
  }

  if (metadata.traversalIndex !== undefined) {
    if (isValidHistoryTraversalIndex(metadata.traversalIndex)) {
      nextState[VINEXT_HISTORY_INDEX_HISTORY_STATE_KEY] = metadata.traversalIndex;
    } else {
      delete nextState[VINEXT_HISTORY_INDEX_HISTORY_STATE_KEY];
    }
  }

  if (metadata.bfcacheIds !== undefined) {
    if (metadata.bfcacheIds === null || Object.keys(metadata.bfcacheIds).length === 0) {
      delete nextState[VINEXT_BFCACHE_IDS_HISTORY_STATE_KEY];
    } else {
      nextState[VINEXT_BFCACHE_IDS_HISTORY_STATE_KEY] = { ...metadata.bfcacheIds };
    }
  }

  return Object.keys(nextState).length > 0 ? nextState : null;
}

export function createExternalHistoryStatePreservingMetadata(
  callerState: unknown,
  currentHistoryState: unknown,
): unknown {
  const previousNextUrl = readHistoryStatePreviousNextUrl(currentHistoryState);
  const traversalIndex = readHistoryStateTraversalIndex(currentHistoryState);
  const bfcacheIds = readHistoryStateBfcacheIds(currentHistoryState);

  if (previousNextUrl === null && traversalIndex === null && bfcacheIds === null) {
    return callerState;
  }

  return createHistoryStateWithNavigationMetadata(callerState, {
    bfcacheIds,
    previousNextUrl,
    traversalIndex,
  });
}

export function readHistoryStatePreviousNextUrl(state: unknown): string | null {
  const value = cloneHistoryState(state)[VINEXT_PREVIOUS_NEXT_URL_HISTORY_STATE_KEY];
  return typeof value === "string" ? value : null;
}

function isBfcacheSegmentId(id: string): boolean {
  const parsed = AppElementsWire.parseElementKey(id);
  return (
    parsed?.kind === "layout" ||
    parsed?.kind === "page" ||
    parsed?.kind === "slot" ||
    parsed?.kind === "template"
  );
}

export function readHistoryStateBfcacheIds(state: unknown): BfcacheIdMap | null {
  const value = cloneHistoryState(state)[VINEXT_BFCACHE_IDS_HISTORY_STATE_KEY];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const ids: Record<string, string> = {};
  for (const [key, id] of Object.entries(value)) {
    if (!isBfcacheSegmentId(key) || typeof id !== "string") {
      return null;
    }
    ids[key] = id;
  }
  return ids;
}

function isValidHistoryTraversalIndex(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function readHistoryStateTraversalIndex(state: unknown): number | null {
  const value = cloneHistoryState(state)[VINEXT_HISTORY_INDEX_HISTORY_STATE_KEY];
  return isValidHistoryTraversalIndex(value) ? value : null;
}

export function resolveHistoryTraversalIntent(options: {
  currentHistoryIndex: number | null;
  historyState: unknown;
}): HistoryTraversalIntent {
  const targetHistoryIndex = readHistoryStateTraversalIndex(options.historyState);
  let direction: TraverseDirection = "unknown";

  if (options.currentHistoryIndex !== null && targetHistoryIndex !== null) {
    if (targetHistoryIndex < options.currentHistoryIndex) {
      direction = "back";
    } else if (targetHistoryIndex > options.currentHistoryIndex) {
      direction = "forward";
    }
  }

  return {
    direction,
    historyState: options.historyState,
    targetHistoryIndex,
  };
}
