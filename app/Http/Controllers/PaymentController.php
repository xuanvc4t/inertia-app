<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    protected string $privateKey = "bef4c565db3971c5d843ef93c7f6b1f5";

    public function mac()
    {
        $appId = "3260297689777236195";
        $orderId = "898747342143410028151532046_1777952485438";
        $privateKey = $this->privateKey;
        $data = "appId=${appId}&orderId=${orderId}&privateKey=${privateKey}";

        $mac = hash_hmac("sha256", $data, $this->privateKey);
        return response()->json([
            "mac" => $mac,
        ]);
    }
    public function order(Request $request)
    {
        $validated = $request->validate([
            'amount' => ['required', 'integer', 'min:1000'],
            'desc' => ['required', 'string', 'max:255'],
            'storeName' => ['nullable', 'string', 'max:100'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required'],
            'items.*.amount' => ['required', 'integer', 'min:0'],
            'method' => ['required', 'array'], // <- nhận từ selectPaymentMethod(data)
        ]);
        $myTransactionId = 'BANK_' . now()->format('YmdHis') . Str::upper(Str::random(4));
        $params = [
            'amount' => (int) $validated['amount'],
            'desc' => $validated['desc'],
            'extradata' => json_encode([
                'storeName' => $validated['storeName'] ?? 'Store',
                'myTransactionId' => $myTransactionId,
            ], JSON_UNESCAPED_UNICODE),
            'item' => json_encode($validated['items'], JSON_UNESCAPED_UNICODE),
            // method lấy trực tiếp từ client, encode thành string JSON
            'method' => json_encode($validated['method'], JSON_UNESCAPED_UNICODE),
        ];
        $mac = $this->buildMac($params);
        return response()->json([
            'mac' => $mac,
            'params' => $params,
        ]);
    }

    private function buildMac(array $params): string
    {
        // 1. Sắp xếp key theo thứ tự từ điển (tăng dần)
        ksort($params);

        $queryParts = [];
        foreach ($params as $key => $value) {
            $queryParts[] = $key . '=' . $value;
        }

        // 2. Nối các phần tử bằng dấu &
        $data = implode('&', $queryParts);

        Log::info('Log data Mac: ' . $data);

        // 3. Tạo mã HMAC SHA256
        return hash_hmac('sha256', $data, $this->privateKey);
    }

    public function callback(Request $request)
    {
        $data = $request->all();
        Log::info('callback: '. json_encode($data, true));

        $zaloMac = $data['mac'] ?? '';

        $params = $data;
        unset($params['mac']);
        ksort($params);

        $dataMacParts = [];
        foreach ($params as $key => $value) {
            $dataMacParts[] = $key . "=" . (is_null($value) ? "" : $value);
        }
        $dataMacString = implode("&", $dataMacParts);

        // Tạo mã MAC
        $myMac = hash_hmac("sha256", $dataMacString, $this->privateKey);

        // 4. So sánh
        if ($zaloMac === $myMac) {
            if (isset($data['status']) && $data['status'] == 1) {
                Log::info("Thanh toán thành công cho đơn: " . ($data['orderId'] ?? 'N/A'));
                // Xử lý cập nhật DB tại đây
            }

            // Trả về cho Zalo biết đã nhận dữ liệu thành công
            return response()->json(["return_code" => 1, "return_message" => "success"]);
        } else {
            Log::error("Sai chữ ký MAC từ Zalo Callback");
            return response()->json(["return_code" => -1, "return_message" => "mac invalid"], 400);
        }
    }

    public function showNotify(Request $request)
    {
        $allData = $request->all();
        Log::info('Data Notify: '. json_encode($allData, true));

        $data = $allData['data'] ?? [];
        $receivedMac = $allData['mac'] ?? '';

        $appId   = $data['appId'] ?? '';
        $orderId = $data['orderId'] ?? '';
        $method  = $data['method'] ?? '';

        // Thứ tự: appId -> orderId -> method
        $rawContent = "appId=" . $appId . "&orderId=" . $orderId . "&method=" . $method;

        $privateKey = $this->privateKey;
        $computedMac = hash_hmac("sha256", $rawContent, $privateKey);

        // So sánh mã MAC tính toán được với mã MAC Zalo gửi sang
        if ($computedMac === $receivedMac) {
            // --- XÁC THỰC THÀNH CÔNG ---
            Log::info("Xác thực Notify thành công cho đơn hàng: " . $orderId);

            // Thực hiện cập nhật DB tại đây...

            return response()->json([
                "returnCode" => 1,
                "returnMessage" => "Success"
            ]);
        } else {
            // --- XÁC THỰC THẤT BẠI ---
            Log::error("Xác thực Notify thất bại!");
            Log::error("Chuỗi data dùng để hash: " . $rawContent);
            Log::error("MAC tính toán: " . $computedMac);
            Log::error("MAC từ Zalo: " . $receivedMac);

            return response()->json([
                "returnCode" => -1,
                "returnMessage" => "Invalid MAC"
            ], 400);
        }
    }
}
