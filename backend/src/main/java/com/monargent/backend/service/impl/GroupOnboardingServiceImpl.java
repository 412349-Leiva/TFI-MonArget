package com.monargent.backend.service.impl;

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
import com.monargent.backend.service.GroupOnboardingService;
import com.monargent.backend.service.TransactionService;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class GroupOnboardingServiceImpl implements GroupOnboardingService {

    private final GroupGuestMemberRepository groupGuestMemberRepository;
    private final GroupRepository groupRepository;
    private final GroupExpenseRepository groupExpenseRepository;
    private final GroupInvitationRepository groupInvitationRepository;
    private final GroupSettlementPaymentRepository settlementPaymentRepository;
    private final TransactionService transactionService;

    @Override
    public void onUserRegistered(User user) {
        List<String> migratedGuestKeys = linkGuestMemberships(user);
        acceptPendingInvitations(user);
        recordPendingCreditorIncomes(user, migratedGuestKeys);
    }

    private List<String> linkGuestMemberships(User user) {
        List<GroupGuestMember> guests = groupGuestMemberRepository.findAllByEmailIgnoreCase(user.getEmail());
        List<String> migratedKeys = new ArrayList<>();

        for (GroupGuestMember guest : guests) {
            Group group = guest.getGroup();
            String oldKey = guestMemberKey(guest.getId());
            String newKey = userMemberKey(user.getId());
            migratedKeys.add(oldKey);

            if (group.getMembers().stream().noneMatch(member -> member.getId().equals(user.getId()))) {
                group.getMembers().add(user);
            }

            List<GroupExpense> expenses = groupExpenseRepository.findAllByGroupId(group.getId());
            for (GroupExpense expense : expenses) {
                if (expense.getPaidByGuest() != null && expense.getPaidByGuest().getId().equals(guest.getId())) {
                    expense.setPaidBy(user);
                    expense.setPaidByGuest(null);
                }
            }

            remapSettlementMemberKeys(group.getId(), oldKey, newKey);
            groupGuestMemberRepository.delete(guest);
            groupRepository.save(group);
            log.info("Guest {} linked to user {} in group {}", guest.getEmail(), user.getEmail(), group.getTitle());
        }

        return migratedKeys;
    }

    private void acceptPendingInvitations(User user) {
        List<GroupInvitation> invitations = groupInvitationRepository
            .findByInvitedEmailIgnoreCaseAndStatus(user.getEmail(), GroupInvitationStatus.PENDING);

        for (GroupInvitation invitation : invitations) {
            Group group = invitation.getGroup();
            if (group.getMembers().stream().noneMatch(member -> member.getId().equals(user.getId()))) {
                group.getMembers().add(user);
            }
            invitation.setStatus(GroupInvitationStatus.ACCEPTED);
            groupRepository.save(group);
        }
    }

    private void recordPendingCreditorIncomes(User user, List<String> migratedGuestKeys) {
        // migratedGuestKeys reserved for future audit/logging
        String userKey = userMemberKey(user.getId());
        settlementPaymentRepository.findAllByToMemberKey(userKey).forEach(payment -> {
            if (!payment.isConfirmed() || payment.isCreditorIncomeRecorded()) {
                return;
            }
            Group group = payment.getGroup();
            transactionService.createFromGroupSettlement(
                user,
                TransactionType.INCOME,
                payment.getSettlementAmount(),
                group.getTitle(),
                "integrante",
                group.getId()
            );
            payment.setCreditorIncomeRecorded(true);
            settlementPaymentRepository.save(payment);
        });
    }

    private void remapSettlementMemberKeys(Long groupId, String oldKey, String newKey) {
        settlementPaymentRepository.findAllByGroupId(groupId).forEach(payment -> {
            boolean changed = false;
            if (oldKey.equals(payment.getFromMemberKey())) {
                payment.setFromMemberKey(newKey);
                changed = true;
            }
            if (oldKey.equals(payment.getToMemberKey())) {
                payment.setToMemberKey(newKey);
                changed = true;
            }
            if (changed) {
                settlementPaymentRepository.save(payment);
            }
        });
    }

    private String guestMemberKey(Long guestId) {
        return "guest-" + guestId;
    }

    private String userMemberKey(Long userId) {
        return "user-" + userId;
    }
}
