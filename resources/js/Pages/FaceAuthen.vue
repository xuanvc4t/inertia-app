<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps({
    callback: String,
    personId: String,
})

// 0 = form, 1 = camera/sdk, 2 = result
const screen = ref(0)
const personId = ref(props.personId ?? '')
const loading = ref(false)
const sdkReady = ref(false)
const errorMsg = ref('')
const result = ref(null)
const sdkContainer = ref(null)

let faceSdk = null

// Bypass Vite's static import analysis — files are served from public/
const dynamicImport = new Function('url', 'return import(url)')

const LICENSE_KEY = 'CserWsSztcjbMXLnyhvTpwQCbejxcEMWbXhTgDegGvuJwKqdL1o+NbpnAJ/l4JH+juqTZz/TfJYR6XTcgAF9F3sitZV6w+99kviC/oIgVB2pX+Lb7jzZUspLb/Tnyb1Y3Gpn4RedjXacp6wiSjV2QQEf0Agc0cG4MjbMLySKxfLk063+/Ytq5jcYZOVt4RJN8MSdmF9ZCPVVvm/ovP6HFrgGTBA1TpAMtTSTbFOqQWC6nJIzub/1/3sDYob9/Rq7DHIydwuQ4Q+mnzAKginuUGVUF2s6JViTDjIBP89hMktonNhNYAElRbMv88ynpumU5TqkszKOFEYFD1VpL3jjtoEN+KINGUXoQu/o+r49ZWpuZ+BdXAsu5gAb6JCpSXz+/IlS+VcSbsFUbi1FXIDsoXE3Lj/E4SgpqnwIexEK6y7GULvfXzZH9ixvM2Un1UKvk5R1mxPAOyVXhV+wVmaxAFRek5zN+d/GpcKdHWiQgY1Tr1yUU7RUkfNUQqa6sanGOnwe3LvBJknH3FHSxX9KrUJbD+GVnyjqWK9l3Tc/w+csZC8NWhUya1blbeMLgjc/Me43'

const SDK_CONFIG = {
    detectionTimeoutMs: 90_000,
    fontFamily: 'Arial',
    fontSize: '18px',
    showLoading: true,
    overlayTransparent: true,
    palette: {
        primaryColor: '#4d4dff',
        secondaryColor: '#33cc33',
        textColor: '#ffffff',
        backgroundColor: '#1a1a2e',
    },
    ovalRadiusX: {
        mobile: 80,
        desktop: 150,
    },
    translations: {
        instruction: {
            move_closer: 'Di chuyển gương mặt lại gần camera',
            move_further: 'Di chuyển gương mặt ra xa camera',
            put_in_oval: 'Đưa khuôn mặt vào vùng oval',
            face_detected: 'Phát hiện khuôn mặt',
            watch_camera: 'Vui lòng nhìn thẳng vào camera',
            processing: 'Đang kiểm tra...',
            performing: 'Chúng tôi đang thực hiện...',
            uploading: 'Đang tải lên Facemap 3D mã hóa...',
            look_straight: 'Giữ mặt thẳng, không nghiêng.',
            action: 'Chúng tôi đang thực hiện...',
            put_face_in_oval: 'Đưa khuôn mặt vào khung hình',
            open_eyes: 'Giữ mặt bình thường, mở cả 2 mắt.',
        },
        loading: {
            message: 'Hệ thống đang khởi tạo, vui lòng chờ...',
        },
        error: {
            verify_failed: 'Có lỗi xảy ra, vui lòng thử lại',
            not_support_mobile: 'SDK không hỗ trợ trên thiết bị này',
        },
    },
}

onMounted(async () => {
    loading.value = true
    try {
        globalThis.xqconfig = LICENSE_KEY

        console.log('[SDK] Loading boot.js...')
        const boot = await dynamicImport('/libs/face-sdk/boot.js')
        console.log('[SDK] boot.js loaded, exports:', Object.keys(boot))

        console.log('[SDK] Calling boot.load()...')
        await boot.load()
        console.log('[SDK] boot.load() done')

        console.log('[SDK] Loading index.js...')
        const sdk = await dynamicImport('/libs/face-sdk/index.js')
        console.log('[SDK] index.js loaded, exports:', Object.keys(sdk))

        faceSdk = new sdk.FaceSDK(sdkContainer.value, SDK_CONFIG)
        console.log('[SDK] FaceSDK instance created')
        sdkReady.value = true
    } catch (e) {
        console.error('[SDK] Error:', e)
        errorMsg.value = 'Không thể tải SDK: ' + (e?.message ?? String(e))
    } finally {
        loading.value = false
    }
})

