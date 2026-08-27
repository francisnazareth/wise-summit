# Azure Deployment Plan

> **Status:** Planning

Generated: 2026-08-27

## 1. Project Overview

**Goal:** Deploy the existing WISE Summit operations prototype to Azure as a publicly accessible web application.

**Path:** Modernize existing application for static hosting.

## 2. Requirements

| Attribute | Value |
|-----------|-------|
| Classification | Proof of concept |
| Scale | Small, fewer than 1,000 expected users |
| Budget | Balanced |
| Subscription | FNazaret-1-hybrid-1 (`58de9d50-47ba-4144-be0e-43aefbfd7a78`) |
| Resource group | `rg-wise-demo` (existing, East US) |
| Hosting location | East US 2 (confirmed; Static Web Apps is unavailable in East US) |
| Compliance | HTTPS and Azure platform defaults; no additional requirements |

## 3. Components Detected

| Component | Type | Technology | Path |
|-----------|------|------------|------|
| WISE Ops | Frontend | Next.js 16, React 19, TypeScript, static client-side state | Repository root |

There are no APIs, server actions, databases, secrets, or persistent data stores.

## 4. Recipe Selection

**Selected:** AZD with Bicep

**Rationale:** Azure Developer CLI is the default Azure-first workflow and provides repeatable provisioning and deployment. Bicep will define the single Static Web Apps resource. The app will use Next.js static export to `out/`.

## 5. Architecture

**Stack:** App Service family, static SPA hosting

| Component | Azure Service | SKU | Resource Name |
|-----------|---------------|-----|---------------|
| WISE Ops frontend | Azure Static Web Apps | Standard | `swa-wise-summit-demo` |

No supporting Azure services are required. Application Insights, Key Vault, managed identity, and Log Analytics are excluded because this artifact is a static POC with no backend, secrets, or service-to-service calls.

### Security and Operations

- Platform-managed HTTPS certificate and endpoint
- No credentials embedded in the exported application
- Standard tier for SLA eligibility and future custom authentication
- Public frontend only; all current agent actions remain browser-local prototype interactions
- Post-deployment browser verification of landing page and first three workflows

### Policy Constraints

- Inherited management-group security, audit, deploy/modify, and deny initiatives are present.
- No resource-group policy assignments or exemptions were returned for `rg-wise-demo`.
- A management-group assignment named `Block Azure RM Resource Creation` was reported by policy discovery, but its definition was not readable at subscription scope and no evidence specifically denying `Microsoft.Web/staticSites` was found.
- ARM what-if validation is required before deployment to detect any effective deny policy.

## 6. Provisioning Limit Checklist

| Resource Type | Number to Deploy | Current Subscription Count | Total After Deployment | Limit/Quota | Notes |
|---------------|------------------|----------------------------|------------------------|-------------|-------|
| `Microsoft.Web/staticSites` Standard | 1 | 1 | 2 | No customer-adjustable Static Web Apps quota exposed by `az quota`; platform availability validated | Microsoft.Web is Registered; `staticSites` supports East US 2; current resource is in West US 2 |

**Status:** Capacity checks passed. Static Web Apps does not consume VM/app-service-plan compute quota. Resource name uniqueness and policy authorization will be validated before provisioning.

## 7. Execution Checklist

### Planning

- [x] Analyze workspace
- [x] Gather requirements
- [x] Confirm subscription and location
- [x] Check inherited policy assignments
- [x] Validate provider registration, region support, and current usage
- [x] Select architecture and deployment recipe
- [ ] User approved this plan

### Preparation

- [ ] Configure Next.js `output: "export"`
- [ ] Generate `azure.yaml`
- [ ] Generate Bicep infrastructure and parameters
- [ ] Build and verify the `out/` static artifact
- [ ] Set plan status to Ready for Validation

### Validation

- [ ] Validate Bicep and AZD configuration
- [ ] Run ARM what-if against `rg-wise-demo`
- [ ] Validate production build and exported site
- [ ] Populate validation proof and set status to Validated

### Deployment

- [ ] Obtain final deployment approval
- [ ] Provision Azure Static Web Apps Standard in East US 2
- [ ] Deploy `out/`
- [ ] Verify the HTTPS endpoint and core workflows
- [ ] Set status to Deployed

## 8. Validation Proof

To be populated by the validation phase after preparation.

## 9. Files to Generate

| File | Purpose | Status |
|------|---------|--------|
| `.azure/deployment-plan.md` | Deployment source of truth | Complete |
| `azure.yaml` | AZD service configuration | Awaiting approval |
| `infra/main.bicep` | Static Web Apps infrastructure | Awaiting approval |
| `infra/main.parameters.json` | Subscription deployment parameters | Awaiting approval |

## 10. Cost Estimate

- Azure Static Web Apps Standard: approximately **$9 USD/app/month**, billed hourly based on 730 hours.
- Includes 100 GB bandwidth per subscription and 2 GB storage; bandwidth overage is publicly listed at $0.20/GB.
- No additional Azure services are planned.
- Actual charges depend on the subscription agreement and usage.

## 11. Next Step

Awaiting user approval to generate deployment artifacts and application configuration. No Azure resources will be created during preparation.
