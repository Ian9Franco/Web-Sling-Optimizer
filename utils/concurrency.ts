/**
 * Ejecuta un arreglo de elementos a través de un iterador asíncrono respetando
 * un límite máximo de tareas ejecutadas en concurrencia paralela.
 *
 * @param poolLimit Cantidad máxima de tareas ejecutándose simultáneamente.
 * @param array Arreglo de elementos a procesar.
 * @param iteratorFn Función asíncrona que procesa cada elemento.
 */
export async function asyncPool<T, R>(
  poolLimit: number,
  array: T[],
  iteratorFn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const ret: Promise<R>[] = [];
  const executing = new Set<Promise<void>>();

  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    const p = Promise.resolve().then(() => iteratorFn(item, i));
    ret.push(p);

    if (poolLimit <= array.length) {
      const e: Promise<void> = p.then(() => {
        executing.delete(e);
      });
      executing.add(e);

      if (executing.size >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(ret);
}
