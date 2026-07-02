package com.monargent.backend.service.impl;

import com.monargent.backend.dto.financialprofile.FinancialProfileCreateRequest;
import com.monargent.backend.dto.financialprofile.FinancialProfileResponse;
import com.monargent.backend.dto.financialprofile.FinancialProfileUpdateRequest;
import com.monargent.backend.entity.FinancialProfile;
import com.monargent.backend.exception.ResourceAlreadyExistsException;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.mapper.FinancialProfileMapper;
import com.monargent.backend.repository.FinancialProfileRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.FinancialProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class FinancialProfileServiceImpl implements FinancialProfileService {

    private final FinancialProfileRepository financialProfileRepository;
    private final CurrentUserService currentUserService;
    private final FinancialProfileMapper financialProfileMapper;

    @Override
    public FinancialProfileResponse create(FinancialProfileCreateRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        if (financialProfileRepository.existsByUserId(userId)) {
            throw new ResourceAlreadyExistsException("Ya existe un perfil financiero para este usuario");
        }

        FinancialProfile profile = financialProfileMapper.toEntity(request);
        profile.setUser(currentUserService.getCurrentUser());
        return financialProfileMapper.toResponse(financialProfileRepository.save(profile));
    }

    @Override
    @Transactional(readOnly = true)
    public FinancialProfileResponse getCurrentProfile() {
        FinancialProfile profile = financialProfileRepository.findByUserId(currentUserService.getCurrentUserId())
            .orElseThrow(() -> new ResourceNotFoundException("Perfil financiero no encontrado"));
        return financialProfileMapper.toResponse(profile);
    }

    @Override
    public FinancialProfileResponse update(FinancialProfileUpdateRequest request) {
        FinancialProfile profile = financialProfileRepository.findByUserId(currentUserService.getCurrentUserId())
            .orElseThrow(() -> new ResourceNotFoundException("Perfil financiero no encontrado"));

        financialProfileMapper.updateEntity(profile, request);
        return financialProfileMapper.toResponse(financialProfileRepository.save(profile));
    }
}