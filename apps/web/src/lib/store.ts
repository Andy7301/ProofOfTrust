"use client";

import * as Api from "./api-store";
import * as Mock from "./mock-store-impl";

const useMockClient = process.env.NEXT_PUBLIC_USE_MOCK_CLIENT === "1";

export const MockStoreProvider = useMockClient ? Mock.MockStoreProvider : Api.ApiStoreProvider;
export const useMockStore = useMockClient ? Mock.useMockStore : Api.useMockStore;
export const getApprovalForRequest = useMockClient
  ? Mock.getApprovalForRequest
  : Api.getApprovalForRequest;
export const getPaymentForRequest = useMockClient
  ? Mock.getPaymentForRequest
  : Api.getPaymentForRequest;
export const getDebtForRequest = useMockClient ? Mock.getDebtForRequest : Api.getDebtForRequest;
