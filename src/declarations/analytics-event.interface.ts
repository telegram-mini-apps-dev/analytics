export interface AnalyticsEvent {
    event_name: string;
    data?: Record<string, any>;
    attributes?: Record<string, any>;
    innerworks_request_id?: string;
    timestamp?: number;
    session_id?: string;
    user_id?: string;
}

export interface BatchedAnalyticsEvent extends AnalyticsEvent {
    batch_id?: string;
    retry_count?: number;
}
