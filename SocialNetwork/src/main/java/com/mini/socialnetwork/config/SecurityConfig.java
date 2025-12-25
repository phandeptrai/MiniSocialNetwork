package com.mini.socialnetwork.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Cấu hình bảo mật cho OAuth2 Resource Server với xác thực JWT.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /** URI để lấy JWK Set từ Keycloak dùng cho việc xác minh chữ ký JWT */
    @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}")
    private String jwkSetUri;

    /**
     * Security filter chain cho các endpoint public (không cần JWT)
     * Có độ ưu tiên cao hơn (order 1)
     */
    @Bean
    @Order(1)
    public SecurityFilterChain publicSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/api/auth/**", "/ws/**", "/api/follows/**", "/api/users/**")
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }

    /**
     * Security filter chain chính cho các endpoint yêu cầu JWT
     * Có độ ưu tiên thấp hơn (order 2)
     */
    @Bean
    @Order(2)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.decoder(jwtDecoder())));
        return http.build();
    }

    /**
     * Tạo bean JwtDecoder để giải mã và xác minh JWT token.
     * <p>
     * Bean này sử dụng JWK Set URI của Keycloak để lấy public key và xác minh
     * chữ ký của JWT token. Nimbus là thư viện được Spring Security sử dụng
     * mặc định cho việc xử lý JWT.
     * </p>
     *
     * <h3>Quy trình xác minh:</h3>
     * <ol>
     * <li>Lấy public key từ JWK Set endpoint</li>
     * <li>Xác minh chữ ký của token</li>
     * <li>Kiểm tra thời gian hết hạn (exp claim)</li>
     * </ol>
     *
     * @return NimbusJwtDecoder đã được cấu hình với JWK Set URI
     */
    @Bean
    public JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withJwkSetUri(this.jwkSetUri).build();
    }

    /**
     * Tạo bean JwtAuthenticationConverter để trích xuất quyền từ JWT token.
     * <p>
     * Converter này đọc các role từ claim "realm_access" trong JWT token
     * và ánh xạ chúng thành các GrantedAuthority của Spring Security với
     * prefix "ROLE_".
     * </p>
     *
     * <h3>Cấu trúc claim trong Keycloak JWT:</h3>
     * 
     * <pre>
     * {
     *   "realm_access": {
     *     "roles": ["user", "admin"]
     *   }
     * }
     * </pre>
     *
     * <h3>Kết quả ánh xạ:</h3>
     * <ul>
     * <li>"user" → ROLE_user</li>
     * <li>"admin" → ROLE_admin</li>
     * </ul>
     *
     * @return JwtAuthenticationConverter đã được cấu hình
     */
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        grantedAuthoritiesConverter.setAuthoritiesClaimName("realm_access");
        grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
        return jwtAuthenticationConverter;
    }
}
