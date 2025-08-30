'use client'

import { useState, useEffect } from 'react'
import { EmailValidationService, type ValidationSettings } from '@/lib/email-validation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Settings, Save, RotateCcw } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<ValidationSettings>({
    provider: 'mslm',
    batchSize: 5,
    timeout: 30000
  })
  const [isLoading, setIsLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)

  const validationService = EmailValidationService.getInstance()

  useEffect(() => {
    if (isOpen) {
      const currentSettings = validationService.getSettings()
      setSettings(currentSettings)
    }
  }, [isOpen, validationService])

  const handleSave = () => {
    validationService.saveSettings(settings)
    onClose()
  }

  const handleTest = async () => {
    if (!testEmail) return

    setIsLoading(true)
    setTestResult(null)

    try {
      const result = await validationService.validateEmail(testEmail)
      setTestResult(JSON.stringify(result, null, 2))
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    const defaultSettings: ValidationSettings = {
      provider: 'mslm',
      batchSize: 5,
      timeout: 30000
    }
    setSettings(defaultSettings)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Email Validation Settings</span>
          </CardTitle>
          <CardDescription>
            Configure email validation providers and request settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Validation Provider</h3>
            <div className="space-y-2">
              <Label htmlFor="provider">API Provider</Label>
              <Select 
                value={settings.provider} 
                onValueChange={(value: any) => setSettings(prev => ({ ...prev, provider: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select validation provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mslm">MSLM.io - Detailed validation with mailbox check</SelectItem>
                  <SelectItem value="email-checker">Email-checker.space - Simple binary validation</SelectItem>
                  <SelectItem value="automizely">Automizely - Bulk validation with syntax check</SelectItem>
                  <SelectItem value="mail7">Mail7.net - Comprehensive validation with rate limits</SelectItem>
                  <SelectItem value="validate-email">Validate.email - Advanced validation with risk scoring</SelectItem>
                  <SelectItem value="bazzigate">Bazzigate - Simple boolean validation</SelectItem>
                  <SelectItem value="supersend">SuperSend - Multi-step validation with detailed breakdown</SelectItem>
                  <SelectItem value="site24x7">Site24x7 - SMTP-based validation with detailed responses</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {settings.provider === 'mslm' && 'Provides detailed validation including mailbox existence, disposable detection, and role-based email detection.'}
                {settings.provider === 'email-checker' && 'Simple and fast validation that returns binary success/failure results.'}
                {settings.provider === 'automizely' && 'Bulk-capable service with syntax validation, MX record checking, and deliverability assessment.'}
                {settings.provider === 'mail7' && 'Comprehensive validation with format, MX, and SMTP checks. Rate limited to 5 requests per minute.'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Batch Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Request Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batchSize">Batch Size</Label>
                <Input
                  id="batchSize"
                  type="number"
                  min="1"
                  max="50"
                  value={settings.batchSize}
                  onChange={(e) => setSettings(prev => ({ ...prev, batchSize: parseInt(e.target.value) || 5 }))}
                />
                <p className="text-sm text-muted-foreground">
                  Number of emails to validate simultaneously. Higher values are faster but may trigger rate limits.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (milliseconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min="5000"
                  max="120000"
                  step="1000"
                  value={settings.timeout}
                  onChange={(e) => setSettings(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30000 }))}
                />
                <p className="text-sm text-muted-foreground">
                  Maximum time to wait for API response before timing out.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Test Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Test Configuration</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testEmail">Test Email</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="Enter an email to test validation"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              
              <Button onClick={handleTest} disabled={!testEmail || isLoading}>
                {isLoading ? 'Testing...' : 'Test Validation'}
              </Button>

              {testResult && (
                <div className="space-y-2">
                  <Label>Test Result</Label>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                    {testResult}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}