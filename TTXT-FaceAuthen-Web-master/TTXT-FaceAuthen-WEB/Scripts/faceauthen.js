

angular.module('FaceAuthen', [])
    .config(function ($httpProvider) {
        $httpProvider.defaults.withCredentials = true;
        //rest of route code
    })
    .controller("FaceAuthenCtr", ['$scope', '$rootScope', '$http', '$timeout', function ($scope, $rootScope, $http, $timeout) {
        $scope.init = function () {

            $scope.isMobile = /Mobi|Android/i.test(navigator.userAgent);

            $scope.sdkConfig = {
                detectionTimeoutMs: 90_000, // 90 seconds
                fontFamily: 'Times New Roman',
                fontSize: '28px',
                showLoading: true,
                overlayTransparent: true,
                palette: {
                    primaryColor: '#4d4dff',
                    secondaryColor: '#33cc33',
                    textColor: '#ff4dc4',
                    backgroundColor: '#c0bebe',
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
                        uploading: 'Đang tải lên Facemap 3d mã hóa...',
                        look_straight: 'Giữ mặt thẳng, không nghiêng.',
                        action: 'Chúng tôi đang thực hiện...',
                        put_face_in_oval: 'Đưa khuôn mặt vào khung hình',
                        open_eyes: 'Giữ mặt bình thường, mở cả 2 mắt.',
                    },
                    loading: {
                        message: 'Hệ thống đang được khởi tạo, vui lòng chờ trong giây lát...',
                    },
                    error: {
                        verify_failed: 'Có vẻ như đã xảy ra lỗi, chúng tôi không thể quét gương mặt của bạn, Vui lòng thử lại',
                        not_support_mobile: 'FaceAuthen SDK không hỗ trợ trên thiết bị di động',
                    },
                },
            }
            $scope.faceSdk = null;
            $scope.sdkContainer = document.getElementById('sdk-container')
            $scope.viewScreen = 0;
            $scope.retry = false;
            $scope.accesstoken = null;
            $scope.firstFace = null;
            $scope.lastFace = null;
            $scope.result = null;
            $scope.domain = "https://face-id-uat.dta.ai.vn";
            $scope.authenEndpoint = "/face/sdk-liveness-match";
            $scope.accessTokenEndpoint = "/auth/v1.0/oauth/accessToken";
            $scope.personID = localStorage.getItem("personID");
            $scope.initSDK();
        }
        $scope.initSDK = async function () {
            swal.showLoading();
            globalThis.xqconfig = 'CserWsSztcjbMXLnyhvTpwQCbejxcEMWbXhTgDegGvuJwKqdL1o+NbpnAJ/l4JH+juqTZz/TfJYR6XTcgAF9F3sitZV6w+99kviC/oIgVB2pX+Lb7jzZUspLb/Tnyb1Y3Gpn4RedjXacp6wiSjV2QQEf0Agc0cG4MjbMLySKxfLk063+/Ytq5jcYZOVt4RJN8MSdmF9ZCPVVvm/ovP6HFrgGTBA1TpAMtTSTbFOqQWC6nJIzub/1/3sDYob9/Rq7DHIydwuQ4Q+mnzAKginuUGVUF2s6JViTDjIBP89hMktonNhNYAElRbMv88ynpumU5TqkszKOFEYFD1VpL3jjtoEN+KINGUXoQu/o+r49ZWpuZ+BdXAsu5gAb6JCpSXz+/IlS+VcSbsFUbi1FXIDsoXE3Lj/E4SgpqnwIexEK6y7GULvfXzZH9ixvM2Un1UKvk5R1mxPAOyVXhV+wVmaxAFRek5zN+d/GpcKdHWiQgY1Tr1yUU7RUkfNUQqa6sanGOnwe3LvBJknH3FHSxX9KrUJbD+GVnyjqWK9l3Tc/w+csZC8NWhUya1blbeMLgjc/Me43';
            if (!$scope.faceSdk) {
                await (await import('../../libs/face-sdk/boot.js')).load()
                const faceSdkImp = await import('../../libs/face-sdk/index.js')
                $scope.faceSdk = new faceSdkImp.FaceSDK($scope.sdkContainer, $scope.sdkConfig)
                $scope.getToken();
                $scope.$apply(() => {
                    $scope.version = $scope.faceSdk.version();
                });
            }
        }
        $scope.closeSDK = async function () {
            $scope.viewScreen = 0;
            await $scope.faceSdk.close();
        }
        $scope.startFaceAuthen = async function (nonce, transId) {
            if ($scope.personID == "") {
                Swal.fire({
                    icon: 'error',
                    type: 'error',
                    title: '',
                    text: "Nhập số CCCD"
                });
                return false;
            }
            localStorage.setItem("personID", $scope.personID);
            $scope.viewScreen = 1;
            $scope.retry = false;
            try {
                await $scope.faceSdk.initialize();
            }
            catch (e) {
                Swal.fire({
                    icon: 'error',
                    type: 'error',
                    title: '',
                    text: "Có lỗi khi khởi tạo SDK: " + e.errorMessage
                });
                return false;
            }
            console.log('Nonce:', nonce)
            const result = await $scope.faceSdk.startDetection(nonce)
            console.log('Detection result:', result)
            if (result.code == 1) {
                let faceImages = result.faceImages;
                let signature = result.signature;
                $scope.firstFace = result.firstFace;
                $scope.lastFace = result.lastFace;
                $scope.verify($scope.personID, transId, faceImages, signature, nonce)
            }
            else {
                Swal.fire({
                    icon: 'error',
                    type: 'error',
                    title: '',
                    text: result.errorMessage
                });
                $scope.$apply(() => {
                    $scope.retry = true;
                });
                return false;
            }

        }
        $scope.getToken = function () {
            if ($scope.loadding) {
                return false;
            }
            $scope.loadding = true;
            swal.showLoading();
            $http({
                method: "POST",
                url: $scope.domain + $scope.accessTokenEndpoint,
                data: {
                    appId: "030095013763",
                    appSecret: "Test123#"
                },
                contentType: 'application/json; charset=utf-8',
                timeout: 10000
            }).then(function (res) {
                $scope.loadding = false;
                closeswal();
                if (res.data.statusCode === 1) {
                    $scope.accesstoken = res.data.accessToken;
                    console.log('token:', $scope.accesstoken)
                }
                else {
                    Swal.fire({
                        icon: 'error',
                        type: 'error',
                        title: '',
                        text: res.data.errorDetail
                    });
                    return false;
                }
            }).catch(function (error) {
                $scope.loadding = false;
                // Handle the error, including timeout
                Swal.fire({
                    icon: 'error',
                    type: 'error',
                    title: '',
                    text: "API time out"
                });
                console.log('error:', error)
                return false;
            });
        }

        $scope.getNonce = function () {
            if ($scope.loadding) {
                return false;
            }
            $scope.loadding = true;
            swal.showLoading();
            $http({
                method: "GET",
                url: $scope.domain + "/get-nonce",
                data: {},
                contentType: 'application/json; charset=utf-8',
                timeout: 10000
            }).then(function (res) {
                $scope.loadding = false;
                closeswal();
                if (res.data) {
                    $scope.startFaceAuthen(res.data.nonce, res.data.transId);
                }
                else {
                    Swal.fire({
                        icon: 'error',
                        type: 'error',
                        title: '',
                        text: res.data.errorDetail
                    });
                    return false;
                }
            }).catch(function (error) {
                $scope.loadding = false;
                Swal.fire({
                    icon: 'error',
                    type: 'error',
                    title: '',
                    text: "API time out"
                });
                return false;
            });
        }
        $scope.verify = function (personId, transId, faceImages, signature, nonce) {
            if ($scope.loadding) {
                return false;
            }
            $scope.loadding = true;
            swal.showLoading();
            $http({
                method: "POST",
                url: $scope.domain + $scope.authenEndpoint,
                data: {
                    personId: personId,
                    transId: transId,
                    faceImages: faceImages,
                    signature: signature,
                    nonce: nonce
                },
                contentType: 'application/json; charset=utf-8',
                timeout: 10000
            }).then(function (res) {
                $scope.result = null;
                $scope.loadding = false;
                closeswal();
                $scope.viewScreen = 2;
                if (res.data.statusCode === 1) {
                    $scope.result = res.data.data;
                    console.log('result:', res.data)
                }
                else {
                    Swal.fire({
                        icon: 'error',
                        type: 'error',
                        title: '',
                        text: res.data.errorDetail
                    });
                    return false;
                }
            }).catch(function (error) {
                $scope.loadding = false;
                // Handle the error, including timeout
                Swal.fire({
                    icon: 'error',
                    type: 'error',
                    title: '',
                    text: "API time out"
                });
                $scope.viewScreen = 0;
                return false;
            });
        }
        $scope.setImageBitmapToImg = function (imageBitmap) {
            const canvas = document.createElement('canvas');
            canvas.width = imageBitmap.width;
            canvas.height = imageBitmap.height;
            const context = canvas.getContext('2d');
            context.drawImage(imageBitmap, 0, 0);
            const dataUrl = canvas.toDataURL();  // Convert canvas to a data URL
            return dataUrl;
        }
        $scope.return = function () {
            $scope.viewScreen = 0;
        }
        $scope.init();
        function closeswal() {
            $(".swal2-container").remove();
        };
    }])
