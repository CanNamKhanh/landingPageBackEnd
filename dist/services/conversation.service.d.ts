import { ConversationType } from "../generated/prisma";
import { SendMessageInput, GetMessagesInput } from "../schemas/conversation.schema";
import { MessageResponse, PaginatedMessages, ConversationWithMessages } from "../types/index.type";
export declare const conversationService: {
    getMyConversationsService(userId: string): Promise<ConversationWithMessages[]>;
    getMessagesService(userId: string, type: ConversationType, query: GetMessagesInput): Promise<PaginatedMessages>;
    sendMessageToAiService(userId: string, data: SendMessageInput): Promise<MessageResponse>;
    saveAiReplyService(conversationId: string, content: string): Promise<MessageResponse>;
    sendMessageToAdminService(userId: string, data: SendMessageInput): Promise<MessageResponse>;
    adminReplyService(adminId: string, targetUserId: string, data: SendMessageInput): Promise<MessageResponse>;
    adminGetAllConversationsService(): Promise<ConversationWithMessages[]>;
    adminGetUserMessagesService(targetUserId: string, query: GetMessagesInput): Promise<PaginatedMessages>;
};
//# sourceMappingURL=conversation.service.d.ts.map