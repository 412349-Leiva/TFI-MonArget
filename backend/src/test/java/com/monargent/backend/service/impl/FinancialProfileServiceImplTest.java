package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.monargent.backend.dto.financialprofile.FinancialProfileCreateRequest;
import com.monargent.backend.dto.financialprofile.FinancialProfileResponse;
import com.monargent.backend.dto.financialprofile.FinancialProfileUpdateRequest;
import com.monargent.backend.entity.FinancialProfile;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.FinancialModel;
import com.monargent.backend.exception.ResourceAlreadyExistsException;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.mapper.FinancialProfileMapper;
import com.monargent.backend.repository.FinancialProfileRepository;
import com.monargent.backend.service.CurrentUserService;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FinancialProfileServiceImplTest {

    @Mock private FinancialProfileRepository financialProfileRepository;
    @Mock private CurrentUserService currentUserService;
    @Mock private FinancialProfileMapper financialProfileMapper;

    @InjectMocks
    private FinancialProfileServiceImpl service;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).name("Mon").lastname("Argent")
            .email("fp@example.com").password("x").verified(true).build();
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
    }

    @Test
    void create_success() {
        when(currentUserService.getCurrentUser()).thenReturn(user);
        FinancialProfileCreateRequest request = FinancialProfileCreateRequest.builder()
            .monthlyIncome(new BigDecimal("1000"))
            .financialModel(FinancialModel.TRADITIONAL)
            .monthlySavingsGoal(new BigDecimal("200"))
            .currency("ARS")
            .build();
        FinancialProfile entity = FinancialProfile.builder().build();
        FinancialProfile saved = FinancialProfile.builder().id(2L).user(user).build();
        FinancialProfileResponse response = FinancialProfileResponse.builder().id(2L).build();

        when(financialProfileRepository.existsByUserId(1L)).thenReturn(false);
        when(financialProfileMapper.toEntity(request)).thenReturn(entity);
        when(financialProfileRepository.save(entity)).thenReturn(saved);
        when(financialProfileMapper.toResponse(saved)).thenReturn(response);

        assertThat(service.create(request).getId()).isEqualTo(2L);
        assertThat(entity.getUser()).isEqualTo(user);
    }

    @Test
    void create_duplicate_throws() {
        when(financialProfileRepository.existsByUserId(1L)).thenReturn(true);
        assertThatThrownBy(() -> service.create(FinancialProfileCreateRequest.builder()
            .monthlyIncome(BigDecimal.ONE).financialModel(FinancialModel.ZERO_BASED)
            .monthlySavingsGoal(BigDecimal.ONE).currency("ARS").build()))
            .isInstanceOf(ResourceAlreadyExistsException.class)
            .hasMessage("Ya existe un perfil financiero para este usuario");
    }

    @Test
    void getCurrentProfile_success() {
        FinancialProfile profile = FinancialProfile.builder().id(3L).user(user).build();
        FinancialProfileResponse response = FinancialProfileResponse.builder().id(3L).build();
        when(financialProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(financialProfileMapper.toResponse(profile)).thenReturn(response);
        assertThat(service.getCurrentProfile().getId()).isEqualTo(3L);
    }

    @Test
    void getCurrentProfile_missing_throws() {
        when(financialProfileRepository.findByUserId(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getCurrentProfile())
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage("Perfil financiero no encontrado");
    }

    @Test
    void update_success() {
        FinancialProfile profile = FinancialProfile.builder().id(3L).user(user).build();
        FinancialProfileUpdateRequest request = FinancialProfileUpdateRequest.builder()
            .monthlyIncome(new BigDecimal("2000"))
            .financialModel(FinancialModel.TRADITIONAL)
            .monthlySavingsGoal(new BigDecimal("300"))
            .currency("ARS")
            .build();
        FinancialProfileResponse response = FinancialProfileResponse.builder().id(3L).build();
        when(financialProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(financialProfileRepository.save(profile)).thenReturn(profile);
        when(financialProfileMapper.toResponse(profile)).thenReturn(response);

        assertThat(service.update(request).getId()).isEqualTo(3L);
        verify(financialProfileMapper).updateEntity(profile, request);
    }
}
