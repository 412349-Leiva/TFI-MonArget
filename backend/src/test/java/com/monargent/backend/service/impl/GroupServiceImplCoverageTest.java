package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.monargent.backend.dto.group.GroupCreateRequest;
import com.monargent.backend.dto.group.GroupExpenseBatchRequest;
import com.monargent.backend.dto.group.GroupExpenseItemRequest;
import com.monargent.backend.dto.group.GroupGuestCreateRequest;
import com.monargent.backend.dto.group.GroupInviteRequest;
import com.monargent.backend.dto.group.GroupResponse;
import com.monargent.backend.dto.group.GroupSettlementMarkPaidRequest;
import com.monargent.backend.dto.group.GroupSummaryResponse;
import com.monargent.backend.entity.Category;
import com.monargent.backend.entity.Group;
import com.monargent.backend.entity.GroupExpense;
import com.monargent.backend.entity.GroupGuestMember;
import com.monargent.backend.entity.GroupInvitation;
import com.monargent.backend.entity.GroupMovementConfirmation;
import com.monargent.backend.entity.GroupSettlementPayment;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.CategoryType;
import com.monargent.backend.enums.GroupInvitationStatus;
import com.monargent.backend.enums.GroupLifecycleStatus;
import com.monargent.backend.enums.NotificationType;
import com.monargent.backend.enums.SettlementPaymentMethod;
import com.monargent.backend.exception.InvalidRequestException;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.repository.CategoryRepository;
import com.monargent.backend.repository.GroupExpenseRepository;
import com.monargent.backend.repository.GroupGuestMemberRepository;
import com.monargent.backend.repository.GroupInvitationRepository;
import com.monargent.backend.repository.GroupMovementConfirmationRepository;
import com.monargent.backend.repository.GroupRepository;
import com.monargent.backend.repository.GroupSettlementPaymentRepository;
import com.monargent.backend.repository.NotificationRepository;
import com.monargent.backend.repository.UserRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.GroupEmailService;
import com.monargent.backend.service.GuestSettlementTokenService;
import com.monargent.backend.service.NotificationService;
import com.monargent.backend.service.SettlementProofStorageService;
import com.monargent.backend.service.TransactionService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
class GroupServiceImplCoverageTest {

    @Mock private GroupRepository groupRepository;
    @Mock private GroupExpenseRepository groupExpenseRepository;
    @Mock private GroupGuestMemberRepository groupGuestMemberRepository;
    @Mock private GroupInvitationRepository groupInvitationRepository;
    @Mock private GroupSettlementPaymentRepository settlementPaymentRepository;
    @Mock private GroupMovementConfirmationRepository movementConfirmationRepository;
    @Mock private UserRepository userRepository;
    @Mock private CurrentUserService currentUserService;
    @Mock private NotificationService notificationService;
    @Mock private GroupEmailService groupEmailService;
    @Mock private SettlementProofStorageService settlementProofStorageService;
    @Mock private CategoryRepository categoryRepository;
    @Mock private TransactionService transactionService;
    @Mock private NotificationRepository notificationRepository;
    @Mock private GuestSettlementTokenService guestSettlementTokenService;

    @InjectMocks
    private GroupServiceImpl groupService;

    private User ana;
    private User bob;
    private Category category;

    @BeforeEach
    void setUp() {
        ana = User.builder().id(1L).name("Ana").lastname("Perez")
            .email("ana@example.com").password("x").verified(true).mpAlias("ana.mp").build();
        bob = User.builder().id(2L).name("Bob").lastname("Lopez")
            .email("bob@example.com").password("x").verified(true).build();
        category = Category.builder().id(5L).name("Comida").type(CategoryType.EXPENSE).user(ana).build();
        lenient().when(currentUserService.getCurrentUser()).thenReturn(ana);
        lenient().when(currentUserService.getCurrentUserId()).thenReturn(1L);
        stubEmptyDetailDeps();
    }

    private void stubEmptyDetailDeps() {
        lenient().when(groupGuestMemberRepository.findAllByGroupId(anyLong())).thenReturn(List.of());
        lenient().when(groupExpenseRepository.findAllByGroupId(anyLong())).thenReturn(List.of());
        lenient().when(movementConfirmationRepository.findAllByGroupId(anyLong())).thenReturn(List.of());
        lenient().when(settlementPaymentRepository.findAllByGroupId(anyLong())).thenReturn(List.of());
    }

