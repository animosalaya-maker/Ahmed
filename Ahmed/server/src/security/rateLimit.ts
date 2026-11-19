/** Token bucket: allows short bursts but caps the average message rate per connection. */
export class TokenBucket {
  private tokens: number;
  private last: number;
  constructor(private readonly ratePerSec: number, private readonly burst: number, now = Date.now()) {
    this.tokens = burst;
    this.last = now;
  }
  take(now = Date.now()): boolean {
    this.tokens = Math.min(this.burst, this.tokens + ((now - this.last) / 1000) * this.ratePerSec);
    this.last = now;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}

/** Counts open connections per IP address. */
export class ConnectionCounter {
  private readonly counts = new Map<string, number>();
  constructor(private readonly max: number) {}
  tryAdd(ip: string): boolean {
    const n = this.counts.get(ip) ?? 0;
    if (n >= this.max) return false;
    this.counts.set(ip, n + 1);
    return true;
  }
  remove(ip: string): void {
    const n = (this.counts.get(ip) ?? 1) - 1;
    if (n <= 0) this.counts.delete(ip);
    else this.counts.set(ip, n);
  }
}
