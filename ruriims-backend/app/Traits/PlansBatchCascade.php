<?php

namespace App\Traits;

use App\Models\StockInUse;

trait PlansBatchCascade
{
    /**
     * Compute a cascade plan: an ordered list of [stock_in_use_id, quantity_deducted] pairs
     * that fulfill the requested quantity starting from the selected batch and cascading
     * to nearest-harvest-date batches with FIFO tiebreak.
     *
     * @return array<int, array{stock_in_use_id: int, quantity_deducted: float}>
     * @throws \RuntimeException if total available across all non-zero batches < requested quantity
     */
    protected function planBatchCascade(
        int $productId,
        int $warehouseId,
        int $selectedStockInUseId,
        float $requestedQuantity
    ): array {
        $nonZeroBatches = StockInUse::where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->where('quantity', '>', 0)
            ->lockForUpdate()
            ->get();

        // Also lock the selected batch (may itself have zero quantity)
        $selected = StockInUse::lockForUpdate()->find($selectedStockInUseId);

        if (!$selected) {
            throw new \RuntimeException("Selected batch (id={$selectedStockInUseId}) not found.");
        }

        $totalAvailable = $nonZeroBatches->sum(fn ($b) => (float) $b->quantity);

        if ($totalAvailable < $requestedQuantity - 0.0005) {
            throw new \RuntimeException(
                "Insufficient stock: requested {$requestedQuantity}, total available {$totalAvailable}."
            );
        }

        if (!$nonZeroBatches->contains('id', $selectedStockInUseId)) {
            // Selected batch may be depleted since this plan was created; fall back to FIFO across remaining batches.
            $plan      = [];
            $remaining = $requestedQuantity;
            foreach ($nonZeroBatches->sortBy('harvest_date')->values() as $batch) {
                if ($remaining <= 0.0005) break;
                $take      = min($remaining, (float) $batch->quantity);
                $plan[]    = ['stock_in_use_id' => $batch->id, 'quantity_deducted' => $take];
                $remaining -= $take;
            }
            if ($remaining > 0.0005) {
                throw new \RuntimeException(
                    "Insufficient stock: requested {$requestedQuantity}, available {$totalAvailable} (shortfall: " . round($remaining, 3) . ")."
                );
            }
            return $plan;
        }

        if ((float) $selected->quantity >= $requestedQuantity) {
            return [['stock_in_use_id' => $selected->id, 'quantity_deducted' => $requestedQuantity]];
        }

        $plan = [];
        $remaining = $requestedQuantity;

        if ((float) $selected->quantity > 0) {
            $plan[]    = ['stock_in_use_id' => $selected->id, 'quantity_deducted' => (float) $selected->quantity];
            $remaining -= (float) $selected->quantity;
        }

        $others = $nonZeroBatches
            ->filter(fn ($b) => $b->id !== $selectedStockInUseId)
            ->sort(function ($a, $b) use ($selected) {
                $diffA = abs((int) $a->harvest_date->diffInDays($selected->harvest_date));
                $diffB = abs((int) $b->harvest_date->diffInDays($selected->harvest_date));
                if ($diffA !== $diffB) {
                    return $diffA <=> $diffB;
                }
                // Older first (FIFO) for ties
                return $a->harvest_date->timestamp <=> $b->harvest_date->timestamp;
            })
            ->values();

        foreach ($others as $batch) {
            if ($remaining <= 0.0005) {
                break;
            }
            $take      = min($remaining, (float) $batch->quantity);
            $plan[]    = ['stock_in_use_id' => $batch->id, 'quantity_deducted' => $take];
            $remaining -= $take;
        }

        if ($remaining > 0.0005) {
            throw new \RuntimeException(
                "Insufficient stock: requested {$requestedQuantity}, available {$totalAvailable} (shortfall: " . round($remaining, 3) . ")."
            );
        }

        return $plan;
    }
}
