package com.monargent.backend.service;

import com.monargent.backend.dto.group.GroupCreateRequest;
import com.monargent.backend.dto.group.SettlementProofDownload;
import com.monargent.backend.dto.group.GroupExpenseBatchRequest;
import com.monargent.backend.dto.group.GroupGuestCreateRequest;
import com.monargent.backend.dto.group.GroupInvitationResponse;
import com.monargent.backend.dto.group.GroupInviteRequest;
import com.monargent.backend.dto.group.GroupResponse;
import com.monargent.backend.dto.group.GroupSettlementMarkPaidRequest;
import com.monargent.backend.dto.group.GroupSummaryResponse;
import com.monargent.backend.entity.GroupSettlementPayment;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface GroupService {

    List<GroupSummaryResponse> findAllForCurrentUser();

    List<GroupSummaryResponse> findHistoryForCurrentUser();

    GroupResponse findById(Long groupId);

    GroupResponse create(GroupCreateRequest request);

    void inviteMember(Long groupId, GroupInviteRequest request);

    GroupResponse addGuest(Long groupId, GroupGuestCreateRequest request);

    GroupResponse addMyExpenses(Long groupId, GroupExpenseBatchRequest request);

    List<GroupInvitationResponse> findPendingInvitations();

    GroupResponse acceptInvitation(Long invitationId);

    void rejectInvitation(Long invitationId);

    GroupResponse uploadSettlementProof(
        Long groupId,
        String fromMemberKey,
        String toMemberKey,
        MultipartFile file
    );

    Resource loadSettlementProof(Long groupId, String fromMemberKey, String toMemberKey);

    SettlementProofDownload getSettlementProofDownload(Long groupId, String fromMemberKey, String toMemberKey);

    String resolveSettlementProofContentType(GroupSettlementPayment payment);

    void deleteClosedGroup(Long groupId);

    GroupResponse confirmSettlementPayment(Long groupId, GroupSettlementMarkPaidRequest request);

    GroupResponse markSettlementPaid(Long groupId, GroupSettlementMarkPaidRequest request);

    GroupResponse confirmMovements(Long groupId);
}
