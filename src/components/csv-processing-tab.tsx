'use client'

import { useState, useEffect, useRef } from 'react'
import { EmailValidationService } from '@/lib/email-validation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Upload, 
  Download, 
  MailCheck, 
  XCircle, 
  CheckCircle, 
  Loader2,
  FileText,
  Columns,
  Play,
  Pause,
  RotateCcw,
  Filter,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react'

interface CSVRow {
  [key: string]: string
}

interface GeneratedEmail {
  email: string
  firstName: string
  lastName: string
  domain: string
  sourceRow: number
}

interface ProcessingStatus {
  status: 'idle' | 'uploading' | 'selecting' | 'generating' | 'ready' | 'validating' | 'completed' | 'error'
  progress: number
  currentStep: number
  totalSteps: number
  message: string
}

interface ValidationTask {
  email: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: any
  startTime?: Date
  endTime?: Date
  duration?: number
}

interface CSVProcessingTabProps {
  onValidationComplete?: (results: any[]) => void
}

export function CSVProcessingTab({ onValidationComplete }: CSVProcessingTabProps) {
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [selectedColumns, setSelectedColumns] = useState({
    firstName: '',
    lastName: '',
    domain: ''
  })
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([])
  const [validationTasks, setValidationTasks] = useState<ValidationTask[]>([])
  const [completedValidations, setCompletedValidations] = useState<any[]>([])
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    status: 'idle',
    progress: 0,
    currentStep: 0,
    totalSteps: 4,
    message: 'Ready to process CSV file'
  })
  const [isPaused, setIsPaused] = useState(false)
  const [batchSize, setBatchSize] = useState(5)
  const [delayBetweenBatches, setDelayBetweenBatches] = useState(1000)

  const validationService = EmailValidationService.getInstance()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cleanDomain = (domain: string): string => {
    return domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '')
      .trim()
  }

  const updateStatus = (status: ProcessingStatus['status'], message: string, progress?: number) => {
    setProcessingStatus(prev => ({
      ...prev,
      status,
      message,
      progress: progress || prev.progress
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (uploadedFile && uploadedFile.type === 'text/csv') {
      setFile(uploadedFile)
      parseCSV(uploadedFile)
    }
  }

  const parseCSV = (file: File) => {
    updateStatus('uploading', 'Parsing CSV file...')
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        updateStatus('error', 'Invalid CSV file format')
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const row: CSVRow = {}
        headers.forEach((header, i) => {
          row[header] = values[i] || ''
        })
        return row
      })

      setHeaders(headers)
      setCsvData(data)
      updateStatus('selecting', 'CSV parsed successfully. Please select columns.', 25)
    }
    reader.readAsText(file)
  }

  const generateEmailsFromCSV = () => {
    if (!selectedColumns.firstName || !selectedColumns.lastName || !selectedColumns.domain) {
      updateStatus('error', 'Please select all required columns')
      return
    }

    updateStatus('generating', 'Generating email permutations...', 50)

    const emails: GeneratedEmail[] = []
    
    csvData.forEach((row, index) => {
      const firstName = row[selectedColumns.firstName]?.trim()
      const lastName = row[selectedColumns.lastName]?.trim()
      const rawDomain = row[selectedColumns.domain]?.trim()
      
      if (!firstName || !lastName || !rawDomain) return

      const domain = cleanDomain(rawDomain)
      if (!domain) return

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

      emailPatterns.forEach(email => {
        emails.push({
          email,
          firstName,
          lastName,
          domain,
          sourceRow: index + 2
        })
      })
    })

    setGeneratedEmails(emails)
    
    // Initialize validation tasks
    const tasks = emails.map(email => ({
      email: email.email,
      status: 'pending' as const
    }))
    setValidationTasks(tasks)
    
    updateStatus('ready', `Generated ${emails.length} emails. Ready to validate.`, 75)
  }

  const validateEmails = async () => {
    if (isPaused) return
    
    updateStatus('validating', 'Starting validation...', 75)
    
    const settings = validationService.getSettings()
    const totalEmails = generatedEmails.length
    let processedCount = 0

    for (let i = 0; i < totalEmails; i += batchSize) {
      if (isPaused) break

      const batch = generatedEmails.slice(i, i + batchSize)
      const batchPromises = batch.map(async (item, batchIndex) => {
        const taskIndex = i + batchIndex
        
        // Update task status to processing
        setValidationTasks(prev => prev.map((task, index) => 
          index === taskIndex 
            ? { ...task, status: 'processing', startTime: new Date() }
            : task
        ))

        try {
          const result = await validationService.validateEmail(item.email)
          
          // Update task status to completed
          setValidationTasks(prev => prev.map((task, index) => 
            index === taskIndex 
              ? { 
                  ...task, 
                  status: 'completed', 
                  result,
                  endTime: new Date(),
                  duration: new Date().getTime() - (task.startTime?.getTime() || 0)
                }
              : task
          ))

          if (result.isValid) {
            setCompletedValidations(prev => {
              const newResults = [...prev, result]
              onValidationComplete?.(newResults)
              return newResults
            })
          }

          return result
        } catch (error) {
          const failedResult = {
            email: item.email,
            isValid: false,
            error: error instanceof Error ? error.message : 'Validation error',
            timestamp: new Date().toISOString(),
            provider: validationService.getSettings().provider
          }
          
          // Update task status to failed
          setValidationTasks(prev => prev.map((task, index) => 
            index === taskIndex 
              ? { 
                  ...task, 
                  status: 'failed', 
                  result: failedResult,
                  endTime: new Date(),
                  duration: new Date().getTime() - (task.startTime?.getTime() || 0)
                }
              : task
          ))
          
          // Also notify about failed results
          onValidationComplete?.([failedResult])
          return null
        }
      })

      await Promise.all(batchPromises)
      processedCount += batch.length
      
      // Update progress
      const progress = Math.round((processedCount / totalEmails) * 100)
      updateStatus('validating', `Validating emails... (${processedCount}/${totalEmails})`, 75 + (progress * 0.25))
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < totalEmails && !isPaused) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
      }
    }

    if (!isPaused) {
      updateStatus('completed', `Validation completed! ${completedValidations.length} valid emails found.`, 100)
    }
  }

  const startProcessing = () => {
    setIsPaused(false)
    if (processingStatus.status === 'ready') {
      updateStatus('validating', 'Starting validation...', 75)
    }
    validateEmails()
  }

  const pauseProcessing = () => {
    setIsPaused(true)
    updateStatus('validating', 'Processing paused', processingStatus.progress)
  }

  const resetProcessing = () => {
    setFile(null)
    setCsvData([])
    setHeaders([])
    setSelectedColumns({ firstName: '', lastName: '', domain: '' })
    setGeneratedEmails([])
    setValidationTasks([])
    setCompletedValidations([])
    setIsPaused(false)
    updateStatus('idle', 'Ready to process CSV file', 0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const exportValidEmails = () => {
    if (completedValidations.length === 0) return

    const headers = ['Email', 'Score', 'Provider', 'Timestamp', 'First Name', 'Last Name', 'Domain']
    const csvContent = [
      headers.join(','),
      ...completedValidations.map(result => {
        const generatedEmail = generatedEmails.find(ge => ge.email === result.email)
        return [
          result.email,
          result.score || '',
          result.provider || '',
          result.timestamp,
          generatedEmail?.firstName || '',
          generatedEmail?.lastName || '',
          generatedEmail?.domain || ''
        ].join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `valid-emails-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: ProcessingStatus['status']) => {
    switch (status) {
      case 'idle': return 'text-gray-500'
      case 'uploading': return 'text-blue-500'
      case 'selecting': return 'text-purple-500'
      case 'generating': return 'text-orange-500'
      case 'ready': return 'text-yellow-500'
      case 'validating': return 'text-green-500'
      case 'completed': return 'text-emerald-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getTaskIcon = (task: ValidationTask) => {
    switch (task.status) {
      case 'pending': return <Clock className="w-4 h-4 text-gray-400" />
      case 'processing': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const stats = {
    total: generatedEmails.length,
    completed: validationTasks.filter(t => t.status === 'completed').length,
    failed: validationTasks.filter(t => t.status === 'failed').length,
    processing: validationTasks.filter(t => t.status === 'processing').length,
    pending: validationTasks.filter(t => t.status === 'pending').length,
    valid: completedValidations.length,
    successRate: generatedEmails.length > 0 
      ? Math.round((completedValidations.length / generatedEmails.length) * 100) 
      : 0
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>CSV Processing Status</span>
          </CardTitle>
          <CardDescription>
            Real-time processing status and progress tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  processingStatus.status === 'completed' ? 'bg-green-500' :
                  processingStatus.status === 'error' ? 'bg-red-500' :
                  processingStatus.status === 'validating' ? 'bg-blue-500' :
                  processingStatus.status === 'ready' ? 'bg-yellow-500' :
                  processingStatus.status === 'generating' ? 'bg-orange-500' :
                  processingStatus.status === 'selecting' ? 'bg-purple-500' :
                  processingStatus.status === 'uploading' ? 'bg-blue-400' : 'bg-gray-400'
                }`} />
                <span className={`font-medium ${getStatusColor(processingStatus.status)}`}>
                  {processingStatus.message}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {processingStatus.progress}% complete
              </div>
            </div>
            
            <Progress value={processingStatus.progress} className="w-full" />
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={resetProcessing} disabled={processingStatus.status === 'validating' && !isPaused}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              
              {(processingStatus.status === 'validating' || processingStatus.status === 'ready') && (
                <div className="space-x-2">
                  {isPaused ? (
                    <Button onClick={startProcessing}>
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                  ) : (
                    <Button 
                      onClick={startProcessing} 
                      disabled={processingStatus.status === 'validating' && !isPaused}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {processingStatus.status === 'ready' ? 'Start Validation' : 'Resume'}
                    </Button>
                  )}
                </div>
              )}
              
              {processingStatus.status === 'validating' && !isPaused && (
                <Button onClick={pauseProcessing}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              
              {completedValidations.length > 0 && (
                <Button onClick={exportValidEmails}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Valid Emails ({completedValidations.length})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Processing Area */}
      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload & Configure</TabsTrigger>
          <TabsTrigger value="progress">Real-time Progress</TabsTrigger>
          <TabsTrigger value="results">Validation Results</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Upload & Configure Tab */}
        <TabsContent value="upload" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Upload CSV File</span>
                </CardTitle>
                <CardDescription>
                  Upload a CSV file containing contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csvFile">Select CSV File</Label>
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    disabled={processingStatus.status === 'validating'}
                  />
                </div>
                
                {csvData.length > 0 && (
                  <div className="space-y-2">
                    <Label>File Information</Label>
                    <div className="text-sm space-y-1">
                      <p><strong>Rows:</strong> {csvData.length}</p>
                      <p><strong>Columns:</strong> {headers.length}</p>
                      <p><strong>File Name:</strong> {file?.name}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Columns className="w-5 h-5" />
                  <span>Column Selection</span>
                </CardTitle>
                <CardDescription>
                  Select which columns contain the required information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>First Name Column</Label>
                    <Select 
                      value={selectedColumns.firstName} 
                      onValueChange={(value) => setSelectedColumns(prev => ({ ...prev, firstName: value }))}
                      disabled={headers.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select first name column" />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map(header => (
                          <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Last Name Column</Label>
                    <Select 
                      value={selectedColumns.lastName} 
                      onValueChange={(value) => setSelectedColumns(prev => ({ ...prev, lastName: value }))}
                      disabled={headers.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select last name column" />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map(header => (
                          <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Domain Column</Label>
                    <Select 
                      value={selectedColumns.domain} 
                      onValueChange={(value) => setSelectedColumns(prev => ({ ...prev, domain: value }))}
                      disabled={headers.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select domain column" />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map(header => (
                          <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={generateEmailsFromCSV} 
                  className="w-full"
                  disabled={!selectedColumns.firstName || !selectedColumns.lastName || !selectedColumns.domain}
                >
                  <MailCheck className="w-4 h-4 mr-2" />
                  Generate Email Permutations
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Processing Configuration */}
          {generatedEmails.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Processing Configuration</CardTitle>
                <CardDescription>
                  Configure batch processing settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Batch Size</Label>
                    <Select value={batchSize.toString()} onValueChange={(value) => setBatchSize(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 email per batch</SelectItem>
                        <SelectItem value="5">5 emails per batch</SelectItem>
                        <SelectItem value="10">10 emails per batch</SelectItem>
                        <SelectItem value="20">20 emails per batch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Delay Between Batches</Label>
                    <Select value={delayBetweenBatches.toString()} onValueChange={(value) => setDelayBetweenBatches(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="500">0.5 seconds</SelectItem>
                        <SelectItem value="1000">1 second</SelectItem>
                        <SelectItem value="2000">2 seconds</SelectItem>
                        <SelectItem value="5000">5 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Processing Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium">{generatedEmails.length}</p>
                      <p className="text-muted-foreground">Emails Generated</p>
                    </div>
                    <div>
                      <p className="font-medium">{Math.ceil(generatedEmails.length / batchSize)}</p>
                      <p className="text-muted-foreground">Batches</p>
                    </div>
                    <div>
                      <p className="font-medium">{Math.round((generatedEmails.length / batchSize) * (delayBetweenBatches / 1000))}</p>
                      <p className="text-muted-foreground">Est. Seconds</p>
                    </div>
                    <div>
                      <p className="font-medium">{batchSize}</p>
                      <p className="text-muted-foreground">Batch Size</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={startProcessing} 
                  className="w-full"
                  disabled={processingStatus.status === 'validating' && !isPaused}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {processingStatus.status === 'ready' ? 'Start Validation' : 'Resume'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Real-time Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Live Progress</CardTitle>
                <CardDescription>
                  Real-time validation progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Completed</span>
                      <span className="text-sm font-medium">{stats.completed}</span>
                    </div>
                    <Progress value={(stats.completed / stats.total) * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Success Rate</span>
                      <span className="text-sm font-medium">{stats.successRate}%</span>
                    </div>
                    <Progress value={stats.successRate} className="h-2" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-blue-500">{stats.processing}</div>
                    <p className="text-xs text-muted-foreground">Processing</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-green-500">{stats.valid}</div>
                    <p className="text-xs text-muted-foreground">Valid</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                </div>

                {/* Currently Processing */}
                <div className="space-y-2">
                  <Label>Currently Processing</Label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {validationTasks
                      .filter(task => task.status === 'processing')
                      .slice(0, 5)
                      .map((task, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                          <span className="text-sm font-medium truncate">{task.email}</span>
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                        </div>
                      ))}
                    {validationTasks.filter(task => task.status === 'processing').length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No emails currently processing
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest validation results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {validationTasks
                    .filter(task => task.status === 'completed' || task.status === 'failed')
                    .slice(-20)
                    .reverse()
                    .map((task, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          {getTaskIcon(task)}
                          <span className="text-sm truncate max-w-[200px]">{task.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {task.duration && (
                            <Badge variant="outline" className="text-xs">
                              {task.duration}ms
                            </Badge>
                          )}
                          {task.result?.score && (
                            <Badge variant="outline" className="text-xs">
                              {task.result.score}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  {validationTasks.filter(task => task.status === 'completed' || task.status === 'failed').length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No validation activity yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Validation Results Tab */}
        <TabsContent value="results" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Valid Emails */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Valid Emails</CardTitle>
                    <CardDescription>
                      Successfully validated email addresses
                    </CardDescription>
                  </div>
                  <Badge variant="default">{completedValidations.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {completedValidations.slice(0, 50).map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm truncate">{result.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {result.score && (
                          <Badge variant="outline" className="text-xs">
                            {result.score}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {result.provider}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {completedValidations.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No valid emails found yet
                    </p>
                  )}
                  {completedValidations.length > 50 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Showing first 50 of {completedValidations.length} valid emails
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Failed Validations */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Failed Validations</CardTitle>
                    <CardDescription>
                      Emails that failed validation
                    </CardDescription>
                  </div>
                  <Badge variant="destructive">{stats.failed}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {validationTasks
                    .filter(task => task.status === 'failed')
                    .slice(0, 50)
                    .map((task, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm truncate">{task.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {task.duration && (
                            <Badge variant="outline" className="text-xs">
                              {task.duration}ms
                            </Badge>
                          )}
                          <Badge variant="destructive" className="text-xs">
                            Failed
                          </Badge>
                        </div>
                      </div>
                    ))}
                  {stats.failed === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No failed validations
                    </p>
                  )}
                  {stats.failed > 50 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Showing first 50 of {stats.failed} failed validations
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Generated</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  Email permutations
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
                  {stats.successRate}% success rate
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.failed}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0}% failure rate
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {validationTasks.filter(t => t.duration).length > 0 
                    ? Math.round(validationTasks.filter(t => t.duration).reduce((sum, t) => sum + (t.duration || 0), 0) / validationTasks.filter(t => t.duration).length)
                    : 0
                  }ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Average validation time
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Provider Distribution</CardTitle>
                <CardDescription>
                  Which validation providers were used
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    completedValidations.reduce((acc, result) => {
                      const provider = result.provider || 'unknown'
                      acc[provider] = (acc[provider] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                  ).map(([provider, count]) => (
                    <div key={provider} className="flex items-center justify-between">
                      <span className="font-medium capitalize">{provider}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(count / completedValidations.length) * 100}%` }}
                          />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {count}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {completedValidations.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No validation data yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processing Timeline</CardTitle>
                <CardDescription>
                  Validation activity over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {validationTasks
                    .filter(task => task.endTime)
                    .sort((a, b) => (b.endTime?.getTime() || 0) - (a.endTime?.getTime() || 0))
                    .slice(0, 20)
                    .map((task, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="truncate max-w-[200px]">{task.email}</span>
                        <div className="flex items-center space-x-2">
                          {getTaskIcon(task)}
                          <span className="text-xs text-muted-foreground">
                            {task.endTime?.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  {validationTasks.filter(task => task.endTime).length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No completed validations yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}