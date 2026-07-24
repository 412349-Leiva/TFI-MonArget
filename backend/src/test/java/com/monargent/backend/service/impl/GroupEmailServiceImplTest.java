package com.monargent.backend.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.monargent.backend.dto.group.GroupResponse;
import com.monargent.backend.dto.group.GroupSettlementResponse;
import com.monargent.backend.entity.Group;
import com.monargent.backend.entity.GroupGuestMember;
import com.monargent.backend.entity.User;
import com.monargent.backend.service.GuestPayUrlService;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class GroupEmailServiceImplTest {

    @Mock private JavaMailSender mailSender;
    @Mock private GuestPayUrlService guestPayUrlService;
    @Mock private MimeMessage mimeMessage;

    @InjectMocks
    private GroupEmailServiceImpl service;

    private User inviter;
    private Group group;
    private GroupGuestMember guest;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "frontendUrl", "http://localhost:5173");
        ReflectionTestUtils.setField(service, "fromAddress", "noreply@monargent.app");
        inviter = User.builder().id(1L).name("Ana").lastname("Perez")
            .email("ana@example.com").password("x").verified(true).mpAlias("ana.mp").build();
        group = Group.builder().id(10L).title("Asado <especial>").build();
        guest = GroupGuestMember.builder()
            .id(7L).displayName("Invitado").email("guest@example.com").mpAlias("guest.mp")
            .group(group).build();
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
    }

    @Test
    void sendAllEmailVariants_success() {
        when(guestPayUrlService.buildGuestPayPageUrl(any(), any(), any(), any()))
            .thenReturn("http://localhost:5173/pagar");

        service.sendGroupInviteEmail("bob@example.com", inviter, group);
        service.sendGuestAddedEmail(guest, group, "123456");
        service.sendGuestDebtSummary(guest, group, GroupResponse.builder()
            .settlements(List.of(
                GroupSettlementResponse.builder()
                    .fromMemberKey("guest-7").toMemberKey("user-1")
                    .fromNick("Invitado").toNick("Ana")
                    .toMpAlias("ana.mp").amount(new BigDecimal("50")).build(),
                GroupSettlementResponse.builder()
                    .fromMemberKey("user-1").toMemberKey("guest-7")
                    .fromNick("Ana").toNick("Invitado")
                    .amount(new BigDecimal("10")).paid(true).build()
            ))
            .build());
        service.sendProofUploadedEmail("cred@example.com", "Creditor", inviter, group,
            new BigDecimal("20"), true);
        service.sendProofUploadedEmail("guest@example.com", "Invitado", inviter, group,
            new BigDecimal("20"), false);
        service.sendGuestPaymentNoticeEmail(guest, group, new BigDecimal("35"), inviter);

        verify(mailSender, org.mockito.Mockito.atLeast(5)).send(mimeMessage);
    }

    @Test
    void sendHtml_failure_fallsBackToConsole() {
        doThrow(new RuntimeException("smtp")).when(mailSender).send(any(MimeMessage.class));
        service.sendGroupInviteEmail("bob@example.com", inviter, group);
    }
}
