package vhuwng.itisacademy.common.websocket;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import vhuwng.itisacademy.Security.UserPrincipal;
import vhuwng.itisacademy.Security.jwt.JWTService;
import vhuwng.itisacademy.Security.jwt.TokenType;
import vhuwng.itisacademy.common.enums.Role;
import vhuwng.itisacademy.common.exception.InvalidTokenException;
import vhuwng.itisacademy.common.exception.TokenExpiredException;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JWTService jwtService;
    private final JwtHandshakeInterceptor jwtHandshakeInterceptor;

    @Value("${app.cors.allowed-origins}")
    private String corsAllowedOrigins;

    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        String[] origins = java.util.Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toArray(String[]::new);

        // SockJS (browsers). Transport URL: /ws
        registry.addEndpoint("/ws")
                .addInterceptors(jwtHandshakeInterceptor)
                .setAllowedOrigins(origins)
                .withSockJS();

        // Raw WebSocket (no SockJS) for native STOMP clients
        registry.addEndpoint("/ws-native")
                .addInterceptors(jwtHandshakeInterceptor)
                .setAllowedOrigins(origins);
    }

    @Override
    public void configureClientInboundChannel(@NonNull ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
                    return message;
                }

                String token = extractAccessToken(accessor);
                if (token == null || token.isBlank()) {
                    throw new IllegalArgumentException("Missing access token for WebSocket CONNECT");
                }

                try {
                    Claims claims = jwtService.validateToken(token, TokenType.ACCESS);
                    UUID userId = UUID.fromString(claims.getSubject());
                    String username = claims.get("userName", String.class);
                    String roleStr = claims.get("role", String.class);
                    Role role = roleStr == null ? Role.USER : Role.valueOf(roleStr);

                    UserPrincipal principal = new UserPrincipal(userId, username, role);
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    principal, null, principal.getAuthorities());
                    accessor.setUser(authentication);
                } catch (TokenExpiredException | InvalidTokenException ex) {
                    throw new IllegalArgumentException("Invalid or expired access token", ex);
                }

                return message;
            }
        });
    }

    private static String extractAccessToken(StompHeaderAccessor accessor) {
        String auth = firstHeader(accessor, "Authorization");
        if (auth != null && auth.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return auth.substring(7).trim();
        }

        String token = firstHeader(accessor, "access_token");
        if (token != null && !token.isBlank()) {
            return token.trim();
        }

        // SockJS / browser: ?access_token=... on handshake
        Object queryToken = accessor.getSessionAttributes() != null
                ? accessor.getSessionAttributes().get("access_token")
                : null;
        if (queryToken instanceof String s && !s.isBlank()) {
            return s.trim();
        }

        return null;
    }

    private static String firstHeader(StompHeaderAccessor accessor, String name) {
        List<String> values = accessor.getNativeHeader(name);
        if (values == null || values.isEmpty()) {
            return null;
        }
        return values.getFirst();
    }
}
