package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.monargent.backend.dto.profile.UserDocumentResponse;
import com.monargent.backend.entity.Group;
import com.monargent.backend.entity.GroupGuestMember;
import com.monargent.backend.entity.GroupSettlementPayment;
import com.monargent.backend.entity.User;
import com.monargent.backend.repository.GroupGuestMemberRepository;
import com.monargent.backend.repository.GroupRepository;
import com.monargent.backend.repository.GroupSettlementPaymentRepository;
import com.monargent.backend.repository.UserRepository;
import com.monargent.backend.service.CurrentUserService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProfileDocumentServiceImplTest {

    @Mock private GroupSettlementPaymentRepository settlementPaymentRepository;
    @Mock private GroupRepository groupRepository;
    @Mock private GroupGuestMemberRepository guestMemberRepository;
    @Mock private UserRepository userRepository;
    @Mock private CurrentUserService currentUserService;

    @InjectMocks
    private ProfileDocumentServiceImpl service;

    private User currentUser;
    private User payer;
    private Group group;

    @BeforeEach
    void setUp() {
        currentUser = User.builder().id(1L).name("Ana").lastname("Perez")
            .email("ana@example.com").password("x").verified(true).build();
        payer = User.builder().id(2L).name("Bob").lastname("Lopez")
            .email("bob@example.com").password("x").verified(true).build();
        group = Group.builder().id(10L).title("Asado").build();
        when(currentUserService.getCurrentUser()).thenReturn(currentUser);
    }

    @Test
    void listReceivedDocuments_resolvesUserAndGuestNames() {
        GroupGuestMember guest = GroupGuestMember.builder().id(7L).displayName("Invitado X").build();
        GroupSettlementPayment fromUser = GroupSettlementPayment.builder()
            .id(100L).group(group).fromMemberKey("user-2").toMemberKey("user-1")
            .settlementAmount(new BigDecimal("50")).proofContentType("image/png")
            .proofUploadedAt(LocalDateTime.now()).confirmedAt(LocalDateTime.now()).build();
        GroupSettlementPayment fromGuest = GroupSettlementPayment.builder()
            .id(101L).group(group).fromMemberKey("guest-7").toMemberKey("user-1")
            .settlementAmount(new BigDecimal("20")).proofContentType("application/pdf")
            .proofUploadedAt(LocalDateTime.now()).confirmedAt(null).build();
        GroupSettlementPayment unknown = GroupSettlementPayment.builder()
            .id(102L).group(group).fromMemberKey("weird").toMemberKey("user-1")
            .settlementAmount(new BigDecimal("1")).proofUploadedAt(LocalDateTime.now()).build();

        when(settlementPaymentRepository
            .findAllByToMemberKeyAndProofUploadedAtIsNotNullOrderByProofUploadedAtDesc("user-1"))
            .thenReturn(List.of(fromUser, fromGuest, unknown));
        when(groupRepository.findAllById(Set.of(10L))).thenReturn(List.of(group));
        when(guestMemberRepository.findAll()).thenReturn(List.of(guest));
        when(userRepository.findAll()).thenReturn(List.of(currentUser, payer));

        List<UserDocumentResponse> docs = service.listReceivedDocuments();
        assertThat(docs).hasSize(3);
        assertThat(docs.get(0).getFromMemberName()).isEqualTo("Bob Lopez");
        assertThat(docs.get(1).getFromMemberName()).isEqualTo("Invitado X");
        assertThat(docs.get(2).getFromMemberName()).isEqualTo("Integrante");
        assertThat(docs.get(0).getGroupTitle()).isEqualTo("Asado");
    }

    @Test
    void listReceivedDocuments_missingUserFallsBackToEmailOrIntegrante() {
        User nameless = User.builder().id(3L).name(" ").lastname(" ").email("x@y.com")
            .password("x").verified(true).build();
        GroupSettlementPayment payment = GroupSettlementPayment.builder()
            .id(1L).group(group).fromMemberKey("user-3").toMemberKey("user-1")
            .settlementAmount(BigDecimal.ONE).proofUploadedAt(LocalDateTime.now()).build();
        when(settlementPaymentRepository
            .findAllByToMemberKeyAndProofUploadedAtIsNotNullOrderByProofUploadedAtDesc("user-1"))
            .thenReturn(List.of(payment));
        when(groupRepository.findAllById(Set.of(10L))).thenReturn(List.of(group));
        when(guestMemberRepository.findAll()).thenReturn(List.of());
        when(userRepository.findAll()).thenReturn(List.of(nameless));

        assertThat(service.listReceivedDocuments().get(0).getFromMemberName()).isEqualTo("x@y.com");
    }
}
