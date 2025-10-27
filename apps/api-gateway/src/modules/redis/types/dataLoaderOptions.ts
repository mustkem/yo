import DataLoader from 'dataloader'

export interface RedisDataLoaderOptions<K, V> extends DataLoader.Options<K, V> {
  prefix: string
  returnType?: any
}
