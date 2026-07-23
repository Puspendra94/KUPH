import axios, { AxiosInstance } from "axios";
import * as SecureStore from "expo-secure-store";

const API_BASE = "http://localhost:3001/api";

let apiClient: AxiosInstance | null = null;

export async function getApiClient(): Promise<AxiosInstance> {
  if (apiClient) return apiClient;

  const token = await SecureStore.getItemAsync("kuph_auth_token");

  apiClient = axios.create({
    baseURL: API_BASE,
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  return apiClient;
}

export async function apiRequest<T>(
  method: string,
  url: string,
  data?: any
): Promise<T> {
  const client = await getApiClient();

  try {
    const response = await client({
      method,
      url,
      data,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message);
    }
    throw error;
  }
}

export async function invalidateApiClient() {
  apiClient = null;
}
