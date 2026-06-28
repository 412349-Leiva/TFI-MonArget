package com.monargent.backend.service;

import com.monargent.backend.dto.group.GroupCreateRequest;
import com.monargent.backend.dto.group.GroupExpenseBatchRequest;
import com.monargent.backend.dto.group.GroupGuestCreateRequest;
import com.monargent.backend.dto.group.GroupInvitationResponse;
import com.monargent.backend.dto.group.GroupInviteRequest;
import com.monargent.backend.dto.group.GroupResponse;
import com.monargent.backend.dto.group.GroupSummaryResponse;
import java.util.List;

public interface GroupService {

    List<GroupSummaryResponse> findAllForCurrentUser();

    GroupResponse findById(Long groupId);

    GroupResponse create(GroupCreateRequest request);

    void inviteMember(Long groupId, GroupInviteRequest request);

    GroupResponse addGuest(Long groupId, GroupGuestCreateRequest request);

    GroupResponse addMyExpenses(Long groupId, GroupExpenseBatchRequest request);

    List<GroupInvitationResponse> findPendingInvitations();

    GroupResponse acceptInvitation(Long invitationId);

    void rejectInvitation(Long invitationId);
}
