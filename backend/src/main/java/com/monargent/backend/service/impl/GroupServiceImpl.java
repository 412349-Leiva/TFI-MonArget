package com.monargent.backend.service.impl;

import com.monargent.backend.dto.group.GroupCreateRequest;
import com.monargent.backend.dto.group.GroupExpenseResponse;
import com.monargent.backend.dto.group.GroupGuestCreateRequest;
import com.monargent.backend.dto.group.GroupInvitationResponse;
import com.monargent.backend.dto.group.GroupInviteRequest;
import com.monargent.backend.dto.group.GroupMemberResponse;
import com.monargent.backend.dto.group.GroupResponse;
import com.monargent.backend.dto.group.GroupSummaryResponse;
import com.monargent.backend.entity.Group;
import com.monargent.backend.entity.GroupExpense;
import com.monargent.backend.entity.GroupGuestMember;
import com.monargent.backend.entity.GroupInvitation;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.GroupInvitationStatus;
import com.monargent.backend.enums.NotificationType;
import com.monargent.backend.exception.InvalidRequestException;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.repository.GroupExpenseRepository;
import com.monargent.backend.repository.GroupGuestMemberRepository;
import com.monargent.backend.repository.GroupInvitationRepository;
import com.monargent.backend.repository.GroupRepository;
import com.monargent.backend.repository.UserRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.GroupService;
import com.monargent.backend.service.NotificationService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class GroupServiceImpl implements GroupService {

    private final GroupRepository groupRepository;
    private final GroupExpenseRepository groupExpenseRepository;
    private final GroupGuestMemberRepository groupGuestMemberRepository;
    private final GroupInvitationRepository groupInvitationRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public List<GroupSummaryResponse> findAllForCurrentUser() {
        Long userId = currentUserService.getCurrentUserId();
        return groupRepository.findAllByMemberId(userId).stream()
            .map(group -> toSummary(group, userId))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public GroupResponse findById(Long groupId) {
        Group group = findOwnedGroup(groupId);
        return toDetail(group, currentUserService.getCurrentUserId());
    }

    @Override
    public GroupResponse create(GroupCreateRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        Set<User> members = new HashSet<>();
        members.add(currentUser);

        Group group = Group.builder()
            .title(request.getTitle().trim())
            .description(request.getDescription() == null ? null : request.getDescription().trim())
            .createdBy(currentUser)
            .members(members)
            .build();

        return toDetail(groupRepository.save(group), currentUser.getId());
    }

    @Override
    public void inviteMember(Long groupId, GroupInviteRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        Group group = findOwnedGroup(groupId);
        String email = normalizeEmail(request.getEmail());

        if (email.equalsIgnoreCase(currentUser.getEmail())) {
            throw new InvalidRequestException("No podés invitarte a vos mismo.");
        }

        boolean alreadyMember = group.getMembers().stream()
            .anyMatch(member -> member.getEmail().equalsIgnoreCase(email));
        if (alreadyMember) {
            throw new InvalidRequestException("Esa persona ya es miembro del grupo.");
        }

        if (groupInvitationRepository.existsByGroupIdAndInvitedEmailIgnoreCaseAndStatus(
            groupId, email, GroupInvitationStatus.PENDING)) {
            throw new InvalidRequestException("Ya hay una invitación pendiente para ese correo.");
        }

        GroupInvitation invitation = GroupInvitation.builder()
            .group(group)
            .invitedEmail(email)
            .invitedBy(currentUser)
            .status(GroupInvitationStatus.PENDING)
            .build();
        groupInvitationRepository.save(invitation);

        userRepository.findByEmailIgnoreCase(email).ifPresent(invitedUser ->
            notificationService.createNotification(
                invitedUser,
                NotificationType.GROUP,
                currentUser.getName() + " te invitó al grupo \"" + group.getTitle() + "\"."
            )
        );
    }

    @Override
    public GroupResponse addGuest(Long groupId, GroupGuestCreateRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        Group group = findOwnedGroup(groupId);

        GroupGuestMember guest = GroupGuestMember.builder()
            .group(group)
            .displayName(request.getName().trim())
            .mpAlias(request.getMpAlias().trim())
            .addedBy(currentUser)
            .build();
        guest = groupGuestMemberRepository.save(guest);

        if (request.getExpenseTitle() != null && !request.getExpenseTitle().isBlank()
            && request.getExpenseAmount() != null) {
            GroupExpense expense = GroupExpense.builder()
                .group(group)
                .title(request.getExpenseTitle().trim())
                .amount(request.getExpenseAmount())
                .date(LocalDateTime.now())
                .paidByGuest(guest)
                .build();
            groupExpenseRepository.save(expense);
        }

        return toDetail(group, currentUser.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<GroupInvitationResponse> findPendingInvitations() {
        String email = currentUserService.getCurrentUser().getEmail();
        return groupInvitationRepository
            .findByInvitedEmailIgnoreCaseAndStatus(email, GroupInvitationStatus.PENDING)
            .stream()
            .map(this::toInvitationResponse)
            .toList();
    }

    @Override
    public GroupResponse acceptInvitation(Long invitationId) {
        User currentUser = currentUserService.getCurrentUser();
        GroupInvitation invitation = groupInvitationRepository
            .findByIdAndInvitedEmailIgnoreCase(invitationId, currentUser.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("Invitación no encontrada"));

        if (invitation.getStatus() != GroupInvitationStatus.PENDING) {
            throw new InvalidRequestException("La invitación ya fue respondida.");
        }

        Group group = invitation.getGroup();
        group.getMembers().add(currentUser);
        invitation.setStatus(GroupInvitationStatus.ACCEPTED);

        return toDetail(groupRepository.save(group), currentUser.getId());
    }

    @Override
    public void rejectInvitation(Long invitationId) {
        User currentUser = currentUserService.getCurrentUser();
        GroupInvitation invitation = groupInvitationRepository
            .findByIdAndInvitedEmailIgnoreCase(invitationId, currentUser.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("Invitación no encontrada"));

        if (invitation.getStatus() != GroupInvitationStatus.PENDING) {
            throw new InvalidRequestException("La invitación ya fue respondida.");
        }

        invitation.setStatus(GroupInvitationStatus.REJECTED);
        groupInvitationRepository.save(invitation);
    }

    private Group findOwnedGroup(Long groupId) {
        Long userId = currentUserService.getCurrentUserId();
        return groupRepository.findByIdAndMemberId(groupId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Grupo no encontrado"));
    }

    private GroupSummaryResponse toSummary(Group group, Long userId) {
        List<GroupGuestMember> guests = groupGuestMemberRepository.findAllByGroupId(group.getId());
        List<GroupExpense> expenses = groupExpenseRepository.findAllByGroupId(group.getId());

        return GroupSummaryResponse.builder()
            .id(group.getId())
            .title(group.getTitle())
            .memberCount(group.getMembers().size() + guests.size())
            .totalExpenses(sumExpenses(expenses))
            .myBalance(calculateUserBalance(group, guests, expenses, userId))
            .build();
    }

    private GroupResponse toDetail(Group group, Long userId) {
        List<GroupGuestMember> guests = groupGuestMemberRepository.findAllByGroupId(group.getId());
        List<GroupExpense> expenses = groupExpenseRepository.findAllByGroupId(group.getId());

        List<GroupMemberResponse> members = new ArrayList<>();
        group.getMembers().forEach(member -> members.add(GroupMemberResponse.builder()
            .userId(member.getId())
            .name(fullName(member))
            .email(member.getEmail())
            .mpAlias(member.getMpAlias())
            .guest(false)
            .build()));
        guests.forEach(guest -> members.add(GroupMemberResponse.builder()
            .guestId(guest.getId())
            .name(guest.getDisplayName())
            .mpAlias(guest.getMpAlias())
            .guest(true)
            .build()));

        List<GroupExpenseResponse> expenseResponses = expenses.stream()
            .map(expense -> GroupExpenseResponse.builder()
                .id(expense.getId())
                .title(expense.getTitle())
                .amount(expense.getAmount())
                .date(expense.getDate())
                .paidByName(resolvePayerName(expense))
                .paidByAlias(resolvePayerAlias(expense))
                .build())
            .toList();

        return GroupResponse.builder()
            .id(group.getId())
            .title(group.getTitle())
            .description(group.getDescription())
            .createdAt(group.getCreatedAt())
            .memberCount(members.size())
            .totalExpenses(sumExpenses(expenses))
            .myBalance(calculateUserBalance(group, guests, expenses, userId))
            .members(members)
            .expenses(expenseResponses)
            .build();
    }

    private GroupInvitationResponse toInvitationResponse(GroupInvitation invitation) {
        return GroupInvitationResponse.builder()
            .id(invitation.getId())
            .groupId(invitation.getGroup().getId())
            .groupTitle(invitation.getGroup().getTitle())
            .invitedByName(fullName(invitation.getInvitedBy()))
            .invitedByEmail(invitation.getInvitedBy().getEmail())
            .status(invitation.getStatus().name())
            .createdAt(invitation.getCreatedAt())
            .build();
    }

    private BigDecimal sumExpenses(List<GroupExpense> expenses) {
        return expenses.stream()
            .map(GroupExpense::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateUserBalance(
        Group group,
        List<GroupGuestMember> guests,
        List<GroupExpense> expenses,
        Long userId
    ) {
        int memberCount = group.getMembers().size() + guests.size();
        if (memberCount == 0 || expenses.isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal balance = BigDecimal.ZERO;
        for (GroupExpense expense : expenses) {
            BigDecimal share = expense.getAmount()
                .divide(BigDecimal.valueOf(memberCount), 2, RoundingMode.HALF_UP);

            boolean userPaid = expense.getPaidBy() != null
                && expense.getPaidBy().getId().equals(userId);

            if (userPaid) {
                balance = balance.add(expense.getAmount().subtract(share));
            } else {
                balance = balance.subtract(share);
            }
        }
        return balance;
    }

    private String resolvePayerName(GroupExpense expense) {
        if (expense.getPaidBy() != null) {
            return fullName(expense.getPaidBy());
        }
        if (expense.getPaidByGuest() != null) {
            return expense.getPaidByGuest().getDisplayName();
        }
        return "Desconocido";
    }

    private String resolvePayerAlias(GroupExpense expense) {
        if (expense.getPaidBy() != null) {
            return expense.getPaidBy().getMpAlias();
        }
        if (expense.getPaidByGuest() != null) {
            return expense.getPaidByGuest().getMpAlias();
        }
        return null;
    }

    private String fullName(User user) {
        String name = user.getName() == null ? "" : user.getName().trim();
        String lastname = user.getLastname() == null ? "" : user.getLastname().trim();
        if (name.isBlank()) {
            return lastname.isBlank() ? user.getEmail() : lastname;
        }
        return lastname.isBlank() ? name : name + " " + lastname;
    }

    private String normalizeEmail(String email) {
        return email.toLowerCase(Locale.ROOT).trim();
    }
}
