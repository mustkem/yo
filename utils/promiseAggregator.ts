/**
 * Aggregate simultaneous calls into a single Promise
 */
export class PromiseAggregator {
  private promises = new Map<string, Promise<any>>()

  /**
   * Aggregate simultaneous calls, with the same key, as a single Promise
   * @param key
   * @param callback
   * @returns
   */
  async execute<T>(key: string, action: () => Promise<T>): Promise<T> {
    const existing = this.promises.get(key)

    if (existing) {
      return existing
    }

    const promise = action()
    this.promises.set(key, promise)

    try {
      return await promise
    } finally {
      this.promises.delete(key)
    }
  }
}
