package com.monargent.backend.service;

import com.monargent.backend.dto.profile.FinancialMoodResponse;

public interface FinancialMoodService {

    FinancialMoodResponse getCurrentMonthMood();
}
