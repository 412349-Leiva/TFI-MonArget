package com.monargent.backend.service;

import com.monargent.backend.dto.profile.UserDocumentResponse;
import java.util.List;

public interface ProfileDocumentService {

    List<UserDocumentResponse> listReceivedDocuments();
}
