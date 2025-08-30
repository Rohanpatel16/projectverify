'use client'

import { useState, useEffect } from 'react'
import { EmailValidationService, type ValidationResult } from '@/lib/email-validation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Copy, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  Shield, 
  AlertCircle,
  BarChart3,
  Mail,
  Network,
  TestTube,
  Timer,
  TrendingUp,
  FileText,
  Settings
} from 'lucide-react'

interface TestResult {
  provider: string
  result: ValidationResult | null
  error: string | null
  duration: number
  timestamp: string
}

interface TestStats {
  totalTests: number
  successfulTests: number
  failedTests: number
  averageDuration: number
  fastestProvider: string
  slowestProvider: string
  accuracyByProvider: Record<string, { valid: number; invalid: number; total: number }>
}

const testEmails = [
  'john.doe@gmail.com',
  'jane.smith@company.com',
  'support@github.com',
  'admin@microsoft.com',
  'test@example.com',
  'invalid@nonexistent-domain.com',
  'user@disposable-email.com',
  'info@startup.io'
]

const providers = [
  { id: 'mslm', name: 'MSLM.io', color: 'bg-blue-100 text-blue-800' },
  { id: 'email-checker', name: 'Email-checker.space', color: 'bg-green-100 text-green-800' },
  { id: 'automizely', name: 'Automizely', color: 'bg-purple-100 text-purple-800' },
  { id: 'mail7', name: 'Mail7.net', color: 'bg-orange-100 text-orange-800' },
  { id: 'validate-email', name: 'Validate.email', color: 'bg-red-100 text-red-800' },
  { id: 'bazzigate', name: 'Bazzigate', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'supersend', name: 'SuperSend', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'site24x7', name: 'Site24x7', color: 'bg-pink-100 text-pink-800' }
]

