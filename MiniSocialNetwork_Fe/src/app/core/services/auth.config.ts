import { AuthConfig } from 'angular-oauth2-oidc';

/**
 * Cấu hình kết nối tới Keycloak.
 * Đây là nơi định nghĩa tất cả các endpoint và thông tin client.
 */
export const authConfig: AuthConfig = {
  // URL trỏ tới realm của Keycloak mà chúng ta đã tạo.
  issuer: 'http://localhost:8180/realms/social-network',

  // URL mà Keycloak sẽ chuyển hướng người dùng về sau khi đăng nhập thành công.
  redirectUri: '',

  // Client ID của ứng dụng Angular đã đăng ký trong Keycloak.
  clientId: 'social-network-client',

  // Sử dụng luồng "Authorization Code Flow with PKCE", an toàn nhất cho SPA.
  responseType: 'code',

  // Các thông tin (scope) mà ứng dụng muốn truy cập từ hồ sơ người dùng.
  // 'openid' là bắt buộc, 'profile' và 'email' để lấy tên và email.
  scope: 'openid profile email',

  // Bật log debug trong console của trình duyệt để dễ dàng gỡ lỗi.
  // Nên tắt khi triển khai production.
  showDebugInformation: true,

  // Bắt buộc sử dụng PKCE (Proof Key for Code Exchange) để tăng cường bảo mật.
  strictDiscoveryDocumentValidation: false, // Tạm thời tắt để tương thích với một số phiên bản Keycloak
};