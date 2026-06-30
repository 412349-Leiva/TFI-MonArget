package com.monargent.backend.service.impl;

import com.monargent.backend.dto.group.GroupCreateRequest;
import com.monargent.backend.dto.group.GroupExpenseBatchRequest;
import com.monargent.backend.dto.group.GroupExpenseItemRequest;
import com.monargent.backend.dto.group.GroupExpenseItemResponse;
import com.monargent.backend.dto.group.GroupGuestCreateRequest;
import com.monargent.backend.dto.group.GroupInvitationResponse;
import com.monargent.backend.dto.group.GroupInviteRequest;
import com.monargent.backend.dto.group.GroupMemberResponse;
import com.monargent.backend.dto.group.GroupResponse;
import com.monargent.backend.dto.group.GroupSettlementMarkPaidRequest;
import com.monargent.backend.dto.group.GroupSettlementResponse;
import com.monargent.backend.dto.group.GroupSummaryResponse;
import com.monargent.backend.entity.Group;
import com.monargent.backend.entity.GroupExpense;
import com.monargent.backend.entity.GroupGuestMember;
import com.monargent.backend.entity.GroupInvitation;
import com.monargent.backend.entity.GroupMovementConfirmation;
import com.monargent.backend.entity.GroupSettlementPayment;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.GroupInvitationStatus;
import com.monargent.backend.enums.GroupLifecycleStatus;
import com.monargent.backend.enums.NotificationType;
import com.monargent.backend.exception.InvalidRequestException;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.repository.GroupExpenseRepository;
import com.monargent.backend.repository.GroupGuestMemberRepository;
import com.monargent.backend.repository.GroupInvitationRepository;
import com.monargent.backend.repository.GroupMovementConfirmationRepository;
import com.monargent.backend.repository.GroupRepository;
import com.monargent.backend.repository.GroupSettlementPaymentRepository;
import com.monargent.backend.repository.UserRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.GroupGuestDebtEmailService;
import com.monargent.backend.service.GroupService;
import com.monargent.backend.service.NotificationService;
import com.monargent.backend.service.SettlementProofStorageService;
import com.monargent.backend.service.group.GroupSettlementCalculator;
import com.monargent.backend.service.group.GroupSettlementCalculator.Participant;
import com.monargent.backend.service.group.GroupSettlementCalculator.Transfer;
import java.math.BigDecimal;
import java.text.NumberFormat;
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
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class GroupServiceImpl implements GroupService {

    private final GroupRepository groupRepository;
    private final GroupExpenseRepository groupExpenseRepository;
    private final GroupGuestMemberRepository groupGuestMemberRepository;
    private final GroupInvitationRepository groupInvitationRepository;
    private final GroupSettlementPaymentRepository settlementPaymentRepository;
    private final GroupMovementConfirmationRepository movementConfirmationRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final NotificationService notificationService;
    private final GroupGuestDebtEmailService groupGuestDebtEmailService;
    private final SettlementProofStorageService settlementProofStorageService;

    public GroupServiceImpl(
        GroupRepository groupRepository,
        GroupExpenseRepository groupExpenseRepository,
        GroupGuestMemberRepository groupGuestMemberRepository,
        GroupInvitationRepository groupInvitationRepository,
        GroupSettlementPaymentRepository settlementPaymentRepository,
        GroupMovementConfirmationRepository movementConfirmationRepository,
        UserRepository userRepository,
        CurrentUserService currentUserService,
        NotificationService notificationService,
        GroupGuestDebtEmailService groupGuestDebtEmailService,
        SettlementProofStorageService settlementProofStorageService
    ) {
        this.groupRepository = groupRepository;
        this.groupExpenseRepository = groupExpenseRepository;
        this.groupGuestMemberRepository = groupGuestMemberRepository;
        this.groupInvitationRepository = groupInvitationRepository;
        this.settlementPaymentRepository = settlementPaymentRepository;
        this.movementConfirmationRepository = movementConfirmationRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.notificationService = notificationService;
        this.groupGuestDebtEmailService = groupGuestDebtEmailService;
        this.settlementProofStorageService = settlementProofStorageService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<GroupSummaryResponse> findAllForCurrentUser() {
        Long userId = currentUserService.getCurrentUserId();
        return groupRepository.findAllByMemberId(userId).stream()
            .filter(group -> group.getLifecycleStatus() != GroupLifecycleStatus.CLOSED)
            .map(group -> toSummary(group, userId))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<GroupSummaryResponse> findHistoryForCurrentUser() {
        Long userId = currentUserService.getCurrentUserId();
        return groupRepository.findAllByMemberId(userId).stream()
            .filter(group -> group.getLifecycleStatus() == GroupLifecycleStatus.CLOSED)
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
        if (group.getLifecycleStatus() != GroupLifecycleStatus.OPEN) {
            throw new InvalidRequestException("Los movimientos ya están cerrados. No se pueden agregar más gastos.");
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
    public GroupResponse uploadSettlementProof(
        Long groupId,
        String fromMemberKey,
        String toMemberKey,
        MultipartFile file
    ) {
        User currentUser = currentUserService.getCurrentUser();
        Group group = findOwnedGroup(groupId);
        String currentKey = userMemberKey(currentUser.getId());

        if (!currentKey.equals(fromMemberKey)) {
            throw new InvalidRequestException("Solo quien debe puede subir el comprobante.");
        }
        if (group.getLifecycleStatus() != GroupLifecycleStatus.SETTLEMENT) {
            throw new InvalidRequestException("Confirmá los movimientos del grupo antes de pagar.");
        }

        GroupSettlementResponse settlement = findOpenSettlement(group, fromMemberKey, toMemberKey, currentUser.getId());

        if (settlementPaymentRepository.findByGroupIdAndFromMemberKeyAndToMemberKey(
            groupId, fromMemberKey, toMemberKey
        ).filter(GroupSettlementPayment::isConfirmed).isPresent()) {
            throw new InvalidRequestException("Esta liquidación ya está pagada.");
        }

        String storedName = settlementProofStorageService.store(file, groupId, fromMemberKey, toMemberKey);
        String contentType = file.getContentType();

        GroupSettlementPayment payment = settlementPaymentRepository
            .findByGroupIdAndFromMemberKeyAndToMemberKey(groupId, fromMemberKey, toMemberKey)
            .orElseGet(() -> GroupSettlementPayment.builder()
                .group(group)
                .fromMemberKey(fromMemberKey)
                .toMemberKey(toMemberKey)
                .markedBy(currentUser)
                .build());

        payment.setProofStoredName(storedName);
        payment.setProofContentType(contentType);
        payment.setProofUploadedAt(LocalDateTime.now());
        payment.setMarkedBy(currentUser);
        settlementPaymentRepository.save(payment);

        Long creditorUserId = parseUserMemberKey(toMemberKey);
        if (creditorUserId != null) {
            userRepository.findById(creditorUserId).ifPresent(creditor ->
                notificationService.createNotification(
                    creditor,
                    NotificationType.PAYMENT,
                    resolveUserNick(currentUser) + " subió un comprobante de "
                        + formatSettlementAmount(settlement.getAmount()) + " en \""
                        + group.getTitle() + "\". Revisalo y confirmá el pago.",
                    group.getId()
                )
            );
        }

        return toDetail(group, currentUser.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public Resource loadSettlementProof(Long groupId, String fromMemberKey, String toMemberKey) {
        User currentUser = currentUserService.getCurrentUser();
        Group group = findOwnedGroup(groupId);
        String currentKey = userMemberKey(currentUser.getId());

        if (!currentKey.equals(fromMemberKey) && !currentKey.equals(toMemberKey)) {
            throw new InvalidRequestException("No tenés acceso a este comprobante.");
        }

        GroupSettlementPayment payment = settlementPaymentRepository
            .findByGroupIdAndFromMemberKeyAndToMemberKey(groupId, fromMemberKey, toMemberKey)
            .filter(GroupSettlementPayment::hasProof)
            .orElseThrow(() -> new InvalidRequestException("Todavía no hay comprobante para esta liquidación."));

        return settlementProofStorageService.load(payment.getProofStoredName());
    }

    @Override
    @Transactional(readOnly = true)
    public String resolveSettlementProofContentType(GroupSettlementPayment payment) {
        if (payment.getProofContentType() != null && !payment.getProofContentType().isBlank()) {
            return payment.getProofContentType();
        }
        return settlementProofStorageService.contentTypeFor(payment.getProofStoredName());
    }

    @Override
    public GroupResponse confirmSettlementPayment(Long groupId, GroupSettlementMarkPaidRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        Group group = findOwnedGroup(groupId);
        String currentKey = userMemberKey(currentUser.getId());

        if (!currentKey.equals(request.getToMemberKey())) {
            throw new InvalidRequestException("Solo quien cobra puede confirmar el pago.");
        }
        if (group.getLifecycleStatus() != GroupLifecycleStatus.SETTLEMENT) {
            throw new InvalidRequestException("Confirmá los movimientos del grupo antes de registrar pagos.");
        }

        GroupSettlementPayment payment = settlementPaymentRepository
            .findByGroupIdAndFromMemberKeyAndToMemberKey(
                groupId, request.getFromMemberKey(), request.getToMemberKey()
            )
            .filter(GroupSettlementPayment::hasProof)
            .orElseThrow(() -> new InvalidRequestException("El deudor todavía no subió el comprobante."));

        if (payment.isConfirmed()) {
            throw new InvalidRequestException("Este pago ya fue confirmado.");
        }

        GroupSettlementResponse settlement = findOpenSettlement(
            group, request.getFromMemberKey(), request.getToMemberKey(), currentUser.getId()
        );

        payment.setConfirmedBy(currentUser);
        payment.setConfirmedAt(LocalDateTime.now());
        settlementPaymentRepository.save(payment);

        Long debtorUserId = parseUserMemberKey(request.getFromMemberKey());
        if (debtorUserId != null) {
            userRepository.findById(debtorUserId).ifPresent(debtor ->
                notificationService.createNotification(
                    debtor,
                    NotificationType.PAYMENT,
                    resolveUserNick(currentUser) + " confirmó tu pago de "
                        + formatSettlementAmount(settlement.getAmount()) + " en \""
                        + group.getTitle() + "\".",
                    group.getId()
                )
            );
        }

        closeGroupIfFullyPaid(group, currentUser.getId());
        return toDetail(group, currentUser.getId());
    }

    private GroupSettlementResponse findOpenSettlement(
        Group group,
        String fromMemberKey,
        String toMemberKey,
        Long userId
    ) {
        return toDetail(group, userId).getSettlements().stream()
            .filter(s -> s.getFromMemberKey().equals(fromMemberKey)
                && s.getToMemberKey().equals(toMemberKey)
                && !s.isPaid())
            .findFirst()
            .orElseThrow(() -> new InvalidRequestException("Liquidación no encontrada."));
    }

    @Override
    public GroupResponse confirmMovements(Long groupId) {
        User currentUser = currentUserService.getCurrentUser();
        Group group = findOwnedGroup(groupId);

        if (group.getLifecycleStatus() != GroupLifecycleStatus.OPEN) {
            throw new InvalidRequestException("Los movimientos ya fueron confirmados.");
        }

        List<GroupExpense> expenses = groupExpenseRepository.findAllByGroupId(groupId);
        if (expenses.isEmpty()) {
            throw new InvalidRequestException("Agregá gastos antes de confirmar los movimientos.");
        }

        if (movementConfirmationRepository.existsByGroupIdAndUserId(groupId, currentUser.getId())) {
            throw new InvalidRequestException("Ya confirmaste los movimientos.");
        }

        movementConfirmationRepository.save(GroupMovementConfirmation.builder()
            .group(group)
            .user(currentUser)
            .build());

        int required = group.getMembers().size();
        int confirmed = movementConfirmationRepository.findAllByGroupId(groupId).size();

        if (confirmed >= required) {
            group.setLifecycleStatus(GroupLifecycleStatus.SETTLEMENT);
            group.setMovementsConfirmedAt(LocalDateTime.now());
            groupRepository.save(group);

            for (User member : group.getMembers()) {
                notificationService.createNotification(
                    member,
                    NotificationType.GROUP,
                    "Todos confirmaron los movimientos en \"" + group.getTitle()
                        + "\". Ya podés ver la liquidación y pagar.",
                    group.getId()
                );
            }
        } else {
            for (User member : group.getMembers()) {
                if (member.getId().equals(currentUser.getId())) {
                    continue;
                }
                notificationService.createNotification(
                    member,
                    NotificationType.GROUP,
                    resolveUserNick(currentUser) + " confirmó los movimientos en \""
                        + group.getTitle() + "\" (" + confirmed + "/" + required + ").",
                    group.getId()
                );
            }
        }

        return toDetail(group, currentUser.getId());
    }

    private void closeGroupIfFullyPaid(Group group, Long userId) {
        GroupResponse detail = toDetail(group, userId);
        if (group.getLifecycleStatus() != GroupLifecycleStatus.SETTLEMENT) {
            return;
        }
        boolean allPaid = detail.getSettlements().isEmpty()
            || detail.getSettlements().stream().allMatch(GroupSettlementResponse::isPaid);
        if (allPaid) {
            group.setLifecycleStatus(GroupLifecycleStatus.CLOSED);
            groupRepository.save(group);
        }
    }

    private String formatSettlementAmount(BigDecimal amount) {
        NumberFormat formatter = NumberFormat.getNumberInstance(Locale.forLanguageTag("es-AR"));
        formatter.setMaximumFractionDigits(0);
        formatter.setMinimumFractionDigits(0);
        return "$" + formatter.format(amount.setScale(0, RoundingMode.HALF_UP));
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

        Set<Long> confirmedUserIds = movementConfirmationRepository.findAllByGroupId(group.getId()).stream()
            .map(c -> c.getUser().getId())
            .collect(java.util.stream.Collectors.toSet());
        int movementConfirmationsRequired = group.getMembers().size();
        int movementConfirmationsCount = confirmedUserIds.size();
        boolean currentUserConfirmedMovements = confirmedUserIds.contains(userId);

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
                .movementConfirmed(confirmedUserIds.contains(member.getId()))
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

        Map<String, GroupSettlementPayment> paymentsByKey = loadPaymentsByKey(group.getId());

        List<GroupSettlementResponse> settlements = group.getLifecycleStatus() == GroupLifecycleStatus.OPEN
            ? List.of()
            : GroupSettlementCalculator.compute(participants).stream()
                .map((Transfer transfer) -> toSettlementResponse(
                    transfer, resolvedCurrentUserKey, paymentsByKey
                ))
                .toList();

        boolean movementsConfirmed = group.getLifecycleStatus() != GroupLifecycleStatus.OPEN;
        boolean paymentsEnabled = group.getLifecycleStatus() == GroupLifecycleStatus.SETTLEMENT;
        boolean canConfirmMovements = group.getLifecycleStatus() == GroupLifecycleStatus.OPEN
            && !expenses.isEmpty()
            && !currentUserConfirmedMovements;

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
            .lifecycleStatus(group.getLifecycleStatus().name())
            .movementsConfirmed(movementsConfirmed)
            .paymentsEnabled(paymentsEnabled)
            .canConfirmMovements(canConfirmMovements)
            .currentUserConfirmedMovements(currentUserConfirmedMovements)
            .movementConfirmationsCount(movementConfirmationsCount)
            .movementConfirmationsRequired(movementConfirmationsRequired)
            .build();
    }

    private GroupSettlementResponse toSettlementResponse(
        Transfer transfer,
        String currentUserMemberKey,
        Map<String, GroupSettlementPayment> paymentsByKey
    ) {
        boolean involvesCurrentUser = currentUserMemberKey != null
            && (currentUserMemberKey.equals(transfer.getFromMemberKey())
            || currentUserMemberKey.equals(transfer.getToMemberKey()));

        String settlementKey = transfer.getFromMemberKey() + "->" + transfer.getToMemberKey();
        GroupSettlementPayment payment = paymentsByKey.get(settlementKey);
        boolean proofUploaded = payment != null && payment.hasProof();
        boolean paid = payment != null && payment.isConfirmed();
        boolean pendingConfirmation = proofUploaded && !paid;

        return GroupSettlementResponse.builder()
            .fromMemberKey(transfer.getFromMemberKey())
            .toMemberKey(transfer.getToMemberKey())
            .fromNick(transfer.getFromNick())
            .fromMpAlias(transfer.getFromMpAlias())
            .toNick(transfer.getToNick())
            .toMpAlias(transfer.getToMpAlias())
            .amount(transfer.getAmount())
            .involvesCurrentUser(involvesCurrentUser)
            .paid(paid)
            .proofUploaded(proofUploaded)
            .pendingConfirmation(pendingConfirmation)
            .build();
    }

    private Map<String, GroupSettlementPayment> loadPaymentsByKey(Long groupId) {
        Map<String, GroupSettlementPayment> map = new HashMap<>();
        for (GroupSettlementPayment payment : settlementPaymentRepository.findAllByGroupId(groupId)) {
            map.put(payment.getFromMemberKey() + "->" + payment.getToMemberKey(), payment);
        }
        return map;
    }

    private Set<String> loadPaidSettlementKeys(Long groupId) {
        Set<String> keys = new HashSet<>();
        for (GroupSettlementPayment payment : settlementPaymentRepository.findAllByGroupId(groupId)) {
            if (payment.isConfirmed()) {
                keys.add(payment.getFromMemberKey() + "->" + payment.getToMemberKey());
            }
        }
        return keys;
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
