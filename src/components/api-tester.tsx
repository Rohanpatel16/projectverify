'use client'

import { useState } from 'react'
import { EmailValidationService, type ValidationResult } from '@/lib/email-validation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Zap,
  Shield,
  Timer,
  Copy,
  ExternalLink,
  Star,
  Network
} from 'lucide-react'

interface APIResult {
  provider: string
  result: ValidationResult | null
  loading: boolean
  error: string | null
  responseTime: number
  startTime: number
}

interface APIProvider {
  id: string
  name: string
  description: string
  color: string
  icon: React.ReactNode
}

const apiProviders: APIProvider[] = [
  {
    id: 'mslm',
    name: 'MSLM.io',
    description: 'Comprehensive validation with detailed mailbox verification',
    color: 'bg-blue-100 text-blue-800',
    icon: <Shield className="w-4 h-4" />
  },
  {
    id: 'email-checker',
    name: 'Email-checker.space',
    description: 'Simple binary validation service',
    color: 'bg-green-100 text-green-800',
    icon: <Zap className="w-4 h-4" />
  },
  {
    id: 'automizely',
    name: 'Automizely',
    description: 'Bulk validation with comprehensive checking',
    color: 'bg-purple-100 text-purple-800',
    icon: <Network className="w-4 h-4" />
  },
  {
    id: 'mail7',
    name: 'Mail7.net',
    description: 'Comprehensive validation with rate limits',
    color: 'bg-orange-100 text-orange-800',
    icon: <Timer className="w-4 h-4" />
  },
  {
    id: 'validate-email',
    name: 'Validate.email',
    description: 'Advanced validation with risk scoring',
    color: 'bg-cyan-100 text-cyan-800',
    icon: <Star className="w-4 h-4" />
  },
  {
    id: 'bazzigate',
    name: 'Bazzigate',
    description: 'Simple boolean validation service',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <CheckCircle className="w-4 h-4" />
  },
  {
    id: 'supersend',
    name: 'SuperSend',
    description: 'Multi-step validation with detailed breakdown',
    color: 'bg-pink-100 text-pink-800',
    icon: <AlertCircle className="w-4 h-4" />
  },
  {
    id: 'site24x7',
    name: 'Site24x7',
    description: 'SMTP-based validation with detailed responses',
    color: 'bg-indigo-100 text-indigo-800',
    icon: <Network className="w-4 h-4" />
  }
]

