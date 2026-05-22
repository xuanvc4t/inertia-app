# TTXT-FaceAuthen-WEB
SDK tích hợp trên Web sử dụng dịch vụ xác thực chống giả mạo và dịch vụ xác thực khuôn mặt (web-sdk-liveness-match) của Trung tâm xác thực
# 1.Trình duyệt được hỗ trợ

Hệ thống được tối ưu hóa cho trình duyệt máy tính để bàn, với các yêu cầu phiên bản tối thiểu sau:

| Trình duyệt     | Phiên bản       |
| --------------- | --------------- |
| Chrome          | 52+             |
| Firefox         | 42+             |
| Safari          | 15+             |
| Edge (Chromium) | 79+             |
| Safari mobile   | 15+             |

Lưu ý**: Hệ thống chỉ hoạt động trên một số trình duyệt cơ bản trên mobile như Safari của IOS và đa số các trình duyệt trên Android

# 2. Apply Shield <span style="color:red">(Bắt buộc)</span>.

* TCDN gửi domain của ứng dụng cho Trung tâm RAR để build license (bao gồm cả domain prod và domain dev)

# 3. SDK
## 3.1 SDK input

| Tên trường            | Kiểu dữ liệu | Mô tả                                              |
|-----------------------|--------------|----------------------------------------------------|
| detectionTimeoutMs    | int          | Thời gian time out SDK                             |
| sdkContainer          | object       | Vùng hiển thị giao diện SDK                        |
| nonce                 | string       | Giá trị nonce lấy từ backend                       |

## 3.2 SDK Output

| Tên trường            | Kiểu dữ liệu | Mô tả                                              |
|------------------|--------------|-------------------------------------------------------------------------------------------|
| code            | Integer        | Mã lỗi. 1: thành công, 311: lỗi giá trị nonce, 307: timeout |
| errorMessage    | String        | Chi tiết lỗi|
| firstFace        | ImageBitmap  | Ảnh liveness bước 1. <em>(Ảnh này để TCDN lưu lại phục vụ cho nghiệp vụ)<em>|
| lastFace        | ImageBitmap  | Ảnh liveness bước 2. <em>(Ảnh này để TCDN lưu lại phục vụ cho nghiệp vụ)<em>|
| signature        | String       | Chữ ký xác thực dữ liệu (Phục vụ verify data)           |
| faceImages       | String       | Dữ liệu khuôn mặt. <em><strong>Đây là dữ liệu truyền vào trường faceImage để gửi tới Trung tâm xác thực.<strong><em>|

## 3.3 SDK public function
| Tên trường       |  Mô tả                                                                 |
|------------------|------------------------------------------------------------------------|
| version          |  Lấy version SDK                                                       |
| initialize       |  Hàm khởi tạo SDK                                                      |
| startDetection   |  Hàm bắt đầu SDK                                                       |

## 3.4 Cài đặt SDK
copy thư mục libs/face-sdk vào trong dự án của bạn.

## 3.5 Cách sử dụng
**Lưu ý**: Ví dụ được thực hiện trên Angulajs.

trong file javascript của bạn:

 ```javascript
    $scope.sdkConfig = {
		detectionTimeoutMs: 90_000, // 90 seconds
	}
	$scope.faceSdk = null;
	$scope.sdkContainer = document.getElementById('sdk-container')
	const nonce = "chuỗi nonce";
	globalThis.xqconfig = 'your string license’;
	if (!$scope.faceSdk) {
		await (await import('../../libs/face-sdk/boot.js')).load()
		const faceSdkImp = await import('../../libs/face-sdk/index.js')
		$scope.faceSdk = new faceSdkImp.FaceSDK($scope.sdkContainer, $scope.sdkConfig)
	}
	await $scope.faceSdk.initialize()

	const result = await $scope.faceSdk.startDetection(nonce)
	console.log('Detection result:', result)

 ```  
## 3.6.	Tùy chỉnh giao diện (Không bắt buộc)
### 3.6.1.	Tùy chỉnh UI/UX
| Tên thuộc tính            | Kiểu dữ liệu | Mô tả                                              |
|-----------------------|--------------|----------------------------------------------------|
| showLoading    | Boolean          | Tắt bật màn hình chờ khởi tạo SDK                         |
### 3.6.2.	Tùy chỉnh font/size
| Tên thuộc tính            | Kiểu dữ liệu | Mô tả                                              |
|-----------------------|--------------|----------------------------------------------------|
| fontFamily    | String          | Thay đổi font chữ trong giao diện                        |   
| textSize    | Integer          | Thay đổi kích thước chữ trong giao diện                        |   
### 3.6.3.	Tùy chỉnh màu giao diện
| Tên thuộc tính            | Kiểu dữ liệu | Mô tả                                              |
|-----------------------|--------------|----------------------------------------------------|
| primaryColor    | String          | Màu viền hình oval                        |   
| secondaryColor    | String          | Màu animation trong hình oval              |   
| textColor    | String          | Màu chữ                        |   
| backgroundColor    | String          | Màu nền              |   

### 3.6.4.	Ngôn ngữ
Thay đổi ngôn ngữ tuỳ chọn.
Ví dụ:

 ```javascript
    $scope.sdkConfig = {
		detectionTimeoutMs: 90_000, // 90 seconds
		fontFamily: 'Times New Roman',
		fontSize: '28px',
		showLoading: true,
		palette: {
			primaryColor: '#4d4dff',
			secondaryColor: '#33cc33',
			textColor: '#ff4dc4',
			backgroundColor: '#c0bebe',
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
 ```  


