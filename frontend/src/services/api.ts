/**
 * API Service for Skills Development Backend
 * Base URL: http://localhost:8001
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Article {
  article_id: string;
  title: string;
  content: string;
  topic: string;
  created_at: string;
  quality_score?: number;
  evaluation_details?: {
    task_performance?: number;
    alignment?: number;
    feedback?: string;
  };
  vocabulary?: string[];
}

export interface ArticleGenerationRequest {
  topics: string[];
  count_per_topic?: number;
  quality_threshold?: number;
  max_regeneration_attempts?: number;
}

export interface Recommendation {
  article_id: string;
  title: string;
  topic: string;
  score: number;
  explanation?: string;
  component_scores?: {
    [key: string]: number;
  };
  metadata?: {
    [key: string]: any;
  };
}

export interface RecommendationRequest {
  user_id: string;
  limit?: number;
  strategy?: 'personalized' | 'cold_start';
  apply_diversity?: boolean;
  include_explanations?: boolean;
}

export interface UserInteraction {
  user_id: string;
  article_id: string;
  interaction_type: 'read' | 'rate' | 'bookmark';
  rating?: number;
}

export interface SystemStats {
  total_articles: number;
  total_users: number;
  total_interactions: number;
  avg_quality_score: number;
  topics_count: number;
  database_status: {
    chromadb: string;
    neo4j: string;
  };
}

// ============================================================================
// API Client Class
// ============================================================================

class SkillsDevAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
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
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

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
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  // ------------------------------------------------------------------------
  // Newsletter Endpoints
  // ------------------------------------------------------------------------

  /**
   * Generate new newsletter articles with AI evaluation
   */
  async generateArticles(
    request: ArticleGenerationRequest
  ): Promise<Article[]> {
    return this.request<Article[]>('/api/newsletter/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get all articles with optional filtering
   */
  async getArticles(params?: {
    topic?: string;
    limit?: number;
    offset?: number;
  }): Promise<Article[]> {
    const queryParams = new URLSearchParams();
    if (params?.topic) queryParams.append('topic', params.topic);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.request<Article[]>(
      `/api/newsletter/articles${query ? `?${query}` : ''}`
    );
  }

  /**
   * Get a single article by ID
   */
  async getArticle(articleId: string): Promise<Article> {
    return this.request<Article>(`/api/newsletter/articles/${articleId}`);
  }

  // ------------------------------------------------------------------------
  // Recommendation Endpoints
  // ------------------------------------------------------------------------

  /**
   * Get personalized recommendations for a user
   */
  async getRecommendations(
    request: RecommendationRequest
  ): Promise<Recommendation[]> {
    return this.request<Recommendation[]>('/api/recommendations/get', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Record user interaction with an article
   */
  async recordInteraction(
    interaction: UserInteraction
  ): Promise<{ status: string; message: string }> {
    return this.request('/api/recommendations/interact', {
      method: 'POST',
      body: JSON.stringify(interaction),
    });
  }

  /**
   * Get user's reading history
   */
  async getUserHistory(
    userId: string,
    limit: number = 20
  ): Promise<{
    user_id: string;
    history: Array<{
      article_id: string;
      title: string;
      topic: string;
      created_at: string;
      read_at: string;
      user_rating?: number;
    }>;
    count: number;
  }> {
    return this.request(`/api/recommendations/user/${userId}/history?limit=${limit}`);
  }

  // ------------------------------------------------------------------------
  // System Management Endpoints
  // ------------------------------------------------------------------------

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<SystemStats> {
    return this.request<SystemStats>('/api/system/stats');
  }

  /**
   * Check system health
   */
  async checkHealth(): Promise<{
    status: string;
    timestamp: string;
    services: {
      chromadb: string;
      neo4j: string;
    };
  }> {
    return this.request('/api/system/health');
  }

  /**
   * Get all available topics
   */
  async getTopics(): Promise<{
    topics: Array<{ topic: string; article_count: number }>;
    count: number;
  }> {
    return this.request('/api/system/topics');
  }

  /**
   * Simple health check
   */
  async ping(): Promise<{ status: string }> {
    return this.request('/health');
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const api = new SkillsDevAPI();

// ============================================================================
// Utility Hooks (optional, for React Query integration later)
// ============================================================================

export const apiEndpoints = {
  newsletter: {
    generate: '/api/newsletter/generate',
    list: '/api/newsletter/articles',
    detail: (id: string) => `/api/newsletter/articles/${id}`,
  },
  recommendations: {
    get: '/api/recommendations/get',
    interact: '/api/recommendations/interact',
    history: (userId: string) => `/api/recommendations/user/${userId}/history`,
  },
  system: {
    stats: '/api/system/stats',
    health: '/api/system/health',
    topics: '/api/system/topics',
  },
};
