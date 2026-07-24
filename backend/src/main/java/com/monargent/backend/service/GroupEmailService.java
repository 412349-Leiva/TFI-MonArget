package com.monargent.backend.service;

import com.monargent.backend.dto.group.GroupResponse;
import com.monargent.backend.entity.Group;
import com.monargent.backend.entity.GroupGuestMember;
import com.monargent.backend.entity.User;
import java.math.BigDecimal;

public interface GroupEmailService {

    void sendGroupInviteEmail(String invitedEmail, User invitedBy, Group group);

    void sendGuestAddedEmail(GroupGuestMember guest, Group group, String verificationCode);

    void sendGuestDebtSummary(GroupGuestMember guest, Group group, GroupResponse groupDetail);

    void sendProofUploadedEmail(
        String creditorEmail,
        String creditorName,
        User debtor,
        Group group,
        BigDecimal amount,
        boolean creditorHasApp
    );

    void sendGuestPaymentNoticeEmail(
        GroupGuestMember guest,
        Group group,
        BigDecimal amount,
        User payer
    );
}
