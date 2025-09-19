export interface BookMeetingRequest {
    personId: number;
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    userId: number;
}
export interface Activity {
    id: number;
}
export declare const bookMeeting: (params: BookMeetingRequest) => Promise<Activity>;
