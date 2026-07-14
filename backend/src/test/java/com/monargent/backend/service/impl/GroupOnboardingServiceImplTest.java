package com.monargent.backend.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.monargent.backend.entity.Group;
import com.monargent.backend.entity.GroupExpense;
import com.monargent.backend.entity.GroupGuestMember;
import com.monargent.backend.entity.GroupInvitation;
import com.monargent.backend.entity.GroupSettlementPayment;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.GroupInvitationStatus;
import com.monargent.backend.enums.TransactionType;
import com.monargent.backend.repository.GroupExpenseRepository;
import com.monargent.backend.repository.GroupGuestMemberRepository;
import com.monargent.backend.repository.GroupInvitationRepository;
import com.monargent.backend.repository.GroupRepository;
import com.monargent.backend.repository.GroupSettlementPaymentRepository;
import com.monargent.backend.service.TransactionService;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GroupOnboardingServiceImplTest {

    @Mock private GroupGuestMemberRepository groupGuestMemberRepository;
    @Mock private GroupRepository groupRepository;
    @Mock private GroupExpenseRepository groupExpenseRepository;
    @Mock private GroupInvitationRepository groupInvitationRepository;
    @Mock private GroupSettlementPaymentRepository settlementPaymentRepository;
    @Mock private TransactionService transactionService;

    @InjectMocks
    private GroupOnboardingServiceImpl service;

    @Test
    void onUserRegistered_linksGuest_acceptsInvites_andRecordsIncome() {
        User user = User.builder().id(50L).name("Nuevo").lastname("User")
            .email("guest@example.com").password("x").verified(true).build();
        Group group = Group.builder().id(10L).title("Viaje").members(new HashSet<>()).build();
        GroupGuestMember guest = GroupGuestMember.builder()
            .id(7L).email("guest@example.com").displayName("Guest").group(group).build();
        GroupExpense expense = GroupExpense.builder()
            .id(1L).title("Taxi").amount(new BigDecimal("30")).paidByGuest(guest).group(group).build();
        GroupSettlementPayment payment = GroupSettlementPayment.builder()
            .id(2L).group(group).fromMemberKey("guest-7").toMemberKey("user-9")
            .settlementAmount(new BigDecimal("10")).build();
        GroupSettlementPayment incomePayment = GroupSettlementPayment.builder()
            .id(3L).group(group).fromMemberKey("user-9").toMemberKey("user-50")
            .settlementAmount(new BigDecimal("40"))
            .confirmedAt(java.time.LocalDateTime.now())
            .creditorIncomeRecorded(false).build();
        GroupInvitation invitation = GroupInvitation.builder()
            .id(4L).group(group).invitedEmail("guest@example.com")
            .status(GroupInvitationStatus.PENDING).build();

        when(groupGuestMemberRepository.findAllByEmailIgnoreCase("guest@example.com"))
            .thenReturn(List.of(guest));
        when(groupExpenseRepository.findAllByGroupId(10L)).thenReturn(List.of(expense));
        when(settlementPaymentRepository.findAllByGroupId(10L)).thenReturn(List.of(payment));
        when(groupInvitationRepository.findByInvitedEmailIgnoreCaseAndStatus(
            "guest@example.com", GroupInvitationStatus.PENDING)).thenReturn(List.of(invitation));
        when(settlementPaymentRepository.findAllByToMemberKey("user-50"))
            .thenReturn(List.of(incomePayment));

        service.onUserRegistered(user);

        verify(groupGuestMemberRepository).delete(guest);
        verify(groupRepository, org.mockito.Mockito.atLeastOnce()).save(group);
        verify(settlementPaymentRepository).save(payment);
        org.assertj.core.api.Assertions.assertThat(payment.getFromMemberKey()).isEqualTo("user-50");
        org.assertj.core.api.Assertions.assertThat(expense.getPaidBy()).isEqualTo(user);
        org.assertj.core.api.Assertions.assertThat(invitation.getStatus()).isEqualTo(GroupInvitationStatus.ACCEPTED);
        verify(transactionService).createFromGroupSettlement(
            eq(user), eq(TransactionType.INCOME), eq(new BigDecimal("40")),
            eq("Viaje"), eq("integrante"), eq(10L));
        verify(settlementPaymentRepository).save(incomePayment);
    }

    @Test
    void onUserRegistered_skipsAlreadyRecordedIncome() {
        User user = User.builder().id(1L).name("A").lastname("B")
            .email("a@example.com").password("x").verified(true).build();
        when(groupGuestMemberRepository.findAllByEmailIgnoreCase("a@example.com")).thenReturn(List.of());
        when(groupInvitationRepository.findByInvitedEmailIgnoreCaseAndStatus(
            "a@example.com", GroupInvitationStatus.PENDING)).thenReturn(List.of());
        GroupSettlementPayment unpaid = GroupSettlementPayment.builder()
            .confirmedAt(null).creditorIncomeRecorded(false).build();
        when(settlementPaymentRepository.findAllByToMemberKey("user-1")).thenReturn(List.of(unpaid));

        service.onUserRegistered(user);
        verify(transactionService, never()).createFromGroupSettlement(any(), any(), any(), any(), any(), any());
    }
}
