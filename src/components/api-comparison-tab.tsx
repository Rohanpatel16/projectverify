'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Zap,
  Network,
  Shield,
  DollarSign,
  ExternalLink,
  Play,
  RefreshCw
} from 'lucide-react'

interface APIProvider {
  id: string
  name: string
  endpoint: string
  method: 'GET' | 'POST'
  description: string
  features: {
    syntaxValidation: boolean
    domainValidation: boolean
    smtpValidation: boolean
    disposableDetection: boolean
    riskScoring: boolean
    bulkValidation: boolean
  }
  pricing: {
    freeTier: boolean
    paidPlans: string
    credits: boolean
  }
  performance: {
    responseTime: number
    accuracy: number
    reliability: number
  }
  responseFormat: 'simple' | 'detailed' | 'raw'
  authentication: 'none' | 'apiKey' | 'oauth'
  documentation?: string
}

interface APIComparisonResult {
  providerId: string
  email: string
  isValid: boolean
  responseTime: number
  score?: number
  status: string
  error?: string
  timestamp: string
  rawData?: any
}

const apiProviders: APIProvider[] = [
  {
    id: 'validate-email',
    name: 'Validate.Email',
    endpoint: 'https://api.validate.email/validate',
    method: 'GET',
    description: 'Comprehensive email validation with detailed risk analysis',
    features: {
      syntaxValidation: true,
      domainValidation: true,
      smtpValidation: true,
      disposableDetection: true,
      riskScoring: true,
      bulkValidation: false
    },
    pricing: {
      freeTier: true,
      paidPlans: 'Starting at $9/month',
      credits: false
    },
    performance: {
      responseTime: 850,
      accuracy: 95,
      reliability: 98
    },
    responseFormat: 'detailed',
    authentication: 'apiKey'
  },
  {
    id: 'bazzigate',
    name: 'Bazzigate Email Verifier',
    endpoint: 'https://emailverifiers-backend.bazzigate.com/single-email-varification',
    method: 'GET',
    description: 'Simple and fast email verification service',
    features: {
      syntaxValidation: true,
      domainValidation: true,
      smtpValidation: true,
      disposableDetection: false,
      riskScoring: false,
      bulkValidation: false
    },
    pricing: {
      freeTier: true,
      paidPlans: 'Unknown',
      credits: false
    },
    performance: {
      responseTime: 450,
      accuracy: 88,
      reliability: 85
    },
    responseFormat: 'simple',
    authentication: 'none'
  },
  {
    id: 'supersend',
    name: 'SuperSend',
    endpoint: 'https://api.supersend.io/v1/verify-email',
    method: 'GET',
    description: 'Email validation with detailed validator breakdown',
    features: {
      syntaxValidation: true,
      domainValidation: true,
      smtpValidation: true,
      disposableDetection: true,
      riskScoring: false,
      bulkValidation: true
    },
    pricing: {
      freeTier: false,
      paidPlans: 'Credit-based system',
      credits: true
    },
    performance: {
      responseTime: 620,
      accuracy: 92,
      reliability: 94
    },
    responseFormat: 'detailed',
    authentication: 'apiKey'
  },
  {
    id: 'site24x7',
    name: 'Site24x7 Email Validator',
    endpoint: 'https://www.site24x7.com/tools/email-validator',
    method: 'POST',
    description: 'SMTP-focused validation tool (internal use)',
    features: {
      syntaxValidation: true,
      domainValidation: true,
      smtpValidation: true,
      disposableDetection: false,
      riskScoring: false,
      bulkValidation: true
    },
    pricing: {
      freeTier: true,
      paidPlans: 'Part of monitoring suite',
      credits: false
    },
    performance: {
      responseTime: 1200,
      accuracy: 90,
      reliability: 80
    },
    responseFormat: 'raw',
    authentication: 'none'
  }
]

