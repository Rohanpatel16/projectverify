'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  Shield, 
  Database,
  Mail,
  Server,
  AlertCircle,
  ExternalLink,
  Star
} from 'lucide-react'

interface APIFeature {
  name: string
  description: string
  available: boolean
}

interface APIDetails {
  id: string
  name: string
  description: string
  endpoint: string
  method: string
  auth: string
  features: APIFeature[]
  pros: string[]
  cons: string[]
  useCase: string
  rating: number
  speed: 'fast' | 'medium' | 'slow'
  accuracy: 'high' | 'medium' | 'low'
  pricing: 'free' | 'freemium' | 'paid'
}

const apiData: APIDetails[] = [
  {
    id: 'mslm',
    name: 'MSLM.io',
    description: 'Comprehensive email validation with detailed mailbox verification',
    endpoint: 'https://mslm.io/api/sv/v1',
    method: 'GET',
    auth: 'API Key Required',
    features: [
      { name: 'Syntax Validation', description: 'Checks email format and structure', available: true },
      { name: 'Domain Verification', description: 'Verifies domain existence and MX records', available: true },
      { name: 'Mailbox Check', description: 'Checks if mailbox actually exists', available: true },
      { name: 'Disposable Detection', description: 'Identifies temporary email services', available: true },
      { name: 'Role-based Detection', description: 'Detects role emails (admin, info, etc.)', available: true },
      { name: 'Gravatar Integration', description: 'Checks for associated Gravatar images', available: true },
      { name: 'Risk Scoring', description: 'Provides numerical risk assessment', available: false },
      { name: 'SMTP Debug Info', description: 'Detailed SMTP transaction logs', available: false }
    ],
    pros: [
      'High accuracy rates',
      'Detailed validation results',
      'Good documentation',
      'Reasonable pricing',
      'Fast response times'
    ],
    cons: [
      'Requires API key',
      'Rate limits on free tier',
      'No bulk discounts mentioned'
    ],
    useCase: 'Best for applications requiring high accuracy and detailed validation results',
    rating: 4.5,
    speed: 'fast',
    accuracy: 'high',
    pricing: 'freemium'
  },
  {
    id: 'email-checker',
    name: 'Email-checker.space',
    description: 'Simple binary email validation service',
    endpoint: 'https://email-checker.space/check_mailer.php',
    method: 'GET',
    auth: 'None Required',
    features: [
      { name: 'Syntax Validation', description: 'Basic email format checking', available: true },
      { name: 'Domain Verification', description: 'Basic domain existence check', available: true },
      { name: 'Mailbox Check', description: 'Simple mailbox verification', available: true },
      { name: 'Disposable Detection', description: 'Basic disposable email detection', available: false },
      { name: 'Role-based Detection', description: 'No role-based detection', available: false },
      { name: 'Gravatar Integration', description: 'No Gravatar support', available: false },
      { name: 'Risk Scoring', description: 'No risk scoring', available: false },
      { name: 'SMTP Debug Info', description: 'No SMTP debug information', available: false }
    ],
    pros: [
      'No authentication required',
      'Very simple to use',
      'Fast responses',
      'Free to use',
      'Binary result (true/false)'
    ],
    cons: [
      'Limited features',
      'No detailed results',
      'Unknown reliability',
      'No documentation',
      'Possible rate limits'
    ],
    useCase: 'Best for simple applications needing basic email validation',
    rating: 3.0,
    speed: 'fast',
    accuracy: 'medium',
    pricing: 'free'
  },
  {
    id: 'automizely',
    name: 'Automizely',
    description: 'Bulk email validation with comprehensive checking',
    endpoint: 'https://websites.automizely.com/v1/public/email-verify',
    method: 'POST',
    auth: 'None Required',
    features: [
      { name: 'Syntax Validation', description: 'Comprehensive syntax checking', available: true },
      { name: 'Domain Verification', description: 'Full domain validation', available: true },
      { name: 'Mailbox Check', description: 'SMTP mailbox verification', available: true },
      { name: 'Disposable Detection', description: 'Disposable email service detection', available: true },
      { name: 'Role-based Detection', description: 'Role account identification', available: true },
      { name: 'Gravatar Integration', description: 'No Gravatar support', available: false },
      { name: 'Risk Scoring', description: 'Basic risk assessment', available: false },
      { name: 'SMTP Debug Info', description: 'Limited SMTP information', available: false }
    ],
    pros: [
      'Supports bulk validation',
      'No authentication required',
      'Good for large lists',
      'Detailed validation steps',
      'Reachability assessment'
    ],
    cons: [
      'Limited documentation',
      'Unknown rate limits',
      'No risk scoring',
      'No API key management'
    ],
    useCase: 'Best for bulk email validation and list cleaning',
    rating: 3.8,
    speed: 'medium',
    accuracy: 'high',
    pricing: 'free'
  },
  {
    id: 'mail7',
    name: 'Mail7.net',
    description: 'Comprehensive validation with rate limits',
    endpoint: 'https://mail7.net/api/validate-single',
    method: 'POST',
    auth: 'None Required',
    features: [
      { name: 'Syntax Validation', description: 'Format and structure validation', available: true },
      { name: 'Domain Verification', description: 'Domain and MX record checking', available: true },
      { name: 'Mailbox Check', description: 'SMTP mailbox verification', available: true },
      { name: 'Disposable Detection', description: 'Disposable email detection', available: false },
      { name: 'Role-based Detection', description: 'No role-based detection', available: false },
      { name: 'Gravatar Integration', description: 'No Gravatar support', available: false },
      { name: 'Risk Scoring', description: 'No risk scoring', available: false },
      { name: 'SMTP Debug Info', description: 'Basic SMTP error messages', available: true }
    ],
    pros: [
      'No authentication required',
      'Comprehensive validation',
      'Error message details',
      'Simple integration',
      'Free to use'
    ],
    cons: [
      'Rate limited (5/min)',
      'No bulk validation',
      'Limited features',
      'No documentation',
      'Unknown reliability'
    ],
    useCase: 'Best for applications with moderate validation needs',
    rating: 3.5,
    speed: 'medium',
    accuracy: 'medium',
    pricing: 'free'
  },
  {
    id: 'validate-email',
    name: 'Validate.email',
    description: 'Advanced validation with risk scoring and detailed analysis',
    endpoint: 'https://api.validate.email/validate',
    method: 'GET',
    auth: 'None Required',
    features: [
      { name: 'Syntax Validation', description: 'Comprehensive syntax validation', available: true },
      { name: 'Domain Verification', description: 'Full domain analysis with SPF', available: true },
      { name: 'Mailbox Check', description: 'Advanced SMTP deliverability check', available: true },
      { name: 'Disposable Detection', description: 'Disposable email service detection', available: true },
      { name: 'Role-based Detection', description: 'No role-based detection', available: false },
      { name: 'Gravatar Integration', description: 'Gravatar URL generation', available: true },
      { name: 'Risk Scoring', description: 'Numerical risk score with reasons', available: true },
      { name: 'SMTP Debug Info', description: 'Detailed SMTP transaction details', available: true }
    ],
    pros: [
      'No authentication required',
      'Comprehensive feature set',
      'Risk scoring system',
      'Detailed SMTP analysis',
      'Gravatar integration',
      'Domain age information'
    ],
    cons: [
      'Unknown rate limits',
      'No bulk validation API',
      'Limited documentation',
      'No role-based detection',
      'Possible reliability concerns'
    ],
    useCase: 'Best for applications needing detailed analysis and risk assessment',
    rating: 4.2,
    speed: 'medium',
    accuracy: 'high',
    pricing: 'free'
  },
  {
    id: 'bazzigate',
    name: 'Bazzigate',
    description: 'Simple boolean validation service',
    endpoint: 'https://emailverifiers-backend.bazzigate.com/single-email-varification',
    method: 'GET',
    auth: 'None Required',
    features: [
      { name: 'Syntax Validation', description: 'Basic syntax checking', available: true },
      { name: 'Domain Verification', description: 'Basic domain verification', available: true },
      { name: 'Mailbox Check', description: 'Simple mailbox check', available: true },
      { name: 'Disposable Detection', description: 'No disposable detection', available: false },
      { name: 'Role-based Detection', description: 'No role-based detection', available: false },
      { name: 'Gravatar Integration', description: 'No Gravatar support', available: false },
      { name: 'Risk Scoring', description: 'No risk scoring', available: false },
      { name: 'SMTP Debug Info', description: 'No SMTP debug info', available: false }
    ],
    pros: [
      'Extremely simple',
      'No authentication',
      'Very fast response',
      'Binary result',
      'Free to use'
    ],
    cons: [
      'Very limited features',
      'No detailed results',
      'Unknown reliability',
      'No documentation',
      'Possible anti-bot measures'
    ],
    useCase: 'Best for simple true/false validation needs',
    rating: 2.8,
    speed: 'fast',
    accuracy: 'low',
    pricing: 'free'
  },
  {
    id: 'supersend',
    name: 'SuperSend',
    description: 'Multi-step validation with detailed breakdown',
    endpoint: 'https://api.supersend.io/v1/verify-email',
    method: 'GET',
    auth: 'API Key Required',
    features: [
      { name: 'Syntax Validation', description: 'Regex pattern validation', available: true },
      { name: 'Domain Verification', description: 'MX record validation', available: true },
      { name: 'Mailbox Check', description: 'SMTP deliverability check', available: true },
      { name: 'Disposable Detection', description: 'Disposable email detection', available: true },
      { name: 'Role-based Detection', description: 'No role-based detection', available: false },
      { name: 'Gravatar Integration', description: 'No Gravatar support', available: false },
      { name: 'Risk Scoring', description: 'No numerical risk score', available: false },
      { name: 'SMTP Debug Info', description: 'Detailed SMTP error messages', available: true }
    ],
    pros: [
      'Detailed validation breakdown',
      'Handles uncertain states',
      'Clear error messages',
      'Multi-step validation',
      'Good documentation'
    ],
    cons: [
      'Requires API key',
      'Credit-based system',
      'No risk scoring',
      'Limited free tier',
      'No role-based detection'
    ],
    useCase: 'Best for applications needing detailed validation steps and error handling',
    rating: 4.0,
    speed: 'medium',
    accuracy: 'high',
    pricing: 'freemium'
  },
  {
    id: 'site24x7',
    name: 'Site24x7',
    description: 'SMTP-based validation with detailed server responses',
    endpoint: 'https://www.site24x7.com/tools/email-validator',
    method: 'POST',
    auth: 'Session-based',
    features: [
      { name: 'Syntax Validation', description: 'Basic syntax validation', available: true },
      { name: 'Domain Verification', description: 'MX record validation', available: true },
      { name: 'Mailbox Check', description: 'Direct SMTP server communication', available: true },
      { name: 'Disposable Detection', description: 'No disposable detection', available: false },
      { name: 'Role-based Detection', description: 'No role-based detection', available: false },
      { name: 'Gravatar Integration', description: 'No Gravatar support', available: false },
      { name: 'Risk Scoring', description: 'No risk scoring', available: false },
      { name: 'SMTP Debug Info', description: 'Actual SMTP server responses', available: true }
    ],
    pros: [
      'Real SMTP server responses',
      'Detailed error messages',
      'Status code information',
      'No authentication required',
      'Direct server communication'
    ],
    cons: [
      'Session-based (browser-like)',
      'HTML-encoded responses',
      'No bulk validation',
      'Limited features',
      'Possible rate limits'
    ],
    useCase: 'Best for applications needing actual SMTP server responses',
    rating: 3.3,
    speed: 'slow',
    accuracy: 'high',
    pricing: 'free'
  }
]

