package com.mini.socialnetwork.modules.chat.service;

import com.mini.socialnetwork.modules.chat.dto.ConversationDTO;
import com.mini.socialnetwork.modules.chat.entity.Conversation;
import com.mini.socialnetwork.modules.chat.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;

    public List<ConversationDTO> getConversationsForUser(String userId) {
        List<Conversation> convs = conversationRepository.findAllByParticipantIdsOrderByUpdatedAtDescIdDesc(userId);
        return convs.stream().map(this::toDto).collect(Collectors.toList());
    }

    public ConversationDTO getConversationByIdForUser(Long id, String userId) {
        return conversationRepository.findById(id)
                .filter(c -> c.getParticipantIds().contains(userId))
                .map(this::toDto)
                .orElse(null);
    }

    private ConversationDTO toDto(Conversation c) {
        ConversationDTO dto = new ConversationDTO();
        dto.setId(c.getId());
        dto.setLastMessageContent(c.getLastMessageContent());
        dto.setLastMessageSenderId(c.getLastMessageSenderId());
        dto.setLastMessageType(c.getLastMessageType() != null ? c.getLastMessageType().name() : null);
        dto.setUpdatedAt(c.getUpdatedAt());
        dto.setParticipantIds(c.getParticipantIds());
        dto.setType(c.getType());
        dto.setName(c.getName());
        return dto;
    }
}
