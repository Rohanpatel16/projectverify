'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  MailCheck, 
  BarChart3, 
  History, 
  Settings,
  Download,
  Upload,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  FileText,
  Network
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { SettingsModal } from '@/components/settings-modal'
import { CSVUploadModal } from '@/components/csv-upload-modal'
import { CSVProcessingTab } from '@/components/csv-processing-tab'
import { APIComparison } from '@/components/api-comparison'
import { APITester } from '@/components/api-tester'
import { EmailValidationService, type ValidationResult } from '@/lib/email-validation'

export default function LeadSpark() {
  const [activeTab, setActiveTab] = useState('finder')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [domain, setDomain] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [bulkEmails, setBulkEmails] = useState('')
  const [generatedEmails, setGeneratedEmails] = useState<string[]>([])
  const [verificationResults, setVerificationResults] = useState<ValidationResult[]>([])
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isCSVUploadOpen, setIsCSVUploadOpen] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [validationProgress, setValidationProgress] = useState({ current: 0, total: 0 })

  const validationService = EmailValidationService.getInstance()

  const handleCSVValidationComplete = (results: any[]) => {
    // Add CSV validation results to the main verification results
    setVerificationResults(prev => {
      const newResults = [...results]
      // Filter out duplicates based on email and timestamp
      const existingEmails = new Set(prev.map(r => r.email))
      const uniqueNewResults = newResults.filter(r => !existingEmails.has(r.email))
      return [...uniqueNewResults, ...prev]
    })
  }

  // Add some demo data for testing (remove in production)
  const addDemoData = () => {
    const demoResults: ValidationResult[] = [
      {
        email: 'john.doe@example.com',
        isValid: true,
        score: 95,
        domain: 'example.com',
        status: 'real',
        hasMailbox: true,
        isDisposable: false,
        isFree: false,
        isRole: false,
        syntaxValid: true,
        mxValid: true,
        smtpValid: true,
        provider: 'mslm',
        timestamp: new Date().toISOString()
      },
      {
        email: 'jane.smith@company.com',
        isValid: true,
        score: 88,
        domain: 'company.com',
        status: 'real',
        hasMailbox: true,
        isDisposable: false,
        isFree: false,
        isRole: false,
        syntaxValid: true,
        mxValid: true,
        smtpValid: true,
        provider: 'automizely',
        timestamp: new Date(Date.now() - 300000).toISOString()
      },
      {
        email: 'invalid@email.com',
        isValid: false,
        score: 25,
        domain: 'email.com',
        status: 'invalid',
        hasMailbox: false,
        isDisposable: false,
        isFree: false,
        isRole: false,
        syntaxValid: true,
        mxValid: false,
        smtpValid: false,
        provider: 'mslm',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        error: 'Domain does not exist'
      }
    ]
    setVerificationResults(demoResults)
  }

  const generateEmails = () => {
    if (!firstName || !lastName || !domain) return
    
    const emailPatterns = [
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
      `${firstName.toLowerCase()}_${lastName.toLowerCase()}@${domain}`,
      `${firstName.toLowerCase()}@${domain}`,
      `${lastName.toLowerCase()}@${domain}`,
      `${firstName.toLowerCase()}${lastName.charAt(0).toLowerCase()}@${domain}`,
      `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}@${domain}`,
      `${lastName.toLowerCase()}${firstName.charAt(0).toLowerCase()}@${domain}`
    ]
    
    setGeneratedEmails(emailPatterns)
  }

  const verifyEmail = async (email: string) => {
    setIsValidating(true)
    try {
      const result = await validationService.validateEmail(email)
      setVerificationResults(prev => [result, ...prev])
    } catch (error) {
      const errorResult: ValidationResult = {
        email,
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation error',
        timestamp: new Date().toISOString()
      }
      setVerificationResults(prev => [errorResult, ...prev])
    } finally {
      setIsValidating(false)
    }
  }

  const verifyBulkEmails = async () => {
    const emails = bulkEmails.split('\n').filter(email => email.trim())
    if (emails.length === 0) return

    setIsValidating(true)
    setValidationProgress({ current: 0, total: emails.length })

    try {
      const results = await validationService.validateBulkEmails(emails)
      setVerificationResults(prev => [...results, ...prev])
    } catch (error) {
      const errorResults: ValidationResult[] = emails.map(email => ({
        email: email.trim(),
        isValid: false,
        error: error instanceof Error ? error.message : 'Bulk validation error',
        timestamp: new Date().toISOString()
      }))
      setVerificationResults(prev => [...errorResults, ...prev])
    } finally {
      setIsValidating(false)
      setValidationProgress({ current: 0, total: 0 })
    }
  }

  const exportToCSV = () => {
    if (verificationResults.length === 0) return

    const headers = ['Email', 'Valid', 'Score', 'Provider', 'Status', 'Domain', 'Timestamp', 'Error']
    const csvContent = [
      headers.join(','),
      ...verificationResults.map(result => [
        result.email,
        result.isValid,
        result.score || '',
        result.provider || '',
        result.status || '',
        result.domain || '',
        result.timestamp,
        result.error || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `email-validation-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStats = () => {
    const total = verificationResults.length
    const valid = verificationResults.filter(r => r.isValid).length
    const invalid = total - valid
    const averageScore = verificationResults
      .filter(r => r.score !== undefined)
      .reduce((sum, r) => sum + (r.score || 0), 0) / verificationResults.filter(r => r.score !== undefined).length || 0

    return { total, valid, invalid, averageScore: Math.round(averageScore) }
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative w-8 h-8">
              <img src="/logo.svg" alt="LeadSpark" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">LeadSpark</h1>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="finder" className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Email Finder</span>
            </TabsTrigger>
            <TabsTrigger value="verifier" className="flex items-center space-x-2">
              <MailCheck className="w-4 h-4" />
              <span>Email Verifier</span>
            </TabsTrigger>
            <TabsTrigger value="csv-processor" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>CSV Processor</span>
            </TabsTrigger>
            <TabsTrigger value="api-tester" className="flex items-center space-x-2">
              <Network className="w-4 h-4" />
              <span>API Tester</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center space-x-2">
              <History className="w-4 h-4" />
              <span>Validation Log</span>
            </TabsTrigger>
            <TabsTrigger value="api-comparison" className="flex items-center space-x-2">
              <Network className="w-4 h-4" />
              <span>API Comparison</span>
            </TabsTrigger>
          </TabsList>

          {/* Email Finder Tab */}
          <TabsContent value="finder" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Email Finder</span>
                </CardTitle>
                <CardDescription>
                  Generate email permutations based on names and domains
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      placeholder="company.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={generateEmails} className="w-full">
                  <Search className="w-4 h-4 mr-2" />
                  Generate Emails
                </Button>
              </CardContent>
            </Card>

            {generatedEmails.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Generated Email Patterns</CardTitle>
                  <CardDescription>
                    Click on any email to verify it
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {generatedEmails.map((email, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-start h-auto p-3"
                        onClick={() => verifyEmail(email)}
                        disabled={isValidating}
                      >
                        {isValidating ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <MailCheck className="w-4 h-4 mr-2 flex-shrink-0" />
                        )}
                        <span className="text-sm truncate">{email}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Email Verifier Tab */}
          <TabsContent value="verifier" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Single Email Verification</CardTitle>
                  <CardDescription>
                    Verify a single email address
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emailInput">Email Address</Label>
                    <Input
                      id="emailInput"
                      type="email"
                      placeholder="example@company.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={() => verifyEmail(emailInput)} 
                    className="w-full"
                    disabled={!emailInput || isValidating}
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <MailCheck className="w-4 h-4 mr-2" />
                        Verify Email
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bulk Email Verification</CardTitle>
                  <CardDescription>
                    Verify multiple email addresses at once
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulkEmails">Email Addresses (one per line)</Label>
                    <Textarea
                      id="bulkEmails"
                      placeholder="email1@company.com
email2@company.com
email3@company.com"
                      value={bulkEmails}
                      onChange={(e) => setBulkEmails(e.target.value)}
                      rows={6}
                    />
                  </div>
                  <Button 
                    onClick={verifyBulkEmails} 
                    className="w-full"
                    disabled={!bulkEmails.trim() || isValidating}
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying ({validationProgress.current}/{validationProgress.total})
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Verify All Emails
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* CSV Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>CSV Email Generator & Validator</span>
                </CardTitle>
                <CardDescription>
                  Upload a CSV file with contact information, generate email permutations, and validate them to get only valid emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <Button onClick={() => setIsCSVUploadOpen(true)} className="w-full">
                      <FileText className="w-4 h-4 mr-2" />
                      Upload CSV File
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium">Upload CSV</p>
                      <p className="text-xs text-muted-foreground">Select columns for names and domain</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto">
                        <MailCheck className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium">Generate Emails</p>
                      <p className="text-xs text-muted-foreground">Create permutations from names</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium">Get Valid Emails</p>
                      <p className="text-xs text-muted-foreground">Batch validate and export results</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {verificationResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Verification Results</CardTitle>
                  <CardDescription>
                    Recent email verification results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {verificationResults.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {result.isValid ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium">{result.email}</p>
                            <p className="text-sm text-muted-foreground">
                              {result.domain} • {result.provider}
                            </p>
                            {result.error && (
                              <p className="text-xs text-red-500">{result.error}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={result.isValid ? 'default' : 'destructive'}>
                            {result.isValid ? 'Valid' : 'Invalid'}
                          </Badge>
                          {result.score && (
                            <Badge variant="outline">
                              Score: {result.score}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* CSV Processor Tab */}
          <TabsContent value="csv-processor" className="space-y-6">
            <CSVProcessingTab onValidationComplete={handleCSVValidationComplete} />
          </TabsContent>

          {/* Email Tester Tab */}
          <TabsContent value="api-tester" className="space-y-6">
            <APITester />
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    Emails processed
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valid Emails</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.valid}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 0}% success rate
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Invalid Emails</CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.invalid}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.total > 0 ? Math.round((stats.invalid / stats.total) * 100) : 0}% failure rate
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageScore}</div>
                  <p className="text-xs text-muted-foreground">
                    Quality score
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Provider Distribution</CardTitle>
                  <CardDescription>
                    Validation methods used
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(
                      verificationResults.reduce((acc, result) => {
                        const provider = result.provider || 'unknown'
                        acc[provider] = (acc[provider] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                    ).map(([provider, count]) => (
                      <div key={provider} className="flex items-center justify-between">
                        <span className="font-medium capitalize">{provider}</span>
                        <Badge variant="outline">{count} emails</Badge>
                      </div>
                    ))}
                    {verificationResults.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="font-medium mb-1">No validation data yet</p>
                        <p className="text-sm">Start validating emails to see analytics here</p>
                        <div className="mt-4 space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setActiveTab('finder')}
                          >
                            Try Email Finder
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setActiveTab('verifier')}
                          >
                            Try Email Verifier
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setActiveTab('csv-processor')}
                          >
                            Try CSV Processor
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={addDemoData}
                          >
                            Load Demo Data
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest verification results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {verificationResults.slice(0, 10).map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          {result.isValid ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm truncate max-w-[150px]">{result.email}</span>
                        </div>
                        <Badge variant={result.isValid ? 'default' : 'destructive'} className="text-xs">
                          {result.isValid ? 'Valid' : 'Invalid'}
                        </Badge>
                      </div>
                    ))}
                    {verificationResults.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="font-medium mb-1">No recent activity</p>
                        <p className="text-sm">Validate some emails to see recent results here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Validation Log Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Validation Log</CardTitle>
                    <CardDescription>
                      Track all verification activities and export results
                    </CardDescription>
                  </div>
                  <Button onClick={exportToCSV} disabled={verificationResults.length === 0}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {verificationResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{result.email}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(result.timestamp).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Provider: {result.provider}
                          </p>
                          {result.error && (
                            <p className="text-xs text-red-500">{result.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={result.isValid ? 'default' : 'destructive'}>
                          {result.isValid ? 'Valid' : 'Invalid'}
                        </Badge>
                        {result.score && (
                          <Badge variant="outline">
                            Score: {result.score}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {verificationResults.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="font-medium mb-1">No verification activities yet</p>
                      <p className="text-sm mb-4">Start validating emails to see detailed logs here</p>
                      <div className="space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setActiveTab('finder')}
                        >
                          Email Finder
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setActiveTab('verifier')}
                        >
                          Email Verifier
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setActiveTab('csv-processor')}
                        >
                          CSV Processor
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={addDemoData}
                        >
                          Load Demo Data
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Comparison Tab */}
          <TabsContent value="api-comparison" className="space-y-6">
            <APIComparison />
          </TabsContent>
        </Tabs>
      </main>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* CSV Upload Modal */}
      <CSVUploadModal
        isOpen={isCSVUploadOpen}
        onClose={() => setIsCSVUploadOpen(false)}
      />
    </div>
  )
}