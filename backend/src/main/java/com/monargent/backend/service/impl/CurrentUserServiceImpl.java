package com.monargent.backend.service.impl;

import com.monargent.backend.entity.User;
import com.monargent.backend.exception.UserNotFoundException;
import com.monargent.backend.repository.UserRepository;
import com.monargent.backend.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CurrentUserServiceImpl implements CurrentUserService {

    private final UserRepository userRepository;

    @Override
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new UserNotFoundException("Authenticated user not found");
        }

        return userRepository.findByEmailIgnoreCase(authentication.getName())
            .orElseThrow(() -> new UserNotFoundException("Authenticated user not found"));
    }

    @Override
    public Long getCurrentUserId() {
        return getCurrentUser().getId();
    }
}