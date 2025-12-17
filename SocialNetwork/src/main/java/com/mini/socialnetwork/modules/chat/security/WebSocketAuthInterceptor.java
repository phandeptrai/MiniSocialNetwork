package com.mini.socialnetwork.modules.chat.security;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;

/**
 * Interceptor xác thực kết nối WebSocket bằng JWT token.
 * <p>
 * Interceptor này xử lý việc xác thực người dùng khi họ kết nối WebSocket.
 * Khác với HTTP request (được xử lý bởi SecurityFilterChain), WebSocket
 * cần interceptor riêng để trích xuất và xác minh token từ STOMP header.
 * </p>
 *
 * <h2>Luồng xác thực:</h2>
 * <ol>
 *   <li>Client gửi lệnh STOMP CONNECT với header "Authorization: Bearer {token}"</li>
 *   <li>Interceptor trích xuất token từ header</li>
 *   <li>JwtDecoder xác minh chữ ký và thời hạn token</li>
 *   <li>JwtAuthenticationConverter tạo Authentication object</li>
 *   <li>Authentication được gắn vào WebSocket session</li>
 * </ol>
 *
 * <h2>Lưu ý:</h2>
 * <p>
 * Xác thực chỉ xảy ra ở lệnh CONNECT. Các message sau đó sử dụng
 * Authentication đã được lưu trong session. Nếu token không hợp lệ,
 * BadCredentialsException được throw và kết nối bị từ chối.
 * </p>
 *
 * @author MiniSocialNetwork Team
 * @version 1.0
 * @see com.mini.socialnetwork.config.WebSocketConfig
 */
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    /** Decoder để giải mã và xác minh JWT token */
    private final JwtDecoder jwtDecoder;

    /** Converter để tạo Authentication object từ JWT */
    private final JwtAuthenticationConverter jwtAuthenticationConverter;

    /**
     * Khởi tạo WebSocketAuthInterceptor với các dependency cần thiết.
     *
     * @param jwtDecoder bean JwtDecoder đã được cấu hình trong SecurityConfig
     * @param converter bean JwtAuthenticationConverter để chuyển đổi JWT thành Authentication
     */
    public WebSocketAuthInterceptor(JwtDecoder jwtDecoder, JwtAuthenticationConverter converter) {
        this.jwtDecoder = jwtDecoder;
        this.jwtAuthenticationConverter = converter;
    }

    /**
     * Xử lý message trước khi gửi đến channel, thực hiện xác thực cho lệnh CONNECT.
     * <p>
     * Phương thức này được gọi cho mọi message đến từ client. Chỉ xử lý xác thực
     * cho lệnh STOMP CONNECT, các lệnh khác được pass through.
     * </p>
     *
     * <h3>Xử lý Authorization header:</h3>
     * <ul>
     *   <li>Header phải có format "Bearer {token}"</li>
     *   <li>Nếu không có header hoặc format sai, không set user (anonymous)</li>
     *   <li>Nếu token không hợp lệ, throw BadCredentialsException</li>
     * </ul>
     *
     * @param message message STOMP từ client
     * @param channel channel nhận message
     * @return message gốc (có thể đã được gắn user trong accessor)
     * @throws BadCredentialsException nếu token không hợp lệ hoặc đã hết hạn
     */
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    Jwt jwt = jwtDecoder.decode(token);
                    Authentication authentication = jwtAuthenticationConverter.convert(jwt);
                    accessor.setUser(authentication);
                } catch (JwtException e) {
                    throw new BadCredentialsException("Invalid token");
                }
            }
        }
        return message;
    }
}