# Azure Deployment Plan

> **Status:** Awaiting Approval

Generated: 2026-08-27

## 1. Project Overview

**Goal:** Extend the deployed WISE Summit operations prototype with a backend API that invokes GPT models through a new Microsoft Foundry resource.

**Path:** Preserve the existing Static Web App and add a managed-identity App Service backend plus Foundry model deployment.

## 2. Requirements

| Attribute | Value |
|-----------|-------|
| Classification | Proof of concept |
| Scale | Small, fewer than 1,000 expected users |
| Budget | P0v3 approved; model usage is consumption-based |
| Subscription | FNazaret-1-hybrid-1 (`58de9d50-47ba-4144-be0e-43aefbfd7a78`) |
| Resource group | `rg-wise-demo` (existing, East US) |
| Hosting location | East US for all new resources; existing Static Web App remains in West US 2 |
| Compliance | HTTPS and Azure platform defaults; no additional requirements |

## 3. Components Detected

| Component | Type | Technology | Path |
|-----------|------|------------|------|
| WISE Ops | Frontend | Next.js 16, React 19, TypeScript, static client-side state | Repository root |
| WISE Ops API | Backend | Python 3.14 FastAPI (new) | `src/backend/` |

The current application has no API. The new FastAPI backend will expose health and chat endpoints through Uvicorn without adding a database or storing Foundry keys.

## 4. Recipe Selection

**Selected:** AZD with Bicep

**Rationale:** Azure Developer CLI provides repeatable provisioning and deployment. Bicep will add Foundry, a GPT deployment, an App Service plan, a managed-identity web app, and least-privilege RBAC. The existing Static Web App will not be reprovisioned.

## 5. Architecture

**Stack:** Static SPA hosting plus managed backend API and model inference

| Component | Azure Service | SKU | Resource Name |
|-----------|---------------|-----|---------------|
| WISE Ops frontend (existing) | Azure Static Web Apps | Existing | `swa-wise-summit-demo` |
| WISE Ops API | Azure App Service on Linux | P0v3 plan | `app-wise-demo-api-58de9d` |
| Backend compute | Azure App Service plan | P0v3, Linux | `asp-wise-demo-api` |
| GPT inference | Microsoft Foundry (`AIServices`) | S0 | `ai-wise-demo-58de9d` |
| GPT deployment | Foundry model deployment | GlobalStandard, 10K TPM | `gpt-4-1` |

The model is `gpt-4.1`, version `2025-04-14`. The version is currently marked Legacy in the model catalog, so replacement planning is required before its retirement date. The deployment uses 10K tokens per minute from 5,215K TPM currently available in East US.

The App Service will use a system-assigned managed identity and `DefaultAzureCredential`. Bicep will grant that identity the `Cognitive Services OpenAI User` role at the Foundry account scope. The API receives the Foundry endpoint and deployment name through App Service settings. Key Vault is unnecessary because no API keys or application secrets will be stored. Application Insights remains out of scope for this POC.

### Security and Operations

- Platform-managed HTTPS certificate and endpoint
- No credentials embedded in the exported application
- P0v3 App Service plan because East US Basic B1/B2/B3 quota is zero
- Public HTTPS API with CORS restricted to the existing Static Web App hostname
- `/health` endpoint does not invoke the model; `/api/chat` invokes only the configured deployment
- No chat persistence or database
- Post-deployment verification of API health, authenticated Foundry invocation, CORS, and frontend integration

### Policy Constraints

- Inherited management-group security, audit, deploy/modify, and deny initiatives are present.
- No resource-group policy assignments or exemptions were returned for `rg-wise-demo`.
- A management-group assignment named `Block Azure RM Resource Creation` was reported by policy discovery, but its definition was not readable at subscription scope and no evidence specifically denying `Microsoft.Web/staticSites` was found.
- ARM what-if validation is required before deployment to detect any effective deny policy.

## 6. Provisioning Limit Checklist

