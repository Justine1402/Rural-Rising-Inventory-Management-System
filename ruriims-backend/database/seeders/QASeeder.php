<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\StockInUse;
use App\Models\Warehouse;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class QASeeder extends Seeder
{
    public function run(): void
    {
        $today = Carbon::today();

        $warehouses = Warehouse::where('is_temporary', false)->get()->keyBy('code');
        $admin      = User::where('role', 'admin')->first();

        // ── Products ──────────────────────────────────────────────────────────
        // [name, category, unit, shelf_life]
        $productDefs = [
            // Fruits (5)
            ['Carabao Mango',      'Fruits',          'kg',  14],
            ['Saba Banana',        'Fruits',          'kg',   7],
            ['Papaya',             'Fruits',          'kg',  10],
            ['Pineapple',          'Fruits',          'pcs', 14],
            ['Watermelon',         'Fruits',          'kg',  10],
            // Vegetables (5)
            ['Eggplant',           'Vegetables',      'kg',   7],
            ['Tomato',             'Vegetables',      'kg',   7],
            ['Cabbage',            'Vegetables',      'kg',  14],
            ['Water Spinach',      'Vegetables',      'kg',   5],
            ['Bitter Gourd',       'Vegetables',      'kg',   7],
            // Poultry (4)
            ['Whole Chicken',      'Poultry',         'pcs',  5],
            ['Chicken Breast',     'Poultry',         'kg',   5],
            ['Chicken Egg',        'Poultry',         'pcs', 21],
            ['Duck Egg',           'Poultry',         'pcs', 21],
            // Herbs & Spices (4)
            ['Ginger',             'Herbs & Spices',  'kg',  30],
            ['Garlic',             'Herbs & Spices',  'kg',  60],
            ['Lemongrass',         'Herbs & Spices',  'kg',   7],
            ['Turmeric',           'Herbs & Spices',  'g',   30],
            // Processed Goods (3)
            ['Virgin Coconut Oil', 'Processed Goods', 'pcs', 365],
            ['Banana Chips',       'Processed Goods', 'pcs',  90],
            ['Salted Egg',         'Processed Goods', 'pcs',  30],
        ];

        $products = [];
        foreach ($productDefs as $i => [$name, $category, $unit, $shelfLife]) {
            $seq          = str_pad($i + 1, 3, '0', STR_PAD_LEFT);
            $products[$i + 1] = Product::create([
                'sku_code'   => "SKU-{$seq}",
                'name'       => $name,
                'category'   => $category,
                'unit'       => $unit,
                'shelf_life' => $shelfLife,
                'created_by' => $admin->id,
            ]);
        }

        // ── Stock batches ─────────────────────────────────────────────────────
        // [product_seq, warehouse_code, quantity, harvest_days_ago]
        // Note: entries where days_ago > shelf_life produce EXPIRED batches
        $stockDefs = [
            // Carabao Mango (shelf 14d)
            [1, 'QC',  180,  3],
            [1, 'QC',  120,  9],
            [1, 'ALA', 100,  5],
            [1, 'ALA',  60, 11],   // near expiry — 3d left
            [1, 'MAN',  80,  2],

            // Saba Banana (shelf 7d)
            [2, 'QC',  250,  2],
            [2, 'QC',  150,  5],
            [2, 'QC',   40,  8],   // EXPIRED — 1d past
            [2, 'ALA', 180,  3],
            [2, 'MAN', 100,  6],   // near expiry — 1d left

            // Papaya (shelf 10d)
            [3, 'QC',  110,  4],
            [3, 'QC',   75,  8],   // near expiry — 2d left
            [3, 'ALA',  90,  3],
            [3, 'MAN',  60,  7],

            // Pineapple (shelf 14d)
            [4, 'QC',  400,  2],
            [4, 'QC',  250, 10],
            [4, 'ALA', 300,  4],
            [4, 'MAN', 150,  6],

            // Watermelon (shelf 10d)
            [5, 'QC',   90,  1],
            [5, 'QC',   60,  7],   // near expiry — 3d left
            [5, 'ALA', 110,  4],
            [5, 'MAN',  50,  9],   // near expiry — 1d left

            // Eggplant (shelf 7d)
            [6, 'QC',  220,  1],
            [6, 'QC',  160,  4],
            [6, 'ALA', 140,  2],
            [6, 'ALA',  50,  8],   // EXPIRED — 1d past
            [6, 'MAN', 100,  3],

            // Tomato (shelf 7d)
            [7, 'QC',  280,  2],
            [7, 'QC',  120,  6],   // near expiry — 1d left
            [7, 'ALA', 130,  3],
            [7, 'MAN',  90,  5],

            // Cabbage (shelf 14d)
            [8, 'QC',  500,  3],
            [8, 'QC',  350, 10],
            [8, 'ALA', 220,  6],
            [8, 'MAN', 180, 12],   // near expiry — 2d left

            // Water Spinach (shelf 5d)
            [9, 'QC',   70,  1],
            [9, 'QC',   45,  4],   // near expiry — 1d left
            [9, 'QC',   30,  6],   // EXPIRED — 1d past
            [9, 'ALA',  55,  2],
            [9, 'MAN',  40,  3],

            // Bitter Gourd (shelf 7d)
            [10, 'QC',  130,  2],
            [10, 'QC',   80,  5],
            [10, 'ALA',  90,  3],
            [10, 'MAN',  65,  6],  // near expiry — 1d left

            // Whole Chicken (shelf 5d)
            [11, 'QC',   60,  1],
            [11, 'QC',   30,  4],  // near expiry — 1d left
            [11, 'QC',   15,  6],  // EXPIRED — 1d past
            [11, 'ALA',  45,  2],
            [11, 'MAN',  25,  3],

            // Chicken Breast (shelf 5d)
            [12, 'QC',   80,  1],
            [12, 'QC',   50,  3],
            [12, 'ALA',  60,  2],
            [12, 'MAN',  35,  4],  // near expiry — 1d left

            // Chicken Egg (shelf 21d)
            [13, 'QC',  1200,  4],
            [13, 'QC',   600, 14],
            [13, 'ALA',  900,  7],
            [13, 'MAN',  700, 18],

            // Duck Egg (shelf 21d)
            [14, 'QC',  450,  6],
            [14, 'QC',  200, 15],
            [14, 'ALA', 320, 10],
            [14, 'MAN', 200, 19],

            // Ginger (shelf 30d)
            [15, 'QC',  170,  8],
            [15, 'QC',  110, 22],
            [15, 'ALA', 130, 14],
            [15, 'MAN',  90, 28],  // near expiry — 2d left

            // Garlic (shelf 60d)
            [16, 'QC',  220, 10],
            [16, 'QC',  160, 35],
            [16, 'ALA', 190, 20],
            [16, 'MAN', 130, 50],

            // Lemongrass (shelf 7d)
            [17, 'QC',   65,  1],
            [17, 'QC',   40,  5],
            [17, 'ALA',  55,  2],
            [17, 'MAN',  30,  6],  // near expiry — 1d left

            // Turmeric (shelf 30d)
            [18, 'QC',  6000,  5],
            [18, 'QC',  3500, 18],
            [18, 'ALA', 4500, 10],
            [18, 'MAN', 2500, 25],

            // Virgin Coconut Oil (shelf 365d)
            [19, 'QC',  240,  30],
            [19, 'QC',  180,  90],
            [19, 'ALA', 200,  60],
            [19, 'MAN', 120, 120],

            // Banana Chips (shelf 90d)
            [20, 'QC',  350, 10],
            [20, 'QC',  200, 40],
            [20, 'ALA', 280, 20],
            [20, 'MAN', 160, 55],

            // Salted Egg (shelf 30d)
            [21, 'QC',  160,  4],
            [21, 'QC',  100, 16],
            [21, 'ALA', 130,  8],
            [21, 'MAN',  85, 22],
        ];

        $batchSeqs = [];

        foreach ($stockDefs as [$pSeq, $whCode, $qty, $daysAgo]) {
            $product   = $products[$pSeq];
            $warehouse = $warehouses[$whCode];

            $key = "{$pSeq}_{$whCode}";
            $batchSeqs[$key] = ($batchSeqs[$key] ?? 0) + 1;

            $skuSeq   = str_pad($pSeq, 3, '0', STR_PAD_LEFT);
            $batchSeq = str_pad($batchSeqs[$key], 3, '0', STR_PAD_LEFT);

            StockInUse::create([
                'code'         => "SKU-{$whCode}-{$skuSeq}-{$batchSeq}",
                'product_id'   => $product->id,
                'warehouse_id' => $warehouse->id,
                'quantity'     => $qty,
                'harvest_date' => $today->copy()->subDays($daysAgo)->toDateString(),
            ]);
        }

        $pCount = Product::count();
        $sCount = StockInUse::count();

        $this->command->info("✓ {$pCount} products created (SKU-001 → SKU-021)");
        $this->command->info("✓ {$sCount} stock batches across QC / ALA / MAN");
        $this->command->info('');
        $this->command->info('Category breakdown:');
        $this->command->info('  Fruits          → 5 products (SKU-001 – SKU-005)');
        $this->command->info('  Vegetables      → 5 products (SKU-006 – SKU-010)');
        $this->command->info('  Poultry         → 4 products (SKU-011 – SKU-014)');
        $this->command->info('  Herbs & Spices  → 4 products (SKU-015 – SKU-018)');
        $this->command->info('  Processed Goods → 3 products (SKU-019 – SKU-021)');
        $this->command->info('');
        $this->command->info('EXPIRED batches (red highlight in product detail):');
        $this->command->info('  SKU-QC-002-003  — Saba Banana (harvested 8d ago, shelf 7d)');
        $this->command->info('  SKU-ALA-006-002 — Eggplant     (harvested 8d ago, shelf 7d)');
        $this->command->info('  SKU-QC-009-003  — Water Spinach (harvested 6d ago, shelf 5d)');
        $this->command->info('  SKU-QC-011-003  — Whole Chicken (harvested 6d ago, shelf 5d)');
    }
}
