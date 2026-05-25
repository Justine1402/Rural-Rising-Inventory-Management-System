<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        abort_if($request->user()->role !== 'admin', 403);

        $users = User::withTrashed()->with('warehouse')->get()->map(fn ($u) => [
            'id'              => $u->id,
            'name'            => $u->name,
            'email'           => $u->email,
            'role'            => $u->role,
            'warehouse_id'    => $u->warehouse_id,
            'warehouse'       => $u->warehouse?->name,
            'position_title'  => $u->position_title,
            'deleted_at'      => $u->deleted_at?->toISOString(),
            'created_at'      => $u->created_at?->toISOString(),
        ]);

        return response()->json(['users' => $users]);
    }

    public function store(Request $request)
    {
        abort_if($request->user()->role !== 'admin', 403);

        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'email'          => 'required|email|unique:users,email',
            'password'       => 'required|string|min:8',
            'role'           => 'required|in:admin,manager',
            'warehouse_id'   => [
                'nullable',
                'exists:warehouses,id',
                'required_if:role,manager',
                function ($attribute, $value, $fail) {
                    if ($value && Warehouse::find($value)?->is_temporary) {
                        $fail('Managers cannot be assigned to temporary warehouses.');
                    }
                },
            ],
            'position_title' => 'nullable|string|max:255',
            'pin'            => 'required|digits:6',
        ]);

        $user = User::create([
            'name'           => $validated['name'],
            'email'          => $validated['email'],
            'password'       => $validated['password'],
            'role'           => $validated['role'],
            'warehouse_id'   => $validated['warehouse_id'] ?? null,
            'position_title' => $validated['position_title'] ?? null,
            'pin'            => Hash::make($validated['pin']),
        ]);

        $user->load('warehouse');

        return response()->json(['user' => [
            'id'             => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'role'           => $user->role,
            'warehouse_id'   => $user->warehouse_id,
            'warehouse'      => $user->warehouse?->name,
            'position_title' => $user->position_title,
            'deleted_at'     => null,
            'created_at'     => $user->created_at?->toISOString(),
        ]], 201);
    }

    public function show(Request $request, User $user)
    {
        abort_if($request->user()->role !== 'admin', 403);

        $user->load('warehouse');

        return response()->json(['user' => [
            'id'             => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'role'           => $user->role,
            'warehouse_id'   => $user->warehouse_id,
            'warehouse'      => $user->warehouse?->name,
            'position_title' => $user->position_title,
            'deleted_at'     => $user->deleted_at?->toISOString(),
            'created_at'     => $user->created_at?->toISOString(),
        ]]);
    }

    public function update(Request $request, User $user)
    {
        abort_if($request->user()->role !== 'admin', 403);

        if ($user->id === $request->user()->id && $request->input('role') !== 'admin') {
            return response()->json(['message' => 'Admins cannot demote their own account.'], 422);
        }

        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'email'          => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'role'           => 'required|in:admin,manager',
            'warehouse_id'   => [
                'nullable',
                'exists:warehouses,id',
                'required_if:role,manager',
                function ($attribute, $value, $fail) {
                    if ($value && Warehouse::find($value)?->is_temporary) {
                        $fail('Managers cannot be assigned to temporary warehouses.');
                    }
                },
            ],
            'position_title' => 'nullable|string|max:255',
        ]);

        $user->update([
            'name'           => $validated['name'],
            'email'          => $validated['email'],
            'role'           => $validated['role'],
            'warehouse_id'   => $validated['warehouse_id'] ?? null,
            'position_title' => $validated['position_title'] ?? null,
        ]);

        $user->load('warehouse');

        return response()->json(['user' => [
            'id'             => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'role'           => $user->role,
            'warehouse_id'   => $user->warehouse_id,
            'warehouse'      => $user->warehouse?->name,
            'position_title' => $user->position_title,
            'deleted_at'     => $user->deleted_at?->toISOString(),
            'created_at'     => $user->created_at?->toISOString(),
        ]]);
    }

    public function destroy(Request $request, User $user)
    {
        abort_if($request->user()->role !== 'admin', 403);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Admins cannot delete their own account.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User deactivated successfully.']);
    }

    public function restore(Request $request, User $user)
    {
        abort_if($request->user()->role !== 'admin', 403);

        $user->restore();
        $user->load('warehouse');

        return response()->json([
            'user' => [
                'id'             => $user->id,
                'name'           => $user->name,
                'email'          => $user->email,
                'role'           => $user->role,
                'warehouse_id'   => $user->warehouse_id,
                'warehouse'      => $user->warehouse?->name,
                'position_title' => $user->position_title,
                'deleted_at'     => null,
                'created_at'     => $user->created_at?->toISOString(),
            ],
            'message' => 'User reactivated successfully.',
        ]);
    }

    public function resetPassword(Request $request, User $user)
    {
        abort_if($request->user()->role !== 'admin', 403);

        $validated = $request->validate([
            'password' => 'required|string|min:8',
        ]);

        $user->password = $validated['password'];
        $user->save();

        return response()->json(['message' => 'Password reset successfully.']);
    }

    public function resetPin(Request $request, User $user)
    {
        abort_if($request->user()->role !== 'admin', 403);

        $validated = $request->validate([
            'pin' => 'required|digits:6',
        ]);

        $user->pin = Hash::make($validated['pin']);
        $user->save();

        return response()->json(['message' => 'PIN reset successfully.']);
    }
}
