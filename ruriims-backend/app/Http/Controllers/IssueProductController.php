<?php

namespace App\Http\Controllers;

use App\Models\IssueProduct;
use App\Models\IssueProductItem;
use App\Models\StockInUse;
use App\Models\Warehouse;
use App\Traits\GeneratesTransactionCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class IssueProductController extends Controller
{
    use GeneratesTransactionCode;

    public function index()
    {
        $issues = IssueProduct::with(['warehouse', 'issuedBy'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($ip) => [
                'id'          => $ip->id,
                'code'        => $ip->code,
                'warehouse'   => $ip->warehouse->name,
                'issue_type'  => $ip->issue_type,
                'date_issued' => $ip->date_issued->format('M d, Y'),
                'issued_by'   => $ip->issuedBy->name,
            ]);

        return response()->json(['issues' => $issues]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'warehouse_id'            => 'required|exists:warehouses,id',
            'issue_type'              => 'required|in:sale,internal_use',
            'date_issued'             => 'required|date',
            'pin'                     => 'required|string|size:6',
            'items'                   => 'required|array|min:1',
            'items.*.product_id'      => 'required|integer|exists:products,id',
            'items.*.stock_in_use_id' => 'required|integer|exists:stock_in_use_codes,id',
            'items.*.quantity_issued' => 'required|numeric|min:0.001',
            'items.*.harvest_date'    => 'nullable|date',
            'items.*.note'            => 'nullable|string',
        ]);

        $user = $request->user();
        if (!$user->pin || !Hash::check($request->pin, $user->pin)) {
            return response()->json(['message' => 'Incorrect PIN.'], 422);
        }

        $warehouse = Warehouse::findOrFail($request->warehouse_id);

        try {
            $issue = DB::transaction(function () use ($request, $warehouse, $user) {
                $code = $this->generateTransactionCode('ISS', $warehouse->id, $warehouse->code, IssueProduct::class);

                $issue = IssueProduct::create([
                    'code'         => $code,
                    'warehouse_id' => $request->warehouse_id,
                    'issue_type'   => $request->issue_type,
                    'date_issued'  => $request->date_issued,
                    'issued_by'    => $user->id,
                ]);

                foreach ($request->items as $item) {
                    $batch = StockInUse::lockForUpdate()->findOrFail($item['stock_in_use_id']);

                    if ($batch->quantity < $item['quantity_issued']) {
                        throw new \Exception(
                            "Insufficient stock in batch {$batch->code}. Available: {$batch->quantity}."
                        );
                    }

                    IssueProductItem::create([
                        'issue_product_id' => $issue->id,
                        'product_id'       => $item['product_id'],
                        'stock_in_use_id'  => $item['stock_in_use_id'],
                        'quantity_issued'  => $item['quantity_issued'],
                        'harvest_date'     => $item['harvest_date'] ?? null,
                        'note'             => $item['note'] ?? null,
                    ]);

                    $batch->decrement('quantity', $item['quantity_issued']);
                }

                return $issue;
            });
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['issue' => ['code' => $issue->code]], 201);
    }

    public function show(IssueProduct $issueProduct)
    {
        $issueProduct->load(['warehouse', 'issuedBy', 'items.product', 'items.stockInUse']);

        $data = [
            'id'           => $issueProduct->id,
            'code'         => $issueProduct->code,
            'warehouse_id' => $issueProduct->warehouse_id,
            'warehouse'    => $issueProduct->warehouse->name,
            'issue_type'   => $issueProduct->issue_type,
            'date_issued'  => $issueProduct->date_issued->format('M d, Y'),
            'issued_by'    => $issueProduct->issuedBy->name,
            'items'        => $issueProduct->items->map(fn ($i) => [
                'id'               => $i->id,
                'product_id'       => $i->product_id,
                'product_code'     => $i->product->sku_code,
                'product_name'     => $i->product->name,
                'unit'             => $i->product->unit,
                'stock_in_use_id'  => $i->stock_in_use_id,
                'stock_in_use_code' => $i->stockInUse->code,
                'quantity_issued'  => $i->quantity_issued,
                'harvest_date'     => $i->harvest_date?->format('M d, Y'),
                'note'             => $i->note,
            ]),
        ];

        return response()->json(['issue' => $data]);
    }
}
