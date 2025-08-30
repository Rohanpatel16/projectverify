'use client'

import { useState, useRef } from 'react'
import { EmailValidationService } from '@/lib/email-validation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  Download, 
  MailCheck, 
  XCircle, 
  CheckCircle, 
  Loader2,
  FileText,
  Columns
} from 'lucide-react'

interface CSVUploadModalProps {
  isOpen: boolean
  onClose: () => void
}

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

interface ValidationResult {
  email: string
  isValid: boolean
  score?: number
  provider?: string
  error?: string
  timestamp: string
}

export function CSVUploadModal({ isOpen, onClose }: CSVUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [selectedColumns, setSelectedColumns] = useState({
    firstName: '',
    lastName: '',
    domain: ''
  })
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([])
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validationService = EmailValidationService.getInstance()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (uploadedFile && uploadedFile.type === 'text/csv') {
      setFile(uploadedFile)
      parseCSV(uploadedFile)
    }
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) return

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
      setCurrentStep(2)
    }
    reader.readAsText(file)
  }

  const cleanDomain = (domain: string): string => {
    return domain
      .toLowerCase()
      .replace(/^https?:\/\//, '') // Remove http:// or https://
      .replace(/^www\./, '')      // Remove www.
      .replace(/\/.*$/, '')        // Remove anything after /
      .trim()
  }

  const generateEmailsFromCSV = () => {
    if (!selectedColumns.firstName || !selectedColumns.lastName || !selectedColumns.domain) {
      alert('Please select all required columns')
      return
    }

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
          sourceRow: index + 2 // +2 because header is row 1 and we start from 0
        })
      })
    })

    setGeneratedEmails(emails)
    setCurrentStep(3)
  }

  const validateGeneratedEmails = async () => {
    setIsProcessing(true)
    setProgress(0)
    
    const settings = validationService.getSettings()
    const batchSize = 5
    const totalEmails = generatedEmails.length
    const validEmails: ValidationResult[] = []

    for (let i = 0; i < totalEmails; i += batchSize) {
      const batch = generatedEmails.slice(i, i + batchSize)
      const batchPromises = batch.map(async (item) => {
        try {
          const result = await validationService.validateEmail(item.email)
          if (result.isValid) {
            validEmails.push(result)
          }
          return result
        } catch (error) {
          return {
            email: item.email,
            isValid: false,
            error: error instanceof Error ? error.message : 'Validation error',
            timestamp: new Date().toISOString()
          }
        }
      })

      await Promise.all(batchPromises)
      
      setProgress(Math.round(((i + batchSize) / totalEmails) * 100))
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < totalEmails) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    setValidationResults(validEmails)
    setIsProcessing(false)
    setCurrentStep(4)
  }

  const exportValidEmails = () => {
    if (validationResults.length === 0) return

    const headers = ['Email', 'Score', 'Provider', 'Timestamp']
    const csvContent = [
      headers.join(','),
      ...validationResults.map(result => [
        result.email,
        result.score || '',
        result.provider || '',
        result.timestamp
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `valid-emails-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const reset = () => {
    setFile(null)
    setCsvData([])
    setHeaders([])
    setSelectedColumns({ firstName: '', lastName: '', domain: '' })
    setGeneratedEmails([])
    setValidationResults([])
    setIsProcessing(false)
    setCurrentStep(1)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>CSV Email Generator & Validator</span>
          </CardTitle>
          <CardDescription>
            Upload a CSV file, select columns for name and domain, generate emails, and validate them
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: File Upload */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csvFile">Upload CSV File</Label>
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                />
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file containing contact information with columns for names and domains
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Column Selection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center space-x-2">
                  <Columns className="w-5 h-5" />
                  <span>Select Columns</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstNameColumn">First Name Column</Label>
                    <Select 
                      value={selectedColumns.firstName} 
                      onValueChange={(value) => setSelectedColumns(prev => ({ ...prev, firstName: value }))}
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
                    <Label htmlFor="lastNameColumn">Last Name Column</Label>
                    <Select 
                      value={selectedColumns.lastName} 
                      onValueChange={(value) => setSelectedColumns(prev => ({ ...prev, lastName: value }))}
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
                    <Label htmlFor="domainColumn">Domain Column</Label>
                    <Select 
                      value={selectedColumns.domain} 
                      onValueChange={(value) => setSelectedColumns(prev => ({ ...prev, domain: value }))}
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

                {csvData.length > 0 && (
                  <div className="space-y-2">
                    <Label>Preview (First 5 rows)</Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {headers.slice(0, 5).map(header => (
                              <th key={header} className="text-left p-1">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(0, 5).map((row, index) => (
                            <tr key={index} className="border-b">
                              {headers.slice(0, 5).map(header => (
                                <td key={header} className="p-1">{row[header]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={reset}>
                    Reset
                  </Button>
                  <Button onClick={generateEmailsFromCSV}>
                    Generate Emails ({csvData.length} rows)
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Generated Emails Preview */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Generated Emails</h3>
                <p className="text-sm text-muted-foreground">
                  Generated {generatedEmails.length} email permutations from {csvData.length} contacts
                </p>
              </div>

              <div className="space-y-2">
                <Label>Preview (First 10 generated emails)</Label>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                  <div className="space-y-1">
                    {generatedEmails.slice(0, 10).map((item, index) => (
                      <div key={index} className="text-sm flex justify-between">
                        <span>{item.email}</span>
                        <Badge variant="outline" className="text-xs">
                          Row {item.sourceRow}
                        </Badge>
                      </div>
                    ))}
                    {generatedEmails.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center">
                        ... and {generatedEmails.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button onClick={validateGeneratedEmails}>
                  <MailCheck className="w-4 h-4 mr-2" />
                  Validate All Emails
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Validation Results */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {isProcessing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Validating emails...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    Processing in batches of 5 with rate limiting...
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">{generatedEmails.length}</div>
                        <p className="text-sm text-muted-foreground">Generated</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{validationResults.length}</div>
                        <p className="text-sm text-muted-foreground">Valid Emails</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {generatedEmails.length - validationResults.length}
                        </div>
                        <p className="text-sm text-muted-foreground">Invalid</p>
                      </CardContent>
                    </Card>
                  </div>

                  {validationResults.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Valid Emails ({validationResults.length})</Label>
                        <Button onClick={exportValidEmails} size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Export CSV
                        </Button>
                      </div>
                      <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
                        <div className="space-y-1">
                          {validationResults.slice(0, 20).map((result, index) => (
                            <div key={index} className="text-sm flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>{result.email}</span>
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
                          {validationResults.length > 20 && (
                            <p className="text-xs text-muted-foreground text-center">
                              ... and {validationResults.length - 20} more valid emails
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={reset}>
                      Start Over
                    </Button>
                    <Button onClick={handleClose}>
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress Indicator */}
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4].map(step => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full ${
                  step <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}