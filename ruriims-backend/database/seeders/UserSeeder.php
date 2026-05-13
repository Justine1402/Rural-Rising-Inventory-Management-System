<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        Warehouse::firstOrCreate(['code' => 'QC'],  ['name' => 'Quezon City Warehouse']);
        Warehouse::firstOrCreate(['code' => 'ALA'], ['name' => 'Alabang Warehouse']);
        Warehouse::firstOrCreate(['code' => 'MAN'], ['name' => 'Mandaluyong Warehouse']);

        $admin = User::firstOrCreate(
            ['email' => 'admin@ruriims.com'],
            [
                'name'     => 'Admin User',
                'password' => Hash::make('password'),
                'role'     => 'admin',
                'pin'      => Hash::make('123456'),
            ]
        );
        $admin->update(['role' => 'admin', 'pin' => Hash::make('123456')]);

        $manager = User::firstOrCreate(
            ['email' => 'manager@ruriims.com'],
            [
                'name'     => 'Manager User',
                'password' => Hash::make('password'),
                'role'     => 'manager',
                'pin'      => Hash::make('123456'),
            ]
        );
        $manager->update(['role' => 'manager', 'pin' => Hash::make('123456')]);
    }
}
