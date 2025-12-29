package com.mini.socialnetwork.modules.auth.service;

import com.mini.socialnetwork.modules.auth.dto.RegisterRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Service để gọi Keycloak Admin REST API
 * Dùng để tạo user mới khi đăng ký và lấy danh sách users
 */
@Service
public class KeycloakAdminService {

    @Value("${keycloak.auth-server-url:http://keycloak:8080}")
    private String keycloakUrl;

    @Value("${keycloak.realm:social-network}")
    private String realm;

    @Value("${keycloak.admin.client-id:social-network-backend}")
    private String clientId;

    @Value("${keycloak.admin.client-secret}")
    private String clientSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Lấy admin token từ Keycloak sử dụng client credentials flow
     */
    private String getAdminToken() {
        String tokenUrl = keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);

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

    /**
     * Lấy tất cả users từ Keycloak
     */
    public List<Map<String, Object>> getAllUsers() {
        String adminToken = getAdminToken();
        String usersUrl = keycloakUrl + "/admin/realms/" + realm + "/users?max=1000";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        HttpEntity<String> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    usersUrl,
                    HttpMethod.GET,
                    request,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {
                    });
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            throw new RuntimeException("Failed to get users from Keycloak: " + e.getMessage());
        }
    }

    /**
     * Lấy user theo ID từ Keycloak
     */
    public Map<String, Object> getUserById(String userId) {
        String adminToken = getAdminToken();
        String userUrl = keycloakUrl + "/admin/realms/" + realm + "/users/" + userId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        HttpEntity<String> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    userUrl,
                    HttpMethod.GET,
                    request,
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });
            return response.getBody();
        } catch (Exception e) {
            throw new RuntimeException("Failed to get user from Keycloak: " + e.getMessage());
        }
    }

    /**
     * Lấy nhiều users theo danh sách IDs
     */
    public List<Map<String, Object>> getUsersByIds(List<String> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Map<String, Object>> users = new ArrayList<>();
        for (String userId : userIds) {
            try {
                Map<String, Object> user = getUserById(userId);
                if (user != null) {
                    users.add(user);
                }
            } catch (Exception e) {
                // Skip users that cannot be found
            }
        }
        return users;
    }

    /**
     * Xóa user khỏi Keycloak
     * 
     * @param userId ID của user trong Keycloak
     */
    public void deleteUser(String userId) {
        String adminToken = getAdminToken();
        String userUrl = keycloakUrl + "/admin/realms/" + realm + "/users/" + userId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        HttpEntity<String> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Void> response = restTemplate.exchange(
                    userUrl,
                    HttpMethod.DELETE,
                    request,
                    Void.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Failed to delete user from Keycloak: " + response.getStatusCode());
            }
        } catch (org.springframework.web.client.HttpClientErrorException.NotFound e) {
            // User already deleted or not found, ignore
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete user from Keycloak: " + e.getMessage());
        }
    }
}
