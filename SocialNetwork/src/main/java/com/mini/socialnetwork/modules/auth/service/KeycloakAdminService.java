package com.mini.socialnetwork.modules.auth.service;

import com.mini.socialnetwork.modules.auth.dto.RegisterRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service để gọi Keycloak Admin REST API
 * Dùng để tạo user mới khi đăng ký
 */
@Service
public class KeycloakAdminService {

    @Value("${keycloak.auth-server-url:http://keycloak:8080}")
    private String keycloakUrl;

    @Value("${keycloak.realm:social-network}")
    private String realm;

    @Value("${keycloak.admin.username:admin}")
    private String adminUsername;

    @Value("${keycloak.admin.password:admin}")
    private String adminPassword;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Lấy admin token từ Keycloak master realm
     */
    private String getAdminToken() {
        String tokenUrl = keycloakUrl + "/realms/master/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", "admin-cli");
        body.add("username", adminUsername);
        body.add("password", adminPassword);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (String) response.getBody().get("access_token");
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to get admin token: " + e.getMessage());
        }

        throw new RuntimeException("Failed to get admin token");
    }

    /**
     * Tạo user mới trong Keycloak
     */
    public void createUser(RegisterRequest request) {
        String adminToken = getAdminToken();
        String usersUrl = keycloakUrl + "/admin/realms/" + realm + "/users";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(adminToken);

        // Tạo user payload
        Map<String, Object> userPayload = new HashMap<>();
        userPayload.put("username", request.getUsername());
        userPayload.put("email", request.getEmail());
        userPayload.put("firstName", request.getFirstName());
        userPayload.put("lastName", request.getLastName());
        userPayload.put("enabled", true);
        userPayload.put("emailVerified", true);

        // Set credentials (password)
        Map<String, Object> credentials = new HashMap<>();
        credentials.put("type", "password");
        credentials.put("value", request.getPassword());
        credentials.put("temporary", false);
        userPayload.put("credentials", List.of(credentials));

        HttpEntity<Map<String, Object>> httpRequest = new HttpEntity<>(userPayload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(usersUrl, httpRequest, String.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Failed to create user: " + response.getStatusCode());
            }
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.CONFLICT) {
                throw new RuntimeException("User already exists");
            }
            throw new RuntimeException("Failed to create user: " + e.getMessage());
        }
    }
}
