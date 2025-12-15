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
 * Interceptor for authenticating WebSocket connections using JWT tokens.
 * <p>
 * This interceptor checks the Authorization header during the STOMP CONNECT command,
 * decodes the JWT token, and sets the authenticated user in the WebSocket session.
 * If the token is invalid or missing, the user is not authenticated and the connection
 * may be rejected by subsequent security checks.
 * </p>
 */
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtDecoder jwtDecoder;
    private final JwtAuthenticationConverter jwtAuthenticationConverter;

    /**
     * Constructs a new WebSocketAuthInterceptor.
     *
     * @param jwtDecoder the JwtDecoder bean for decoding JWT tokens
     * @param converter the JwtAuthenticationConverter for creating Authentication objects from JWTs
     */
    public WebSocketAuthInterceptor(JwtDecoder jwtDecoder, JwtAuthenticationConverter converter) {
        this.jwtDecoder = jwtDecoder;
        this.jwtAuthenticationConverter = converter;
    }

    /**
     * Intercepts messages sent to the channel and authenticates WebSocket connections.
     * <p>
     * Extracts and validates the JWT token from the Authorization header during the STOMP CONNECT
     * command. Upon successful validation, sets the authenticated user in the WebSocket session
     * accessor, allowing downstream handlers to access the authenticated principal.
     * </p>
     *
     * @param message the message being sent
     * @param channel the message channel
     * @return the original message, possibly with the authenticated user set in the accessor
     * @throws BadCredentialsException if the token is present but invalid or malformed
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