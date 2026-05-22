<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return inertia('Welcome', [
        'appName' => config('app.name'),
    ]);
});

Route::get('/face-authen', [\App\Http\Controllers\FaceAuthenController::class, 'page']);
