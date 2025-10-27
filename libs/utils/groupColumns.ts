import { PlainFlatObject, PlainObject } from 'libs/types/plainObject';

/**
 * Group object properties by field prefix. For example:
 * This is used to group columns of TypeORM raw result by source table.
 * Each group then can be transformed into entity with `plainToClass`
 */
export function groupColumns<T extends PlainObject>(
  source: PlainFlatObject,
): T {
  const result: PlainObject = <T>{};
  for (const [key, value] of Object.entries(source)) {
    const [table, column] = key.split('_');
    const subTable = <PlainFlatObject>(result[table] ?? {});
    subTable[column] = value;
    result[table] = subTable;
  }

  return <T>result;
}