| Resource Type | Number to Deploy | Current Subscription Count | Total After Deployment | Limit/Quota | Notes |
|---------------|------------------|----------------------------|------------------------|-------------|-------|
| `Microsoft.Web/serverfarms` P0v3 | 1 | 0 | 1 | 360 instances | Basic quota is zero; user approved P0v3 |
| `Microsoft.Web/sites` | 1 | 1 | 2 | Governed by App Service plan quota | Linux web app with system-assigned identity |
| `Microsoft.CognitiveServices/accounts` | 1 | 1 | 2 | No blocking account quota found | `AIServices` kind, S0, East US |
| `gpt-4.1` GlobalStandard capacity | 10K TPM | 785K TPM used | 795K TPM used | 6,000K TPM | 5,205K TPM remains after deployment |
| Azure role assignments | 1 | 109 | 110 | 4,000 per subscription | Foundry account scope |

**Status:** Capacity checks passed. `Microsoft.Web` and `Microsoft.CognitiveServices` are registered. Subscription-suffixed global names are proposed; ARM what-if and deployment validation remain the authoritative name-availability and policy checks.

## 7. Execution Checklist

This workflow uses two-stage approval: the completed preparation approval permits local code and IaC generation, while a separate deployment approval is required before any billable Azure resource is created.

### Planning

- [x] Analyze workspace
- [x] Gather requirements
- [x] Confirm subscription and location
- [x] Check inherited policy assignments
- [x] Validate provider registration, region support, current usage, and GPT quota
- [x] Select P0v3 after confirming East US Basic quota is zero
- [x] Select architecture and deployment recipe
- [ ] User approved this plan

### Preparation

- [ ] Generate `azure.yaml`
- [ ] Generate Bicep infrastructure and parameters
- [ ] Create and test the Python 3.14 FastAPI backend under `src/backend/`
- [ ] Add the backend URL to the existing frontend configuration
- [ ] Set plan status to Ready for Validation

### Validation

- [ ] Validate Bicep and AZD configuration
- [ ] Run ARM what-if against `rg-wise-demo`
- [ ] Validate backend build/tests and frontend lint/build
- [ ] Confirm proposed global resource names are available
- [ ] Populate validation proof and set status to Validated

### Deployment

- [ ] Obtain final deployment approval
- [ ] Provision Foundry, GPT deployment, P0v3 plan, App Service, and RBAC in East US
- [ ] Deploy the backend API
- [ ] Configure the existing Static Web App with the backend URL
- [ ] Verify health, model invocation, managed identity, and CORS
- [ ] Set status to Deployed

## 8. Validation Proof

To be populated by the validation phase after preparation.

## 9. Files to Generate

| File | Purpose | Status |
|------|---------|--------|
| `.azure/deployment-plan.md` | Deployment source of truth | Awaiting approval |
| `azure.yaml` | AZD service configuration | Awaiting approval |
| `infra/main.bicep` | Foundry, model, App Service, plan, and RBAC infrastructure | Awaiting approval |
| `infra/main.parameters.json` | Subscription deployment parameters | Awaiting approval |
| `src/backend/` | Python FastAPI service with health and chat endpoints | Awaiting approval |

## 10. Cost Estimate

- Existing Static Web App: unchanged by this plan.
- App Service P0v3: dedicated Premium v3 compute billed continuously while provisioned. The Azure Retail Prices API returned no matching East US row, so no unverified dollar amount is recorded; confirm the subscription-specific estimate in Azure Pricing Calculator before deployment.
- Foundry S0 account: no fixed account charge; `gpt-4.1` GlobalStandard input/output usage is billed per token at the subscription's applicable rate.
- No database, Key Vault, private endpoint, or Application Insights cost is introduced.
- Actual charges depend on the subscription agreement, runtime duration, and token usage.

## 11. Next Step

Awaiting user approval to generate the backend and deployment artifacts. Preparation creates local files only; validation uses build checks and ARM what-if. Azure resources will be created only after a separate final deployment approval.
