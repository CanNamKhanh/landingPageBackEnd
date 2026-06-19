import { RegisterInput, LoginInput, RefreshTokenInput, ForgotPasswordInput, ChangePasswordInput, ChangeUserInfoInput } from "../schemas/auth.schema";
import { TokenPair, UserProfile } from "../types/index.type";
export declare const authService: {
    registerService(data: RegisterInput): Promise<UserProfile>;
    loginService(data: LoginInput): Promise<TokenPair>;
    logoutService(userId: string, accessToken: string, refreshToken: string): Promise<void>;
    refreshTokenService(data: RefreshTokenInput): Promise<TokenPair>;
    forgotPasswordService(data: ForgotPasswordInput): Promise<void>;
    changePasswordService(userId: string, data: ChangePasswordInput): Promise<void>;
    getMeService(userId: string): Promise<UserProfile>;
    changeUserInfoService(userId: string, data: ChangeUserInfoInput): Promise<UserProfile>;
};
//# sourceMappingURL=auth.service.d.ts.map