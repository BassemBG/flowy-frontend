/**
 * API Service for AI Glossary Backend
 * Routes through gateway at localhost:8000
 */

// Gateway URL - in Docker mode, frontend calls gateway which routes to microservices
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8000';
const GLOSSARY_BASE = `${GATEWAY_URL}/ai_glossary`;

// ============================================================================
// Type Definitions
// ============================================================================

export interface ManagedFile {
    id: string;
    name: string;
    size: number;
    uploaded_at: string;
    terms_count: number;
}

export interface FileListResponse {
    files: ManagedFile[];
    total_count: number;
}

export interface FileUploadResponse {
    id: string;
    name: string;
    size: number;
    uploaded_at: string;
    terms_count: number;
    status: string;
    message: string;
}

export interface FileDeleteResponse {
    message: string;
    deleted_terms_count: number;
}

export interface GlossaryResult {
    term: string;
    definition: string;
    score: number;
    source_file: string;
}

export interface GlossarySearchResponse {
    query: string;
    results: GlossaryResult[];
    answer: string;
    mode: 'glossary';
}

export interface SearchRequest {
    query: string;
    top_k?: number;
}

export interface WebResult {
    title: string;
    snippet: string;
    url: string;
}

export interface WebSearchResponse {
    query: string;
    results: WebResult[];
    answer: string;
    mode: 'web';
}

// ============================================================================
// API Client Class
// ============================================================================

class GlossaryAPI {
    private baseUrl: string;

    constructor(baseUrl: string = GLOSSARY_BASE) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const config: RequestInit = {
            ...options,
            headers: {
                ...options.headers,
            },
        };

        // Only add Content-Type for JSON requests (not for FormData)
        if (!(options.body instanceof FormData)) {
            config.headers = {
                'Content-Type': 'application/json',
                ...config.headers,
            };
        }

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.detail || `HTTP error! status: ${response.status}`
                );
            }

            return await response.json();
        } catch (error) {
            console.error(`Glossary API request failed: ${url}`, error);
            throw error;
        }
    }

    // ------------------------------------------------------------------------
    // File Management Endpoints
    // ------------------------------------------------------------------------

    /**
     * Upload an Excel/CSV glossary file
     */
    async uploadFile(file: File): Promise<FileUploadResponse> {
        const formData = new FormData();
        formData.append('file', file);

        return this.request<FileUploadResponse>('/upload', {
            method: 'POST',
            body: formData,
        });
    }

    /**
     * Get all uploaded glossary files
     */
    async listFiles(): Promise<FileListResponse> {
        return this.request<FileListResponse>('/files');
    }

    /**
     * Delete a file and its embeddings
     */
    async deleteFile(fileId: string): Promise<FileDeleteResponse> {
        return this.request<FileDeleteResponse>(`/files/${fileId}`, {
            method: 'DELETE',
        });
    }

    // ------------------------------------------------------------------------
    // Search Endpoints
    // ------------------------------------------------------------------------

    /**
     * Search the glossary using semantic search
     */
    async searchGlossary(
        query: string,
        topK: number = 5
    ): Promise<GlossarySearchResponse> {
        return this.request<GlossarySearchResponse>('/search/glossary', {
            method: 'POST',
            body: JSON.stringify({ query, top_k: topK }),
        });
    }

    /**
     * Search the web using DuckDuckGo + Groq LLM
     */
    async searchWeb(
        query: string,
        topK: number = 5
    ): Promise<WebSearchResponse> {
        return this.request<WebSearchResponse>('/search/web', {
            method: 'POST',
            body: JSON.stringify({ query, top_k: topK }),
        });
    }

    /**
     * Health check
     */
    async checkHealth(): Promise<{ status: string; service: string }> {
        return this.request('/health');
    }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const glossaryApi = new GlossaryAPI();