export function APITester() {
  const [email, setEmail] = useState('')
  const [results, setResults] = useState<APIResult[]>([])
  const [isTesting, setIsTesting] = useState(false)
  const [testProgress, setTestProgress] = useState(0)
  const [selectedTab, setSelectedTab] = useState('test')

  const validationService = EmailValidationService.getInstance()

  const testAllAPIs = async () => {
    if (!email.trim()) return

    setIsTesting(true)
    setTestProgress(0)
    
    // Initialize results for all providers
    const initialResults: APIResult[] = apiProviders.map(provider => ({
      provider: provider.id,
      result: null,
      loading: true,
      error: null,
      responseTime: 0,
      startTime: Date.now()
    }))
    
    setResults(initialResults)

    // Test each API sequentially to avoid rate limiting
    for (let i = 0; i < apiProviders.length; i++) {
      const provider = apiProviders[i]
      const startTime = Date.now()
      
      try {
        // Temporarily change the provider
        const currentSettings = validationService.getSettings()
        validationService.saveSettings({
          ...currentSettings,
          provider: provider.id as any
        })

        const result = await validationService.validateEmail(email)
        const responseTime = Date.now() - startTime

        setResults(prev => prev.map(r => 
          r.provider === provider.id 
            ? { 
                ...r, 
                result, 
                loading: false, 
                responseTime,
                error: null 
              }
            : r
        ))
      } catch (error) {
        const responseTime = Date.now() - startTime
        setResults(prev => prev.map(r => 
          r.provider === provider.id 
            ? { 
                ...r, 
                result: null, 
                loading: false, 
                responseTime,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            : r
        ))
      }

      // Update progress
      setTestProgress(((i + 1) / apiProviders.length) * 100)
      
      // Add small delay between requests to respect rate limits
      if (i < apiProviders.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    setIsTesting(false)
  }

  const copyResults = () => {
    const resultsText = results.map(r => {
      const provider = apiProviders.find(p => p.id === r.provider)
      return `${provider?.name} (${r.provider}):
  Status: ${r.result ? (r.result.isValid ? 'Valid' : 'Invalid') : 'Error'}
  Response Time: ${r.responseTime}ms
  ${r.error ? `Error: ${r.error}` : ''}
  ${r.result ? `Score: ${r.result.score || 'N/A'}` : ''}
  ${r.result ? `Provider: ${r.result.provider || 'N/A'}` : ''}
  `
    }).join('\n')

    navigator.clipboard.writeText(resultsText).then(() => {
      alert('Results copied to clipboard!')
    })
  }

  const getStats = () => {
    const completed = results.filter(r => !r.loading).length
    const valid = results.filter(r => r.result?.isValid).length
    const invalid = results.filter(r => r.result && !r.result.isValid).length
    const errors = results.filter(r => r.error).length
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length || 0

    return { completed, valid, invalid, errors, avgResponseTime: Math.round(avgResponseTime) }
  }

  const stats = getStats()

  const getResultIcon = (result: APIResult) => {
    if (result.loading) return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
    if (result.error) return <XCircle className="w-4 h-4 text-red-500" />
    if (result.result?.isValid) return <CheckCircle className="w-4 h-4 text-green-500" />
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  const getProviderInfo = (providerId: string) => {
    return apiProviders.find(p => p.id === providerId) || apiProviders[0]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center space-x-2">
          <Network className="w-6 h-6" />
          <span>API Tester</span>
        </h2>
        <p className="text-muted-foreground">
          Test an email address against all available validation APIs simultaneously
        </p>
      </div>

      {/* Test Input */}
      <Card>
        <CardHeader>
          <CardTitle>Test Email Address</CardTitle>
          <CardDescription>
            Enter an email address to test across all 8 validation APIs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="testEmail">Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="Enter email to test..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isTesting}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={testAllAPIs} 
                disabled={!email.trim() || isTesting}
                className="px-6"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Test All APIs
                  </>
                )}
              </Button>
            </div>
          </div>

          {isTesting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Testing in progress...</span>
                <span>{Math.round(testProgress)}%</span>
              </div>
              <Progress value={testProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results Summary</CardTitle>
            <CardDescription>
              Overview of validation results across all APIs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
                <div className="text-sm text-muted-foreground">Valid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.invalid}</div>
                <div className="text-sm text-muted-foreground">Invalid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.errors}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.avgResponseTime}ms</div>
                <div className="text-sm text-muted-foreground">Avg Response</div>
              </div>
            </div>

            <div className="mt-4 flex justify-center space-x-2">
              <Button variant="outline" onClick={copyResults}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Results
              </Button>
              <Button variant="outline" onClick={() => setResults([])}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Results
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results */}
      {results.length > 0 && (
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="test">Test Results</TabsTrigger>
            <TabsTrigger value="comparison">Side-by-Side</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="test" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((result) => {
                const provider = getProviderInfo(result.provider)
                return (
                  <Card key={result.provider}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {provider.icon}
                          <CardTitle className="text-lg">{provider.name}</CardTitle>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getResultIcon(result)}
                          <Badge className={provider.color}>
                            {result.responseTime}ms
                          </Badge>
                        </div>
                      </div>
                      <CardDescription className="text-sm">
                        {provider.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.loading && (
                        <div className="text-center text-muted-foreground">
                          <Clock className="w-4 h-4 animate-spin mx-auto mb-2" />
                          Testing...
                        </div>
                      )}
                      
                      {result.error && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-red-600">
                            <XCircle className="w-4 h-4" />
                            <span className="font-medium">Error</span>
                          </div>
                          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {result.error}
                          </p>
                        </div>
                      )}
                      
                      {result.result && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Status:</span>
                            <Badge variant={result.result.isValid ? 'default' : 'destructive'}>
                              {result.result.isValid ? 'Valid' : 'Invalid'}
                            </Badge>
                          </div>
                          
                          {result.result.score !== undefined && (
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Score:</span>
                              <span className="font-mono">{result.result.score}</span>
                            </div>
                          )}
                          
                          {result.result.domain && (
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Domain:</span>
                              <span className="font-mono text-sm">{result.result.domain}</span>
                            </div>
                          )}
                          
                          {result.result.status && (
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Status:</span>
                              <span className="text-sm">{result.result.status}</span>
                            </div>
                          )}
                          
                          {result.result.provider && (
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Provider:</span>
                              <span className="text-sm">{result.result.provider}</span>
                            </div>
                          )}
                          
                          {result.result.error && (
                            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                              {result.result.error}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Side-by-Side Comparison</CardTitle>
                <CardDescription>
                  Compare results from all APIs in a structured format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">API</th>
                        <th className="text-center p-2 font-medium">Status</th>
                        <th className="text-center p-2 font-medium">Valid</th>
                        <th className="text-center p-2 font-medium">Score</th>
                        <th className="text-center p-2 font-medium">Response Time</th>
                        <th className="text-center p-2 font-medium">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result) => {
                        const provider = getProviderInfo(result.provider)
                        return (
                          <tr key={result.provider} className="border-b">
                            <td className="p-2">
                              <div className="flex items-center space-x-2">
                                {provider.icon}
                                <span className="font-medium">{provider.name}</span>
                              </div>
                            </td>
                            <td className="text-center p-2">
                              {getResultIcon(result)}
                            </td>
                            <td className="text-center p-2">
                              {result.result?.isValid ? (
                                <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                              ) : result.result ? (
                                <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-yellow-500 mx-auto" />
                              )}
                            </td>
                            <td className="text-center p-2">
                              {result.result?.score !== undefined ? (
                                <span className="font-mono">{result.result.score}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="text-center p-2">
                              <Badge variant="outline">{result.responseTime}ms</Badge>
                            </td>
                            <td className="text-center p-2">
                              {result.error ? (
                                <span className="text-xs text-red-600">Error</span>
                              ) : (
                                <span className="text-xs text-green-600">OK</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Consensus Analysis</CardTitle>
                  <CardDescription>
                    What do most APIs agree on?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Valid Consensus:</span>
                      <Badge variant={stats.valid > stats.invalid ? 'default' : 'destructive'}>
                        {stats.valid > stats.invalid ? 'Valid' : stats.valid < stats.invalid ? 'Invalid' : 'Mixed'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Success Rate:</span>
                      <span className="font-medium">
                        {stats.completed > 0 ? Math.round((stats.valid / stats.completed) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Error Rate:</span>
                      <span className="font-medium">
                        {stats.completed > 0 ? Math.round((stats.errors / stats.completed) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Average Response:</span>
                      <span className="font-medium">{stats.avgResponseTime}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Analysis</CardTitle>
                  <CardDescription>
                    Response time and reliability metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Fastest API</span>
                        <span className="font-medium">
                          {results.length > 0 ? results.reduce((fastest, current) => 
                            current.responseTime < fastest.responseTime ? current : fastest
                          , results[0])?.provider || 'N/A' : 'N/A'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {results.length > 0 ? Math.min(...results.map(r => r.responseTime)) + 'ms' : 'N/A'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Slowest API</span>
                        <span className="font-medium">
                          {results.length > 0 ? results.reduce((slowest, current) => 
                            current.responseTime > slowest.responseTime ? current : slowest
                          , results[0])?.provider || 'N/A' : 'N/A'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {results.length > 0 ? Math.max(...results.map(r => r.responseTime)) + 'ms' : 'N/A'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Most Reliable</span>
                        <span className="font-medium">
                          {stats.errors === 0 ? 'All APIs' : 'Mixed results'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stats.errors === 0 ? 'No errors' : `${stats.errors} errors`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  Based on the test results, here are some recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.valid > stats.invalid && stats.errors === 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2 text-green-800">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">High Confidence Result</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        All APIs agree this email is valid. You can trust this result.
                      </p>
                    </div>
                  )}
                  
                  {stats.invalid > stats.valid && stats.errors === 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2 text-red-800">
                        <XCircle className="w-4 h-4" />
                        <span className="font-medium">High Confidence Result</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">
                        All APIs agree this email is invalid. You can trust this result.
                      </p>
                    </div>
                  )}
                  
                  {Math.abs(stats.valid - stats.invalid) <= 1 && stats.errors === 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2 text-yellow-800">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">Mixed Results</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        APIs disagree on this email's validity. Consider using additional verification methods.
                      </p>
                    </div>
                  )}
                  
                  {stats.errors > stats.completed / 2 && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center space-x-2 text-orange-800">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">High Error Rate</span>
                      </div>
                      <p className="text-sm text-orange-700 mt-1">
                        Many APIs failed to validate this email. The email or APIs may have issues.
                      </p>
                    </div>
                  )}
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-blue-800">
                      <Zap className="w-4 h-4" />
                      <span className="font-medium">Performance Tip</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      For best performance, consider using APIs with response times under {stats.avgResponseTime}ms.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}