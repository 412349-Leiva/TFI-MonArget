package com.monargent.backend.service.impl;

import com.monargent.backend.dto.group.GroupCreateRequest;
import com.monargent.backend.dto.group.GroupExpenseBatchRequest;
import com.monargent.backend.dto.group.GroupExpenseItemRequest;
import com.monargent.backend.dto.group.GroupExpenseItemResponse;
import com.monargent.backend.dto.group.GroupGuestCreateRequest;
import com.monargent.backend.dto.group.GroupInvitationResponse;
import com.monargent.backend.dto.group.GroupInviteRequest;
import com.monargent.backend.dto.group.GroupPaymentLinkRequest;
import com.monargent.backend.dto.group.GroupPaymentLinkResponse;
import com.monargent.backend.dto.group.GroupMemberResponse;
import com.monargent.backend.dto.group.GroupResponse;
import com.monargent.backend.dto.group.GroupSettlementResponse;
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
import com.monargent.backend.service.GroupGuestDebtEmailService;
import com.monargent.backend.service.GroupService;
import com.monargent.backend.service.MercadoPagoPaymentLinkService;
import com.monargent.backend.service.MercadoPagoTokenService;
import com.monargent.backend.service.NotificationService;
import com.monargent.backend.service.group.GroupSettlementCalculator;
import com.monargent.backend.service.group.GroupSettlementCalculator.Participant;
import com.monargent.backend.service.group.GroupSettlementCalculator.Transfer;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
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
    private final GroupGuestDebtEmailService groupGuestDebtEmailService;
    private final MercadoPagoTokenService mercadoPagoTokenService;
    private final MercadoPagoPaymentLinkService mercadoPagoPaymentLinkService;

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

        GroupInvitation invitation = groupInvitationRepository.save(GroupInvitation.builder()
            .group(group)
            .invitedEmail(email)
            .invitedBy(currentUser)
            .status(GroupInvitationStatus.PENDING)
            .build());

        userRepository.findByEmailIgnoreCase(email).ifPresent(invitedUser ->
            notificationService.createNotification(
                invitedUser,
                NotificationType.GROUP,
                currentUser.getName() + " te invitó al grupo \"" + group.getTitle() + "\".",
                invitation.getId()
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
            .email(request.getEmail().trim().toLowerCase(Locale.ROOT))
            .addedBy(currentUser)
            .build();
        guest = groupGuestMemberRepository.save(guest);

        saveGuestExpenses(group, guest, request.resolvedItems());

        GroupResponse detail = toDetail(group, currentUser.getId());
        groupGuestDebtEmailService.sendGuestDebtSummary(guest, group, detail);
        return detail;
    }

    @Override
    public GroupResponse addMyExpenses(Long groupId, GroupExpenseBatchRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        Group group = findOwnedGroup(groupId);

        boolean isMember = group.getMembers().stream()
            .anyMatch(member -> member.getId().equals(currentUser.getId()));
        if (!isMember) {
            throw new InvalidRequestException("Solo los miembros del grupo pueden cargar gastos.");
        }

        saveUserExpenses(group, currentUser, request.getItems());
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

    @Override
    public GroupPaymentLinkResponse createPaymentLink(Long groupId, GroupPaymentLinkRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        Group group = findOwnedGroup(groupId);

        Long creditorUserId = parseUserMemberKey(request.getToMemberKey());
        if (creditorUserId == null) {
            throw new InvalidRequestException("Solo se pueden generar links de pago a usuarios con cuenta.");
        }

        Optional<String> collectorToken = mercadoPagoTokenService.getValidAccessToken(creditorUserId);
        String creditorAlias = resolveMpAliasForMemberKey(group, request.getToMemberKey());
        String creditorNick = resolveNickForMemberKey(group, request.getToMemberKey());

        String paymentUrl = collectorToken
            .flatMap(token -> mercadoPagoPaymentLinkService.createPaymentLink(
                token,
                request.getAmount(),
                "MonArgent - " + group.getTitle() + " → " + creditorNick,
                currentUser.getEmail(),
                "group-" + group.getId() + "-user-" + currentUser.getId() + "-to-" + creditorUserId
            ))
            .orElseGet(() -> mercadoPagoPaymentLinkService.buildGuestPayPageUrl(
                creditorAlias,
                creditorNick,
                request.getAmount(),
                group.getTitle()
            ));

        return GroupPaymentLinkResponse.builder()
            .checkoutAvailable(collectorToken.isPresent())
            .paymentUrl(paymentUrl)
            .build();
    }

    private void saveUserExpenses(Group group, User user, List<GroupExpenseItemRequest> items) {
        if (items == null || items.isEmpty()) {
            throw new InvalidRequestException("Agregá al menos un gasto.");
        }
        for (GroupExpenseItemRequest item : items) {
            groupExpenseRepository.save(GroupExpense.builder()
                .group(group)
                .title(item.getTitle().trim())
                .amount(item.getAmount())
                .date(LocalDateTime.now())
                .paidBy(user)
                .build());
        }
    }

    private void saveGuestExpenses(Group group, GroupGuestMember guest, List<GroupExpenseItemRequest> items) {
        if (items == null) {
            return;
        }
        for (GroupExpenseItemRequest item : items) {
            if (item.getTitle() == null || item.getTitle().isBlank()
                || item.getAmount() == null || item.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            groupExpenseRepository.save(GroupExpense.builder()
                .group(group)
                .title(item.getTitle().trim())
                .amount(item.getAmount())
                .date(LocalDateTime.now())
                .paidByGuest(guest)
                .build());
        }
    }

    private Group findOwnedGroup(Long groupId) {
        Long userId = currentUserService.getCurrentUserId();
        return groupRepository.findByIdAndMemberId(groupId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Grupo no encontrado"));
    }

    private GroupSummaryResponse toSummary(Group group, Long userId) {
        List<GroupGuestMember> guests = groupGuestMemberRepository.findAllByGroupId(group.getId());
        List<GroupExpense> expenses = groupExpenseRepository.findAllByGroupId(group.getId());
        BigDecimal total = sumExpenses(expenses);

        return GroupSummaryResponse.builder()
            .id(group.getId())
            .title(group.getTitle())
            .memberCount(group.getMembers().size() + guests.size())
            .totalExpenses(total)
            .myBalance(calculateMyBalance(group, guests, expenses, userId, total))
            .build();
    }

    private GroupResponse toDetail(Group group, Long userId) {
        List<GroupGuestMember> guests = groupGuestMemberRepository.findAllByGroupId(group.getId());
        List<GroupExpense> expenses = groupExpenseRepository.findAllByGroupId(group.getId());
        BigDecimal total = sumExpenses(expenses);
        int memberCount = group.getMembers().size() + guests.size();

        Map<String, List<GroupExpenseItemResponse>> itemsByMember = new HashMap<>();
        Map<String, BigDecimal> spentByMember = new HashMap<>();

        for (GroupExpense expense : expenses) {
            String memberKey = resolveExpenseMemberKey(expense);
            if (memberKey == null) {
                continue;
            }
            spentByMember.merge(memberKey, expense.getAmount(), BigDecimal::add);
            itemsByMember.computeIfAbsent(memberKey, key -> new ArrayList<>())
                .add(GroupExpenseItemResponse.builder()
                    .id(expense.getId())
                    .title(expense.getTitle())
                    .amount(expense.getAmount())
                    .build());
        }

        List<GroupMemberResponse> members = new ArrayList<>();
        List<Participant> participants = new ArrayList<>();
        String currentUserMemberKey = null;

        for (User member : group.getMembers()) {
            String memberKey = userMemberKey(member.getId());
            boolean isCurrent = member.getId().equals(userId);
            if (isCurrent) {
                currentUserMemberKey = memberKey;
            }
            String nick = resolveUserNick(member);
            BigDecimal spent = spentByMember.getOrDefault(memberKey, BigDecimal.ZERO);

            members.add(GroupMemberResponse.builder()
                .memberKey(memberKey)
                .userId(member.getId())
                .name(fullName(member))
                .nick(nick)
                .email(member.getEmail())
                .mpAlias(member.getMpAlias())
                .guest(false)
                .currentUser(isCurrent)
                .totalSpent(spent)
                .items(itemsByMember.getOrDefault(memberKey, List.of()))
                .build());

            participants.add(Participant.builder()
                .memberKey(memberKey)
                .nick(nick)
                .mpAlias(member.getMpAlias())
                .paid(spent)
                .currentUser(isCurrent)
                .build());
        }

        for (GroupGuestMember guest : guests) {
            String memberKey = guestMemberKey(guest.getId());
            String nick = guest.getMpAlias();
            BigDecimal spent = spentByMember.getOrDefault(memberKey, BigDecimal.ZERO);

            members.add(GroupMemberResponse.builder()
                .memberKey(memberKey)
                .name(guest.getDisplayName())
                .nick(nick)
                .email(guest.getEmail())
                .mpAlias(guest.getMpAlias())
                .guest(true)
                .guestId(guest.getId())
                .currentUser(false)
                .totalSpent(spent)
                .items(itemsByMember.getOrDefault(memberKey, List.of()))
                .build());

            participants.add(Participant.builder()
                .memberKey(memberKey)
                .nick(nick)
                .mpAlias(guest.getMpAlias())
                .paid(spent)
                .currentUser(false)
                .build());
        }

        BigDecimal sharePerPerson = memberCount > 0 && total.compareTo(BigDecimal.ZERO) > 0
            ? total.divide(BigDecimal.valueOf(memberCount), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        final String resolvedCurrentUserKey = currentUserMemberKey;

        List<GroupSettlementResponse> settlements = GroupSettlementCalculator.compute(participants).stream()
            .map(transfer -> toSettlementResponse(transfer, resolvedCurrentUserKey))
            .toList();

        return GroupResponse.builder()
            .id(group.getId())
            .title(group.getTitle())
            .description(group.getDescription())
            .createdAt(group.getCreatedAt())
            .memberCount(memberCount)
            .totalExpenses(total)
            .sharePerPerson(sharePerPerson)
            .myBalance(calculateMyBalance(group, guests, expenses, userId, total))
            .currentUserMemberKey(currentUserMemberKey)
            .members(members)
            .settlements(settlements)
            .build();
    }

    private GroupSettlementResponse toSettlementResponse(
        Transfer transfer,
        String currentUserMemberKey
    ) {
        boolean involvesCurrentUser = currentUserMemberKey != null
            && (currentUserMemberKey.equals(transfer.getFromMemberKey())
            || currentUserMemberKey.equals(transfer.getToMemberKey()));

        return GroupSettlementResponse.builder()
            .fromMemberKey(transfer.getFromMemberKey())
            .toMemberKey(transfer.getToMemberKey())
            .fromNick(transfer.getFromNick())
            .fromMpAlias(transfer.getFromMpAlias())
            .toNick(transfer.getToNick())
            .toMpAlias(transfer.getToMpAlias())
            .amount(transfer.getAmount())
            .involvesCurrentUser(involvesCurrentUser)
            .toMpCheckoutAvailable(isCreditorCheckoutAvailable(transfer.getToMemberKey()))
            .build();
    }

    private Long parseUserMemberKey(String memberKey) {
        if (memberKey == null || !memberKey.startsWith("user-")) {
            return null;
        }
        try {
            return Long.parseLong(memberKey.substring("user-".length()));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String resolveMpAliasForMemberKey(Group group, String memberKey) {
        Long userId = parseUserMemberKey(memberKey);
        if (userId == null) {
            return "";
        }
        return group.getMembers().stream()
            .filter(member -> member.getId().equals(userId))
            .map(User::getMpAlias)
            .findFirst()
            .orElse("");
    }

    private String resolveNickForMemberKey(Group group, String memberKey) {
        Long userId = parseUserMemberKey(memberKey);
        if (userId == null) {
            return "integrante";
        }
        return group.getMembers().stream()
            .filter(member -> member.getId().equals(userId))
            .map(this::resolveUserNick)
            .findFirst()
            .orElse("integrante");
    }

    private boolean isCreditorCheckoutAvailable(String toMemberKey) {
        Long userId = parseUserMemberKey(toMemberKey);
        if (userId == null) {
            return false;
        }
        return mercadoPagoTokenService.getValidAccessToken(userId).isPresent();
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

    private BigDecimal calculateMyBalance(
        Group group,
        List<GroupGuestMember> guests,
        List<GroupExpense> expenses,
        Long userId,
        BigDecimal total
    ) {
        int memberCount = group.getMembers().size() + guests.size();
        if (memberCount == 0 || total.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal share = total.divide(BigDecimal.valueOf(memberCount), 2, RoundingMode.HALF_UP);
        BigDecimal mySpent = expenses.stream()
            .filter(expense -> expense.getPaidBy() != null && expense.getPaidBy().getId().equals(userId))
            .map(GroupExpense::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return mySpent.subtract(share);
    }

    private String resolveExpenseMemberKey(GroupExpense expense) {
        if (expense.getPaidBy() != null) {
            return userMemberKey(expense.getPaidBy().getId());
        }
        if (expense.getPaidByGuest() != null) {
            return guestMemberKey(expense.getPaidByGuest().getId());
        }
        return null;
    }

    private String userMemberKey(Long userId) {
        return "user-" + userId;
    }

    private String guestMemberKey(Long guestId) {
        return "guest-" + guestId;
    }

    private String resolveUserNick(User user) {
        if (user.getMpAlias() != null && !user.getMpAlias().isBlank()) {
            return user.getMpAlias().trim();
        }
        String source = user.getName() != null && !user.getName().isBlank()
            ? user.getName()
            : user.getEmail().split("@")[0];
        return slugify(source);
    }

    private String slugify(String value) {
        return value.trim()
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "_")
            .replaceAll("^_|_$", "");
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
