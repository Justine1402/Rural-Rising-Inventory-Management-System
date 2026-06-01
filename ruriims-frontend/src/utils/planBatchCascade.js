import { EPSILON } from './reconciliationFormat';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Mirror of backend PlansBatchCascade::planBatchCascade.
 * Given a list of non-zero batches and a selected batch + quantity, returns
 * an ordered list of { id, code, harvestDate, quantityDeducted }.
 * Returns null if total available across batches is less than requested.
 *
 * Both this function and the backend trait must produce identical plans for
 * identical inputs. If you change the algorithm here, change it there too.
 */
export function planBatchCascade(batches, selectedBatchId, requestedQty) {
  const nonZero = batches.filter((b) => b.quantity > 0);
  const selected = nonZero.find((b) => b.id === selectedBatchId);

  if (!selected) return null;

  const totalAvailable = nonZero.reduce((sum, b) => sum + b.quantity, 0);

  if (totalAvailable < requestedQty - EPSILON) return null;

  if (selected.quantity >= requestedQty) {
    return [{ id: selected.id, code: selected.code, harvestDate: selected.harvest_date, quantityDeducted: requestedQty }];
  }

  const plan = [];
  let remaining = requestedQty;

  if (selected.quantity > 0) {
    plan.push({ id: selected.id, code: selected.code, harvestDate: selected.harvest_date, quantityDeducted: selected.quantity });
    remaining -= selected.quantity;
  }

  const selectedMs = new Date(selected.harvest_date).getTime();

  const others = nonZero
    .filter((b) => b.id !== selectedBatchId)
    .slice()
    .sort((a, b) => {
      const diffA = Math.round(Math.abs(new Date(a.harvest_date).getTime() - selectedMs) / MS_PER_DAY);
      const diffB = Math.round(Math.abs(new Date(b.harvest_date).getTime() - selectedMs) / MS_PER_DAY);
      if (diffA !== diffB) return diffA - diffB;
      // Older first (FIFO) for ties
      return new Date(a.harvest_date).getTime() - new Date(b.harvest_date).getTime();
    });

  for (const batch of others) {
    if (remaining <= EPSILON) break;
    const take = Math.min(remaining, batch.quantity);
    plan.push({ id: batch.id, code: batch.code, harvestDate: batch.harvest_date, quantityDeducted: take });
    remaining -= take;
  }

  if (remaining > EPSILON) return null;

  return plan;
}
