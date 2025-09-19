import { Query } from "encore.dev/api";
export interface TrackLinkClickParams {
    trackingId: string;
    url: Query<string>;
}
export declare const trackLinkClick: (params: TrackLinkClickParams) => Promise<void>;
