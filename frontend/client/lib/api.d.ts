export declare function apiRequest<T>(path: string, options?: RequestInit & {
    token?: string;
}): Promise<T>;
export declare function makeAuthHeaders(token?: string): Record<string, string>;
