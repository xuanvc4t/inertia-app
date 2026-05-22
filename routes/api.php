<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/face/nonce', [\App\Http\Controllers\FaceAuthenController::class, 'nonce']);
Route::post('/face/verify', [\App\Http\Controllers\FaceAuthenController::class, 'verify']);

Route::get('/mac', [\App\Http\Controllers\PaymentController::class, 'mac']);
Route::post('/zalo/callback', [\App\Http\Controllers\PaymentController::class, 'callback']);

Route::post('/order', [\App\Http\Controllers\PaymentController::class, 'order']);
Route::post('/zalo/show-notify', [\App\Http\Controllers\PaymentController::class, 'showNotify']);