    private Group openGroup(Long id, User... members) {
        Set<User> memberSet = new HashSet<>(Set.of(members));
        return Group.builder()
            .id(id)
            .title("Asado")
            .description("desc")
            .createdBy(ana)
            .members(memberSet)
            .lifecycleStatus(GroupLifecycleStatus.OPEN)
            .build();
    }

    private void stubOwned(Group group) {
        when(groupRepository.existsByIdAndMembers_Id(group.getId(), 1L)).thenReturn(true);
        when(groupRepository.findByIdWithMembers(group.getId())).thenReturn(Optional.of(group));
    }

    @Test
    void create_findAll_findHistory_findById() {
        when(groupRepository.save(any(Group.class))).thenAnswer(inv -> {
            Group g = inv.getArgument(0);
            g.setId(10L);
            return g;
        });
        GroupResponse created = groupService.create(GroupCreateRequest.builder()
            .title("  Viaje  ").description("  playa  ").build());
        assertThat(created.getTitle()).isEqualTo("Viaje");

        Group open = openGroup(11L, ana);
        Group closed = openGroup(12L, ana);
        closed.setLifecycleStatus(GroupLifecycleStatus.CLOSED);
        when(groupRepository.findAllByMemberId(1L)).thenReturn(List.of(open, closed));
        List<GroupSummaryResponse> active = groupService.findAllForCurrentUser();
        List<GroupSummaryResponse> history = groupService.findHistoryForCurrentUser();
        assertThat(active).extracting(GroupSummaryResponse::getId).containsExactly(11L);
        assertThat(history).extracting(GroupSummaryResponse::getId).containsExactly(12L);

        stubOwned(open);
        assertThat(groupService.findById(11L).getId()).isEqualTo(11L);
    }

    @Test
    void inviteMember_existingUser_notifies_unknownSendsEmail() {
        Group group = openGroup(10L, ana);
        stubOwned(group);
        when(groupInvitationRepository.existsByGroupIdAndInvitedEmailIgnoreCaseAndStatus(
            10L, "bob@example.com", GroupInvitationStatus.PENDING)).thenReturn(false);
        when(groupInvitationRepository.save(any(GroupInvitation.class))).thenAnswer(inv -> {
            GroupInvitation invit = inv.getArgument(0);
            invit.setId(99L);
            return invit;
        });
        when(userRepository.findByEmailIgnoreCase("bob@example.com")).thenReturn(Optional.of(bob));

        groupService.inviteMember(10L, GroupInviteRequest.builder().email("bob@example.com").build());
        verify(notificationService).createNotification(eq(bob), eq(NotificationType.GROUP), anyString(), eq(99L));
        verify(groupEmailService, never()).sendGroupInviteEmail(anyString(), any(), any());
    }

