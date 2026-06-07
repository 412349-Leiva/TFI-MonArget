package com.monargent.backend.service;

import com.monargent.backend.entity.User;

public interface CurrentUserService {

    User getCurrentUser();

    Long getCurrentUserId();
}