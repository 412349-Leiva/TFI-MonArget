package com.monargent.backend.controller;

import com.monargent.backend.dto.group.GroupCreateRequest;
import com.monargent.backend.dto.group.GroupExpenseBatchRequest;
import com.monargent.backend.dto.group.GroupGuestCreateRequest;
import com.monargent.backend.dto.group.GroupInvitationResponse;
import com.monargent.backend.dto.group.GroupInviteRequest;
import com.monargent.backend.dto.group.GroupResponse;
import com.monargent.backend.dto.group.GroupSummaryResponse;
import com.monargent.backend.service.GroupService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @GetMapping
    public ResponseEntity<List<GroupSummaryResponse>> findAll() {
        return ResponseEntity.ok(groupService.findAllForCurrentUser());
    }

    @GetMapping("/invitations")
    public ResponseEntity<List<GroupInvitationResponse>> pendingInvitations() {
        return ResponseEntity.ok(groupService.findPendingInvitations());
    }

    @PostMapping("/invitations/{id}/accept")
    public ResponseEntity<GroupResponse> acceptInvitation(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.acceptInvitation(id));
    }

    @PostMapping("/invitations/{id}/reject")
    public ResponseEntity<Void> rejectInvitation(@PathVariable Long id) {
        groupService.rejectInvitation(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping
    public ResponseEntity<GroupResponse> create(@Valid @RequestBody GroupCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.findById(id));
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<Void> invite(@PathVariable Long id, @Valid @RequestBody GroupInviteRequest request) {
        groupService.inviteMember(id, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/guests")
    public ResponseEntity<GroupResponse> addGuest(
        @PathVariable Long id,
        @Valid @RequestBody GroupGuestCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.addGuest(id, request));
    }

    @PostMapping("/{id}/my-expenses")
    public ResponseEntity<GroupResponse> addMyExpenses(
        @PathVariable Long id,
        @Valid @RequestBody GroupExpenseBatchRequest request
    ) {
        return ResponseEntity.ok(groupService.addMyExpenses(id, request));
    }
}