    @Test
    void inviteMember_unknownEmail_sendsEmail() {
        Group group = openGroup(10L, ana);
        stubOwned(group);
        when(groupInvitationRepository.existsByGroupIdAndInvitedEmailIgnoreCaseAndStatus(
            10L, "new@example.com", GroupInvitationStatus.PENDING)).thenReturn(false);
        when(groupInvitationRepository.save(any(GroupInvitation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findByEmailIgnoreCase("new@example.com")).thenReturn(Optional.empty());

        groupService.inviteMember(10L, GroupInviteRequest.builder().email("new@example.com").build());
        verify(groupEmailService).sendGroupInviteEmail(eq("new@example.com"), eq(ana), eq(group));
    }

    @Test
    void inviteMember_validationErrors() {
        Group group = openGroup(10L, ana, bob);
        stubOwned(group);
        assertThatThrownBy(() -> groupService.inviteMember(10L,
            GroupInviteRequest.builder().email("ana@example.com").build()))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("No podés invitarte a vos mismo.");
        assertThatThrownBy(() -> groupService.inviteMember(10L,
            GroupInviteRequest.builder().email("bob@example.com").build()))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("Esa persona ya es miembro del grupo.");
        when(groupInvitationRepository.existsByGroupIdAndInvitedEmailIgnoreCaseAndStatus(
            10L, "x@example.com", GroupInvitationStatus.PENDING)).thenReturn(true);
        assertThatThrownBy(() -> groupService.inviteMember(10L,
            GroupInviteRequest.builder().email("x@example.com").build()))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("Ya hay una invitación pendiente para ese correo.");
    }

    @Test
    void addGuest_andAddMyExpenses() {
        Group group = openGroup(10L, ana);
        stubOwned(group);
        when(userRepository.existsByEmailIgnoreCase("guest@example.com")).thenReturn(false);
        when(groupInvitationRepository.existsByGroupIdAndInvitedEmailIgnoreCaseAndStatus(
            10L, "guest@example.com", GroupInvitationStatus.PENDING)).thenReturn(false);
        when(groupGuestMemberRepository.save(any(GroupGuestMember.class))).thenAnswer(inv -> {
            GroupGuestMember g = inv.getArgument(0);
            g.setId(7L);
            return g;
        });
        when(categoryRepository.findByUserIdAndNameIgnoreCaseAndType(1L, "Taxi", CategoryType.EXPENSE))
            .thenReturn(Optional.empty());
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

        GroupGuestCreateRequest guestRequest = GroupGuestCreateRequest.builder()
            .name(" Guest ").email("guest@example.com").mpAlias(" guest.mp ")
            .items(List.of(GroupExpenseItemRequest.builder()
                .title("Taxi").amount(new BigDecimal("100")).categoryName("Taxi").build()))
            .build();
        assertThat(groupService.addGuest(10L, guestRequest).getId()).isEqualTo(10L);
        verify(groupEmailService).sendGuestAddedEmail(any(GroupGuestMember.class), eq(group));

        when(categoryRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(category));
        when(groupExpenseRepository.save(any(GroupExpense.class))).thenAnswer(inv -> {
            GroupExpense e = inv.getArgument(0);
            e.setId(20L);
            return e;
        });
        groupService.addMyExpenses(10L, GroupExpenseBatchRequest.builder()
            .items(List.of(GroupExpenseItemRequest.builder()
                .title("Carne").amount(new BigDecimal("200")).categoryId(5L).build()))
            .build());
        verify(transactionService).createFromGroupExpense(eq(ana), eq(group), any(GroupExpense.class));
    }

    @Test
    void addMyExpenses_errors() {
        Group group = openGroup(10L, bob);
        group.setMembers(new HashSet<>(Set.of(bob)));
        stubOwned(group);
        assertThatThrownBy(() -> groupService.addMyExpenses(10L, GroupExpenseBatchRequest.builder()
            .items(List.of()).build()))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("Solo los miembros del grupo pueden cargar gastos.");

        Group openOwned = openGroup(11L, ana);
        stubOwned(openOwned);
        assertThatThrownBy(() -> groupService.addMyExpenses(11L, GroupExpenseBatchRequest.builder()
            .items(List.of()).build()))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("Agregá al menos un gasto.");

        openOwned.setLifecycleStatus(GroupLifecycleStatus.SETTLEMENT);
        assertThatThrownBy(() -> groupService.addMyExpenses(11L, GroupExpenseBatchRequest.builder()
            .items(List.of(GroupExpenseItemRequest.builder().title("x").amount(BigDecimal.ONE).categoryId(1L).build()))
            .build()))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessageContaining("movimientos ya están cerrados");
    }

    @Test
    void invitations_acceptRejectPending() {
        Group group = openGroup(10L, ana);
        GroupInvitation invitation = GroupInvitation.builder()
            .id(3L).group(group).invitedEmail("ana@example.com")
            .status(GroupInvitationStatus.PENDING).invitedBy(bob).build();
        when(groupInvitationRepository.findByInvitedEmailIgnoreCaseAndStatus(
            "ana@example.com", GroupInvitationStatus.PENDING)).thenReturn(List.of(invitation));
        assertThat(groupService.findPendingInvitations()).hasSize(1);

        when(groupInvitationRepository.findByIdAndInvitedEmailIgnoreCase(3L, "ana@example.com"))
            .thenReturn(Optional.of(invitation));
        when(groupRepository.save(group)).thenReturn(group);
        assertThat(groupService.acceptInvitation(3L).getId()).isEqualTo(10L);
        assertThat(invitation.getStatus()).isEqualTo(GroupInvitationStatus.ACCEPTED);

        GroupInvitation pending2 = GroupInvitation.builder()
            .id(4L).group(group).invitedEmail("ana@example.com")
            .status(GroupInvitationStatus.PENDING).build();
        when(groupInvitationRepository.findByIdAndInvitedEmailIgnoreCase(4L, "ana@example.com"))
            .thenReturn(Optional.of(pending2));
        groupService.rejectInvitation(4L);
        assertThat(pending2.getStatus()).isEqualTo(GroupInvitationStatus.REJECTED);
    }

    @Test
    void confirmMovements_partialAndFull() {
        Group group = openGroup(10L, ana, bob);
        stubOwned(group);
        GroupExpense expense = GroupExpense.builder()
            .id(1L).group(group).title("Carne").amount(new BigDecimal("100"))
            .date(LocalDateTime.now()).paidBy(ana).category(category).build();
        when(groupExpenseRepository.findAllByGroupId(10L)).thenReturn(List.of(expense));
        when(movementConfirmationRepository.existsByGroupIdAndUserId(10L, 1L)).thenReturn(false);
        when(movementConfirmationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(movementConfirmationRepository.findAllByGroupId(10L)).thenReturn(List.of(
            GroupMovementConfirmation.builder().user(ana).group(group).build()
        ));

        groupService.confirmMovements(10L);
        assertThat(group.getLifecycleStatus()).isEqualTo(GroupLifecycleStatus.OPEN);
        verify(notificationService).createNotification(eq(bob), eq(NotificationType.GROUP), anyString(), eq(10L));

        when(movementConfirmationRepository.findAllByGroupId(10L)).thenReturn(List.of(
            GroupMovementConfirmation.builder().user(ana).group(group).build(),
            GroupMovementConfirmation.builder().user(bob).group(group).build()
        ));
        when(groupRepository.save(group)).thenReturn(group);
        when(currentUserService.getCurrentUser()).thenReturn(bob);
        when(currentUserService.getCurrentUserId()).thenReturn(2L);
        when(groupRepository.existsByIdAndMembers_Id(10L, 2L)).thenReturn(true);
        when(movementConfirmationRepository.existsByGroupIdAndUserId(10L, 2L)).thenReturn(false);

        groupService.confirmMovements(10L);
        assertThat(group.getLifecycleStatus()).isEqualTo(GroupLifecycleStatus.SETTLEMENT);
    }

    @Test
    void confirmMovements_errors() {
        Group group = openGroup(10L, ana);
        stubOwned(group);
        group.setLifecycleStatus(GroupLifecycleStatus.SETTLEMENT);
        assertThatThrownBy(() -> groupService.confirmMovements(10L))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("Los movimientos ya fueron confirmados.");

        group.setLifecycleStatus(GroupLifecycleStatus.OPEN);
        when(groupExpenseRepository.findAllByGroupId(10L)).thenReturn(List.of());
        assertThatThrownBy(() -> groupService.confirmMovements(10L))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessageContaining("Agregá gastos");
    }

    @Test
    void markSettlementCash_notifiesCreditor() {
        Group group = openGroup(10L, ana, bob);
        group.setLifecycleStatus(GroupLifecycleStatus.SETTLEMENT);
        stubOwned(group);
        GroupExpense expense = GroupExpense.builder()
            .id(1L).group(group).title("Todo").amount(new BigDecimal("100"))
            .date(LocalDateTime.now()).paidBy(bob).category(category).build();
        when(groupExpenseRepository.findAllByGroupId(10L)).thenReturn(List.of(expense));
        when(settlementPaymentRepository.findByGroupIdAndFromMemberKeyAndToMemberKey(10L, "user-1", "user-2"))
            .thenReturn(Optional.empty());
        when(settlementPaymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(2L)).thenReturn(Optional.of(bob));

        GroupResponse response = groupService.markSettlementCash(10L, GroupSettlementMarkPaidRequest.builder()
            .fromMemberKey("user-1").toMemberKey("user-2").build());
        assertThat(response.getId()).isEqualTo(10L);
        verify(notificationService).createNotification(eq(bob), eq(NotificationType.PAYMENT), anyString(), eq(10L));
    }

    @Test
    void confirmSettlementPayment_recordsAndCloses() {
        Group group = openGroup(10L, ana, bob);
        group.setLifecycleStatus(GroupLifecycleStatus.SETTLEMENT);
        stubOwned(group);
        GroupExpense expense = GroupExpense.builder()
            .id(1L).group(group).title("Todo").amount(new BigDecimal("100"))
            .date(LocalDateTime.now()).paidBy(ana).category(category).build();
        when(groupExpenseRepository.findAllByGroupId(10L)).thenReturn(List.of(expense));

        GroupSettlementPayment payment = GroupSettlementPayment.builder()
            .id(8L).group(group).fromMemberKey("user-2").toMemberKey("user-1")
            .paymentMethod(SettlementPaymentMethod.CASH)
            .settlementAmount(new BigDecimal("50"))
            .markedBy(bob)
            .build();
        when(settlementPaymentRepository.findByGroupIdAndFromMemberKeyAndToMemberKey(10L, "user-2", "user-1"))
            .thenReturn(Optional.of(payment));
        when(settlementPaymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(2L)).thenReturn(Optional.of(bob));
        // After confirm, payment appears paid so group can close
        when(settlementPaymentRepository.findAllByGroupId(10L)).thenAnswer(inv -> {
            if (payment.getConfirmedAt() != null) {
                return List.of(payment);
            }
            return List.of();
        });

        when(currentUserService.getCurrentUser()).thenReturn(ana);
        groupService.confirmSettlementPayment(10L, GroupSettlementMarkPaidRequest.builder()
            .fromMemberKey("user-2").toMemberKey("user-1").build());
        assertThat(payment.getConfirmedBy()).isEqualTo(ana);
        verify(transactionService).createFromGroupSettlement(eq(bob), any(), any(), eq("Asado"), anyString(), eq(10L));
    }

    @Test
    void uploadSettlementProof_forUserCreditor() {
        Group group = openGroup(10L, ana, bob);
        group.setLifecycleStatus(GroupLifecycleStatus.SETTLEMENT);
        stubOwned(group);
        GroupExpense expense = GroupExpense.builder()
            .id(1L).group(group).title("Todo").amount(new BigDecimal("100"))
            .date(LocalDateTime.now()).paidBy(bob).category(category).build();
        when(groupExpenseRepository.findAllByGroupId(10L)).thenReturn(List.of(expense));
        when(settlementPaymentRepository.findByGroupIdAndFromMemberKeyAndToMemberKey(10L, "user-1", "user-2"))
            .thenReturn(Optional.empty());
        when(settlementProofStorageService.store(any(), eq(10L), eq("user-1"), eq("user-2")))
            .thenReturn("stored.png");
        when(settlementPaymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(2L)).thenReturn(Optional.of(bob));

        MockMultipartFile file = new MockMultipartFile("f", "p.png", "image/png", new byte[]{1});
        groupService.uploadSettlementProof(10L, "user-1", "user-2", file);
        verify(groupEmailService).sendProofUploadedEmail(
            eq(bob.getEmail()), anyString(), eq(ana), eq(group), any(), eq(true));
    }

    @Test
    void deleteClosedGroup_andProofDownload() {
        Group group = openGroup(10L, ana);
        group.setLifecycleStatus(GroupLifecycleStatus.CLOSED);
        stubOwned(group);
        GroupSettlementPayment payment = GroupSettlementPayment.builder()
            .group(group).fromMemberKey("user-1").toMemberKey("user-2")
            .proofStoredName("p.png").proofContentType("image/png")
            .proofUploadedAt(LocalDateTime.now()).build();
        when(settlementPaymentRepository.findAllByGroupId(10L)).thenReturn(List.of(payment));
        when(groupExpenseRepository.findAllByGroupId(10L)).thenReturn(List.of());
        when(movementConfirmationRepository.findAllByGroupId(10L)).thenReturn(List.of());
        when(groupInvitationRepository.findAllByGroupId(10L)).thenReturn(List.of());
        when(groupGuestMemberRepository.findAllByGroupId(10L)).thenReturn(List.of());

        groupService.deleteClosedGroup(10L);
        verify(settlementProofStorageService).delete("p.png");
        verify(transactionService).deleteBySourceGroupId(10L);
        verify(groupRepository).delete(group);

        Group open = openGroup(11L, ana);
        stubOwned(open);
        when(settlementPaymentRepository.findByGroupIdAndFromMemberKeyAndToMemberKey(11L, "user-1", "user-2"))
            .thenReturn(Optional.of(payment));
        when(settlementProofStorageService.load("p.png")).thenReturn(new ByteArrayResource(new byte[]{1}));
        when(settlementProofStorageService.filenameForContentType("image/png")).thenReturn("comprobante.png");
        assertThat(groupService.loadSettlementProof(11L, "user-1", "user-2")).isNotNull();
        assertThat(groupService.getSettlementProofDownload(11L, "user-1", "user-2").getFilename())
            .isEqualTo("comprobante.png");
        assertThat(groupService.resolveSettlementProofContentType(payment)).isEqualTo("image/png");
    }

    @Test
    void findOwnedGroup_missing_throws() {
        when(groupRepository.existsByIdAndMembers_Id(99L, 1L)).thenReturn(false);
        assertThatThrownBy(() -> groupService.findById(99L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage("Grupo no encontrado");
    }

    @Test
    void addGuest_registeredEmail_throws() {
        Group group = openGroup(10L, ana);
        stubOwned(group);
        when(userRepository.existsByEmailIgnoreCase("bob@example.com")).thenReturn(true);
        assertThatThrownBy(() -> groupService.addGuest(10L, GroupGuestCreateRequest.builder()
            .name("Bob").email("bob@example.com").mpAlias("b").build()))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessageContaining("ya tiene cuenta");
    }

    @Test
    void markSettlementPaid_guestCreditor() {
        Group group = openGroup(10L, ana);
        group.setLifecycleStatus(GroupLifecycleStatus.SETTLEMENT);
        stubOwned(group);
        GroupGuestMember guest = GroupGuestMember.builder()
            .id(7L).displayName("G").email("g@example.com").mpAlias("g.mp").group(group).build();
        GroupExpense expense = GroupExpense.builder()
            .id(1L).group(group).title("Todo").amount(new BigDecimal("100"))
            .date(LocalDateTime.now()).paidByGuest(guest).category(category).build();
        when(groupGuestMemberRepository.findAllByGroupId(10L)).thenReturn(List.of(guest));
        when(groupExpenseRepository.findAllByGroupId(10L)).thenReturn(List.of(expense));
        when(settlementPaymentRepository.findByGroupIdAndFromMemberKeyAndToMemberKey(10L, "user-1", "guest-7"))
            .thenReturn(Optional.empty());
        when(settlementPaymentRepository.save(any())).thenAnswer(inv -> {
            GroupSettlementPayment p = inv.getArgument(0);
            p.setId(55L);
            return p;
        });
        when(groupGuestMemberRepository.findById(7L)).thenReturn(Optional.of(guest));
        when(guestSettlementTokenService.createConfirmToken(55L)).thenReturn("tok");

        groupService.markSettlementPaid(10L, GroupSettlementMarkPaidRequest.builder()
            .fromMemberKey("user-1").toMemberKey("guest-7").build());
        verify(groupEmailService).sendGuestSettlementConfirmEmail(eq(guest), eq(group), any(), eq("tok"));
    }

    @Test
    void confirmGuestSettlement_success() {
        Group group = openGroup(10L, ana);
        group.setLifecycleStatus(GroupLifecycleStatus.SETTLEMENT);
        GroupGuestMember guest = GroupGuestMember.builder()
            .id(7L).displayName("G").email("g@example.com").mpAlias("g.mp").group(group).build();
        GroupExpense expense = GroupExpense.builder()
            .id(1L).group(group).title("Todo").amount(new BigDecimal("100"))
            .date(LocalDateTime.now()).paidByGuest(guest).category(category).build();
        GroupSettlementPayment payment = GroupSettlementPayment.builder()
            .id(55L).group(group).fromMemberKey("user-1").toMemberKey("guest-7")
            .markedBy(ana).settlementAmount(new BigDecimal("50"))
            .paymentMethod(SettlementPaymentMethod.CASH).build();
        when(guestSettlementTokenService.parsePaymentId("tok")).thenReturn(55L);
        when(settlementPaymentRepository.findById(55L)).thenReturn(Optional.of(payment));
        when(groupGuestMemberRepository.findAllByGroupId(10L)).thenReturn(List.of(guest));
        when(groupExpenseRepository.findAllByGroupId(10L)).thenReturn(List.of(expense));
        when(settlementPaymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(settlementPaymentRepository.findAllByGroupId(10L)).thenReturn(List.of(payment));
        when(userRepository.findById(1L)).thenReturn(Optional.of(ana));

        groupService.confirmGuestSettlement("tok");
        assertThat(payment.getConfirmedAt()).isNotNull();
        verify(transactionService).createFromGroupSettlement(
            eq(ana), any(), any(), eq("Asado"), anyString(), eq(10L));
    }
}
