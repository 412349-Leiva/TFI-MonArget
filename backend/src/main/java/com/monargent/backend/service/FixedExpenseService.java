package com.monargent.backend.service;

import com.monargent.backend.dto.fixedexpense.FixedExpenseCreateRequest;
import com.monargent.backend.dto.fixedexpense.FixedExpenseResponse;
import com.monargent.backend.dto.fixedexpense.FixedExpenseUpdateRequest;
import java.util.List;

public interface FixedExpenseService {

    List<FixedExpenseResponse> findAll();

    FixedExpenseResponse create(FixedExpenseCreateRequest request);

    FixedExpenseResponse update(Long id, FixedExpenseUpdateRequest request);

    void delete(Long id);
}