export function EmailTester() {
  const [testEmail, setTestEmail] = useState('')
  const [selectedProviders, setSelectedProviders] = useState<string[]>(['mslm', 'validate-email'])
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isTesting, setIsTesting] = useState(false)
  const [testProgress, setTestProgress] = useState({ current: 0, total: 0 })
  const [activeTab, setActiveTab] = useState('single')
  const [bulkEmails, setBulkEmails] = useState(testEmails.join('\n'))
  const [testStats, setTestStats] = useState<TestStats | null>(null)

  const validationService = EmailValidationService.getInstance()

  const calculateStats = (results: TestResult[]): TestStats => {
    const totalTests = results.length
    const successfulTests = results.filter(r => r.result !== null).length
    const failedTests = results.filter(r => r.error !== null).length
    const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / totalTests

    const durationsByProvider = results.reduce((acc, result) => {
      if (!acc[result.provider]) acc[result.provider] = []
      acc[result.provider].push(result.duration)
      return acc
    }, {} as Record<string, number[]>)

    const avgDurations = Object.entries(durationsByProvider).reduce((acc, [provider, durations]) => {
      acc[provider] = durations.reduce((sum, d) => sum + d, 0) / durations.length
      return acc
    }, {} as Record<string, number>)

    const fastestProvider = Object.entries(avgDurations).reduce((a, b) => a[1] < b[1] ? a : b)[0]
    const slowestProvider = Object.entries(avgDurations).reduce((a, b) => a[1] > b[1] ? a : b)[0]

    const accuracyByProvider = results.reduce((acc, result) => {
      if (!result.result) return acc
      if (!acc[result.provider]) {
        acc[result.provider] = { valid: 0, invalid: 0, total: 0 }
      }
      acc[result.provider].total++
      if (result.result.isValid) {
        acc[result.provider].valid++
      } else {
        acc[result.provider].invalid++
      }
      return acc
    }, {} as Record<string, { valid: number; invalid: number; total: number }>)

    return {
      totalTests,
      successfulTests,
      failedTests,
      averageDuration,
      fastestProvider,
      slowestProvider,
      accuracyByProvider
    }
  }

  const testSingleEmail = async (email: string) => {
    const results: TestResult[] = []
    
    for (const providerId of selectedProviders) {
      const startTime = Date.now()
      
      try {
        // Temporarily switch provider
        const currentSettings = validationService.getSettings()
        validationService.saveSettings({
          ...currentSettings,
          provider: providerId as any
        })
        
        const result = await validationService.validateEmail(email)
        const duration = Date.now() - startTime
        
        results.push({
          provider: providerId,
          result,
          error: null,
          duration,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        const duration = Date.now() - startTime
        results.push({
          provider: providerId,
          result: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration,
          timestamp: new Date().toISOString()
        })
      }
    }
    
    return results
  }

  const runSingleTest = async () => {
    if (!testEmail || selectedProviders.length === 0) return

    setIsTesting(true)
    setTestProgress({ current: 0, total: selectedProviders.length })

    try {
      const results = await testSingleEmail(testEmail)
      setTestResults(prev => [...results, ...prev])
      setTestStats(calculateStats([...results, ...testResults]))
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      setIsTesting(false)
      setTestProgress({ current: 0, total: 0 })
    }
  }

  const runBulkTest = async () => {
    const emails = bulkEmails.split('\n').filter(email => email.trim())
    if (emails.length === 0 || selectedProviders.length === 0) return

    setIsTesting(true)
    const totalTests = emails.length * selectedProviders.length
    setTestProgress({ current: 0, total })

    try {
      const allResults: TestResult[] = []
      
      for (let i = 0; i < emails.length; i++) {
        const email = emails[i].trim()
        if (!email) continue

        const results = await testSingleEmail(email)
        allResults.push(...results)
        
        setTestProgress({ current: (i + 1) * selectedProviders.length, total })
        
        // Small delay to respect rate limits
        if (i < emails.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      setTestResults(prev => [...allResults, ...prev])
      setTestStats(calculateStats([...allResults, ...testResults]))
    } catch (error) {
      console.error('Bulk test failed:', error)
    } finally {
      setIsTesting(false)
      setTestProgress({ current: 0, total: 0 })
    }
  }

  const exportResults = () => {
    if (testResults.length === 0) return

    const headers = ['Provider', 'Email', 'Valid', 'Score', 'Status', 'Duration', 'Error', 'Timestamp']
    const csvContent = [
      headers.join(','),
      ...testResults.map(result => [
        result.provider,
        result.result?.email || '',
        result.result?.isValid || '',
        result.result?.score || '',
        result.result?.status || '',
        result.duration,
        result.error || '',
        result.timestamp
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `email-test-results-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const copyResults = () => {
    const text = testResults.map(result => {
      return `${result.provider}: ${result.result?.email || 'N/A'} - ${result.result?.isValid ? 'Valid' : 'Invalid'} (${result.duration}ms)`
    }).join('\n')
    
    navigator.clipboard.writeText(text)
  }

  const resetTests = () => {
    setTestResults([])
    setTestStats(null)
    setTestProgress({ current: 0, total: 0 })
  }

  const getProviderInfo = (providerId: string) => {
    return providers.find(p => p.id === providerId)
  }

  const getDurationColor = (duration: number) => {
    if (duration < 500) return 'text-green-500'
    if (duration < 1500) return 'text-yellow-500'
    return 'text-red-500'
  }

  useEffect(() => {
    if (testResults.length > 0) {
      setTestStats(calculateStats(testResults))
    }
  }, [testResults])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center space-x-2">
          <TestTube className="w-6 h-6" />
          <span>Email Validation Tester</span>
        </h2>
        <p className="text-muted-foreground">
          Test and compare different email validation APIs in real-time
        </p>
      </div>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Test Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure your test parameters and select validation providers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Test Email</Label>
              <Input
                placeholder="Enter email to test"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                disabled={isTesting}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Select Providers</Label>
              <div className="grid grid-cols-2 gap-2">
                {providers.map(provider => (
                  <label key={provider.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProviders.includes(provider.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProviders(prev => [...prev, provider.id])
                        } else {
                          setSelectedProviders(prev => prev.filter(id => id !== provider.id))
                        }
                      }}
                      disabled={isTesting}
                      className="rounded"
                    />
                    <span className="text-sm">{provider.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {isTesting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Testing in progress...</span>
                <span>{testProgress.current} / {testProgress.total}</span>
              </div>
              <Progress value={(testProgress.current / testProgress.total) * 100} className="w-full" />
            </div>
          )}

          <div className="flex space-x-2">
            <Button onClick={runSingleTest} disabled={!testEmail || selectedProviders.length === 0 || isTesting}>
              <Play className="w-4 h-4 mr-2" />
              Test Single Email
            </Button>
            <Button onClick={runBulkTest} disabled={selectedProviders.length === 0 || isTesting} variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Test Bulk Emails
            </Button>
            <Button onClick={resetTests} disabled={testResults.length === 0 || isTesting} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={exportResults} disabled={testResults.length === 0} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={copyResults} disabled={testResults.length === 0} variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {testStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Test Statistics</span>
            </CardTitle>
            <CardDescription>
              Overview of test performance and results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{testStats.totalTests}</div>
                <div className="text-sm text-muted-foreground">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{testStats.successfulTests}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{testStats.failedTests}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.round(testStats.averageDuration)}ms</div>
                <div className="text-sm text-muted-foreground">Avg Duration</div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Performance</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Fastest:</span>
                    <span className="font-medium text-green-500">{getProviderInfo(testStats.fastestProvider)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Slowest:</span>
                    <span className="font-medium text-red-500">{getProviderInfo(testStats.slowestProvider)?.name}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Success Rate</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Overall:</span>
                    <span className="font-medium">
                      {Math.round((testStats.successfulTests / testStats.totalTests) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      <Tabs defaultValue="latest" className="space-y-4">
        <TabsList>
          <TabsTrigger value="latest">Latest Results</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Test</TabsTrigger>
          <TabsTrigger value="comparison">Provider Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="latest" className="space-y-4">
          {testResults.length > 0 ? (
            <div className="space-y-3">
              {testResults.slice(-10).reverse().map((result, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge className={getProviderInfo(result.provider)?.color}>
                          {getProviderInfo(result.provider)?.name}
                        </Badge>
                        <div>
                          <div className="font-medium">{result.result?.email || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(result.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {result.error ? (
                          <div className="flex items-center space-x-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-500">{result.error}</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            {result.result?.isValid ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-sm">{result.result?.isValid ? 'Valid' : 'Invalid'}</span>
                            {result.result?.score && (
                              <Badge variant="outline">Score: {result.result.score}</Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1">
                          <Timer className="w-4 h-4" />
                          <span className={`text-sm ${getDurationColor(result.duration)}`}>
                            {result.duration}ms
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <TestTube className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No test results yet. Run a test to see results here.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Email Testing</CardTitle>
              <CardDescription>
                Enter multiple emails (one per line) to test with selected providers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email List</Label>
                <Textarea
                  placeholder="Enter emails, one per line"
                  value={bulkEmails}
                  onChange={(e) => setBulkEmails(e.target.value)}
                  rows={8}
                  disabled={isTesting}
                />
              </div>
              
              <div className="text-sm text-muted-foreground">
                {bulkEmails.split('\n').filter(email => email.trim()).length} emails ready for testing
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          {testStats && (
            <Card>
              <CardHeader>
                <CardTitle>Provider Performance Comparison</CardTitle>
                <CardDescription>
                  Compare accuracy and performance across different providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(testStats.accuracyByProvider).map(([providerId, stats]) => {
                    const provider = getProviderInfo(providerId)
                    const successRate = stats.total > 0 ? (stats.valid / stats.total) * 100 : 0
                    
                    return (
                      <div key={providerId} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <Badge className={provider?.color}>
                            {provider?.name}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {stats.total} tests
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-medium">{Math.round(successRate)}%</div>
                            <div className="text-xs text-muted-foreground">Success Rate</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{stats.valid}/{stats.invalid}</div>
                            <div className="text-xs text-muted-foreground">Valid/Invalid</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}