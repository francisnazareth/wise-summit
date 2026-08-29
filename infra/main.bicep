targetScope = 'resourceGroup'

@minLength(1)
@maxLength(32)
param environmentName string

@allowed([
  'eastus'
])
param location string = 'eastus'

param appServicePlanName string = 'asp-wise-demo-api'
param webAppName string = 'app-wise-demo-api-58de9d'
param foundryAccountName string = 'ai-wise-demo-58de9d'
param modelDeploymentName string = 'gpt-4-1'
param existingFrontendName string = 'swa-wise-summit-demo'

var serviceName = 'api'
var tags = {
  'azd-env-name': environmentName
  workload: 'wise-ops'
}

resource frontend 'Microsoft.Web/staticSites@2023-12-01' existing = {
  name: existingFrontendName
}

resource foundry 'Microsoft.CognitiveServices/accounts@2024-10-01' = {
  name: foundryAccountName
  location: location
  kind: 'AIServices'
  sku: {
    name: 'S0'
  }
  tags: tags
  properties: {
    customSubDomainName: foundryAccountName
    disableLocalAuth: true
    publicNetworkAccess: 'Enabled'
  }
}

resource modelDeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-10-01' = {
  parent: foundry
  name: modelDeploymentName
  sku: {
    name: 'GlobalStandard'
    capacity: 10
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4.1'
      version: '2025-04-14'
    }
    versionUpgradeOption: 'OnceCurrentVersionExpired'
  }
}

resource appServicePlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  tags: tags
  sku: {
    name: 'P0v3'
    tier: 'PremiumV3'
    capacity: 1
  }
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2024-04-01' = {
  name: webAppName
  location: location
  kind: 'app,linux'
  tags: union(tags, {
    'azd-service-name': serviceName
  })
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    publicNetworkAccess: 'Enabled'
    siteConfig: {
      alwaysOn: true
      appCommandLine: 'python -m uvicorn main:app --host 0.0.0.0'
      ftpsState: 'Disabled'
      healthCheckPath: '/health'
      http20Enabled: true
      linuxFxVersion: 'PYTHON|3.14'
      minTlsVersion: '1.2'
      remoteDebuggingEnabled: false
      appSettings: [
        {
          name: 'ALLOWED_ORIGINS'
          value: 'https://${frontend.properties.defaultHostname}'
        }
        {
          name: 'AZURE_OPENAI_API_VERSION'
          value: '2024-10-21'
        }
        {
          name: 'AZURE_OPENAI_DEPLOYMENT'
          value: modelDeployment.name
        }
        {
          name: 'AZURE_OPENAI_ENDPOINT'
          value: foundry.properties.endpoint
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
      ]
    }
  }
}

resource foundryOpenAIUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(foundry.id, webApp.id, 'Cognitive Services OpenAI User')
  scope: foundry
  properties: {
    principalId: webApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'
    )
  }
}

output AZURE_LOCATION string = location
output AZURE_OPENAI_ENDPOINT string = foundry.properties.endpoint
output SERVICE_API_NAME string = webApp.name
output SERVICE_API_URI string = 'https://${webApp.properties.defaultHostName}'
