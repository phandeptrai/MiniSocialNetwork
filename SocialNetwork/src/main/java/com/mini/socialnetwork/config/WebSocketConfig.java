package com.mini.socialnetwork.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.mini.socialnetwork.modules.chat.security.WebSocketAuthInterceptor;

/**
 * Cấu hình WebSocket với giao thức STOMP cho tính năng chat real-time.
 * <p>
 * Lớp này thiết lập kết nối WebSocket cho phép client và server trao đổi
 * tin nhắn theo thời gian thực. STOMP (Simple Text Oriented Messaging Protocol)
 * được sử dụng làm giao thức messaging trên WebSocket.
 * </p>
 *
 * <h2>Kiến trúc Message Broker:</h2>
 * <ul>
 *   <li><strong>/topic</strong>: Kênh broadcast cho nhiều subscriber (ví dụ: thông báo xóa tin nhắn)</li>
 *   <li><strong>/queue</strong>: Kênh point-to-point cho từng user (ví dụ: tin nhắn mới)</li>
 *   <li><strong>/app</strong>: Prefix cho các message từ client gửi đến server</li>
 *   <li><strong>/user</strong>: Prefix cho các message gửi đến user cụ thể</li>
 * </ul>
 *
 * <h2>Luồng tin nhắn:</h2>
 * <ol>
 *   <li>Client kết nối WebSocket tại /ws với JWT token trong header</li>
 *   <li>Client gửi tin nhắn đến /app/chat.sendMessage</li>
 *   <li>Server xử lý và broadcast đến /user/{userId}/queue/messages</li>
 * </ol>
 *
 * @author MiniSocialNetwork Team
 * @version 1.0
 * @see com.mini.socialnetwork.modules.chat.security.WebSocketAuthInterceptor
 * @see com.mini.socialnetwork.modules.chat.controller.ChatSocketController
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Cấu hình message broker cho WebSocket.
     * <p>
     * Phương thức này định nghĩa các kênh và prefix được sử dụng trong
     * hệ thống messaging:
     * </p>
     *
     * <h3>Simple Broker:</h3>
     * <ul>
     *   <li>/topic: Cho broadcast messages (pub/sub pattern)</li>
     *   <li>/queue: Cho point-to-point messages</li>
     * </ul>
     *
     * <h3>Application Destination:</h3>
     * <p>/app là prefix cho các message handler trong controller</p>
     *
     * <h3>User Destination:</h3>
     * <p>/user cho phép gửi message đến user cụ thể dựa trên Principal</p>
     *
     * @param config registry để cấu hình message broker
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    /**
     * Đăng ký endpoint STOMP cho WebSocket.
     * <p>
     * Endpoint /ws là điểm kết nối WebSocket duy nhất của ứng dụng.
     * SockJS fallback được bật để hỗ trợ các trình duyệt không hỗ trợ
     * WebSocket native.
     * </p>
     *
     * <h3>Cấu hình CORS:</h3>
     * <p>
     * setAllowedOriginPatterns("*") cho phép kết nối từ mọi origin.
     * Trong production, nên giới hạn chỉ cho các domain tin cậy.
     * </p>
     *
     * @param registry registry để đăng ký STOMP endpoints
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*").withSockJS();
    }

    /** SecurityConfig để lấy JwtDecoder và JwtAuthenticationConverter */
    @Autowired
    private SecurityConfig securityConfig;

    /**
     * Cấu hình interceptor cho kênh inbound từ client.
     * <p>
     * Phương thức này đăng ký WebSocketAuthInterceptor để xác thực JWT token
     * khi client gửi lệnh CONNECT. Interceptor sẽ:
     * </p>
     * <ul>
     *   <li>Trích xuất JWT token từ header "Authorization"</li>
     *   <li>Xác minh token qua JwtDecoder</li>
     *   <li>Tạo Authentication object và gắn vào WebSocket session</li>
     * </ul>
     *
     * @param registration registration để đăng ký channel interceptors
     * @see WebSocketAuthInterceptor
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new WebSocketAuthInterceptor(securityConfig.jwtDecoder(), securityConfig.jwtAuthenticationConverter()));
    }
}
