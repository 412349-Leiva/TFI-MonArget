package com.monargent.backend.service;

import com.monargent.backend.dto.group.GroupResponse;
import com.monargent.backend.entity.Group;
import com.monargent.backend.entity.GroupGuestMember;

public interface GroupGuestDebtEmailService {

    void sendGuestDebtSummary(GroupGuestMember guest, Group group, GroupResponse groupDetail);
}