export function APIComparison() {
  const getSpeedIcon = (speed: string) => {
    switch (speed) {
      case 'fast': return <Zap className="w-4 h-4 text-green-500" />
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'slow': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getAccuracyIcon = (accuracy: string) => {
    switch (accuracy) {
      case 'high': return <Shield className="w-4 h-4 text-green-500" />
      case 'medium': return <Shield className="w-4 h-4 text-yellow-500" />
      case 'low': return <Shield className="w-4 h-4 text-red-500" />
      default: return <Shield className="w-4 h-4 text-gray-500" />
    }
  }

  const getPricingColor = (pricing: string) => {
    switch (pricing) {
      case 'free': return 'bg-green-100 text-green-800'
      case 'freemium': return 'bg-blue-100 text-blue-800'
      case 'paid': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= Math.floor(rating) 
                ? 'text-yellow-400 fill-current' 
                : star <= rating 
                ? 'text-yellow-400 fill-current opacity-50' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">{rating.toFixed(1)}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Email Validation API Comparison</h2>
        <p className="text-muted-foreground">
          Compare features, accuracy, and performance of different email validation services
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Feature Comparison</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apiData.map((api) => (
              <Card key={api.id} className="h-fit">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{api.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {getSpeedIcon(api.speed)}
                      {getAccuracyIcon(api.accuracy)}
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    {api.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rating</span>
                    {renderStars(api.rating)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pricing</span>
                    <Badge className={getPricingColor(api.pricing)}>
                      {api.pricing}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Best For</div>
                    <p className="text-xs text-muted-foreground">{api.useCase}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Key Features</div>
                    <div className="flex flex-wrap gap-1">
                      {api.features.filter(f => f.available).slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature.name}
                        </Badge>
                      ))}
                      {api.features.filter(f => f.available).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{api.features.filter(f => f.available).length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Pros</div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {api.pros.slice(0, 2).map((pro, index) => (
                        <li key={index} className="flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Comparison Matrix</CardTitle>
              <CardDescription>
                Compare available features across all email validation APIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Feature</th>
                      {apiData.map((api) => (
                        <th key={api.id} className="text-center p-2 font-medium text-xs">
                          {api.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {apiData[0].features.map((feature, featureIndex) => (
                      <tr key={featureIndex} className="border-b">
                        <td className="p-2">
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{feature.name}</div>
                            <div className="text-xs text-muted-foreground">{feature.description}</div>
                          </div>
                        </td>
                        {apiData.map((api) => (
                          <td key={api.id} className="text-center p-2">
                            {api.features[featureIndex].available ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Speed Comparison</CardTitle>
                <CardDescription>
                  Response time performance across different APIs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {apiData.map((api) => (
                    <div key={api.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getSpeedIcon(api.speed)}
                        <span className="text-sm font-medium">{api.name}</span>
                      </div>
                      <Badge variant="outline">
                        {api.speed}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accuracy Comparison</CardTitle>
                <CardDescription>
                  Validation accuracy levels across different APIs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {apiData.map((api) => (
                    <div key={api.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getAccuracyIcon(api.accuracy)}
                        <span className="text-sm font-medium">{api.name}</span>
                      </div>
                      <Badge variant="outline">
                        {api.accuracy}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Overall Ratings</CardTitle>
              <CardDescription>
                User ratings and overall satisfaction scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {apiData.sort((a, b) => b.rating - a.rating).map((api) => (
                  <div key={api.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium w-24">{api.name}</span>
                      {renderStars(api.rating)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {api.useCase}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span>Top Recommendations</span>
                </CardTitle>
                <CardDescription>
                  Best APIs for different use cases
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-green-700">🏆 Best Overall: MSLM.io</h4>
                    <p className="text-sm text-muted-foreground">
                      Highest accuracy, comprehensive features, and good performance. Ideal for most applications.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-blue-700">⚡ Fastest: Validate.email</h4>
                    <p className="text-sm text-muted-foreground">
                      Excellent speed with advanced features like risk scoring. Great for real-time validation.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-purple-700">🆓 Best Free: Email-checker.space</h4>
                    <p className="text-sm text-muted-foreground">
                      Simple, fast, and completely free. Perfect for basic validation needs.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-orange-700">📊 Best for Bulk: Automizely</h4>
                    <p className="text-sm text-muted-foreground">
                      Supports bulk validation with good accuracy. Ideal for list cleaning.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <span>Use Case Recommendations</span>
                </CardTitle>
                <CardDescription>
                  Choose the right API based on your needs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">📧 Email Marketing</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>MSLM.io</strong> or <strong>SuperSend</strong> for high accuracy and detailed results.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">👥 User Registration</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Validate.email</strong> or <strong>Email-checker.space</strong> for fast real-time validation.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">📋 List Cleaning</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Automizely</strong> or <strong>MSLM.io</strong> for bulk validation capabilities.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">🔒 Security & Fraud Prevention</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Validate.email</strong> for risk scoring and detailed analysis.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">💰 Budget-conscious</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Email-checker.space</strong> or <strong>Bazzigate</strong> for free simple validation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Implementation Tips</CardTitle>
              <CardDescription>
                Best practices for using email validation APIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">✅ Do's</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Implement proper error handling</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Respect rate limits and API terms</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Cache results when appropriate</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Use multiple APIs for redundancy</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Monitor API performance and costs</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">❌ Don'ts</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span>Don't rely solely on syntax validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span>Don't ignore API rate limits</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span>Don't use validation as sole security measure</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span>Don't forget to handle API failures</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span>Don't validate the same email repeatedly</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}