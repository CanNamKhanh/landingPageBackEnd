import { GetAllUsersInput } from "../schemas/admin.schema";
import { AdminUserDetail, AdminUserConversations } from "../types/index.type";
export declare const adminService: {
    getAllUsersService(query: GetAllUsersInput): Promise<{
        users: AdminUserDetail[];
        nextCursor: string | null;
        hasMore: boolean;
    }>;
    getUserDetailService(targetUserId: string): Promise<AdminUserDetail>;
    getUserConversationsService(targetUserId: string): Promise<AdminUserConversations>;
    getAllUsersWithConversationsService(): Promise<AdminUserConversations[]>;
};
//# sourceMappingURL=admin.service.d.ts.map