<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PinController extends Controller
{
    public function verify(Request $request)
    {
        $request->validate(['pin' => 'required|string|size:6']);

        $user = $request->user();

        if (!$user->pin || !Hash::check($request->pin, $user->pin)) {
            return response()->json(['message' => 'Incorrect PIN.'], 422);
        }

        return response()->json(['verified' => true]);
    }
}
