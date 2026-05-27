package com.monargent.backend.service;

import com.monargent.backend.dto.financialprofile.FinancialProfileCreateRequest;
import com.monargent.backend.dto.financialprofile.FinancialProfileResponse;
import com.monargent.backend.dto.financialprofile.FinancialProfileUpdateRequest;

public interface FinancialProfileService {

    FinancialProfileResponse create(FinancialProfileCreateRequest request);

    FinancialProfileResponse getCurrentProfile();

    FinancialProfileResponse update(FinancialProfileUpdateRequest request);
}