async function startAuth() {
    if (!personId.value.trim()) {
        errorMsg.value = 'Vui lòng nhập số CCCD/CMND'
        return
    }

    errorMsg.value = ''
    loading.value = true

    try {
        const { data: nonceData } = await axios.get('/api/face/nonce')

        const { nonce, transId } = nonceData

        screen.value = 1
        await faceSdk.initialize()

        const detection = await faceSdk.startDetection(nonce)

        if (detection.code !== 1) {
            screen.value = 0
            errorMsg.value = detection.errorMessage ?? 'Xác thực khuôn mặt thất bại'
            return
        }

        const { data: verifyData } = await axios.post('/api/face/verify', {
            personId: personId.value.trim(),
            transId,
            faceImages: detection.faceImages,
            signature: detection.signature,
            nonce,
        })

        if (verifyData.statusCode === 1) {
            result.value = verifyData.data

            if (props.callback) {
                const params = new URLSearchParams({
                    success: '1',
                    transId,
                    data: JSON.stringify(verifyData.data ?? {}),
                })
                window.location.href = `${props.callback}?${params}`
            } else {
                screen.value = 2
            }
        } else {
            screen.value = 0
            errorMsg.value = verifyData.errorDetail ?? 'Xác thực thất bại'
        }
    } catch (e) {
        screen.value = 0
        errorMsg.value = e?.response?.data?.error ?? e?.message ?? 'Đã có lỗi xảy ra'
    } finally {
        loading.value = false
    }
}

function retry() {
    screen.value = 0
    errorMsg.value = ''
    result.value = null
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">

        <!-- Loading overlay -->
        <div v-if="loading && screen !== 1"
            class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl p-6 flex flex-col items-center gap-3 shadow-xl">
                <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p class="text-gray-600 text-sm">Đang xử lý...</p>
            </div>
        </div>

        <!-- Screen 0: Form -->
        <div v-if="screen === 0" class="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
            <div class="flex flex-col items-center mb-6">
                <div class="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                    <svg class="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" stroke-width="1.5"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                </div>
                <h1 class="text-xl font-bold text-gray-800">Xác thực khuôn mặt</h1>
                <p class="text-sm text-gray-500 mt-1 text-center">Nhập số CCCD để bắt đầu xác thực</p>
            </div>

            <div v-if="!sdkReady && !loading" class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p class="text-sm text-yellow-700">SDK chưa sẵn sàng. Vui lòng chờ hoặc tải lại trang.</p>
            </div>

            <div v-if="errorMsg" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-sm text-red-600">{{ errorMsg }}</p>
            </div>

            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Số CCCD / CMND</label>
                <input v-model="personId" type="text" inputmode="numeric"
                    placeholder="Nhập 9 hoặc 12 số"
                    class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>

            <button @click="startAuth" :disabled="!sdkReady || loading"
                class="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed">
                Xác thực ngay
            </button>
        </div>

        <!-- Screen 1: SDK camera -->
        <div v-show="screen === 1" class="w-full max-w-sm">
            <div ref="sdkContainer" class="w-full rounded-2xl overflow-hidden shadow-lg" style="min-height: 480px;" />
        </div>

        <!-- Screen 2: Result (khi không có callback) -->
        <div v-if="screen === 2" class="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 text-center">
            <div class="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" stroke-width="2"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
            </div>
            <h2 class="text-lg font-bold text-gray-800 mb-1">Xác thực thành công</h2>
            <p class="text-sm text-gray-500 mb-4">Khuôn mặt của bạn đã được xác thực</p>

            <pre v-if="result"
                class="text-left text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto max-h-40 mb-4">{{ JSON.stringify(result, null, 2) }}</pre>

            <button @click="retry"
                class="w-full border border-indigo-300 text-indigo-600 font-medium py-2.5 rounded-xl hover:bg-indigo-50 transition">
                Thử lại
            </button>
        </div>

    </div>
</template>
