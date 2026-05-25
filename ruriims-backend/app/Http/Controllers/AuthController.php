<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $candidate = User::withTrashed()->where('email', $request->email)->first();
        if ($candidate && $candidate->deleted_at) {
            return response()->json(['message' => 'This account has been deactivated.'], 403);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $request->session()->regenerate();

        return response()->json(['user' => Auth::user()]);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out']);
    }

    public function user(Request $request)
    {
        return response()->json(['user' => $request->user()]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password'              => 'required|string',
            'new_password'                  => 'required|string|min:8|confirmed',
            'new_password_confirmation'     => 'required|string',
        ]);

        if (!Hash::check($request->current_password, $request->user()->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $request->user()->update(['password' => $request->new_password]);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    public function changePin(Request $request)
    {
        $request->validate([
            'current_pin' => 'required|digits:6',
            'new_pin'     => 'required|digits:6',
        ]);

        if (!Hash::check($request->current_pin, $request->user()->pin)) {
            return response()->json(['message' => 'Current PIN is incorrect.'], 422);
        }

        $user = $request->user();
        $user->pin = Hash::make($request->new_pin);
        $user->save();

        return response()->json(['message' => 'PIN updated successfully.']);
    }
}
