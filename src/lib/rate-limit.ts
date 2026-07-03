const MAX_TRACKED_KEYS = 2000;

type FailureBucket = {
  count: number;
  windowStartedAt: number;
};

const failureBuckets = new Map<string, FailureBucket>();

function pruneExpired(windowMs: number) {
  const now = Date.now();
  for (const [key, bucket] of failureBuckets) {
    if (now - bucket.windowStartedAt > windowMs) {
      failureBuckets.delete(key);
    }
  }
  if (failureBuckets.size > MAX_TRACKED_KEYS) {
    const overflow = failureBuckets.size - MAX_TRACKED_KEYS;
    let removed = 0;
    for (const key of failureBuckets.keys()) {
      failureBuckets.delete(key);
      removed += 1;
      if (removed >= overflow) break;
    }
  }
}

/** True when `key` has already accumulated `limit` failures inside the window. */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const bucket = failureBuckets.get(key);
  if (!bucket) return false;
  if (Date.now() - bucket.windowStartedAt > windowMs) {
    failureBuckets.delete(key);
    return false;
  }
  return bucket.count >= limit;
}

export function registerFailure(key: string, windowMs: number): void {
  pruneExpired(windowMs);
  const now = Date.now();
  const bucket = failureBuckets.get(key);
  if (!bucket || now - bucket.windowStartedAt > windowMs) {
    failureBuckets.set(key, { count: 1, windowStartedAt: now });
    return;
  }
  failureBuckets.set(key, { ...bucket, count: bucket.count + 1 });
}

export function clearFailures(key: string): void {
  failureBuckets.delete(key);
}

/** Resolve the client IP behind the reverse proxy, mirroring /go/[slug]. */
export function clientIpFrom(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headerList.get("x-real-ip") ?? headerList.get("cf-connecting-ip") ?? "unknown";
}
