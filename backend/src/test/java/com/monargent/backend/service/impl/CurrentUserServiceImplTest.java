package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.monargent.backend.entity.User;
import com.monargent.backend.exception.UserNotFoundException;
import com.monargent.backend.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class CurrentUserServiceImplTest {

    @Mock private UserRepository userRepository;

    @InjectMocks
    private CurrentUserServiceImpl service;

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getCurrentUser_andId() {
        User user = User.builder().id(9L).name("A").lastname("B")
            .email("a@example.com").password("x").verified(true).build();
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("a@example.com", "x"));
        when(userRepository.findByEmailIgnoreCase("a@example.com")).thenReturn(Optional.of(user));

        assertThat(service.getCurrentUser()).isEqualTo(user);
        assertThat(service.getCurrentUserId()).isEqualTo(9L);
    }

    @Test
    void getCurrentUser_noAuth_throws() {
        SecurityContextHolder.clearContext();
        assertThatThrownBy(() -> service.getCurrentUser())
            .isInstanceOf(UserNotFoundException.class)
            .hasMessage("Usuario autenticado no encontrado");
    }

    @Test
    void getCurrentUser_unknownEmail_throws() {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("missing@example.com", "x"));
        when(userRepository.findByEmailIgnoreCase("missing@example.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getCurrentUser())
            .isInstanceOf(UserNotFoundException.class)
            .hasMessage("Authenticated user not found");
    }
}
