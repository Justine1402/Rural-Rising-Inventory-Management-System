<?php

namespace App\Traits;

trait GeneratesTransactionCode
{
    /**
     * Generate a per-warehouse-scoped transaction code inside the caller's DB::transaction.
     *
     * The caller is responsible for wrapping this in DB::transaction with lockForUpdate
     * already in scope — this method issues its own lockForUpdate on the count query.
     *
     * @param  string  $prefix          e.g. 'RO', 'TRF', 'ISS'
     * @param  int     $warehouseId
     * @param  string  $warehousePrefix e.g. 'QC', 'ALA', 'MAN'
     * @param  string  $modelClass      e.g. ReceiveOrder::class
     * @param  string  $codeColumn      code column name (unused in count strategy, kept for API completeness)
     * @param  string  $warehouseColumn the column that scopes sequences per warehouse
     */
    protected function generateTransactionCode(
        string $prefix,
        int $warehouseId,
        string $warehousePrefix,
        string $modelClass,
        string $codeColumn = 'code',
        string $warehouseColumn = 'warehouse_id'
    ): string {
        $seq = $modelClass::where($warehouseColumn, $warehouseId)
            ->lockForUpdate()
            ->count() + 1;

        return $prefix . '-' . $warehousePrefix . '-000-' . str_pad($seq, 3, '0', STR_PAD_LEFT);
    }
}