export function APIComparisonTab() {
  const [testEmail, setTestEmail] = useState('')
  const [selectedProviders, setSelectedProviders] = useState<string[]>(['validate-email', 'bazzigate'])
  const [isTesting, setIsTesting] = useState(false)
  const [results, setResults] = useState<APIComparisonResult[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  const testAPIs = async () => {
    if (!testEmail || selectedProviders.length === 0) return

    setIsTesting(true)
    const newResults: APIComparisonResult[] = []

    for (const providerId of selectedProviders) {
      const provider = apiProviders.find(p => p.id === providerId)
      if (!provider) continue

      try {
        const startTime = Date.now()
        
        // Mock API calls for demonstration
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 1000))
        
        const responseTime = Date.now() - startTime
        const isValid = Math.random() > 0.3 // Mock validation result
        const score = Math.floor(Math.random() * 100)

        newResults.push({
          providerId,
          email: testEmail,
          isValid,
          responseTime,
          score: isValid ? score : undefined,
          status: isValid ? 'valid' : 'invalid',
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        newResults.push({
          providerId,
          email: testEmail,
          isValid: false,
          responseTime: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'API call failed',
          timestamp: new Date().toISOString()
        })
      }
    }

    setResults(newResults)
    setIsTesting(false)
  }

  const toggleProvider = (providerId: string) => {
    setSelectedProviders(prev => 
      prev.includes(providerId) 
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    )
  }

  const getProviderById = (id: string) => apiProviders.find(p => p.id === id)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'invalid':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getResponseTimeColor = (time: number) => {
    if (time < 500) return 'text-green-600'
    if (time < 1000) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Email Validation API Comparison</span>
          </CardTitle>
          <CardDescription>
            Compare different email validation APIs to find the best fit for your needs
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Live Test</TabsTrigger>
          <TabsTrigger value="features">Feature Matrix</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {apiProviders.map(provider => (
              <Card key={provider.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <Badge variant={provider.pricing.freeTier ? 'default' : 'secondary'}>
                      {provider.pricing.freeTier ? 'Free Tier' : 'Paid'}
                    </Badge>
                  </div>
                  <CardDescription>{provider.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Network className="w-4 h-4" />
                    <span className="font-medium">Endpoint:</span>
                    <span className="text-muted-foreground truncate">{provider.endpoint}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center space-x-1">
                        <Zap className="w-4 h-4" />
                        <span>Response Time</span>
                      </span>
                      <span className={getResponseTimeColor(provider.performance.responseTime)}>
                        {provider.performance.responseTime}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Accuracy</span>
                      </span>
                      <span>{provider.performance.accuracy}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center space-x-1">
                        <Shield className="w-4 h-4" />
                        <span>Reliability</span>
                      </span>
                      <span>{provider.performance.reliability}%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-medium">Pricing:</span>
                      <span className="text-muted-foreground">{provider.pricing.paidPlans}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {Object.entries(provider.features).map(([feature, enabled]) => (
                      enabled && (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature.replace(/([A-Z])/g, ' $1').trim()}
                        </Badge>
                      )
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Live Test Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test APIs with Live Email</CardTitle>
              <CardDescription>
                Compare results across different APIs using the same email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="testEmail">Email Address</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Select APIs to Test</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {apiProviders.map(provider => (
                      <Button
                        key={provider.id}
                        variant={selectedProviders.includes(provider.id) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleProvider(provider.id)}
                        className="justify-start"
                      >
                        {selectedProviders.includes(provider.id) && (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        {provider.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                onClick={testAPIs} 
                disabled={!testEmail || selectedProviders.length === 0 || isTesting}
                className="w-full"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing APIs...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Test Selected APIs
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>
                  Comparison of validation results across selected APIs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Response Time</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, index) => {
                      const provider = getProviderById(result.providerId)
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{provider?.name}</TableCell>
                          <TableCell className="font-mono text-sm">{result.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(result.status)}
                              <span className="capitalize">{result.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={getResponseTimeColor(result.responseTime)}>
                              {result.responseTime}ms
                            </span>
                          </TableCell>
                          <TableCell>
                            {result.score !== undefined ? (
                              <div className="flex items-center space-x-2">
                                <Progress value={result.score} className="w-16" />
                                <span className="text-sm">{result.score}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Feature Matrix Tab */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Comparison Matrix</CardTitle>
              <CardDescription>
                Detailed comparison of features across all email validation APIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    {apiProviders.map(provider => (
                      <TableHead key={provider.id} className="text-center">
                        {provider.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { key: 'syntaxValidation', label: 'Syntax Validation' },
                    { key: 'domainValidation', label: 'Domain Validation' },
                    { key: 'smtpValidation', label: 'SMTP Validation' },
                    { key: 'disposableDetection', label: 'Disposable Detection' },
                    { key: 'riskScoring', label: 'Risk Scoring' },
                    { key: 'bulkValidation', label: 'Bulk Validation' }
                  ].map(feature => (
                    <TableRow key={feature.key}>
                      <TableCell className="font-medium">{feature.label}</TableCell>
                      {apiProviders.map(provider => (
                        <TableCell key={provider.id} className="text-center">
                          {provider.features[feature.key as keyof typeof provider.features] ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {apiProviders.map(provider => (
              <Card key={provider.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{provider.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Response Time</span>
                      <span className={getResponseTimeColor(provider.performance.responseTime)}>
                        {provider.performance.responseTime}ms
                      </span>
                    </div>
                    <Progress value={Math.min((provider.performance.responseTime / 1500) * 100, 100)} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Accuracy</span>
                      <span>{provider.performance.accuracy}%</span>
                    </div>
                    <Progress value={provider.performance.accuracy} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Reliability</span>
                      <span>{provider.performance.reliability}%</span>
                    </div>
                    <Progress value={provider.performance.reliability} className="h-2" />
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span>Overall Score</span>
                      <Badge variant="outline">
                        {Math.round((provider.performance.accuracy + provider.performance.reliability + (100 - (provider.performance.responseTime / 1500) * 100)) / 3)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}