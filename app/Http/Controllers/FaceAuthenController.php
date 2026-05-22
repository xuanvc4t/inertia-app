<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class FaceAuthenController extends Controller
{
    private string $domain = 'https://face-id-uat.dta.ai.vn';
    private string $appId = '030095013763';
    private string $appSecret = 'Test123#';

    public function page(Request $request)
    {
        return inertia('FaceAuthen', [
            'callback' => $request->query('callback'),
            'personId' => $request->query('personId', ''),
        ]);
    }

    public function nonce()
    {
        $response = Http::timeout(10)
            ->withHeaders(['Content-Type' => 'application/json'])
            ->get("{$this->domain}/get-nonce");

        if (!$response->successful()) {
            return response()->json(['error' => 'Không thể lấy nonce'], 500);
        }

        $data = $response->json();

        if (empty($data['nonce'])) {
            return response()->json(['error' => $data['errorDetail'] ?? 'Lỗi không xác định'], 400);
        }

        return response()->json([
            'nonce'   => $data['nonce'],
            'transId' => $data['transId'],
        ]);
    }

    public function verify(Request $request)
    {
        $response = Http::timeout(30)
            ->withHeaders(['Content-Type' => 'application/json'])
            ->post("{$this->domain}/face/sdk-liveness-match", [
                'personId'   => $request->personId,
                'transId'    => $request->transId,
                'faceImages' => $request->faceImages,
                'signature'  => $request->signature,
                'nonce'      => $request->nonce,
            ]);

        if (!$response->successful()) {
            return response()->json(['error' => 'Xác thực thất bại'], 500);
        }

        return response()->json($response->json());
    }
}
