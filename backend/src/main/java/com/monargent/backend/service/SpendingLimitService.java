package com.monargent.backend.service;

import com.monargent.backend.dto.spendinglimit.SpendingLimitCreateRequest;
import com.monargent.backend.dto.spendinglimit.SpendingLimitResponse;
import com.monargent.backend.dto.spendinglimit.SpendingLimitUpdateRequest;
import java.util.List;

public interface SpendingLimitService {

    List<SpendingLimitResponse> findAll();

    SpendingLimitResponse create(SpendingLimitCreateRequest request);

    SpendingLimitResponse update(Long id, SpendingLimitUpdateRequest request);

    void delete(Long id);
}