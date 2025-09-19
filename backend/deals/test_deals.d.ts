export interface TestDealRequest {
    value: number;
}
export interface TestDealResponse {
    success: boolean;
    dealId: number;
    retrievedValue: number;
}
export declare const testDealValueCasting: (params: TestDealRequest) => Promise<TestDealResponse>;
