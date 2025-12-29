package com.mini.socialnetwork.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
     * Có độ ưu tiên cao nhất (order 1)
     */
    @Bean
    @Order(1)
    public SecurityFilterChain publicSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/api/auth/**", "/ws/**", "/api/follows/**")
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }

    /**
     * Security filter chain cho Admin endpoints - yêu cầu role admin
     * Có độ ưu tiên cao hơn filter chain chung (order 2)
     */
    @Bean
    @Order(2)
    public SecurityFilterChain adminSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/api/admin/**")
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().hasRole("admin"))
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .decoder(jwtDecoder())
                                .jwtAuthenticationConverter(jwtAuthenticationConverter())));
        return http.build();
    }

    /**
     * Security filter chain chính cho các endpoint yêu cầu JWT
     * Có độ ưu tiên thấp nhất (order 3)
     */
    @Bean
    @Order(3)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .decoder(jwtDecoder())
                                .jwtAuthenticationConverter(jwtAuthenticationConverter())));
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
     * Converter này đọc các role từ claim "realm_access.roles" trong JWT token
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
        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(new KeycloakRealmRoleConverter());
        return jwtAuthenticationConverter;
    }

    /**
     * Custom converter để trích xuất roles từ Keycloak JWT token.
     * Keycloak lưu realm roles trong claim "realm_access.roles" dạng nested object.
     */
    private static class KeycloakRealmRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

        @Override
        @SuppressWarnings("unchecked")
        public Collection<GrantedAuthority> convert(Jwt jwt) {
            Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
            if (realmAccess == null || !realmAccess.containsKey("roles")) {
                return Collections.emptyList();
            }

            List<String> roles = (List<String>) realmAccess.get("roles");
            return roles.stream()
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                    .collect(Collectors.toList());
        }
    }
}
